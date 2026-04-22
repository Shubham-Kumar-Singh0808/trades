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
  Step,
  StepLabel,
  Stepper,
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
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    'Basic Details',
    'Contact Person 1',
    'Contact Person 2',
    'Contact Person 3',
    'Account Credentials',
  ];

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

  const getDuplicateContactEmailIndexes = () => {
    const emailMap = form.contacts.reduce((acc, contact, index) => {
      const email = contact.email.trim().toLowerCase();
      if (!email) return acc;
      acc[email] = acc[email] || [];
      acc[email].push(index);
      return acc;
    }, {});

    return Object.values(emailMap)
      .filter((indexes) => indexes.length > 1)
      .flat();
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

    const duplicateEmailIndexes = getDuplicateContactEmailIndexes();
    duplicateEmailIndexes.forEach((index) => {
      nextErrors.contacts[index].email = 'Contact person emails must be unique';
    });

    setFieldErrors(nextErrors);

    const rootHasErrors = Object.entries(nextErrors)
      .filter(([key]) => key !== 'contacts')
      .some(([, value]) => Boolean(value));
    const contactHasErrors = nextErrors.contacts.some((c) => Object.values(c).some(Boolean));
    return { valid: !(rootHasErrors || contactHasErrors), errors: nextErrors };
  };

  const validateStep = (step) => {
    const nextErrors = { ...fieldErrors, contacts: [...fieldErrors.contacts] };
    let stepValid = true;
    const duplicateEmailIndexes = getDuplicateContactEmailIndexes();

    if (step === 0) {
      if (!form.name.trim()) {
        nextErrors.name = 'Name is required';
        stepValid = false;
      }
      if (!form.gstNo.trim()) {
        nextErrors.gstNo = 'GST number is required';
        stepValid = false;
      }
      if (!form.companyName.trim()) {
        nextErrors.companyName = 'Fetch GST details first';
        stepValid = false;
      }
      if (!form.registeredAddress.trim()) {
        nextErrors.registeredAddress = 'Fetch GST details first';
        stepValid = false;
      }
      if (!form.officeAddress.trim()) {
        nextErrors.officeAddress = 'Office address is required';
        stepValid = false;
      }
      if (!form.email.trim()) {
        nextErrors.email = 'Email is required';
        stepValid = false;
      } else if (!EMAIL_REGEX.test(form.email.trim())) {
        nextErrors.email = 'Enter a valid email address';
        stepValid = false;
      }
    }

    if (step >= 1 && step <= 3) {
      const index = step - 1;
      const contact = form.contacts[index];
      if (!contact.name.trim()) {
        nextErrors.contacts[index].name = 'Name is required';
        stepValid = false;
      }
      if (!contact.designation.trim()) {
        nextErrors.contacts[index].designation = 'Designation is required';
        stepValid = false;
      }
      if (!contact.email.trim()) {
        nextErrors.contacts[index].email = 'Email is required';
        stepValid = false;
      } else if (!EMAIL_REGEX.test(contact.email.trim())) {
        nextErrors.contacts[index].email = 'Enter a valid email address';
        stepValid = false;
      } else if (duplicateEmailIndexes.includes(index)) {
        nextErrors.contacts[index].email = 'Contact person emails must be unique';
        stepValid = false;
      }
      if (!contact.phone.trim()) {
        nextErrors.contacts[index].phone = 'Phone is required';
        stepValid = false;
      }
    }

    if (step === 4) {
      if (!form.password.trim()) {
        nextErrors.password = 'Password is required';
        stepValid = false;
      } else if (form.password.length < 8 || form.password.length > 100) {
        nextErrors.password = 'Password must be between 8 and 100 characters';
        stepValid = false;
      }
      if (!form.confirmPassword.trim()) {
        nextErrors.confirmPassword = 'Confirm password is required';
        stepValid = false;
      } else if (form.password !== form.confirmPassword) {
        nextErrors.confirmPassword = 'Password and confirm password must match';
        stepValid = false;
      }
    }

    setFieldErrors(nextErrors);
    return stepValid;
  };

  const handleNextStep = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBackStep = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
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

    const validation = validateForm();
    if (!validation.valid) {
      setError('Please fix the highlighted fields.');
      const firstInvalidStep = () => {
        if (
          validation.errors.name ||
          validation.errors.gstNo ||
          validation.errors.companyName ||
          validation.errors.registeredAddress ||
          validation.errors.officeAddress ||
          validation.errors.email
        ) {
          return 0;
        }

        for (let i = 0; i < validation.errors.contacts.length; i += 1) {
          if (Object.values(validation.errors.contacts[i]).some(Boolean)) {
            return i + 1;
          }
        }

        if (validation.errors.password || validation.errors.confirmPassword) {
          return 4;
        }

        return 0;
      };
      setActiveStep(firstInvalidStep());
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

                  <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
                    {steps.map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>

                  {activeStep === 0 && (
                    <>
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
                    </>
                  )}

                  {activeStep >= 1 && activeStep <= 3 && (
                    <>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#144f35' }}>
                        Contact Person {activeStep}
                      </Typography>

                      <Stack
                        spacing={1.5}
                        sx={{
                          p: { xs: 1.5, md: 2 },
                          borderRadius: 2,
                          border: '1px solid rgba(28, 110, 63, 0.15)',
                          backgroundColor: '#f5fbf7',
                        }}
                      >
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                          <TextField
                            label="Name"
                            value={form.contacts[activeStep - 1].name}
                            onChange={(e) => setContact(activeStep - 1, 'name', e.target.value)}
                            error={Boolean(fieldErrors.contacts[activeStep - 1]?.name)}
                            helperText={fieldErrors.contacts[activeStep - 1]?.name}
                            fullWidth
                            required
                          />
                          <TextField
                            label="Designation"
                            value={form.contacts[activeStep - 1].designation}
                            onChange={(e) => setContact(activeStep - 1, 'designation', e.target.value)}
                            error={Boolean(fieldErrors.contacts[activeStep - 1]?.designation)}
                            helperText={fieldErrors.contacts[activeStep - 1]?.designation}
                            fullWidth
                            required
                          />
                        </Stack>

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                          <TextField
                            label="Email"
                            type="email"
                            value={form.contacts[activeStep - 1].email}
                            onChange={(e) => setContact(activeStep - 1, 'email', e.target.value)}
                            error={Boolean(fieldErrors.contacts[activeStep - 1]?.email)}
                            helperText={fieldErrors.contacts[activeStep - 1]?.email}
                            fullWidth
                            required
                          />
                          <TextField
                            label="Phone"
                            type="tel"
                            value={form.contacts[activeStep - 1].phone}
                            onChange={(e) => setContact(activeStep - 1, 'phone', e.target.value)}
                            error={Boolean(fieldErrors.contacts[activeStep - 1]?.phone)}
                            helperText={fieldErrors.contacts[activeStep - 1]?.phone}
                            fullWidth
                            required
                          />
                        </Stack>
                      </Stack>
                    </>
                  )}

                  {activeStep === 4 && (
                    <>
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
                    </>
                  )}

                  <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mt: 2 }}>
                    <Button
                      type="button"
                      onClick={handleBackStep}
                      disabled={activeStep === 0 || loading}
                      variant="outlined"
                    >
                      Back
                    </Button>
                    {activeStep < steps.length - 1 ? (
                      <Button
                        type="button"
                        onClick={handleNextStep}
                        variant="contained"
                        disabled={loading}
                        sx={{
                          py: 1.5,
                          fontWeight: 700,
                          backgroundColor: '#207644',
                          '&:hover': { backgroundColor: '#155c37' },
                        }}
                      >
                        Continue
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={{
                          py: 1.5,
                          fontWeight: 700,
                          backgroundColor: '#207644',
                          '&:hover': { backgroundColor: '#155c37' },
                        }}
                      >
                        {loading ? 'Submitting...' : 'Submit Registration Request'}
                      </Button>
                    )}
                  </Stack>

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
