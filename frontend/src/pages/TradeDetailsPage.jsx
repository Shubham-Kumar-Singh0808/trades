import { Alert, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';

const getModeLabel = (mode) => {
  if (mode === 'ONLINE') return 'DIRECT';
  if (mode === 'HYBRID') return 'HOPPING';
  return mode;
};

export default function TradeDetailsPage() {
  const { id } = useParams();
  const [trade, setTrade] = useState(null);
  const [error, setError] = useState('');
  const [jobSheetPdfUrl, setJobSheetPdfUrl] = useState('');
  const [trackingListPdfUrl, setTrackingListPdfUrl] = useState('');

  useEffect(() => {
    let createdJobSheetUrl = null;
    let createdTrackingListUrl = null;

    const load = async () => {
      try {
        const [tradeRes, jobSheetRes, trackingListRes] = await Promise.all([
          api.get(`/api/trades/${id}`),
          api.get(`/api/trades/${id}/job-sheet/view`, { responseType: 'blob' }),
          api.get(`/api/trades/${id}/tracking-list/view`, { responseType: 'blob' }),
        ]);
        setTrade(tradeRes.data);
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
      const res = await api.get(`/api/trades/${id}/tracking-list/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `trade-${id}-tracking-list.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to download tracking list PDF');
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
            </Stack>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Button variant="contained" onClick={downloadJobSheet} sx={{ backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' }, px: 3 }}>Download Job Sheet</Button>
            <Button variant="contained" onClick={downloadTrackingList} sx={{ backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' }, px: 3 }}>Download Tracking List</Button>
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
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>Tracking List PDF</Typography>
          <Box sx={{ border: '1px solid #d6dce1', borderRadius: 2, overflow: 'hidden' }}>
            {trackingListPdfUrl ? (
              <iframe
                title="Tracking List PDF"
                src={trackingListPdfUrl}
                style={{ width: '100%', height: '60vh', border: 0 }}
              />
            ) : (
              <Box sx={{ p: 3 }}>
                <Typography color="text.secondary">Loading tracking list preview...</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
