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
  IconButton,
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
  Tooltip,
  Typography,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import api from '../api/client';

export default function UsersPage() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    role: 'VENDOR',
    name: '',
    email: '',
    mobileNo: '',
    companyName: '',
    enabled: true,
  });
  const [editingUser, setEditingUser] = useState(null);

  const load = async (targetPage = page) => {
    setError('');
    setSuccess('');
    try {
      const res = await api.get('/api/admin/users', {
        params: { page: targetPage - 1, size: 10, sort: 'email,asc' },
      });
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load users');
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const createUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/api/admin/users', form);
      setForm({ role: 'VENDOR', name: '', email: '', mobileNo: '', companyName: '', enabled: true });
      setSuccess('User created. Setup password email sent.');
      load(1);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create user');
    }
  };

  const toggleStatus = async (user) => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/api/admin/users/${user.id}/status`, { enabled: !user.enabled });
      setSuccess(`User ${!user.enabled ? 'enabled' : 'disabled'} successfully.`);
      load(page);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update user status');
    }
  };

  const removeUser = async (user) => {
    setError('');
    setSuccess('');
    try {
      await api.delete(`/api/admin/users/${user.id}`);
      setSuccess('User deleted successfully.');
      load(1);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete user');
    }
  };

  const saveEdit = async () => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/api/admin/users/${editingUser.id}`, {
        email: editingUser.email,
        name: editingUser.name,
        mobileNo: editingUser.mobileNo,
        companyName: editingUser.companyName,
        role: editingUser.role,
        enabled: editingUser.enabled,
      });
      setSuccess('User updated successfully.');
      setEditingUser(null);
      load(page);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update user');
    }
  };

  const roleFromUser = (user) => {
    const roles = user.roles || [];
    if (roles.includes('ADMIN')) return 'ADMIN';
    if (roles.includes('EXECUTIVE')) return 'EXECUTIVE';
    return 'VENDOR';
  };

  return (
    <Stack spacing={3} sx={{ width: '100%' }}>
      <Typography variant="h5">Users</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Card sx={{ width: '100%' }}>
        <CardContent sx={{ width: '100%', p: { xs: 2, sm: 3 }, overflow: 'hidden' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 2, gap: 1 }}>
            <Typography variant="h6">User List</Typography>
            <Button variant="contained" onClick={() => setCreateModalOpen(true)} sx={{ backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' }, px: 3 }}>Add User</Button>
          </Stack>
          <Box sx={{ overflowX: 'auto', overflowY: 'hidden', width: '100%', WebkitOverflowScrolling: 'touch' }}>
            <Table size="small" sx={{ width: '100%', minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Name</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Phone</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Company</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Enabled</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Verified</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Roles</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.content?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{u.email}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{u.name}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{u.mobileNo}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{u.companyName}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{String(u.enabled)}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{String(u.emailVerified)}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{u.roles?.join(', ')}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => setEditingUser({ ...u, role: roleFromUser(u) })} color="primary">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={u.enabled ? 'Disable' : 'Enable'}>
                          <IconButton size="small" onClick={() => toggleStatus(u)} color={u.enabled ? 'warning' : 'success'}>
                            {u.enabled ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => removeUser(u)} color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
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

      <Dialog open={Boolean(editingUser)} onClose={() => setEditingUser(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {editingUser && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={editingUser.role}
                  label="Role"
                  onChange={(e) => setEditingUser((p) => ({ ...p, role: e.target.value, companyName: e.target.value === 'VENDOR' ? p.companyName : '' }))}
                >
                  <MenuItem value="VENDOR">VENDOR</MenuItem>
                  <MenuItem value="EXECUTIVE">EXECUTIVE</MenuItem>
                  <MenuItem value="ADMIN">ADMIN</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Name" value={editingUser.name || ''} onChange={(e) => setEditingUser((p) => ({ ...p, name: e.target.value }))} fullWidth />
              <TextField label="Email" value={editingUser.email || ''} onChange={(e) => setEditingUser((p) => ({ ...p, email: e.target.value }))} fullWidth />
              <TextField label="Phone" value={editingUser.mobileNo || ''} onChange={(e) => setEditingUser((p) => ({ ...p, mobileNo: e.target.value }))} fullWidth />
              {editingUser.role === 'VENDOR' && (
                <TextField label="Company Name" value={editingUser.companyName || ''} onChange={(e) => setEditingUser((p) => ({ ...p, companyName: e.target.value }))} fullWidth />
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingUser(null)} sx={{ color: '#666' }}>Cancel</Button>
          <Button onClick={saveEdit} variant="contained" sx={{ backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' } }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create User</DialogTitle>
        <DialogContent>
          <Stack component="form" onSubmit={(e) => { createUser(e); setCreateModalOpen(false); }} spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={form.role}
                label="Role"
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value, companyName: e.target.value === 'VENDOR' ? p.companyName : '' }))}
              >
                <MenuItem value="VENDOR">VENDOR</MenuItem>
                <MenuItem value="EXECUTIVE">EXECUTIVE</MenuItem>
                <MenuItem value="ADMIN">ADMIN</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} fullWidth />
            <TextField label="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} fullWidth />
            <TextField label="Phone" value={form.mobileNo} onChange={(e) => setForm((p) => ({ ...p, mobileNo: e.target.value }))} fullWidth />
            {form.role === 'VENDOR' && (
              <TextField label="Company Name" value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} fullWidth />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModalOpen(false)} sx={{ color: '#666' }}>Cancel</Button>
          <Button onClick={(e) => { createUser(e); setCreateModalOpen(false); }} variant="contained" sx={{ backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' } }}>Create</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
