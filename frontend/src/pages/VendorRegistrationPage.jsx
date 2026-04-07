import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function VendorRegistrationPage() {
  const [form, setForm] = useState({
    name: '',
    companyName: '',
    mobileNo: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setError('Password and confirm password must match');
      return;
    }

    try {
      await api.post('/api/auth/vendor/register', {
        name: form.name,
        companyName: form.companyName,
        mobileNo: form.mobileNo,
        email: form.email,
        password: form.password,
      });
      setSuccess('Registration successful. Please check your email and activate your account.');
      setForm({
        name: '',
        companyName: '',
        mobileNo: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Vendor registration failed');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 10% 20%, #d7f6f0 0%, #f8f5eb 100%)', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 760, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Vendor Registration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Fill all details. Activation link will be sent to your email.
          </Typography>

          <Stack component="form" spacing={2} onSubmit={submit}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Full Name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                fullWidth
                required
              />
              <TextField
                label="Company Name"
                value={form.companyName}
                onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                fullWidth
                required
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Mobile Number"
                value={form.mobileNo}
                onChange={(e) => setForm((p) => ({ ...p, mobileNo: e.target.value }))}
                fullWidth
                required
              />
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                fullWidth
                required
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                fullWidth
                required
              />
              <TextField
                label="Confirm Password"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                fullWidth
                required
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Button type="submit" variant="contained" size="large">
                Register Vendor
              </Button>
              <Button component={Link} to="/login" variant="outlined" size="large">
                Back to Login
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
