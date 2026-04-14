import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/api/auth/forgot-password', { email });
      setSuccess(res?.data?.message || 'Password reset link sent to your email');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to process forgot password request');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 15% 20%, #d9f0ff 0%, #f8f5eb 100%)', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 480, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Forgot Password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your registered email to receive a password reset link.
          </Typography>
          <Stack component="form" spacing={2} onSubmit={submit}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
            <Button type="submit" variant="contained" size="large" sx={{ backgroundColor: '#3a8a3a', background: 'linear-gradient(135deg, #3a8a3a 0%, #428a42 100%)', boxShadow: '0 4px 12px rgba(58, 138, 58, 0.3)', fontWeight: 700, transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 6px 16px rgba(58, 138, 58, 0.4)', transform: 'translateY(-2px)' } }}>Send Link</Button>
            <Button component={Link} to="/login" variant="text" sx={{ color: '#3a8a3a', fontWeight: 600, '&:hover': { backgroundColor: 'rgba(58, 138, 58, 0.08)' } }}>Back to Login</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
