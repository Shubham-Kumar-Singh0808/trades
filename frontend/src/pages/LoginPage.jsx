import { Alert, Box, Button, Card, CardContent, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';

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
      await api.post('/api/auth/login', form);
      await onLoginSuccess();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 10% 20%, #d7f6f0 0%, #f8f5eb 100%)' }}>
      <Card sx={{ width: 420, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Sign In
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Secure access via HttpOnly JWT cookie.
          </Typography>
          <Box component="form" onSubmit={submit}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                fullWidth
              />
              <Button type="submit" variant="contained" size="large">
                Login
              </Button>
              <Button component={Link} to="/vendor/register" variant="text" size="small">
                New Vendor? Register Here
              </Button>
              <Button component={Link} to="/forgot-password" variant="text" size="small">
                Forgot Password?
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
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
