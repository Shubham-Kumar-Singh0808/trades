import { Alert, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import api from '../api/client';

export default function PendingRegistrationsPage({ session }) {
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);

  const roles = session?.roles || [];
  const canReviewRequests = roles.includes('ADMIN') || roles.includes('EXECUTIVE');
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));

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
            {isSm ? (
              <Stack spacing={1}>
                {registrationRequests.map((row) => (
                  <Card key={row.id} variant="outlined">
                    <CardContent>
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="subtitle1">{row.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.gstNo || '-'}</Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">{row.companyName}</Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip size="small" label={row?.gstActive ? 'Active' : 'Not Active'} color={row?.gstActive ? 'success' : 'default'} variant={row?.gstActive ? 'filled' : 'outlined'} />
                          <Typography variant="caption" sx={{ color: '#586b5f' }}>{row.gstStatus || '-'}</Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{row.email}</Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{row.officeAddress}</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <Button size="small" variant="outlined" onClick={() => setSelectedVendor(row)}>View</Button>
                          <Button size="small" variant="contained" onClick={() => approveRegistration(row.id)} sx={{ backgroundColor: '#2e7d32', '&:hover': { backgroundColor: '#1b5e20' } }}>{approveLabelFor(row)}</Button>
                          <Button size="small" variant="outlined" disabled={!roles.includes('ADMIN')} onClick={() => rejectRegistration(row.id)} color="error">Reject</Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
                {registrationRequests.length === 0 && (
                  <Typography>No pending vendor registrations.</Typography>
                )}
              </Stack>
            ) : (
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
                          <Chip size="small" label={row?.gstActive ? 'Active' : 'Not Active'} color={row?.gstActive ? 'success' : 'default'} variant={row?.gstActive ? 'filled' : 'outlined'} />
                          <Typography variant="caption" sx={{ color: '#586b5f' }}>{row.gstStatus || '-'}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell sx={{ maxWidth: 300, wordBreak: 'break-word' }}>{row.officeAddress}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="outlined" onClick={() => setSelectedVendor(row)}>View</Button>
                          <Button size="small" variant="contained" onClick={() => approveRegistration(row.id)} sx={{ backgroundColor: '#2e7d32', '&:hover': { backgroundColor: '#1b5e20' } }}>{approveLabelFor(row)}</Button>
                          <Button size="small" variant="outlined" disabled={!roles.includes('ADMIN')} onClick={() => rejectRegistration(row.id)} color="error">Reject</Button>
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
            )}
          </CardContent>
        </Card>
      )}

      {/* Vendor Full Details Dialog */}
      <Dialog open={!!selectedVendor} onClose={() => setSelectedVendor(null)} fullWidth maxWidth="sm" scroll="paper">
        <DialogTitle>Vendor Details — {selectedVendor?.companyName}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Box>
              <Typography variant="overline" color="text.secondary">Company Info</Typography>
              <Divider sx={{ mb: 1 }} />
              <Stack spacing={0.5}>
                <Typography variant="body2"><strong>Name:</strong> {selectedVendor?.name}</Typography>
                <Typography variant="body2"><strong>Company:</strong> {selectedVendor?.companyName}</Typography>
                <Typography variant="body2"><strong>GST No:</strong> {selectedVendor?.gstNo || '—'}</Typography>
                <Typography variant="body2"><strong>GST Status:</strong> {selectedVendor?.gstStatus || '—'} {selectedVendor?.gstActive != null && <Chip size="small" label={selectedVendor.gstActive ? 'Active' : 'Not Active'} color={selectedVendor.gstActive ? 'success' : 'default'} sx={{ ml: 0.5 }} />}</Typography>
                <Typography variant="body2"><strong>Registered Address:</strong> {selectedVendor?.registeredAddress || '—'}</Typography>
                <Typography variant="body2"><strong>Office Address:</strong> {selectedVendor?.officeAddress || '—'}</Typography>
              </Stack>
            </Box>
            <Box>
              <Typography variant="overline" color="text.secondary">Primary Contact</Typography>
              <Divider sx={{ mb: 1 }} />
              <Stack spacing={0.5}>
                <Typography variant="body2"><strong>Email:</strong> {selectedVendor?.email || '—'}</Typography>
                <Typography variant="body2"><strong>Mobile:</strong> {selectedVendor?.mobileNo || '—'}</Typography>
              </Stack>
            </Box>
            {selectedVendor?.contactPersons?.length > 0 && (
              <Box>
                <Typography variant="overline" color="text.secondary">Contact Persons</Typography>
                <Divider sx={{ mb: 1 }} />
                <Stack spacing={1.5}>
                  {selectedVendor.contactPersons.map((cp, idx) => (
                    <Box key={cp.id || idx} sx={{ pl: 1, borderLeft: '3px solid #e0e0e0' }}>
                      <Typography variant="body2" fontWeight={600}>{cp.name || '—'}</Typography>
                      <Typography variant="body2" color="text.secondary">{cp.designation || '—'}</Typography>
                      <Typography variant="body2"><strong>Email:</strong> {cp.email || '—'}</Typography>
                      <Typography variant="body2"><strong>Phone:</strong> {cp.phone || '—'}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { approveRegistration(selectedVendor.id); setSelectedVendor(null); }} variant="contained" sx={{ backgroundColor: '#2e7d32', '&:hover': { backgroundColor: '#1b5e20' } }}>
            {approveLabelFor(selectedVendor)}
          </Button>
          <Button onClick={() => { rejectRegistration(selectedVendor.id); setSelectedVendor(null); }} variant="outlined" color="error" disabled={!roles.includes('ADMIN')}>
            Reject
          </Button>
          <Button onClick={() => setSelectedVendor(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
