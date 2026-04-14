import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';

export default function VendorSetupPasswordPage() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get('token') || '', [params]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing setup token');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and confirm password must match');
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/auth/setup-password', { token, password });
      navigate('/login?passwordSetup=success', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to setup password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 85% 20%, #e6eeff 0%, #f8f5eb 100%)', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 560, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Set Password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create your account password to start using PawfectFoods portal.
          </Typography>

          <Stack component="form" spacing={2} onSubmit={submit}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              fullWidth
            />

            <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ backgroundColor: '#3a8a3a', background: disabled ? 'rgba(58, 138, 58, 0.5)' : 'linear-gradient(135deg, #3a8a3a 0%, #428a42 100%)', boxShadow: '0 4px 12px rgba(58, 138, 58, 0.3)', fontWeight: 700, transition: 'all 0.3s ease', '&:hover': disabled ? {} : { boxShadow: '0 6px 16px rgba(58, 138, 58, 0.4)', transform: 'translateY(-2px)' } }}>
              {loading ? 'Saving...' : 'Set Password'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
