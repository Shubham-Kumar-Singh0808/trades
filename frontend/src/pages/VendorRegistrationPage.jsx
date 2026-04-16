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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyFieldErrors = {
  name: '',
  companyName: '',
  mobileNo: '',
  email: '',
  password: '',
  confirmPassword: '',
};

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
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(emptyFieldErrors);

  const validateForm = () => {
    const nextErrors = { ...emptyFieldErrors };

    const name = form.name.trim();
    const companyName = form.companyName.trim();
    const mobileNo = form.mobileNo.trim();
    const email = form.email.trim();

    if (!name) {
      nextErrors.name = 'Name is required';
    } else if (name.length > 100) {
      nextErrors.name = 'Name must be at most 100 characters';
    }

    if (!companyName) {
      nextErrors.companyName = 'Company name is required';
    } else if (companyName.length > 150) {
      nextErrors.companyName = 'Company name must be at most 150 characters';
    }

    if (!mobileNo) {
      nextErrors.mobileNo = 'Mobile number is required';
    } else if (mobileNo.length > 20) {
      nextErrors.mobileNo = 'Mobile number must be at most 20 characters';
    }

    if (!email) {
      nextErrors.email = 'Email is required';
    } else if (email.length > 150) {
      nextErrors.email = 'Email must be at most 150 characters';
    } else if (!EMAIL_REGEX.test(email)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!form.password.trim()) {
      nextErrors.password = 'Password is required';
    } else if (form.password.length < 8 || form.password.length > 100) {
      nextErrors.password = 'Password must be between 8 and 100 characters';
    }

    if (!form.confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Confirm password is required';
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Password and confirm password must match';
    }

    setFieldErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const applyBackendFieldErrors = (details) => {
    if (!details || typeof details !== 'object') {
      return false;
    }

    const mappedErrors = { ...emptyFieldErrors };
    let hasMappedError = false;

    Object.entries(details).forEach(([key, message]) => {
      if (key in mappedErrors) {
        mappedErrors[key] = String(message);
        hasMappedError = true;
      }
    });

    if (hasMappedError) {
      setFieldErrors(mappedErrors);
    }

    return hasMappedError;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors(emptyFieldErrors);

    if (!validateForm()) {
      setError('Please fix the highlighted fields.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/auth/vendor/register', {
        name: form.name.trim(),
        companyName: form.companyName.trim(),
        mobileNo: form.mobileNo.trim(),
        email: form.email.trim(),
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
      setFieldErrors(emptyFieldErrors);
    } catch (err) {
      const backendDetails = err?.response?.data?.details;
      const hasFieldErrors = applyBackendFieldErrors(backendDetails);
      if (hasFieldErrors) {
        setError('Please fix the highlighted fields.');
      } else {
        setError(err?.response?.data?.message || 'Vendor registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 0, md: 0 }, maxWidth: 1000, width: '100%', background: 'white', borderRadius: { xs: '16px', md: '24px' }, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)' }}>
        {/* Left Side - Welcome Section (Light background for visibility) */}
        <Box sx={{ background: '#f8faf6', color: '#1f2937', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: { xs: 3, md: 4 }, position: 'relative', overflow: 'hidden', display: { xs: 'none', md: 'flex' } }}>
          {/* Decorative Wave */}
          <Box sx={{ position: 'absolute', bottom: 0, right: -50, width: 300, height: 300, background: 'rgba(21, 128, 61, 0.05)', borderRadius: '50%' }} />
          <Box sx={{ position: 'absolute', top: -100, right: -100, width: 250, height: 250, background: 'rgba(21, 128, 61, 0.03)', borderRadius: '50%' }} />
          
          <Box sx={{ textAlign: 'center', zIndex: 1 }}>
            <Box component="img" src={logo} alt="Logo" sx={{ height: 80, mb: 3 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#15803d' }}>
              Join Us!
            </Typography>
            <Typography variant="body1" sx={{ color: '#6b7280', lineHeight: 1.6 }}>
              Register as a vendor and start managing your trades with Pawfect Trades
            </Typography>
          </Box>
        </Box>

        {/* Right Side - Registration Form (Green background) */}
        <Box sx={{ p: { xs: 3, md: 4 }, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxHeight: { xs: 'auto', md: '90vh' }, overflowY: { xs: 'auto', md: 'auto' }, background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 2 }}>
            <Box component="img" src={logo} alt="Logo" sx={{ height: 60 }} />
          </Box>
          
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#15803d', textAlign: { xs: 'center', md: 'left' } }}>
            Register
          </Typography>
          <Typography variant="body2" sx={{ color: '#555', mb: 3, textAlign: { xs: 'center', md: 'left' } }}>
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
                error={Boolean(fieldErrors.name)}
                helperText={fieldErrors.name}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#d1fae5' },
                    '&:hover fieldset': { borderColor: '#15803d' },
                    '&.Mui-focused fieldset': { borderColor: '#15803d', borderWidth: '2px' },
                  },
                }}
              />
              <TextField
                label="Company Name"
                value={form.companyName}
                onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                fullWidth
                required
                error={Boolean(fieldErrors.companyName)}
                helperText={fieldErrors.companyName}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#d1fae5' },
                    '&:hover fieldset': { borderColor: '#15803d' },
                    '&.Mui-focused fieldset': { borderColor: '#15803d', borderWidth: '2px' },
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
                error={Boolean(fieldErrors.mobileNo)}
                helperText={fieldErrors.mobileNo}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#d1fae5' },
                    '&:hover fieldset': { borderColor: '#15803d' },
                    '&.Mui-focused fieldset': { borderColor: '#15803d', borderWidth: '2px' },
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
                error={Boolean(fieldErrors.email)}
                helperText={fieldErrors.email}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#d1fae5' },
                    '&:hover fieldset': { borderColor: '#15803d' },
                    '&.Mui-focused fieldset': { borderColor: '#15803d', borderWidth: '2px' },
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
                error={Boolean(fieldErrors.password)}
                helperText={fieldErrors.password}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#d1fae5' },
                    '&:hover fieldset': { borderColor: '#15803d' },
                    '&.Mui-focused fieldset': { borderColor: '#15803d', borderWidth: '2px' },
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
                error={Boolean(fieldErrors.confirmPassword)}
                helperText={fieldErrors.confirmPassword}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#d1fae5' },
                    '&:hover fieldset': { borderColor: '#15803d' },
                    '&.Mui-focused fieldset': { borderColor: '#15803d', borderWidth: '2px' },
                  },
                }}
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 1 }}>
              <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ background: loading ? 'rgba(58, 138, 58, 0.5)' : 'linear-gradient(135deg, #3a8a3a 0%, #428a42 100%)', boxShadow: '0 4px 12px rgba(58, 138, 58, 0.3)', py: 1.5, fontWeight: 700, transition: 'all 0.3s ease', '&:hover': loading ? {} : { boxShadow: '0 6px 16px rgba(58, 138, 58, 0.4)', transform: 'translateY(-2px)' } }}>
                {loading ? 'Registering...' : 'Register Vendor'}
              </Button>
            </Stack>

            <Stack spacing={1} sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#555' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#15803d', textDecoration: 'none', fontWeight: 600 }}>
                  Back to Login
                </Link>
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
