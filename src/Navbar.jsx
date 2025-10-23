import { AppBar, Toolbar, Box, Tab, IconButton, Select, MenuItem, Avatar, Button, Menu, MenuItem as MuiMenuItem, Typography } from '@mui/material';
import { Brain, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  const getSelectedOption = () => {
    if (location.pathname === '/mindmap') return 'mindmap';
    if (location.pathname === '/ai-mcq') return 'mcq';
    if (location.pathname === '/news') return 'news';
    if (location.pathname === '/saved-news') return 'saved-news';
    if (location.pathname === '/prelims-2025') return '2025';
    if (location.pathname === '/prelims-2024') return '2024';
    if (location.pathname === '/prelims-2023') return '2023';
    if (location.pathname === '/prelims-2022') return '2022';
    return '';
  };

  const handleOptionChange = (event) => {
    const value = event.target.value;
    if (value === 'mindmap') {
      navigate('/mindmap');
    } else if (value === 'mcq') {
      navigate('/ai-mcq');
    } else if (value === 'news') {
      navigate('/news');
    } else if (value === 'saved-news') {
      navigate('/saved-news');
    } else {
      navigate(`/prelims-${value}`);
    }
  };

  const getSelectedYear = () => {
    if (location.pathname === '/prelims-2025') return '2025';
    if (location.pathname === '/prelims-2024') return '2024';
    if (location.pathname === '/prelims-2023') return '2023';
    if (location.pathname === '/prelims-2022') return '2022';
    return '';
  };

  const handleYearChange = (event) => {
    const value = event.target.value;
    navigate(`/prelims-${value}`);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    if (document.activeElement && document.activeElement.closest('.MuiMenu-root')) {
      document.activeElement.blur();
    }
    logout();
    handleClose();
  };

  const handleGoogleLogin = async (response) => {
    try {
      const res = await fetch('/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: response.credential }),
      });
      
      if (!res.ok) {
        // Handle backend errors (e.g., 403 for unauthorized)
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Authentication failed');
      }
      
      const data = await res.json();
      if (res.ok) {
        login(data.user);
      } else {
        console.error('Authentication failed:', data);
      }
    } catch (error) {
      console.error('Error during authentication:', error);
      alert(error.message || 'Login failed. Access may be restricted.');
    }
  };

  useEffect(() => {
    const initializeGoogleSignIn = async () => {
      // Wait for Google script to load
      const waitForGoogle = () => {
        return new Promise((resolve) => {
          if (window.google && window.google.accounts && window.google.accounts.id) {
            resolve();
          } else {
            const checkGoogle = setInterval(() => {
              if (window.google && window.google.accounts && window.google.accounts.id) {
                clearInterval(checkGoogle);
                resolve();
              }
            }, 100);
          }
        });
      };

      try {
        await waitForGoogle();
        
        const res = await fetch('/auth/client-id');
        const data = await res.json();
        
        if (res.ok && data.client_id) {
          window.google.accounts.id.initialize({
            client_id: data.client_id,
            callback: handleGoogleLogin,
          });
          
          // Render the button in the navbar if user is not logged in
          const navbarButton = document.getElementById('google-signin-navbar');
          if (navbarButton) {
            navbarButton.innerHTML = ''; // Clear existing content
            if (!user) {
              window.google.accounts.id.renderButton(
                navbarButton,
                { theme: 'outline', size: 'small', text: 'signin' }
              );
            }
          }
        } else {
          console.error('Failed to get client ID:', data);
        }
      } catch (error) {
        console.error('Error initializing Google Sign-In:', error);
      }
    };

    initializeGoogleSignIn();
  }, [user]); // Re-run when user state changes

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 900);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setAnchorEl(null);
    }
  }, [isMobile]);

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1976d2ed', backdropFilter: { xs: 'none', md: 'blur(10px)' } }}>
      <Toolbar sx={{ px: { xs: 1, md: 2 } }}>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' }, flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexGrow: 1 }}>
            <Typography component={Link} to="/" sx={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none' }}>
              Visual IAS
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tab
                label="Mindmap"
                value="/mindmap"
                component={Link}
                to="/mindmap"
                sx={{ 
                  display: { xs: 'none', md: 'block' },
                  color: '#ffffff',
                  '& .MuiTab-root': { color: '#ffffff' },
                  '& .MuiButtonBase-root': { color: '#ffffff' },
                  '&:hover': { 
                    color: '#ffffff',
                    opacity: 0.8
                  },
                  '&.Mui-selected': { 
                    color: '#ffffff',
                    opacity: 1
                  }
                }}
              />
              <Tab
                label="MCQ"
                value="/ai-mcq"
                component={Link}
                to="/ai-mcq"
                sx={{ 
                  display: { xs: 'none', md: 'block' },
                  color: '#ffffff',
                  '& .MuiTab-root': { color: '#ffffff' },
                  '& .MuiButtonBase-root': { color: '#ffffff' },
                  '&:hover': { 
                    color: '#ffffff',
                    opacity: 0.8
                  },
                  '&.Mui-selected': { 
                    color: '#ffffff',
                    opacity: 1
                  }
                }}
              />
              {user && <Tab
                label="News"
                value="/news"
                component={Link}
                to="/news"
                sx={{ 
                  display: { xs: 'none', md: 'block' },
                  color: '#ffffff',
                  '& .MuiTab-root': { color: '#ffffff' },
                  '& .MuiButtonBase-root': { color: '#ffffff' },
                  '&:hover': { 
                    color: '#ffffff',
                    opacity: 0.8
                  },
                  '&.Mui-selected': { 
                    color: '#ffffff',
                    opacity: 1
                  }
                }}
              />}
              <Tab
                label="Articles"
                value="/Articles"
                component={Link}
                to="/saved-news"
                sx={{ 
                  display: { xs: 'none', md: 'block' },
                  color: '#ffffff',
                  '& .MuiTab-root': { color: '#ffffff' },
                  '& .MuiButtonBase-root': { color: '#ffffff' },
                  '&:hover': { 
                    color: '#ffffff',
                    opacity: 0.8
                  },
                  '&.Mui-selected': { 
                    color: '#ffffff',
                    opacity: 1
                  }
                }}
              />
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Select
                  label="Menu"
                  value={getSelectedOption()}
                  onChange={handleOptionChange}
                  displayEmpty
                  inputProps={{ id: 'nav-select' }}
                  sx={{
                    color: '#ffffff',
                    '& .MuiSelect-icon': { color: '#ffffff' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ffffff' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ffffff' },
                    '& .MuiSelect-select': { color: '#ffffff' },
                    '& .MuiInputLabel-root': { color: '#ffffff' },
                    minWidth: { xs: 80, md: 100 }
                  }}
                  renderValue={(selected) => {
                    if (selected === 'mindmap') return 'Mindmap';
                    if (selected === 'mcq') return 'MCQ';
                    if (selected === 'news') return 'News';
                    if (selected === 'saved-news') return 'Articles';
                    if (selected) return `PYQ ${selected}`;
                    return 'Menu';
                  }}
                >
                  <MenuItem value="mindmap">Mindmap</MenuItem>
                  <MenuItem value="mcq">MCQ</MenuItem>
                  {user && <MenuItem value="news">News</MenuItem>}
                  <MenuItem value="saved-news">Articles</MenuItem>
                  <MenuItem value="2025">PYQ 2025</MenuItem>
                  <MenuItem value="2024">PYQ 2024</MenuItem>
                  <MenuItem value="2023">PYQ 2023</MenuItem>
                  <MenuItem value="2022">PYQ 2022</MenuItem>
                </Select>
              </Box>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Select
                  label="PYQ"
                  value={getSelectedYear()}
                  onChange={handleYearChange}
                  displayEmpty
                  inputProps={{ id: 'year-select' }}
                  sx={{
                    color: '#ffffff',
                    '& .MuiSelect-icon': { color: '#ffffff' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ffffff' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ffffff' },
                    '& .MuiSelect-select': { color: '#ffffff' },
                    '& .MuiInputLabel-root': { color: '#ffffff' },
                    minWidth: { xs: 80, md: 100 }
                  }}
                  renderValue={(selected) => selected ? `PYQ ${selected}` : 'PYQ'}
                >
                  <MenuItem value="2025">2025</MenuItem>
                  <MenuItem value="2024">2024</MenuItem>
                  <MenuItem value="2023">2023</MenuItem>
                  <MenuItem value="2022">2022</MenuItem>
                </Select>
              </Box>
              {user && isMobile && (
                <IconButton
                  size="medium"
                  aria-label="account of current user"
                  aria-controls="menu-appbar-mobile"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                >
                  <Avatar src={user.picture} alt={user.name} sx={{ width: 24, height: 24 }} />
                </IconButton>
              )}
              {!user && (
                <div id="google-signin-navbar" style={{ display: 'inline-block', transform: window.innerWidth < 600 ? 'scale(1)' : 'none', paddingLeft: '15px' }}></div>
              )}
            </Box>
            {user && (
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
                <Typography variant="body1" sx={{ color: 'white', mr: 1, display: { xs: 'none', md: 'block' } }}>
                  {user.name}
                </Typography>
                <IconButton
                  size="medium"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                >
                  <Avatar src={user.picture} alt={user.name} sx={{ width: { xs: 24, md: 32 }, height: { xs: 24, md: 32 } }} />
                </IconButton>
                <Menu
                  id="menu-appbar"
                  key="desktop"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl) && !isMobile}
                  onClose={handleClose}
                >
                  <MuiMenuItem onClick={handleLogout}>
                    <LogOut size={16} style={{ marginRight: 8 }} />
                    Logout
                  </MuiMenuItem>
                </Menu>
              </Box>
            )}
          </Box>
          <Menu
            id="menu-appbar-mobile"
            key="mobile"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl) && isMobile}
            onClose={handleClose}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="body1" sx={{ color: 'black' }}>
                {user?.name}
              </Typography>
            </Box>
            <MuiMenuItem onClick={handleLogout}>
              <LogOut size={16} style={{ marginRight: 8 }} />
              Logout
            </MuiMenuItem>
          </Menu>

        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
