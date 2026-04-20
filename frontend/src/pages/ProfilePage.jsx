import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../api/client';

const emptyContact = { name: '', designation: '', email: '', phone: '' };

export default function ProfilePage({ session, onSessionRefresh }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobileNo: '',
    companyName: '',
    officeAddress: '',
    registeredAddress: '',
    contacts: [{ ...emptyContact }, { ...emptyContact }, { ...emptyContact }],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const isVendor = (session?.roles || []).includes('VENDOR');

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: session?.name || '',
      email: session?.email || '',
      mobileNo: session?.mobileNo || '',
      companyName: session?.companyName || '',
    }));
  }, [session]);

  useEffect(() => {
    const loadVendorProfile = async () => {
      if (!isVendor || !session?.email) return;

      try {
        const res = await api.get('/api/vendors', { params: { page: 0, size: 100, sort: 'name,asc' } });
        const vendor = (res.data?.content || []).find((item) => (item.email || '').toLowerCase() === session.email.toLowerCase());
        if (!vendor) return;

        const contacts = vendor.contactPersons || [];
        setForm((prev) => ({
          ...prev,
          name: vendor.name || prev.name,
          email: vendor.email || prev.email,
          companyName: vendor.companyName || prev.companyName,
          officeAddress: vendor.officeAddress || '',
          registeredAddress: vendor.registeredAddress || '',
          contacts: [0, 1, 2].map((index) => ({
            name: contacts[index]?.name || '',
            designation: contacts[index]?.designation || '',
            email: contacts[index]?.email || '',
            phone: contacts[index]?.phone || '',
          })),
        }));
      } catch {
        // Keep profile usable even if vendor details fail to load.
      }
    };

    loadVendorProfile();
  }, [isVendor, session?.email]);

  const setContact = (index, key, value) => {
    setForm((prev) => {
      const contacts = [...prev.contacts];
      contacts[index] = { ...contacts[index], [key]: value };
      return { ...prev, contacts };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);

      if (isVendor) {
        await api.post('/api/vendors/me/change-request', {
          name: form.name,
          email: form.email,
          officeAddress: form.officeAddress,
          contactPersons: form.contacts,
        });
        setSuccess('Profile update request submitted. Changes will apply after admin/executive approval.');
      } else {
        await api.post('/api/auth/me/profile', {
          name: form.name,
          mobileNo: form.mobileNo,
          companyName: form.companyName,
        });
        await onSessionRefresh();
        setSuccess('Profile updated successfully');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5">My Profile</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      {isVendor && (
        <Alert severity="info">
          Vendor profile and contact person changes require approval before they are applied.
        </Alert>
      )}
      <Card>
        <CardContent>
          <Stack component="form" spacing={2} onSubmit={submit}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              fullWidth
              required
              disabled={!isVendor}
            />

            {!isVendor && (
              <>
                <TextField
                  label="Mobile Number"
                  value={form.mobileNo}
                  onChange={(e) => setForm((p) => ({ ...p, mobileNo: e.target.value }))}
                  fullWidth
                  required
                />
                <TextField
                  label="Company Name"
                  value={form.companyName}
                  onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                  fullWidth
                />
              </>
            )}

            {isVendor && (
              <>
                <TextField
                  label="Company Name (GST Auto)"
                  value={form.companyName}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Registered Address (GST Auto)"
                  value={form.registeredAddress}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Office Address"
                  value={form.officeAddress}
                  onChange={(e) => setForm((p) => ({ ...p, officeAddress: e.target.value }))}
                  fullWidth
                  required
                />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Contact Persons
                </Typography>
                {form.contacts.map((contact, index) => (
                  <Stack key={`contact-${index}`} direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                    <TextField
                      label={`Contact ${index + 1} Name`}
                      value={contact.name}
                      onChange={(e) => setContact(index, 'name', e.target.value)}
                      fullWidth
                      required
                    />
                    <TextField
                      label="Designation"
                      value={contact.designation}
                      onChange={(e) => setContact(index, 'designation', e.target.value)}
                      fullWidth
                      required
                    />
                    <TextField
                      label="Email"
                      value={contact.email}
                      onChange={(e) => setContact(index, 'email', e.target.value)}
                      fullWidth
                      required
                    />
                    <TextField
                      label="Phone"
                      value={contact.phone}
                      onChange={(e) => setContact(index, 'phone', e.target.value)}
                      fullWidth
                      required
                    />
                  </Stack>
                ))}
              </>
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ backgroundColor: '#3a8a3a', '&:hover': { backgroundColor: '#2d6b2d' }, fontWeight: 600, py: 1.2 }}
            >
              {loading ? 'Saving...' : isVendor ? 'Submit For Approval' : 'Update Profile'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
