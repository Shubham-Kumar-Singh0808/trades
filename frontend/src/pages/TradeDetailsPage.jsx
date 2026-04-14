import { Alert, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';

export default function TradeDetailsPage() {
  const { id } = useParams();
  const [trade, setTrade] = useState(null);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  useEffect(() => {
    let createdUrl = null;

    const load = async () => {
      try {
        const [tradeRes, pdfRes] = await Promise.all([
          api.get(`/api/trades/${id}`),
          api.get(`/api/trades/${id}/view`, { responseType: 'blob' }),
        ]);
        setTrade(tradeRes.data);
        createdUrl = URL.createObjectURL(new Blob([pdfRes.data], { type: 'application/pdf' }));
        setPdfUrl((old) => {
          if (old) {
            URL.revokeObjectURL(old);
          }
          return createdUrl;
        });
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load trade details');
      }
    };
    load();

    return () => {
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [id]);

  const openDownload = async () => {
    try {
      const res = await api.get(`/api/trades/${id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `trade-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to download trade PDF');
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
              <Typography><strong>Mode:</strong> {trade.mode}</Typography>
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
            <Button variant="contained" onClick={openDownload} sx={{ backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' }, px: 3 }}>Download (Watermarked)</Button>
          </Stack>
          <Box sx={{ border: '1px solid #d6dce1', borderRadius: 2, overflow: 'hidden' }}>
            {pdfUrl ? (
              <iframe
                title="Trade PDF"
                src={pdfUrl}
                style={{ width: '100%', height: '75vh', border: 0 }}
              />
            ) : (
              <Box sx={{ p: 3 }}>
                <Typography color="text.secondary">Loading PDF preview...</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
