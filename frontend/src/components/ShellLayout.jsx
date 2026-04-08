import { AppBar, Box, Button, Container, IconButton, List, ListItem, ListItemButton, ListItemText, Menu, MenuItem, Stack, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';
import { Person, Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import { useState } from 'react';
import logo from '../assets/images/logo.png';

export default function ShellLayout({ onLogout, children, session }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const roles = session?.roles || [];
  const [anchorEl, setAnchorEl] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await onLogout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    ...(roles.includes('ADMIN') ? [{ to: '/users', label: 'Users' }] : []),
    { to: '/vendors', label: 'Vendors' },
    { to: '/trades', label: 'Trades' },
  ];

  const handleNavClick = (to) => {
    navigate(to);
    setSidebarOpen(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <Box
          sx={{
            width: { xs: '100%', sm: 280 },
            background: 'linear-gradient(180deg, #093b3b 0%, #0a4c4c 100%)',
            color: 'white',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            position: { xs: 'fixed', sm: 'fixed' },
            top: 0,
            left: 0,
            zIndex: 1001,
            overflowY: 'auto',
          }}
        >
          {/* Sidebar Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #093b3b 0%, #0a4c4c 100%)',
              p: 3,
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.3rem',
                  letterSpacing: '0.5px',
                  color: 'white',
                }}
              >
                Pawfect Trades
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.75rem',
                  marginTop: '4px',
                  display: 'block',
                }}
              >
                Management System
              </Typography>
            </Box>
            <IconButton
              onClick={() => setSidebarOpen(false)}
              sx={{ color: 'white', mt: -1 }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Navigation Items */}
          <List sx={{ flex: 1, px: 1, py: 2 }}>
            {navItems.map((item) => (
              <ListItem key={item.to} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => handleNavClick(item.to)}
                  component={NavLink}
                  to={item.to}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    transition: 'all 0.3s ease',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                    },
                    '&.active': {
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                      borderLeft: 'none',
                    },
                  }}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          {/* Sidebar Footer */}
          <Box
            sx={{
              p: 2,
              borderTop: '2px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.7rem',
              }}
            >
              © 2026 Pawfect Trades
            </Typography>
          </Box>
        </Box>
      )}

      {/* Backdrop for mobile when sidebar is open */}
      {sidebarOpen && isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998,
            onClick: () => setSidebarOpen(false),
          }}
        />
      )}

      {/* Main Content Wrapper */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: 0,
          transition: 'margin-left 0.3s ease',
          background: 'linear-gradient(160deg, #eef6f6 0%, #f8fbff 100%)',
          minHeight: '100vh',
          width: '100%',
        }}
      >
        {/* Navbar */}
        <AppBar position="sticky" elevation={0} sx={{ background: '#f5f5f5', top: 0, zIndex: 1000 }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              sx={{ color: '#333', mr: 2, fontWeight: 'bold' }}
            >
              {sidebarOpen ? (
                <CloseIcon sx={{ fontSize: '28px', fontWeight: 'bold' }} />
              ) : (
                <MenuIcon sx={{ fontSize: '28px', fontWeight: 'bold' }} />
              )}
            </IconButton>
            <Box
              component="img"
              src={logo}
              alt="Pawfect Trades Logo"
              sx={{ height: 50, width: 'auto', mr: 2, objectFit: 'contain' }}
            />
            <Stack direction="row" spacing={1} sx={{ ml: 'auto', alignItems: 'center' }}>
              <IconButton
                onClick={handleMenuOpen}
                sx={{ color: '#333' }}
              >
                <Person />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem disabled>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {session?.email}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                  Profile
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  Logout
                </MenuItem>
              </Menu>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box sx={{ py: 4, flex: 1, width: '100%', overflow: 'auto' }}>
          <Container maxWidth={false} sx={{ width: '100%', px: { xs: 2, sm: 3 } }}>
            {children}
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
