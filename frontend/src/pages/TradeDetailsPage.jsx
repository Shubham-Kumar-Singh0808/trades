import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';

const getModeLabel = (mode) => {
  if (mode === 'ONLINE') return 'DIRECT';
  if (mode === 'DIRECT') return 'DIRECT';
  if (mode === 'HYBRID') return 'HOPPING';
  if (mode === 'HOPPING') return 'HOPPING';
  return mode;
};

const formatRate = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }
  return `Rs. ${value}`;
};

export default function TradeDetailsPage({ session }) {
  const { id } = useParams();
  const [trade, setTrade] = useState(null);
  const [bidBoard, setBidBoard] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobSheetPdfUrl, setJobSheetPdfUrl] = useState('');
  const [trackingListPdfUrl, setTrackingListPdfUrl] = useState('');
  const roles = session?.roles || [];
  const isAdminExecutive = roles.includes('ADMIN') || roles.includes('EXECUTIVE');
  const isVendor = roles.includes('VENDOR');

  const loadBidBoard = async () => {
    const bidBoardRes = await api.get(`/api/trades/${id}/bids/board`);
    setBidBoard(bidBoardRes.data);
  };

  useEffect(() => {
    let createdJobSheetUrl = null;
    let createdTrackingListUrl = null;

    const load = async () => {
      try {
        const [tradeRes, jobSheetRes, trackingListRes, bidBoardRes] = await Promise.all([
          api.get(`/api/trades/${id}`),
          api.get(`/api/trades/${id}/job-sheet/view`, { responseType: 'blob' }),
          api.get(`/api/trades/${id}/packing-list/view`, { responseType: 'blob' }),
          api.get(`/api/trades/${id}/bids/board`),
        ]);
        setTrade(tradeRes.data);
        setBidBoard(bidBoardRes.data);
        createdJobSheetUrl = URL.createObjectURL(new Blob([jobSheetRes.data], { type: 'application/pdf' }));
        createdTrackingListUrl = URL.createObjectURL(new Blob([trackingListRes.data], { type: 'application/pdf' }));

        setJobSheetPdfUrl((old) => {
          if (old) {
            URL.revokeObjectURL(old);
          }
          return createdJobSheetUrl;
        });
        setTrackingListPdfUrl((old) => {
          if (old) {
            URL.revokeObjectURL(old);
          }
          return createdTrackingListUrl;
        });
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load trade details');
      }
    };
    load();

    return () => {
      if (createdJobSheetUrl) {
        URL.revokeObjectURL(createdJobSheetUrl);
      }
      if (createdTrackingListUrl) {
        URL.revokeObjectURL(createdTrackingListUrl);
      }
    };
  }, [id]);

  const submitBid = async () => {
    if (!bidAmount) {
      setError('Please enter a bid amount.');
      return;
    }

    setError('');
    setActionLoading(true);
    try {
      await api.post(`/api/trades/${id}/bids`, { bidAmount });
      setBidAmount('');
      await Promise.all([loadBidBoard(), api.get(`/api/trades/${id}`).then((res) => setTrade(res.data))]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit bid');
    } finally {
      setActionLoading(false);
    }
  };

  const closeBid = async () => {
    setError('');
    setActionLoading(true);
    try {
      await api.patch(`/api/trades/${id}/bids/close`);
      await Promise.all([loadBidBoard(), api.get(`/api/trades/${id}`).then((res) => setTrade(res.data))]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to close bid');
    } finally {
      setActionLoading(false);
    }
  };

  const closeRound = async () => {
    setError('');
    setActionLoading(true);
    try {
      await api.patch(`/api/trades/${id}/bids/round/close`);
      await Promise.all([loadBidBoard(), api.get(`/api/trades/${id}`).then((res) => setTrade(res.data))]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to close round');
    } finally {
      setActionLoading(false);
    }
  };

  const startNextRound = async () => {
    setError('');
    setActionLoading(true);
    try {
      await api.patch(`/api/trades/${id}/bids/next-round`);
      await Promise.all([loadBidBoard(), api.get(`/api/trades/${id}`).then((res) => setTrade(res.data))]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to start next round');
    } finally {
      setActionLoading(false);
    }
  };

  const downloadJobSheet = async () => {
    try {
      const res = await api.get(`/api/trades/${id}/job-sheet/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `trade-${id}-job-sheet.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to download job sheet PDF');
    }
  };

  const downloadTrackingList = async () => {
    try {
      const res = await api.get(`/api/trades/${id}/packing-list/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `trade-${id}-packing-list.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to download packing list PDF');
    }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Trade Details</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {trade && (
        <Card>
          <CardContent>
            <Stack spacing={1}>
              <Typography><strong>Trade ID:</strong> {trade.tradeId}</Typography>
              <Typography><strong>Mode:</strong> {getModeLabel(trade.mode)}</Typography>
              <Typography><strong>Description:</strong> {trade.description}</Typography>
              <Typography><strong>Created By:</strong> {trade.createdBy}</Typography>
              <Typography><strong>Created At:</strong> {trade.createdAt}</Typography>
              <Typography><strong>Bidding Status:</strong> {trade.biddingOpen ? 'OPEN' : 'CLOSED'}</Typography>
              <Typography><strong>Current Round:</strong> {trade.currentRound}</Typography>
              <Typography><strong>Final L1 Rate:</strong> {formatRate(trade.finalL1Rate)}</Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {bidBoard && (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">Bidding Dashboard</Typography>
              {isAdminExecutive && (
                <Stack direction="row" spacing={2}>
                  {trade?.tradeClosed ? null : bidBoard.biddingOpen ? (
                    <Button
                      variant="contained"
                      onClick={closeRound}
                      disabled={actionLoading}
                      sx={{ backgroundColor: '#c62828', '&:hover': { backgroundColor: '#a81f1f' } }}
                    >
                      Close Round
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="contained"
                        onClick={startNextRound}
                        disabled={actionLoading}
                        sx={{ backgroundColor: '#1565c0', '&:hover': { backgroundColor: '#0f4f9a' } }}
                      >
                        Start Next Round
                      </Button>
                      <Button
                        variant="contained"
                        onClick={closeBid}
                        disabled={actionLoading}
                        sx={{ backgroundColor: '#2e7d32', '&:hover': { backgroundColor: '#1b5e20' } }}
                      >
                        Close Trade
                      </Button>
                    </>
                  )}
                </Stack>
              )}

              {isVendor && (
                <Stack spacing={2}>
                  <Typography><strong>Your Current Round Bid:</strong> {formatRate(bidBoard.myCurrentBid)}</Typography>
                  <Typography><strong>Final L1 Rate:</strong> {formatRate(bidBoard.finalL1Rate)}</Typography>
                  {bidBoard.biddingOpen && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        label="Your Bid (per kg)"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        type="number"
                        inputProps={{ min: '0.0001', step: '0.0001' }}
                        fullWidth
                      />
                      <Button
                        variant="contained"
                        onClick={submitBid}
                        disabled={actionLoading}
                        sx={{ backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' } }}
                      >
                        Submit / Update Bid
                      </Button>
                    </Stack>
                  )}
                </Stack>
              )}

              {isAdminExecutive && (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>L1 / L2 / L3</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Rank</TableCell>
                        <TableCell>Rate</TableCell>
                        <TableCell>Vendor</TableCell>
                        <TableCell>Company</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(bidBoard.leaderboard || []).map((item) => (
                        <TableRow key={item.rank}>
                          <TableCell>{item.rank}</TableCell>
                          <TableCell>{formatRate(item.bidAmount)}</TableCell>
                          <TableCell>{item.vendorName || 'Hidden during bidding'}</TableCell>
                          <TableCell>{item.companyName || 'Hidden during bidding'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}

              {!!bidBoard.bidEntries?.length && (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                    {isVendor ? 'Your Bids by Round' : 'All Vendor Bids'}
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Round</TableCell>
                        {!isVendor && <TableCell>Vendor</TableCell>}
                        {!isVendor && <TableCell>Company</TableCell>}
                        <TableCell>Rate</TableCell>
                        <TableCell>Submitted At</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bidBoard.bidEntries.map((entry, idx) => (
                        <TableRow key={`${entry.roundNumber}-${idx}-${entry.submittedAt}`}>
                          <TableCell>{entry.roundNumber}</TableCell>
                          {!isVendor && <TableCell>{entry.vendorName}</TableCell>}
                          {!isVendor && <TableCell>{entry.companyName}</TableCell>}
                          <TableCell>{formatRate(entry.bidAmount)}</TableCell>
                          <TableCell>{entry.submittedAt}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Button variant="contained" onClick={downloadJobSheet} sx={{ backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' }, px: 3 }}>Download Job Sheet</Button>
            <Button variant="contained" onClick={downloadTrackingList} sx={{ backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' }, px: 3 }}>Download Packing List</Button>
          </Stack>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Job Sheet PDF</Typography>
          <Box sx={{ border: '1px solid #d6dce1', borderRadius: 2, overflow: 'hidden' }}>
            {jobSheetPdfUrl ? (
              <iframe
                title="Job Sheet PDF"
                src={jobSheetPdfUrl}
                style={{ width: '100%', height: '60vh', border: 0 }}
              />
            ) : (
              <Box sx={{ p: 3 }}>
                <Typography color="text.secondary">Loading job sheet preview...</Typography>
              </Box>
            )}
          </Box>
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>Packing List PDF</Typography>
          <Box sx={{ border: '1px solid #d6dce1', borderRadius: 2, overflow: 'hidden' }}>
            {trackingListPdfUrl ? (
              <iframe
                title="Packing List PDF"
                src={trackingListPdfUrl}
                style={{ width: '100%', height: '60vh', border: 0 }}
              />
            ) : (
              <Box sx={{ p: 3 }}>
                <Typography color="text.secondary">Loading packing list preview...</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
