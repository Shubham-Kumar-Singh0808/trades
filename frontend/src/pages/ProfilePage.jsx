import { Alert, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../api/client';

export default function ProfilePage({ session, onSessionRefresh }) {
  const [form, setForm] = useState({ name: '', mobileNo: '', companyName: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setForm({
      name: session?.name || '',
      mobileNo: session?.mobileNo || '',
      companyName: session?.companyName || '',
    });
  }, [session]);

  const isVendor = (session?.roles || []).includes('VENDOR');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/api/auth/me/profile', form);
      await onSessionRefresh();
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5">My Profile</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      <Card>
        <CardContent>
          <Stack component="form" spacing={2} onSubmit={submit}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} fullWidth required />
            <TextField label="Mobile Number" value={form.mobileNo} onChange={(e) => setForm((p) => ({ ...p, mobileNo: e.target.value }))} fullWidth required />
            {isVendor && (
              <TextField label="Company Name" value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} fullWidth required />
            )}
            <Button type="submit" variant="contained">Update Profile</Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
