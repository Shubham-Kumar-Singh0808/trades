import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';

export default function ResetPasswordPage() {
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
      setError('Invalid reset token');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and confirm password must match');
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/auth/reset-password', { token, password });
      navigate('/login?reset=success', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 85% 20%, #d9f7f0 0%, #f8f5eb 100%)', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 520, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Reset Password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Set your new password.
          </Typography>
          <Stack component="form" spacing={2} onSubmit={submit}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth required />
            <TextField label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} fullWidth required />
            <Button type="submit" variant="contained" size="large" disabled={loading}>{loading ? 'Saving...' : 'Reset Password'}</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
