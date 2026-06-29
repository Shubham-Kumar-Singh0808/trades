import { Alert, Button, Card, CardContent, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import api from '../api/client';

export default function ProfileChangesPage({ session }) {
  const [profileChangeRequests, setProfileChangeRequests] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const roles = session?.roles || [];
  const canReviewRequests = roles.includes('ADMIN') || roles.includes('EXECUTIVE');
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));

  const loadRequests = async () => {
    setError('');
    try {
      const res = await api.get('/api/vendors/change-requests', {
        params: { status: 'PENDING', page: 0, size: 50, sort: 'requestedAt,desc' },
      });
      setProfileChangeRequests(res.data?.content || res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load pending profile change requests');
    }
  };

  useEffect(() => {
    if (!canReviewRequests) return;
    loadRequests();
  }, [canReviewRequests]);

  const approveProfileRequest = async (requestId) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/api/vendors/change-requests/${requestId}/approve`);
      setSuccess('Vendor profile change approved.');
      loadRequests();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to approve profile change request');
    }
  };

  const rejectProfileRequest = async (requestId) => {
    const reason = window.prompt('Enter rejection reason');
    if (reason === null) return;

    setError('');
    setSuccess('');
    try {
      await api.patch(`/api/vendors/change-requests/${requestId}/reject`, { reason });
      setSuccess('Vendor profile change request rejected.');
      loadRequests();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reject profile change request');
    }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Vendor Profile Change Requests</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      {!canReviewRequests ? (
        <Alert severity="warning">You do not have permission to view profile change requests.</Alert>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              Pending Profile Change Requests ({profileChangeRequests.length})
            </Typography>
            {isSm ? (
              <Stack spacing={1}>
                {profileChangeRequests.map((row) => (
                  <Card key={row.id} variant="outlined">
                    <CardContent>
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle1">{row.currentName}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.requestedName || ''}</Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">{row.requestedEmail}</Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{row.requestedOfficeAddress}</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <Button size="small" variant="contained" onClick={() => approveProfileRequest(row.id)} sx={{ backgroundColor: '#2e7d32', '&:hover': { backgroundColor: '#1b5e20' } }}>Approve</Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => rejectProfileRequest(row.id)}>Reject</Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
                {profileChangeRequests.length === 0 && (
                  <Typography>No pending profile change requests.</Typography>
                )}
              </Stack>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Requested Name</TableCell>
                    <TableCell>Requested Email</TableCell>
                    <TableCell>Requested Office Address</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {profileChangeRequests.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.currentName}</TableCell>
                      <TableCell>{row.requestedName}</TableCell>
                      <TableCell>{row.requestedEmail}</TableCell>
                      <TableCell sx={{ maxWidth: 300, wordBreak: 'break-word' }}>{row.requestedOfficeAddress}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="contained" onClick={() => approveProfileRequest(row.id)} sx={{ backgroundColor: '#2e7d32', '&:hover': { backgroundColor: '#1b5e20' } }}>Approve</Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => rejectProfileRequest(row.id)}>Reject</Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {profileChangeRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>No pending profile change requests.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
