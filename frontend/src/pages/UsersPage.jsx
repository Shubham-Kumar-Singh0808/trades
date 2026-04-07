import {
  Alert,
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
import api from '../api/client';

export default function UsersPage() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    <Stack spacing={3}>
      <Typography variant="h5">Users</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Create User</Typography>
          <Stack component="form" onSubmit={createUser} spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
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
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField label="Phone" value={form.mobileNo} onChange={(e) => setForm((p) => ({ ...p, mobileNo: e.target.value }))} fullWidth />
              {form.role === 'VENDOR' && (
                <TextField label="Company Name" value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} fullWidth />
              )}
            </Stack>
            <Button type="submit" variant="contained">Create</Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>User List</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Enabled</TableCell>
                <TableCell>Verified</TableCell>
                <TableCell>Roles</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.content?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.mobileNo}</TableCell>
                  <TableCell>{u.companyName}</TableCell>
                  <TableCell>{String(u.enabled)}</TableCell>
                  <TableCell>{String(u.emailVerified)}</TableCell>
                  <TableCell>{u.roles?.join(', ')}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" onClick={() => setEditingUser({ ...u, role: roleFromUser(u) })}>Edit</Button>
                      <Button size="small" variant="outlined" color={u.enabled ? 'warning' : 'success'} onClick={() => toggleStatus(u)}>
                        {u.enabled ? 'Disable' : 'Enable'}
                      </Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => removeUser(u)}>Delete</Button>
                    </Stack>
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
          <Button onClick={() => setEditingUser(null)}>Cancel</Button>
          <Button onClick={saveEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
