import { Alert, Box, Button, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import logo from '../assets/images/logo.png';

export default function LoginPage({ onLoginSuccess }) {
  const [form, setForm] = useState({ email: 'admin@pawfectfoods.com', password: 'admin@pawfectfoods' });
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname
    ? `${location.state.from.pathname}${location.state.from.search || ''}${location.state.from.hash || ''}`
    : '/trades';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('activation') === 'success') {
      setToastSeverity('success');
      setToastMessage('Account activation success. Now you can login.');
    } else if (params.get('activation') === 'failed') {
      setToastSeverity('error');
      setToastMessage('Account activation failed or link expired.');
    } else if (params.get('passwordSetup') === 'success') {
      setToastSeverity('success');
      setToastMessage('Password created successfully. Please login.');
    } else if (params.get('reset') === 'success') {
      setToastSeverity('success');
      setToastMessage('Password reset successful. Please login.');
    }
  }, [location.search]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/api/auth/login', form, { suppressErrorToast: true });

      if (res.data?.requiresPasswordSetup) {
        if (!res.data?.setupToken) {
          setError('Temporary login is enabled but setup token is missing. Please contact admin.');
          return;
        }
        navigate(`/setup-password?token=${encodeURIComponent(res.data.setupToken)}`, { replace: true });
        return;
      }

      await onLoginSuccess();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 0, md: 0 }, maxWidth: 900, width: '100%', background: 'white', borderRadius: { xs: '16px', md: '24px' }, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)' }}>
        {/* Left Side - Welcome Section (Light background for visibility) */}
        <Box sx={{ background: '#f8faf6', color: '#1f2937', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: { xs: 3, md: 4 }, position: 'relative', overflow: 'hidden', display: { xs: 'none', md: 'flex' } }}>
          {/* Decorative Wave */}
          <Box sx={{ position: 'absolute', bottom: 0, right: -50, width: 300, height: 300, background: 'rgba(21, 128, 61, 0.05)', borderRadius: '50%' }} />
          <Box sx={{ position: 'absolute', top: -100, right: -100, width: 250, height: 250, background: 'rgba(21, 128, 61, 0.03)', borderRadius: '50%' }} />
          
          <Box sx={{ textAlign: 'center', zIndex: 1 }}>
            <Box component="img" src={logo} alt="Logo" sx={{ height: 80, mb: 3 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#15803d' }}>
              Welcome Back!
            </Typography>
            <Typography variant="body1" sx={{ color: '#6b7280', lineHeight: 1.6 }}>
              Login to your account to continue managing your trades and vendors
            </Typography>
          </Box>
        </Box>

        {/* Right Side - Login Form (Green background) */}
        <Box sx={{ p: { xs: 3, md: 4 }, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 2 }}>
            <Box component="img" src={logo} alt="Logo" sx={{ height: 60 }} />
          </Box>
          
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#15803d', textAlign: { xs: 'center', md: 'left' } }}>
            Sign In
          </Typography>
          <Typography variant="body2" sx={{ color: '#555', mb: 3, textAlign: { xs: 'center', md: 'left' } }}>
            Login to your account to continue
          </Typography>

          <Box component="form" onSubmit={submit}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              
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
                    '& fieldset': { borderColor: '#d1fae5' },
                    '&:hover fieldset': { borderColor: '#15803d' },
                    '&.Mui-focused fieldset': { borderColor: '#15803d', borderWidth: '2px' },
                  },
                  '& .MuiInputBase-input::placeholder': { color: '#a7f3d0', opacity: 1 },
                }}
              />
              
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
                    '& fieldset': { borderColor: '#d1fae5' },
                    '&:hover fieldset': { borderColor: '#15803d' },
                    '&.Mui-focused fieldset': { borderColor: '#15803d', borderWidth: '2px' },
                  },
                }}
              />
              
              <Button type="submit" variant="contained" size="large" sx={{ background: 'linear-gradient(135deg, #3a8a3a 0%, #428a42 100%)', boxShadow: '0 4px 12px rgba(58, 138, 58, 0.3)', py: 1.5, fontWeight: 700, transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 6px 16px rgba(58, 138, 58, 0.4)', transform: 'translateY(-2px)' }, mt: 1 }}>
                Sign In
              </Button>

              <Stack spacing={1} sx={{ mt: 2 }}>
                <Button component={Link} to="/forgot-password" variant="text" size="small" sx={{ color: '#3a8a3a', fontWeight: 600, '&:hover': { backgroundColor: 'rgba(58, 138, 58, 0.08)' } }}>
                  Forgot Password?
                </Button>
                <Button component={Link} to="/vendor/register" variant="text" size="small" sx={{ color: '#3a8a3a', fontWeight: 600, '&:hover': { backgroundColor: 'rgba(58, 138, 58, 0.08)' } }}>
                  New Vendor? Register Here
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={4500}
        onClose={() => setToastMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setToastMessage('')} severity={toastSeverity} variant="filled">
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
