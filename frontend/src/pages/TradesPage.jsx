import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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

const getModeLabel = (mode) => {
  if (mode === 'ONLINE') return 'DIRECT';
  if (mode === 'HYBRID') return 'HOPPING';
  return mode;
};

export default function TradesPage({ session }) {
  const [data, setData] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    tradeId: '',
    mode: 'DIRECT',
    description: '',
    notificationScope: 'ALL_ACTIVE',
    vendorIds: [],
    jobSheetFile: null,
    trackingListFile: null,
  });
  const roles = session?.roles || [];
  const canCreateTrade = roles.includes('ADMIN') || roles.includes('EXECUTIVE');

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
    if (canCreateTrade) {
      loadVendors();
    }
  }, [canCreateTrade]);

  const createTrade = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.jobSheetFile || !form.trackingListFile) {
      setError('Both Job Sheet PDF and Packing List PDF are required.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('tradeId', form.tradeId);
      formData.append('mode', form.mode);
      formData.append('description', form.description);
      formData.append('notificationScope', form.notificationScope);
      if (form.notificationScope === 'SELECTED') {
        form.vendorIds.forEach((id) => formData.append('vendorIds', id));
      }
      formData.append('jobSheetFile', form.jobSheetFile);
      formData.append('trackingListFile', form.trackingListFile);

      await api.post('/api/trades', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ tradeId: '', mode: 'DIRECT', description: '', notificationScope: 'ALL_ACTIVE', vendorIds: [], jobSheetFile: null, trackingListFile: null });
      setCreateModalOpen(false);
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
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">Trade List</Typography>
            {canCreateTrade && (
              <Button variant="contained" onClick={() => setCreateModalOpen(true)} sx={{ backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' }, px: 3 }}>Create Trade</Button>
            )}
          </Stack>
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
                  <TableCell>{getModeLabel(t.mode)}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>{t.createdBy}</TableCell>
                  <TableCell>
                    <Button component={Link} to={`/trades/${t.id}`} size="small" sx={{ color: '#3a8a3a', fontWeight: 600, '&:hover': { backgroundColor: 'rgba(58, 138, 58, 0.1)' } }}>Open</Button>
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

      <Dialog open={createModalOpen && canCreateTrade} onClose={() => setCreateModalOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Create Trade</DialogTitle>
        <DialogContent>
          <Stack component="form" spacing={2} sx={{ mt: 1 }} onSubmit={createTrade}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField label="Trade ID" value={form.tradeId} onChange={(e) => setForm((p) => ({ ...p, tradeId: e.target.value }))} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Mode</InputLabel>
                <Select value={form.mode} label="Mode" onChange={(e) => setForm((p) => ({ ...p, mode: e.target.value }))}>
                  <MenuItem value="DIRECT">DIRECT</MenuItem>
                  <MenuItem value="HOPPING">HOPPING</MenuItem>
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
              <Button component="label" variant="outlined" sx={{ borderColor: '#3a8a3a', color: '#3a8a3a', '&:hover': { backgroundColor: 'rgba(58, 138, 58, 0.08)', borderColor: '#3a8a3a' } }}>
                Upload Job Sheet PDF
                <input
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={(e) => setForm((p) => ({ ...p, jobSheetFile: e.target.files?.[0] || null }))}
                />
              </Button>
              <Typography variant="caption" sx={{ ml: 1 }}>
                {form.jobSheetFile ? form.jobSheetFile.name : 'No file selected'}
              </Typography>
            </Box>
            <Box>
              <Button component="label" variant="outlined" sx={{ borderColor: '#3a8a3a', color: '#3a8a3a', '&:hover': { backgroundColor: 'rgba(58, 138, 58, 0.08)', borderColor: '#3a8a3a' } }}>
                Upload Packing List PDF
                <input
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={(e) => setForm((p) => ({ ...p, trackingListFile: e.target.files?.[0] || null }))}
                />
              </Button>
              <Typography variant="caption" sx={{ ml: 1 }}>
                {form.trackingListFile ? form.trackingListFile.name : 'No file selected'}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModalOpen(false)} sx={{ color: '#666' }}>Cancel</Button>
          <Button onClick={createTrade} variant="contained" sx={{ backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' } }}>Create Trade</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
