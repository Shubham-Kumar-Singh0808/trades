import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';

export default function ShellLayout({ onLogout, children, session }) {
  const navigate = useNavigate();
  const roles = session?.roles || [];

  const navItems = [
    ...(roles.includes('ADMIN') ? [{ to: '/users', label: 'Users' }] : []),
    { to: '/vendors', label: 'Vendors' },
    { to: '/trades', label: 'Trades' },
    { to: '/profile', label: 'Profile' },
  ];

  const logout = async () => {
    await onLogout();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(160deg, #eef6f6 0%, #f8fbff 100%)' }}>
      <AppBar position="static" elevation={0} sx={{ background: '#093b3b' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontFamily: 'Poppins' }}>
            Pawfect Trades Console
          </Typography>
          <Typography variant="body2" sx={{ mr: 2, opacity: 0.9 }}>
            {session?.email}
          </Typography>
          <Stack direction="row" spacing={1}>
            {navItems.map((item) => (
              <Button
                key={item.to}
                color="inherit"
                component={NavLink}
                to={item.to}
                sx={{ '&.active': { borderBottom: '2px solid #f59e0b' } }}
              >
                {item.label}
              </Button>
            ))}
            <Button color="inherit" onClick={logout}>Logout</Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 4 }}>{children}</Container>
    </Box>
  );
}
