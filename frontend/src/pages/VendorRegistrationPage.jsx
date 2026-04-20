import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import logo from '../assets/images/logo.png';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyContact = { name: '', designation: '', email: '', phone: '' };

const emptyFieldErrors = {
  name: '',
  gstNo: '',
  officeAddress: '',
  email: '',
  password: '',
  confirmPassword: '',
  companyName: '',
  registeredAddress: '',
  contacts: [
    { ...emptyContact },
    { ...emptyContact },
    { ...emptyContact },
  ],
};

export default function VendorRegistrationPage() {
  const [form, setForm] = useState({
    name: '',
    gstNo: '',
    companyName: '',
    registeredAddress: '',
    officeAddress: '',
    email: '',
    password: '',
    confirmPassword: '',
    contacts: [
      { ...emptyContact },
      { ...emptyContact },
      { ...emptyContact },
    ],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [gstLoading, setGstLoading] = useState(false);
  const [gstStatus, setGstStatus] = useState(null);
  const [fieldErrors, setFieldErrors] = useState(emptyFieldErrors);

  const setFieldValue = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const setContact = (index, key, value) => {
    setForm((prev) => {
      const contacts = [...prev.contacts];
      contacts[index] = { ...contacts[index], [key]: value };
      return { ...prev, contacts };
    });
  };

  const validateForm = () => {
    const nextErrors = {
      ...emptyFieldErrors,
      contacts: [{ ...emptyContact }, { ...emptyContact }, { ...emptyContact }],
    };

    if (!form.name.trim()) nextErrors.name = 'Name is required';
    if (!form.gstNo.trim()) nextErrors.gstNo = 'GST number is required';
    if (!form.companyName.trim()) nextErrors.companyName = 'Fetch GST details first';
    if (!form.registeredAddress.trim()) nextErrors.registeredAddress = 'Fetch GST details first';
    if (!form.officeAddress.trim()) nextErrors.officeAddress = 'Office address is required';

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
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

    form.contacts.forEach((contact, index) => {
      if (!contact.name.trim()) nextErrors.contacts[index].name = 'Name is required';
      if (!contact.designation.trim()) nextErrors.contacts[index].designation = 'Designation is required';
      if (!contact.email.trim()) {
        nextErrors.contacts[index].email = 'Email is required';
      } else if (!EMAIL_REGEX.test(contact.email.trim())) {
        nextErrors.contacts[index].email = 'Enter a valid email address';
      }
      if (!contact.phone.trim()) nextErrors.contacts[index].phone = 'Phone is required';
    });

    setFieldErrors(nextErrors);

    const rootHasErrors = Object.entries(nextErrors)
      .filter(([key]) => key !== 'contacts')
      .some(([, value]) => Boolean(value));
    const contactHasErrors = nextErrors.contacts.some((c) => Object.values(c).some(Boolean));
    return !(rootHasErrors || contactHasErrors);
  };

  const lookupGst = async () => {
    setError('');
    setGstStatus(null);
    setFieldErrors((prev) => ({ ...prev, gstNo: '', companyName: '', registeredAddress: '' }));
    if (!form.gstNo.trim()) {
      setFieldErrors((prev) => ({ ...prev, gstNo: 'GST number is required' }));
      return;
    }

    try {
      setGstLoading(true);
      const res = await api.get('/api/auth/vendor/gst-lookup', { params: { gstNo: form.gstNo.trim() } });
      setForm((prev) => ({
        ...prev,
        gstNo: res.data.gstNo || prev.gstNo,
        companyName: res.data.companyName || '',
        registeredAddress: res.data.registeredAddress || '',
      }));
      setGstStatus({
        status: res.data.gstStatus || '',
        active: Boolean(res.data.gstActive),
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch GST details');
      setForm((prev) => ({ ...prev, companyName: '', registeredAddress: '' }));
      setGstStatus(null);
    } finally {
      setGstLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setError('Please fix the highlighted fields.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/auth/vendor/register', {
        name: form.name.trim(),
        gstNo: form.gstNo.trim(),
        officeAddress: form.officeAddress.trim(),
        email: form.email.trim(),
        password: form.password,
        contactPersons: form.contacts.map((contact) => ({
          name: contact.name.trim(),
          designation: contact.designation.trim(),
          email: contact.email.trim(),
          phone: contact.phone.trim(),
        })),
      });

      setSuccess('Registration request submitted. Admin approval is required before login is enabled.');
      setForm({
        name: '',
        gstNo: '',
        companyName: '',
        registeredAddress: '',
        officeAddress: '',
        email: '',
        password: '',
        confirmPassword: '',
        contacts: [{ ...emptyContact }, { ...emptyContact }, { ...emptyContact }],
      });
      setGstStatus(null);
      setFieldErrors(emptyFieldErrors);
    } catch (err) {
      setError(err?.response?.data?.message || 'Vendor registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 2, md: 4 },
        px: 2,
        background:
          'radial-gradient(circle at 10% 10%, #f2fff6 0%, #dff6e9 40%, #cbeedb 100%)',
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Card
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid rgba(20, 99, 56, 0.12)',
            boxShadow: '0 24px 60px rgba(16, 72, 34, 0.16)',
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Stack spacing={2} sx={{ position: { md: 'sticky' }, top: { md: 24 } }}>
                  <Box
                    component="img"
                    src={logo}
                    alt="Pawfect Foods"
                    sx={{ width: 160, maxWidth: '100%' }}
                  />
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#155c37' }}>
                    Vendor Registration
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#2c523d' }}>
                    All fields are mandatory. Fetch GST details first to auto-fill company and
                    registered address.
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid rgba(21, 92, 55, 0.2)',
                      backgroundColor: 'rgba(239, 252, 244, 0.85)',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: '#155c37', fontWeight: 700 }}>
                      Approval Flow
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: '#3f644f' }}>
                      Request submission, executive review, and admin final approval.
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} md={8}>
                <Stack component="form" onSubmit={submit} spacing={2.5}>
                  {error && <Alert severity="error">{error}</Alert>}
                  {success && <Alert severity="success">{success}</Alert>}

                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#144f35' }}>
                    Basic Details
                  </Typography>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      label="Vendor Name"
                      value={form.name}
                      onChange={(e) => setFieldValue('name', e.target.value)}
                      error={Boolean(fieldErrors.name)}
                      helperText={fieldErrors.name}
                      fullWidth
                      required
                    />
                    <TextField
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setFieldValue('email', e.target.value)}
                      error={Boolean(fieldErrors.email)}
                      helperText={fieldErrors.email}
                      fullWidth
                      required
                    />
                  </Stack>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-start' }}>
                    <TextField
                      label="GST Number"
                      value={form.gstNo}
                      onChange={(e) => setFieldValue('gstNo', e.target.value.toUpperCase())}
                      error={Boolean(fieldErrors.gstNo)}
                      helperText={fieldErrors.gstNo || 'Format: 15 character GSTIN'}
                      inputProps={{ maxLength: 15 }}
                      fullWidth
                      required
                    />
                    <Button
                      type="button"
                      onClick={lookupGst}
                      disabled={gstLoading}
                      variant="outlined"
                      sx={{ minWidth: { md: 190 }, height: 56 }}
                    >
                      {gstLoading ? 'Fetching...' : 'Fetch GST Details'}
                    </Button>
                  </Stack>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      label="Company Name (Auto)"
                      value={form.companyName}
                      fullWidth
                      disabled
                      InputProps={{
                        readOnly: true,
                        startAdornment: <InputAdornment position="start">Auto</InputAdornment>,
                      }}
                      error={Boolean(fieldErrors.companyName)}
                      helperText={fieldErrors.companyName}
                      required
                    />
                    <TextField
                      label="Registered Address (Auto)"
                      value={form.registeredAddress}
                      fullWidth
                      disabled
                      InputProps={{
                        readOnly: true,
                        startAdornment: <InputAdornment position="start">Auto</InputAdornment>,
                      }}
                      error={Boolean(fieldErrors.registeredAddress)}
                      helperText={fieldErrors.registeredAddress}
                      required
                    />
                  </Stack>

                  {gstStatus && (
                    <Alert severity={gstStatus.active ? 'success' : 'warning'}>
                      GST Status: {gstStatus.status || (gstStatus.active ? 'Active' : 'Not Active')} ({gstStatus.active ? 'Active' : 'Not Active'})
                    </Alert>
                  )}

                  <TextField
                    label="Office Address"
                    value={form.officeAddress}
                    onChange={(e) => setFieldValue('officeAddress', e.target.value)}
                    error={Boolean(fieldErrors.officeAddress)}
                    helperText={fieldErrors.officeAddress}
                    fullWidth
                    multiline
                    minRows={2}
                    required
                  />

                  <Divider />

                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#144f35' }}>
                    Contact Persons (3 Mandatory)
                  </Typography>

                  {form.contacts.map((contact, index) => (
                    <Stack
                      key={`contact-${index}`}
                      spacing={1.5}
                      sx={{
                        p: { xs: 1.5, md: 2 },
                        borderRadius: 2,
                        border: '1px solid rgba(28, 110, 63, 0.15)',
                        backgroundColor: '#f5fbf7',
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ color: '#2f5a42', fontWeight: 700 }}>
                        Contact Person {index + 1}
                      </Typography>

                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                        <TextField
                          label="Name"
                          value={contact.name}
                          onChange={(e) => setContact(index, 'name', e.target.value)}
                          error={Boolean(fieldErrors.contacts[index]?.name)}
                          helperText={fieldErrors.contacts[index]?.name}
                          fullWidth
                          required
                        />
                        <TextField
                          label="Designation"
                          value={contact.designation}
                          onChange={(e) => setContact(index, 'designation', e.target.value)}
                          error={Boolean(fieldErrors.contacts[index]?.designation)}
                          helperText={fieldErrors.contacts[index]?.designation}
                          fullWidth
                          required
                        />
                      </Stack>

                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                        <TextField
                          label="Email"
                          type="email"
                          value={contact.email}
                          onChange={(e) => setContact(index, 'email', e.target.value)}
                          error={Boolean(fieldErrors.contacts[index]?.email)}
                          helperText={fieldErrors.contacts[index]?.email}
                          fullWidth
                          required
                        />
                        <TextField
                          label="Phone"
                          type="tel"
                          value={contact.phone}
                          onChange={(e) => setContact(index, 'phone', e.target.value)}
                          error={Boolean(fieldErrors.contacts[index]?.phone)}
                          helperText={fieldErrors.contacts[index]?.phone}
                          fullWidth
                          required
                        />
                      </Stack>
                    </Stack>
                  ))}

                  <Divider />

                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#144f35' }}>
                    Account Credentials
                  </Typography>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      label="Password"
                      type="password"
                      value={form.password}
                      onChange={(e) => setFieldValue('password', e.target.value)}
                      error={Boolean(fieldErrors.password)}
                      helperText={fieldErrors.password || 'Use 8 to 100 characters'}
                      fullWidth
                      required
                    />
                    <TextField
                      label="Confirm Password"
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => setFieldValue('confirmPassword', e.target.value)}
                      error={Boolean(fieldErrors.confirmPassword)}
                      helperText={fieldErrors.confirmPassword}
                      fullWidth
                      required
                    />
                  </Stack>

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{
                      mt: 0.5,
                      py: 1.5,
                      fontWeight: 700,
                      backgroundColor: '#207644',
                      '&:hover': { backgroundColor: '#155c37' },
                    }}
                  >
                    {loading ? 'Submitting...' : 'Submit Registration Request'}
                  </Button>

                  <Typography variant="body2" sx={{ color: '#355d48', textAlign: 'center' }}>
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      style={{ color: '#0f5f3d', fontWeight: 700, textDecoration: 'none' }}
                    >
                      Back to Login
                    </Link>
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
