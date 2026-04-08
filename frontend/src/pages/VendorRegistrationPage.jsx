import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import logo from '../assets/images/logo.png';

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
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 0, md: 0 }, maxWidth: 1000, width: '100%', background: 'white', borderRadius: { xs: '16px', md: '24px' }, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)' }}>
        {/* Left Side - Welcome Section */}
        <Box sx={{ background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: { xs: 3, md: 4 }, position: 'relative', overflow: 'hidden', display: { xs: 'none', md: 'flex' } }}>
          {/* Decorative Wave */}
          <Box sx={{ position: 'absolute', bottom: 0, right: -50, width: 300, height: 300, background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%' }} />
          <Box sx={{ position: 'absolute', top: -100, right: -100, width: 250, height: 250, background: 'rgba(255, 255, 255, 0.05)', borderRadius: '50%' }} />
          
          <Box sx={{ textAlign: 'center', zIndex: 1 }}>
            <Box component="img" src={logo} alt="Logo" sx={{ height: 80, mb: 3 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
              Join Us!
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, lineHeight: 1.6 }}>
              Register as a vendor and start managing your trades with Pawfect Trades
            </Typography>
          </Box>
        </Box>

        {/* Right Side - Registration Form */}
        <Box sx={{ p: { xs: 3, md: 4 }, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxHeight: { xs: 'auto', md: '90vh' }, overflowY: { xs: 'auto', md: 'auto' } }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 2 }}>
            <Box component="img" src={logo} alt="Logo" sx={{ height: 60 }} />
          </Box>
          
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#15803d', textAlign: { xs: 'center', md: 'left' } }}>
            Register
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: { xs: 'center', md: 'left' } }}>
            Create your vendor account
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
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#15803d' },
                    '&.Mui-focused fieldset': { borderColor: '#15803d' },
                  },
                }}
              />
              <TextField
                label="Company Name"
                value={form.companyName}
                onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                fullWidth
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#15803d' },
                    '&.Mui-focused fieldset': { borderColor: '#15803d' },
                  },
                }}
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Mobile Number"
                value={form.mobileNo}
                onChange={(e) => setForm((p) => ({ ...p, mobileNo: e.target.value }))}
                fullWidth
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#15803d' },
                    '&.Mui-focused fieldset': { borderColor: '#15803d' },
                  },
                }}
              />
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                fullWidth
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#15803d' },
                    '&.Mui-focused fieldset': { borderColor: '#15803d' },
                  },
                }}
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
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#15803d' },
                    '&.Mui-focused fieldset': { borderColor: '#15803d' },
                  },
                }}
              />
              <TextField
                label="Confirm Password"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                fullWidth
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#15803d' },
                    '&.Mui-focused fieldset': { borderColor: '#15803d' },
                  },
                }}
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 1 }}>
              <Button type="submit" variant="contained" size="large" fullWidth sx={{ background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)', py: 1.5, fontWeight: 600 }}>
                Register Vendor
              </Button>
              <Button component={Link} to="/login" variant="outlined" size="large" fullWidth sx={{ color: '#15803d', borderColor: '#15803d', py: 1.5, fontWeight: 600, '&:hover': { borderColor: '#15803d', background: 'rgba(21, 128, 61, 0.04)' } }}>
                Back to Login
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
