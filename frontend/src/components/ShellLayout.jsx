import { AppBar, Box, Button, Collapse, Container, IconButton, List, ListItem, ListItemButton, ListItemText, Menu, MenuItem, Stack, Toolbar, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { ExpandLess, ExpandMore, Person, Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import api from '../api/client';
import logo from '../assets/images/logo.png';

export default function ShellLayout({ onLogout, children, session }) {
  const navigate = useNavigate();
  const location = useLocation();
  const roles = session?.roles || [];
  const [anchorEl, setAnchorEl] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [vendorMenuOpen, setVendorMenuOpen] = useState(false);
  const [pendingRegistrationCount, setPendingRegistrationCount] = useState(null);
  const [profileChangeCount, setProfileChangeCount] = useState(null);
  const open = Boolean(anchorEl);

  const canReviewRequests = roles.includes('ADMIN') || roles.includes('EXECUTIVE');

  useEffect(() => {
    if (!canReviewRequests) return;
    let active = true;

    const getCount = (response) => {
      if (response?.data?.totalElements != null) return response.data.totalElements;
      if (Array.isArray(response?.data)) return response.data.length;
      if (Array.isArray(response?.data?.content)) return response.data.content.length;
      return null;
    };

    const loadCounts = async () => {
      try {
        const [regRes, profileRes] = await Promise.all([
          api.get('/api/vendors/registration-requests', { params: { page: 0, size: 1, sort: 'createdAt,desc' } }),
          api.get('/api/vendors/change-requests', { params: { status: 'PENDING', page: 0, size: 1, sort: 'requestedAt,desc' } }),
        ]);

        if (!active) return;
        setPendingRegistrationCount(getCount(regRes));
        setProfileChangeCount(getCount(profileRes));
      } catch {
        if (!active) return;
        setPendingRegistrationCount(null);
        setProfileChangeCount(null);
      }
    };

    loadCounts();
    return () => {
      active = false;
    };
  }, [canReviewRequests]);

  useEffect(() => {
    if (location.pathname.startsWith('/vendors')) {
      setVendorMenuOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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
    {
      label: 'Vendor',
      submenu: [
        { to: '/vendors', label: 'All Vendors' },
        {
          to: '/vendors/pending',
          label: `Pending Registrations${pendingRegistrationCount != null ? ` (${pendingRegistrationCount})` : ''}`,
        },
        {
          to: '/vendors/changes',
          label: `Profile Changes${profileChangeCount != null ? ` (${profileChangeCount})` : ''}`,
        },
      ],
    },
    { to: '/trades', label: 'Trades' },
  ];

  const handleNavClick = (to) => {
    setSidebarOpen(false);
    setVendorMenuOpen(false);
    navigate(to);
  };

  const toggleVendorMenu = () => {
    setVendorMenuOpen((prev) => !prev);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <Box
          sx={{
            width: 280,
            background: 'linear-gradient(180deg, #3a8a3a 0%, #428a42 100%)',
            color: 'white',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 1200,
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: 0,
              backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'transparent',
            },
          }}
        >
          {/* Sidebar Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #3a8a3a 0%, #428a42 100%)',
              p: 3,
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
              position: 'relative',
            }}
          >
            <IconButton
              onClick={() => setSidebarOpen(false)}
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              <CloseIcon />
            </IconButton>
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

          {/* Navigation Items */}
          <List sx={{ flex: 1, px: 1, py: 2 }}>
            {navItems.map((item) => (
              item.submenu ? (
                <Box key={item.label} sx={{ mb: 1 }}>
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemButton
                      onClick={toggleVendorMenu}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        transition: 'all 0.3s ease',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                        },
                      }}
                    >
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          sx: {
                            color: 'rgba(255, 255, 255, 0.9)',
                            letterSpacing: '0.03em',
                            textTransform: 'uppercase',
                            fontSize: '0.85rem',
                          },
                        }}
                      />
                      {vendorMenuOpen ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                  </ListItem>

                  <Collapse in={vendorMenuOpen} timeout="auto" unmountOnExit>
                    <Box sx={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', py: 1, px: 0.5, ml: 0.5 }}>
                      {item.submenu.map((sub) => (
                        <ListItem key={sub.to} disablePadding sx={{ mb: 1 }}>
                          <ListItemButton
                            onClick={() => handleNavClick(sub.to)}
                            selected={location.pathname === sub.to}
                            sx={{
                              color: 'rgba(255, 255, 255, 0.9)',
                              borderRadius: '8px',
                              padding: '10px 16px',
                              transition: 'background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                              fontSize: '0.9rem',
                              fontWeight: 500,
                              ml: 1,
                              borderLeft: '4px solid transparent',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                                color: 'white',
                              },
                              '&.Mui-selected': {
                                backgroundColor: 'rgba(220, 38, 38, 0.25)',
                                color: '#ffffff',
                                borderLeftColor: '#dc2626',
                                fontWeight: 600,
                                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
                              },
                            }}
                          >
                            <ListItemText primary={sub.label} />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </Box>
                  </Collapse>
                </Box>
              ) : (
                <ListItem key={item.to} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => handleNavClick(item.to)}
                    selected={location.pathname === item.to}
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
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(220, 38, 38, 0.25)',
                        color: '#ffffff',
                        borderLeft: '4px solid #dc2626',
                        paddingLeft: '12px',
                        fontWeight: 600,
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
                      },
                    }}
                  >
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
              )
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

      {/* Main Content Wrapper */}
      <Box
        onClick={() => setSidebarOpen(false)}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: 0,
          transition: 'margin-left 0.3s ease',
          background: 'linear-gradient(160deg, #eef6f6 0%, #f8fbff 100%)',
          minHeight: '100vh',
          cursor: 'pointer',
        }}
      >
        {/* Navbar */}
        <AppBar position="sticky" elevation={0} sx={{ background: '#f5f5f5', top: 0, zIndex: 1000 }}>
          <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                edge="start"
                color="inherit"
                aria-label="open sidebar"
                onClick={(e) => {
                  e.stopPropagation();
                  setSidebarOpen((prev) => !prev);
                }}
                sx={{ color: '#333' }}
              >
                <MenuIcon sx={{ fontSize: 28, fontWeight: 'bold' }} />
              </IconButton>
              <Box
                component="img"
                src={logo}
                alt="Pawfect Trades Logo"
                sx={{ height: 40, width: 'auto', objectFit: 'contain' }}
              />
            </Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
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
        <Container sx={{ py: 4, flex: 1 }}>{children}</Container>
      </Box>
    </Box>
  );
}
