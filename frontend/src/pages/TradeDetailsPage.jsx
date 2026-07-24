import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';

const getModeLabel = (mode) => {
  if (mode === 'AIR') return 'Air';
  if (mode === 'SEA') return 'Sea';
  // Legacy aliases
  if (mode === 'ONLINE' || mode === 'DIRECT') return 'Air';
  if (mode === 'HYBRID' || mode === 'HOPPING' || mode === 'OFFLINE') return 'Sea';
  return mode;
};

const formatRate = (value, isUsd = false) => {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }
  return isUsd ? `$${value}` : `Rs. ${value}`;
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB');
};

// Displays long text (comments/routing) as 1 truncated line with a "More" button
function LongTextCell({ text }) {
  const [open, setOpen] = React.useState(false);
  if (!text) return <span>—</span>;
  const firstLine = text.split('\n')[0];
  const isTruncated = text.length > firstLine.length || firstLine.length > 80;
  const displayText = firstLine.length > 80 ? firstLine.slice(0, 80) + '…' : firstLine;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{displayText}</Typography>
      {isTruncated && (
        <>
          <Button size="small" sx={{ minWidth: 0, p: '0 4px', fontSize: '0.7rem', color: '#1565c0' }} onClick={() => setOpen(true)}>More</Button>
          <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Full Comment</DialogTitle>
            <DialogContent dividers>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{text}</Typography>
            </DialogContent>
            <DialogActions><Button onClick={() => setOpen(false)}>Close</Button></DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
}

export default function TradeDetailsPage({ session }) {
  const { id } = useParams();
  const [trade, setTrade] = useState(null);
  const [bidBoard, setBidBoard] = useState(null);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [bidForm, setBidForm] = useState({
    bidAmount: '', airlines: '', routing: '', comments: '',
    ihcInr: '', thcInr: '', cfsInr: '', otherChargesComments: '',
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobSheetPdfUrl, setJobSheetPdfUrl] = useState('');
  const [trackingListPdfUrl, setTrackingListPdfUrl] = useState('');
  const roles = session?.roles || [];
  const isAdminExecutive = roles.includes('ADMIN') || roles.includes('EXECUTIVE');
  const isAdmin = roles.includes('ADMIN');
  const isVendor = roles.includes('VENDOR');
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));
  const isFinalRound = trade?.currentRound >= 2;
  const canFinalizeTrade = Boolean(trade && !trade.tradeClosed && bidBoard && !bidBoard.biddingOpen);

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
    if (!bidForm.bidAmount || parseFloat(bidForm.bidAmount) <= 0) {
      setError('Please enter a bid amount greater than 0.');
      return;
    }
    if (!termsAccepted) {
      setError('Please accept the Terms & Conditions before submitting.');
      return;
    }

    const isAir = trade?.mode === 'AIR';
    const payload = {
      bidAmount: bidForm.bidAmount,
      ...(isAir
        ? { airlines: bidForm.airlines, routing: bidForm.routing, comments: bidForm.comments }
        : {
            ihcInr: bidForm.ihcInr || null,
            thcInr: bidForm.thcInr || null,
            cfsInr: bidForm.cfsInr || null,
            otherChargesComments: bidForm.otherChargesComments,
          }),
    };

    setError('');
    setActionLoading(true);
    try {
      await api.post(`/api/trades/${id}/bids`, payload);
      setBidForm({ bidAmount: '', airlines: '', routing: '', comments: '', ihcInr: '', thcInr: '', cfsInr: '', otherChargesComments: '' });
      setTermsAccepted(false);
      setBidDialogOpen(false);
      await Promise.all([loadBidBoard(), api.get(`/api/trades/${id}`).then((res) => setTrade(res.data))]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit bid');
    } finally {
      setActionLoading(false);
    }
  };

  const cancelTrade = async () => {
    setError('');
    setActionLoading(true);
    try {
      await api.patch(`/api/trades/${id}/cancel`);
      await Promise.all([loadBidBoard(), api.get(`/api/trades/${id}`).then((res) => setTrade(res.data))]);
      setCancelDialogOpen(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to cancel trade');
    } finally {
      setActionLoading(false);
    }
  };

  const closeBid = async (winnerBidId) => {
    setError('');
    setActionLoading(true);
    try {
      await api.patch(`/api/trades/${id}/bids/close`, { winnerBidId });
      await Promise.all([loadBidBoard(), api.get(`/api/trades/${id}`).then((res) => setTrade(res.data))]);
      setFinalizeDialogOpen(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to finalize trade');
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
              <Typography><strong>Created At:</strong> {formatDate(trade.createdAt)}</Typography>
              <Typography><strong>Bidding Status:</strong> {trade.cancelled ? 'CANCELLED' : trade.biddingOpen ? 'OPEN' : 'CLOSED'}</Typography>
              <Typography><strong>Current Round:</strong> {trade.currentRound}</Typography>
              <Typography><strong>Round Limit:</strong> R1 and R2 only</Typography>
              <Typography><strong>Final L1 Rate:</strong> {
                trade.mode === 'SEA' && bidBoard?.leaderboard?.[0]?.totalInr != null
                  ? `₹${Number(bidBoard.leaderboard[0].totalInr).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                  : formatRate(trade.finalL1Rate, trade.mode === 'SEA')
              }</Typography>
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
                <Typography variant="body2" color="text.secondary">
                  Round 1 can be finalized directly without starting round 2. Round 2 is the final round.
                </Typography>
              )}
              {isAdmin && (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  {trade?.cancelled ? (
                    <Typography color="error" fontWeight={600}>This trade has been cancelled.</Typography>
                  ) : trade?.tradeClosed ? null : bidBoard.biddingOpen ? (
                    <Button
                      variant="contained"
                      onClick={closeRound}
                      disabled={actionLoading}
                      sx={{ backgroundColor: '#c62828', '&:hover': { backgroundColor: '#a81f1f' } }}
                    >
                      Close Round {trade?.currentRound || ''}
                    </Button>
                  ) : (
                    <>
                      {!isFinalRound && (
                        <Button
                          variant="contained"
                          onClick={startNextRound}
                          disabled={actionLoading}
                          sx={{ backgroundColor: '#1565c0', '&:hover': { backgroundColor: '#0f4f9a' } }}
                        >
                          Start Round 2
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        onClick={() => setFinalizeDialogOpen(true)}
                        disabled={actionLoading}
                        sx={{ backgroundColor: '#2e7d32', '&:hover': { backgroundColor: '#1b5e20' } }}
                      >
                        {canFinalizeTrade ? 'Finalize Trade' : 'Close Trade'}
                      </Button>
                    </>
                  )}
                  {!trade?.tradeClosed && !trade?.cancelled && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setCancelDialogOpen(true)}
                      disabled={actionLoading}
                    >
                      Cancel Trade
                    </Button>
                  )}
                </Stack>
              )}

              {isVendor && (
                <Stack spacing={2}>
                  <Typography><strong>Your Current Round Bid:</strong> {formatRate(bidBoard.myCurrentBid, trade?.mode === 'SEA')}</Typography>
                  <Typography><strong>Final L1 Rate:</strong> {
                    trade?.mode === 'SEA' && bidBoard?.leaderboard?.[0]?.totalInr != null
                      ? `₹${Number(bidBoard.leaderboard[0].totalInr).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                      : formatRate(bidBoard.finalL1Rate, trade?.mode === 'SEA')
                  }</Typography>
                  {bidBoard.biddingOpen && !trade?.cancelled && (
                    <Box>
                      <Button
                        variant="contained"
                        onClick={() => setBidDialogOpen(true)}
                        sx={{ backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' } }}
                      >
                        Submit / Update Bid
                      </Button>
                    </Box>
                  )}
                </Stack>
              )}

              {isAdminExecutive && (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>L1 / L2 / L3</Typography>
                  {isSm ? (
                    <Stack spacing={1}>
                      {(bidBoard.leaderboard || []).map((item) => (
                        <Card key={item.rank} variant="outlined">
                          <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle2">Rank {item.rank}</Typography>
                              <Typography variant="body2">{formatRate(item.bidAmount, trade?.mode === 'SEA')}</Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary">{item.vendorName || 'Hidden during bidding'}</Typography>
                            <Typography variant="body2" color="text.secondary">{item.companyName || 'Hidden during bidding'}</Typography>
                            {trade?.mode === 'SEA' && item.totalInr != null && <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>Total est.: ₹{Number(item.totalInr).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Typography>}
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Rank</TableCell>
                          <TableCell>{trade?.mode === 'SEA' ? 'Ocean Freight (USD)' : 'Rate (INR)'}</TableCell>
                          {trade?.mode === 'SEA' && <>
                            <TableCell>IHC (INR)</TableCell>
                            <TableCell>THC (INR)</TableCell>
                            <TableCell>CFS (INR)</TableCell>
                            <TableCell>Other Charges</TableCell>
                            <TableCell>Total Est. (INR)</TableCell>
                          </>}
                          <TableCell>Vendor</TableCell>
                          <TableCell>Company</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(bidBoard.leaderboard || []).map((item) => (
                          <TableRow key={item.rank}>
                            <TableCell>{item.rank}</TableCell>
                            <TableCell>{formatRate(item.bidAmount, trade?.mode === 'SEA')}</TableCell>
                            {trade?.mode === 'SEA' && <>
                              <TableCell>{item.ihcInr != null ? `₹${item.ihcInr}` : '—'}</TableCell>
                              <TableCell>{item.thcInr != null ? `₹${item.thcInr}` : '—'}</TableCell>
                              <TableCell>{item.cfsInr != null ? `₹${item.cfsInr}` : '—'}</TableCell>
                              <TableCell><LongTextCell text={item.otherChargesComments} /></TableCell>
                              <TableCell sx={{ fontWeight: 600, color: '#1565c0' }}>{item.totalInr != null ? `₹${Number(item.totalInr).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—'}</TableCell>
                            </>}
                            <TableCell>{item.vendorName || 'Hidden during bidding'}</TableCell>
                            <TableCell>{item.companyName || 'Hidden during bidding'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Box>
              )}

              {!!bidBoard.bidEntries?.length && (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                    {isVendor ? 'Your Bids by Round' : 'All Vendor Bids'}
                  </Typography>
                  {isSm ? (
                    <Stack spacing={1}>
                      {bidBoard.bidEntries.map((entry, idx) => (
                        <Card key={`${entry.roundNumber}-${idx}-${entry.submittedAt}`} variant="outlined">
                          <CardContent>
                            <Stack spacing={0.5}>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="subtitle2">Round {entry.roundNumber}</Typography>
                                <Typography variant="body2">{formatRate(entry.bidAmount)}</Typography>
                              </Stack>
                              {!isVendor && entry.vendorName && <Typography variant="body2" color="text.secondary">{entry.vendorName}</Typography>}
                              {!isVendor && entry.companyName && <Typography variant="body2" color="text.secondary">{entry.companyName}</Typography>}
                              {entry.airlines && <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>Airlines: {entry.airlines}</Typography>}
                              {entry.routing && <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>Routing: {entry.routing}</Typography>}
                              {entry.comments && <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>Comments: {entry.comments}</Typography>}
                              {entry.ihcInr != null && <Typography variant="body2" color="text.secondary">IHC: ₹{entry.ihcInr}/ctr</Typography>}
                              {entry.thcInr != null && <Typography variant="body2" color="text.secondary">THC: ₹{entry.thcInr}/ctr</Typography>}
                              {entry.cfsInr != null && <Typography variant="body2" color="text.secondary">CFS: ₹{entry.cfsInr}/ctr</Typography>}
                              {entry.otherChargesComments && <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>Other: {entry.otherChargesComments}</Typography>}
                              {entry.totalInr != null && <Typography variant="body2" sx={{ fontWeight: 600, color: '#1565c0' }}>Total est.: ₹{Number(entry.totalInr).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Typography>}
                              <Typography variant="caption" color="text.secondary">{formatDate(entry.submittedAt)}</Typography>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Round</TableCell>
                          {!isVendor && <TableCell>Vendor</TableCell>}
                          {!isVendor && <TableCell>Company</TableCell>}
                          <TableCell>{trade?.mode === 'AIR' ? 'All-in/Kg (INR)' : 'Ocean Freight (USD)'}</TableCell>
                          {trade?.mode === 'AIR' ? (
                            <>
                              <TableCell>Airlines</TableCell>
                              <TableCell>Routing</TableCell>
                              <TableCell>Comments</TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell>IHC (INR)</TableCell>
                              <TableCell>THC (INR)</TableCell>
                              <TableCell>CFS (INR)</TableCell>
                              <TableCell>Other</TableCell>
                              <TableCell>Total Est. (INR)</TableCell>
                            </>
                          )}
                          <TableCell>Submitted At</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bidBoard.bidEntries.map((entry, idx) => (
                          <TableRow key={`${entry.roundNumber}-${idx}-${entry.submittedAt}`}>
                            <TableCell>{entry.roundNumber}</TableCell>
                            {!isVendor && <TableCell>{entry.vendorName || '—'}</TableCell>}
                            {!isVendor && <TableCell>{entry.companyName || '—'}</TableCell>}
                            <TableCell>{formatRate(entry.bidAmount, trade?.mode === 'SEA')}</TableCell>
                            {trade?.mode === 'AIR' ? (
                              <>
                                <TableCell><LongTextCell text={entry.airlines} /></TableCell>
                                <TableCell><LongTextCell text={entry.routing} /></TableCell>
                                <TableCell><LongTextCell text={entry.comments} /></TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell>{entry.ihcInr != null ? `₹${entry.ihcInr}` : '—'}</TableCell>
                                <TableCell>{entry.thcInr != null ? `₹${entry.thcInr}` : '—'}</TableCell>
                                <TableCell>{entry.cfsInr != null ? `₹${entry.cfsInr}` : '—'}</TableCell>
                                <TableCell><LongTextCell text={entry.otherChargesComments} /></TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#1565c0' }}>{entry.totalInr != null ? `₹${Number(entry.totalInr).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—'}</TableCell>
                              </>
                            )}
                            <TableCell>{formatDate(entry.submittedAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
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

      {/* Bid Submission Dialog */}
      <Dialog open={bidDialogOpen} onClose={() => setBidDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Submit Bid — {trade?.mode === 'AIR' ? 'Air' : 'Sea'} Mode</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {trade?.mode === 'AIR' ? (
              <>
                <TextField
                  label="All-in Rate (INR / Kg)"
                  helperText="Covers Local Clearance, THC, AWB, SB, AMS, Air Freight from origin to destination port"
                  value={bidForm.bidAmount}
                  onChange={(e) => setBidForm((p) => ({ ...p, bidAmount: e.target.value }))}
                  type="number"
                  inputProps={{ min: '0.0001', step: '0.0001' }}
                  fullWidth
                  required
                />
                <TextField
                  label="Airlines"
                  value={bidForm.airlines}
                  onChange={(e) => setBidForm((p) => ({ ...p, airlines: e.target.value }))}
                  fullWidth
                />
                <TextField
                  label="Routing (POL → POD → via)"
                  helperText={
                    <span>
                      * Please mention the POL, POD, Routing via (if hopping)<br />
                      All consignments intended for the European region must be routed directly to the declared Final Port of Destination. The First Port of Entry into Europe and the Final Port must be the same. Any diversion, transloading, trucking or port-hopping within Europe shall not be permitted. Deviance to this rule will lead to the quoting partner absorbing the return cost of the consignment.
                    </span>
                  }
                  value={bidForm.routing}
                  onChange={(e) => setBidForm((p) => ({ ...p, routing: e.target.value }))}
                  fullWidth
                  multiline
                  minRows={2}
                />
                <TextField
                  label="Comments"
                  value={bidForm.comments}
                  onChange={(e) => setBidForm((p) => ({ ...p, comments: e.target.value }))}
                  fullWidth
                  multiline
                  minRows={2}
                />
              </>
            ) : (
              <>
                <TextField
                  label="Ocean Freight (USD / container)"
                  value={bidForm.bidAmount}
                  onChange={(e) => setBidForm((p) => ({ ...p, bidAmount: e.target.value }))}
                  type="number"
                  inputProps={{ min: '0.0001', step: '0.01' }}
                  fullWidth
                  required
                />
                <TextField
                  label="IHC (INR / container)"
                  value={bidForm.ihcInr}
                  onChange={(e) => setBidForm((p) => ({ ...p, ihcInr: e.target.value }))}
                  type="number"
                  inputProps={{ min: '0', step: '1' }}
                  fullWidth
                />
                <TextField
                  label="THC (INR / container)"
                  value={bidForm.thcInr}
                  onChange={(e) => setBidForm((p) => ({ ...p, thcInr: e.target.value }))}
                  type="number"
                  inputProps={{ min: '0', step: '1' }}
                  fullWidth
                />
                <TextField
                  label="CFS (INR / container)"
                  value={bidForm.cfsInr}
                  onChange={(e) => setBidForm((p) => ({ ...p, cfsInr: e.target.value }))}
                  type="number"
                  inputProps={{ min: '0', step: '1' }}
                  fullWidth
                />
                <TextField
                  label="Other Charges — Comments"
                  helperText="Specify any additional charges not listed above"
                  value={bidForm.otherChargesComments}
                  onChange={(e) => setBidForm((p) => ({ ...p, otherChargesComments: e.target.value }))}
                  fullWidth
                  multiline
                  minRows={2}
                />
              </>
            )}
            <Divider />
            <FormControlLabel
              control={
                <Checkbox
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  sx={{ color: '#3a8a3a', '&.Mui-checked': { color: '#3a8a3a' } }}
                />
              }
              label={
                <Typography variant="body2">
                  I acknowledge and confirm that I have read and agree to the{' '}
                  <Box
                    component="span"
                    sx={{ color: '#1565c0', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={(e) => { e.preventDefault(); setTermsDialogOpen(true); }}
                  >
                    Terms &amp; Conditions
                  </Box>
                  .
                </Typography>
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBidDialogOpen(false)} sx={{ color: '#666' }}>Cancel</Button>
          <Button
            onClick={submitBid}
            variant="contained"
            disabled={actionLoading || !termsAccepted}
            sx={{ backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' } }}
          >
            Submit Bid
          </Button>
        </DialogActions>
      </Dialog>

      {/* Finalize Trade — Select Winner Dialog */}
      <Dialog open={finalizeDialogOpen} onClose={() => setFinalizeDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Finalize Trade — Select Winner</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
            Review the current leaderboard and confirm your selected freight forwarder. This action will close the tender and notify the selected vendor.
          </Typography>
          {(bidBoard?.leaderboard || []).length === 0 ? (
            <Typography color="error">No bids available to finalize.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>{trade?.mode === 'SEA' ? 'Ocean Freight (USD)' : 'Rate (INR)'}</TableCell>
                  {trade?.mode === 'SEA' && <>
                    <TableCell>IHC (INR)</TableCell>
                    <TableCell>THC (INR)</TableCell>
                    <TableCell>CFS (INR)</TableCell>
                    <TableCell>Other</TableCell>
                  </>}
                  <TableCell>Vendor</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(bidBoard?.leaderboard || []).map((item) => (
                  <TableRow key={item.rank}>
                    <TableCell><strong>{item.rank}</strong></TableCell>
                    <TableCell>{formatRate(item.bidAmount, trade?.mode === 'SEA')}</TableCell>
                    {trade?.mode === 'SEA' && <>
                      <TableCell>{item.ihcInr != null ? `₹${item.ihcInr}` : '—'}</TableCell>
                      <TableCell>{item.thcInr != null ? `₹${item.thcInr}` : '—'}</TableCell>
                      <TableCell>{item.cfsInr != null ? `₹${item.cfsInr}` : '—'}</TableCell>
                      <TableCell><LongTextCell text={item.otherChargesComments} /></TableCell>
                    </>}
                    <TableCell>{item.vendorName || '—'}</TableCell>
                    <TableCell>{item.companyName || '—'}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => closeBid(item.bidId)}
                        disabled={actionLoading}
                        sx={{ backgroundColor: '#2e7d32', '&:hover': { backgroundColor: '#1b5e20' }, whiteSpace: 'nowrap' }}
                      >
                        Confirm as Winner
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinalizeDialogOpen(false)} sx={{ color: '#666' }}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Terms & Conditions Dialog */}
      <Dialog open={termsDialogOpen} onClose={() => setTermsDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Terms &amp; Conditions</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {[
              { title: '1. All-In Freight Rate', body: 'The quoted All-in per Kg rate shall include Local Clearance Charges, Terminal Handling Charges (THC), Airway Bill Charges, Shipping Bill Charges, AMS (Automated Manifest System) Filing Charges, and Air Freight Charges. The rate covers all costs from origin customs clearance up to the destination port unless otherwise specified in writing.' },
              { title: '2. European Shipment Routing Restriction', body: 'All consignments intended for the European region must be routed directly to the declared Final Port of Destination. The First Port of Entry into Europe and the Final Port must remain the same. Any diversion, transshipment, transloading, trucking or port-hopping within Europe shall not be permitted. Deviance to this rule will lead to the quoting partner absorbing the return cost of the consignment.' },
              { title: '3. Master Airway Bill Requirement', body: 'Shipments shall move under a Master Airway Bill (MAWB) only, unless specifically instructed in writing by Pawfect Pet Foods Private Limited to involve a House Airway Bill (HAWB).' },
              { title: '4. Airway Bill Amendment Restriction', body: 'Once the Airway Bill (AWB) has been issued and the Health Certificate has been obtained, the AWB number must not be changed. Since the AWB number is mentioned on the Health Certificate for shipment identification purposes, any amendment after issuance of the Health Certificate may result in customs clearance delays or rejection. Any charges, penalties, or expenses incurred due to AWB changes shall be solely borne by the handling agent or freight forwarder responsible for such amendment.' },
              { title: '5. DDP / Destination Clearance Notification Requirement', body: 'In case of DDP shipments or destination customs clearance arrangements, the handling forwarder and/or customs broker must notify the consignee and the respective warehouse at least 24–36 hours prior to cargo arrival or delivery scheduling. Failure to provide the required advance notice may result in late alert charges, storage charges, redelivery charges, or appointment rescheduling charges. Pawfect Pet Foods Private Limited shall bear no responsibility for such charges, and the same shall be solely borne by the handling agent and/or destination handling forwarder.' },
              { title: '6. Miscellaneous Charges', body: 'Any miscellaneous, additional, or unexpected charges not previously agreed upon shall require prior written approval from Pawfect Pet Foods Private Limited before being incurred or invoiced.' },
              { title: '7. No Unauthorized Shipment Hold', body: 'Cargo shall not be held, delayed, or withheld for payment disputes or operational issues without prior written consent from Pawfect Pet Foods Private Limited. Any unauthorized hold will lead to a 10% consignment value penalty on the quoting freight partner.' },
              { title: '8. Jurisdiction', body: 'All disputes, claims, or legal proceedings arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts of Delhi, India.' },
            ].map((clause) => (
              <Box key={clause.title}>
                <Typography variant="subtitle2" fontWeight={700}>{clause.title}</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.7 }}>{clause.body}</Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setTermsDialogOpen(false); setTermsAccepted(true); }} variant="contained" sx={{ backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' } }}>
            I Agree
          </Button>
          <Button onClick={() => setTermsDialogOpen(false)} sx={{ color: '#666' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Trade Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancel Trade</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to cancel trade <strong>{trade?.tradeId}</strong>? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} sx={{ color: '#666' }}>No, Go Back</Button>
          <Button onClick={cancelTrade} variant="contained" color="error" disabled={actionLoading}>
            Yes, Cancel Trade
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
