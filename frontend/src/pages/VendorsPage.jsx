import {
  Alert,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
import { Edit as EditIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import api from '../api/client';

const emptySubVendorForm = {
  name: '',
  companyName: '',
  contactNo: '',
};

export default function VendorsPage({ session }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [subVendorModalOpen, setSubVendorModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [subVendorForm, setSubVendorForm] = useState(emptySubVendorForm);
  const [editingSubVendor, setEditingSubVendor] = useState(null);
  const [subVendorError, setSubVendorError] = useState('');
  const [subVendorSuccess, setSubVendorSuccess] = useState('');
  const [subVendorSaving, setSubVendorSaving] = useState(false);
  const [form, setForm] = useState({ name: '', companyName: '', mobileNo: '', email: '' });

  const roles = session?.roles || [];
  const sessionEmail = (session?.email || '').toLowerCase();
  const isAdmin = roles.includes('ADMIN');
  const isExecutive = roles.includes('EXECUTIVE');
  const isVendor = roles.includes('VENDOR');
  const canCreateVendor = isAdmin || isExecutive;

  const canManageSubVendors = (vendor) => {
    if (!vendor) return false;
    if (isAdmin) return true;
    if (isVendor && (vendor.email || '').toLowerCase() === sessionEmail) return true;
    return false;
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

  const refreshVendorInState = (updatedVendor) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        content: (prev.content || []).map((vendor) => (vendor.id === updatedVendor.id ? updatedVendor : vendor)),
      };
    });
    setSelectedVendor(updatedVendor);
  };

  const openSubVendorModal = (vendor) => {
    setSelectedVendor(vendor);
    setSubVendorForm(emptySubVendorForm);
    setEditingSubVendor(null);
    setSubVendorError('');
    setSubVendorSuccess('');
    setSubVendorModalOpen(true);
  };

  const addSubVendor = async (e) => {
    e.preventDefault();
    if (!selectedVendor) return;

    setSubVendorError('');
    setSubVendorSuccess('');
    try {
      setSubVendorSaving(true);
      const res = await api.post(`/api/vendors/${selectedVendor.id}/subvendors`, subVendorForm);
      refreshVendorInState(res.data);
      setSubVendorForm(emptySubVendorForm);
      setSubVendorSuccess('Sub-vendor added successfully.');
    } catch (err) {
      setSubVendorError(err?.response?.data?.message || 'Failed to add sub-vendor');
    } finally {
      setSubVendorSaving(false);
    }
  };

  const startEditSubVendor = (subVendor) => {
    setEditingSubVendor(subVendor);
    setSubVendorForm({
      name: subVendor.name || '',
      companyName: subVendor.companyName || '',
      contactNo: subVendor.contactNo || '',
    });
    setSubVendorError('');
    setSubVendorSuccess('');
  };

  const updateSubVendor = async (e) => {
    e.preventDefault();
    if (!selectedVendor || !editingSubVendor) return;

    setSubVendorError('');
    setSubVendorSuccess('');
    try {
      setSubVendorSaving(true);
      const res = await api.put(
        `/api/vendors/${selectedVendor.id}/subvendors/${editingSubVendor.id}`,
        subVendorForm
      );
      refreshVendorInState(res.data);
      setEditingSubVendor(null);
      setSubVendorForm(emptySubVendorForm);
      setSubVendorSuccess('Sub-vendor updated successfully.');
    } catch (err) {
      setSubVendorError(err?.response?.data?.message || 'Failed to update sub-vendor');
    } finally {
      setSubVendorSaving(false);
    }
  };

  const cancelSubVendorEdit = () => {
    setEditingSubVendor(null);
    setSubVendorForm(emptySubVendorForm);
    setSubVendorError('');
    setSubVendorSuccess('');
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Vendors</Typography>
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
                <TableCell>Active</TableCell>
                <TableCell>Sub Vendors</TableCell>
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
                  <TableCell>{String(v.active)}</TableCell>
                  <TableCell>{v.subVendors?.length || 0}/3</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => openSubVendorModal(v)}
                      disabled={!canManageSubVendors(v)}
                      sx={{ borderColor: '#3a8a3a', color: '#3a8a3a', '&:hover': { borderColor: '#2d6b2d', color: '#2d6b2d' } }}
                    >
                      Manage Sub Vendors
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

      <Dialog open={subVendorModalOpen} onClose={() => setSubVendorModalOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          Sub Vendors {selectedVendor ? `- ${selectedVendor.name}` : ''}
        </DialogTitle>
        <DialogContent>
          {!canManageSubVendors(selectedVendor) && (
            <Alert severity="info" sx={{ mb: 2 }}>
              You can manage sub-vendors only for your own vendor account.
            </Alert>
          )}

          {subVendorError && <Alert severity="error" sx={{ mb: 2 }}>{subVendorError}</Alert>}
          {subVendorSuccess && <Alert severity="success" sx={{ mb: 2 }}>{subVendorSuccess}</Alert>}

          <Typography variant="body2" sx={{ mb: 2 }}>
            Current sub-vendors: {selectedVendor?.subVendors?.length || 0}/3
          </Typography>

          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(selectedVendor?.subVendors || []).map((sv) => (
                <TableRow key={sv.id}>
                  <TableCell>{sv.name}</TableCell>
                  <TableCell>{sv.companyName}</TableCell>
                  <TableCell>{sv.contactNo}</TableCell>
                  <TableCell>
                    {canManageSubVendors(selectedVendor) && (
                      <IconButton size="small" onClick={() => startEditSubVendor(sv)} color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {canManageSubVendors(selectedVendor) && (
            <Stack
              component="form"
              spacing={2}
              onSubmit={editingSubVendor ? updateSubVendor : addSubVendor}
            >
              <Typography variant="subtitle1">
                {editingSubVendor ? 'Edit Sub Vendor' : 'Add Sub Vendor'}
              </Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Name"
                  value={subVendorForm.name}
                  onChange={(e) => setSubVendorForm((p) => ({ ...p, name: e.target.value }))}
                  fullWidth
                  required
                />
                <TextField
                  label="Company Name"
                  value={subVendorForm.companyName}
                  onChange={(e) => setSubVendorForm((p) => ({ ...p, companyName: e.target.value }))}
                  fullWidth
                  required
                />
              </Stack>
              <TextField
                label="Contact Number"
                value={subVendorForm.contactNo}
                onChange={(e) => setSubVendorForm((p) => ({ ...p, contactNo: e.target.value }))}
                fullWidth
                required
              />

              <Stack direction="row" spacing={1}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={
                    subVendorSaving ||
                    (!editingSubVendor && (selectedVendor?.subVendors?.length || 0) >= 3)
                  }
                  sx={{ backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' } }}
                >
                  {subVendorSaving ? 'Saving...' : editingSubVendor ? 'Update Sub Vendor' : 'Add Sub Vendor'}
                </Button>
                {editingSubVendor && (
                  <Button onClick={cancelSubVendorEdit} sx={{ color: '#666' }}>
                    Cancel Edit
                  </Button>
                )}
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubVendorModalOpen(false)} sx={{ color: '#666' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
