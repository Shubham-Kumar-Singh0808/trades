import { Alert, Button, Card, CardContent, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../api/client';

export default function PendingRegistrationsPage({ session }) {
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const roles = session?.roles || [];
  const canReviewRequests = roles.includes('ADMIN') || roles.includes('EXECUTIVE');

  const approveLabelFor = (row) => {
    if (roles.includes('ADMIN') && row?.executiveApproved) {
      return 'Final Approve';
    }
    if (roles.includes('EXECUTIVE') && !roles.includes('ADMIN')) {
      return 'Approve & Forward';
    }
    return 'Approve';
  };

  const loadRequests = async () => {
    setError('');
    try {
      const res = await api.get('/api/vendors/registration-requests', {
        params: { page: 0, size: 50, sort: 'createdAt,desc' },
      });
      setRegistrationRequests(res.data?.content || res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load pending registration requests');
    }
  };

  useEffect(() => {
    if (!canReviewRequests) return;
    loadRequests();
  }, [canReviewRequests]);

  const approveRegistration = async (vendorId) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/api/vendors/${vendorId}/registration/approve`);
      setSuccess('Vendor registration approved.');
      loadRequests();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to approve vendor registration');
    }
  };

  const rejectRegistration = async (vendorId) => {
    const reason = window.prompt('Enter rejection reason');
    if (reason === null) return;

    setError('');
    setSuccess('');
    try {
      await api.patch(`/api/vendors/${vendorId}/registration/reject`, { reason });
      setSuccess('Vendor registration rejected.');
      loadRequests();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reject vendor registration');
    }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Pending Registrations</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      {!canReviewRequests ? (
        <Alert severity="warning">You do not have permission to view pending vendor registrations.</Alert>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              Pending Registration Requests ({registrationRequests.length})
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>GST</TableCell>
                  <TableCell>GST Status</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Office Address</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {registrationRequests.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.companyName}</TableCell>
                    <TableCell>{row.gstNo}</TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Chip
                          size="small"
                          label={row?.gstActive ? 'Active' : 'Not Active'}
                          color={row?.gstActive ? 'success' : 'default'}
                          variant={row?.gstActive ? 'filled' : 'outlined'}
                        />
                        <Typography variant="caption" sx={{ color: '#586b5f' }}>
                          {row.gstStatus || '-'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.officeAddress}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => approveRegistration(row.id)}
                          sx={{ backgroundColor: '#2e7d32', '&:hover': { backgroundColor: '#1b5e20' } }}
                        >
                          {approveLabelFor(row)}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={!roles.includes('ADMIN')}
                          onClick={() => rejectRegistration(row.id)}
                          color="error"
                        >
                          Reject
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {registrationRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>No pending vendor registrations.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
