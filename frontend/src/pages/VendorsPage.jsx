import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Pagination,
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
import api from '../api/client';

export default function VendorsPage({ session }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [form, setForm] = useState({ name: '', companyName: '', mobileNo: '', email: '' });

  const roles = session?.roles || [];
  const isAdmin = roles.includes('ADMIN');
  const isExecutive = roles.includes('EXECUTIVE');
  const canCreateVendor = isAdmin || isExecutive;

  const approveLabelFor = (row) => {
    if (isAdmin && row?.executiveApproved) {
      return 'Final Approve';
    }
    if (isExecutive && !isAdmin) {
      return 'Approve & Forward';
    }
    return 'Approve';
  };

  const renderGstActiveChip = (row) => {
    const isActive = row?.gstActive === true;
    return (
      <Chip
        size="small"
        label={isActive ? 'Active' : 'Not Active'}
        color={isActive ? 'success' : 'default'}
        variant={isActive ? 'filled' : 'outlined'}
      />
    );
  };

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
      setCreateModalOpen(false);
      load(1);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create vendor');
    }
  };


  const openContactDetails = (vendor) => {
    setSelectedVendor(vendor);
    setContactModalOpen(true);
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5">All Vendors</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}


      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">Vendor List</Typography>
            {canCreateVendor && (
              <Button variant="contained" onClick={() => setCreateModalOpen(true)} sx={{ backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' }, px: 3 }}>Add Vendor</Button>
            )}
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Registration Status</TableCell>
                <TableCell>GST Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.content?.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.name}</TableCell>
                  <TableCell>{v.companyName}</TableCell>
                  <TableCell>{v.email}</TableCell>
                  <TableCell>{v.mobileNo}</TableCell>
                  <TableCell>{v.registrationStatus || (v.active ? 'APPROVED' : 'INACTIVE')}</TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      {renderGstActiveChip(v)}
                      <Typography variant="caption" sx={{ color: '#586b5f' }}>
                     
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => openContactDetails(v)}
                      sx={{ borderColor: '#3a8a3a', color: '#3a8a3a', '&:hover': { borderColor: '#2d6b2d', color: '#2d6b2d' } }}
                    >
                      View Details
                    </Button>
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
                load(value);
              }}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Vendor</DialogTitle>
        <DialogContent>
          <Stack component="form" onSubmit={(e) => { createVendor(e); }} spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} fullWidth />
            <TextField label="Company" value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} fullWidth />
            <TextField label="Mobile" value={form.mobileNo} onChange={(e) => setForm((p) => ({ ...p, mobileNo: e.target.value }))} fullWidth />
            <TextField label="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModalOpen(false)} sx={{ color: '#666' }}>Cancel</Button>
          <Button onClick={createVendor} variant="contained" sx={{ backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' } }}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={contactModalOpen} onClose={() => setContactModalOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          Contact Details {selectedVendor ? `- ${selectedVendor.name}` : ''}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#51685b' }}>
            Primary vendor email: {selectedVendor?.email || '-'}
          </Typography>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Designation</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(selectedVendor?.contactPersons || []).map((cp, index) => (
                <TableRow key={cp.id || `cp-${index}`}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{cp.name}</TableCell>
                  <TableCell>{cp.designation}</TableCell>
                  <TableCell>{cp.email}</TableCell>
                  <TableCell>{cp.phone}</TableCell>
                </TableRow>
              ))}
              {(selectedVendor?.contactPersons || []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>No contact persons available.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactModalOpen(false)} sx={{ color: '#666' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
