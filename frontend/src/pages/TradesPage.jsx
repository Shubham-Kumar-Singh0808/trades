import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
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
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function TradesPage() {
  const [data, setData] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    tradeId: '',
    mode: 'ONLINE',
    description: '',
    notificationScope: 'ALL_ACTIVE',
    vendorIds: [],
    file: null,
  });

  const loadTrades = async (targetPage = page) => {
    setError('');
    try {
      const res = await api.get('/api/trades', {
        params: { page: targetPage - 1, size: 10, sort: 'createdAt,desc' },
      });
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load trades');
    }
  };

  const loadVendors = async () => {
    try {
      const res = await api.get('/api/vendors', { params: { page: 0, size: 100, sort: 'name,asc' } });
      setVendors(res.data.content || []);
    } catch {
      // ignore vendor list errors for non-admin/vendor scope usage
    }
  };

  useEffect(() => {
    loadTrades(1);
    loadVendors();
  }, []);

  const createTrade = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const formData = new FormData();
      formData.append('tradeId', form.tradeId);
      formData.append('mode', form.mode);
      formData.append('description', form.description);
      formData.append('notificationScope', form.notificationScope);
      if (form.notificationScope === 'SELECTED') {
        form.vendorIds.forEach((id) => formData.append('vendorIds', id));
      }
      if (form.file) {
        formData.append('file', form.file);
      }

      await api.post('/api/trades', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ tradeId: '', mode: 'ONLINE', description: '', notificationScope: 'ALL_ACTIVE', vendorIds: [], file: null });
      loadTrades(1);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create trade');
    }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Trades</Typography>
      {error && <Alert severity="error">{error}</Alert>}

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Create Trade</Typography>
          <Stack component="form" spacing={2} onSubmit={createTrade}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField label="Trade ID" value={form.tradeId} onChange={(e) => setForm((p) => ({ ...p, tradeId: e.target.value }))} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Mode</InputLabel>
                <Select value={form.mode} label="Mode" onChange={(e) => setForm((p) => ({ ...p, mode: e.target.value }))}>
                  <MenuItem value="ONLINE">ONLINE</MenuItem>
                  <MenuItem value="OFFLINE">OFFLINE</MenuItem>
                  <MenuItem value="HYBRID">HYBRID</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              multiline
              minRows={2}
              fullWidth
            />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Notification Scope</InputLabel>
                <Select
                  value={form.notificationScope}
                  label="Notification Scope"
                  onChange={(e) => setForm((p) => ({ ...p, notificationScope: e.target.value, vendorIds: [] }))}
                >
                  <MenuItem value="ALL_ACTIVE">ALL_ACTIVE</MenuItem>
                  <MenuItem value="ALL">ALL</MenuItem>
                  <MenuItem value="SELECTED">SELECTED</MenuItem>
                </Select>
              </FormControl>
              {form.notificationScope === 'SELECTED' && (
                <FormControl fullWidth>
                  <InputLabel>Selected Vendors</InputLabel>
                  <Select
                    multiple
                    value={form.vendorIds}
                    label="Selected Vendors"
                    onChange={(e) => setForm((p) => ({ ...p, vendorIds: e.target.value }))}
                  >
                    {vendors.map((v) => (
                      <MenuItem key={v.id} value={v.id}>{v.name} ({v.companyName})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
            <Box>
              <Button component="label" variant="outlined">
                Upload PDF
                <input
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] || null }))}
                />
              </Button>
              <Typography variant="caption" sx={{ ml: 1 }}>
                {form.file ? form.file.name : 'No file selected'}
              </Typography>
            </Box>
            <Button type="submit" variant="contained">Create Trade</Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Trade List</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Trade ID</TableCell>
                <TableCell>Mode</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.content?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.tradeId}</TableCell>
                  <TableCell>{t.mode}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>{t.createdBy}</TableCell>
                  <TableCell>
                    <Button component={Link} to={`/trades/${t.id}`} size="small">Open</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!!data && (
            <Pagination
              sx={{ mt: 2 }}
              count={Math.max(data.totalPages || 1, 1)}
              page={page}
              onChange={(_, value) => {
                setPage(value);
                loadTrades(value);
              }}
            />
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
