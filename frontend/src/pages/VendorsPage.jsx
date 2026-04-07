import { Alert, Button, Card, CardContent, Pagination, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../api/client';

export default function VendorsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ name: '', companyName: '', mobileNo: '', email: '' });

  const load = async (targetPage = page) => {
    setError('');
    try {
      const res = await api.get('/api/vendors', {
        params: { page: targetPage - 1, size: 10, sort: 'name,asc' },
      });
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load vendors');
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const createVendor = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/api/vendors', form);
      setForm({ name: '', companyName: '', mobileNo: '', email: '' });
      setSuccess('Vendor created. Invitation email sent to set password and activate account.');
      load(1);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create vendor');
    }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Vendors</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Create Vendor</Typography>
          <Stack component="form" onSubmit={createVendor} direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <TextField label="Company" value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} />
            <TextField label="Mobile" value={form.mobileNo} onChange={(e) => setForm((p) => ({ ...p, mobileNo: e.target.value }))} />
            <TextField label="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            <Button type="submit" variant="contained">Create</Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Vendor List</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Active</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.content?.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.name}</TableCell>
                  <TableCell>{v.companyName}</TableCell>
                  <TableCell>{v.email}</TableCell>
                  <TableCell>{v.mobileNo}</TableCell>
                  <TableCell>{String(v.active)}</TableCell>
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
                load(value);
              }}
            />
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
