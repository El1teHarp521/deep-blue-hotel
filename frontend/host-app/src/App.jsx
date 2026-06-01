import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Typography, Button, IconButton, MenuItem, Select, Container, Divider } from '@mui/material';

import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { getCustomTheme } from './theme';
import { translations } from './translations';
import axios from 'axios';

axios.defaults.withCredentials = true;

import HomePage from './pages/HomePage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailPage from './pages/RoomDetailPage';
import RestaurantPage from './pages/RestaurantPage';
import EntertainmentPage from './pages/EntertainmentPage';
import SpaPage from './pages/SpaPage';
import ParkingPage from './pages/ParkingPage';
import ProfilePage from './pages/ProfilePage';
import TermsPage from './pages/TermsPage';
import AuthModal from './components/AuthModal';

const Footer = ({ t }) => (
  <Box sx={{ bgcolor: '#0b0f19', color: 'white', pt: 8, pb: 4, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
    <Container maxWidth="xl">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr 1fr' }, gap: 8, mb: 6 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, fontSize: '0.9rem', letterSpacing: 1 }}>{t.footerAbout}</Typography>
          <Typography variant="body2" sx={{ color: 'grey.500', lineHeight: 1.8 }}>{t.footerAboutText}</Typography>
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, fontSize: '0.9rem', letterSpacing: 1 }}>{t.footerContacts}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, color: 'grey.500' }}>
              <PhoneIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2">+7 999 111 11 12</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, color: 'grey.500' }}>
              <EmailIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2">DeepBlueSupport@gmail.com</Typography>
            </Box>
          </Box>
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, fontSize: '0.9rem', letterSpacing: 1 }}>{t.footerAddress}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, color: 'grey.500' }}>
            <LocationOnIcon sx={{ fontSize: 16, mt: 0.3 }} />
            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{t.footerAddressText}</Typography>
          </Box>
        </Box>
      </Box>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.05)', my: 4 }} />
      <Typography variant="body2" align="center" sx={{ color: 'grey.600' }}>{t.footerCopyright}</Typography>
    </Container>
  </Box>
);

const Header = ({ mode, toggleTheme, lang, setLang, currency, setCurrency, t, setOpenAuth, user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const navItems = [
    { label: t.rooms, path: '/rooms' },
    { label: t.restaurants, path: '/restaurants' },
    { label: t.entertainment, path: '/entertainment' },
    { label: t.offers, path: '/spa' },
    { label: t.parking, path: '/parking' },
  ];

  const getUserDisplayName = () => {
    if (!user) return '';
    const cleanedName = user.fullName ? user.fullName.replace(/null/gi, '').trim() : '';
    if (cleanedName && cleanedName.length > 0) return user.fullName;
    return user.email || 'Profile';
  };

  return (
    <Box sx={{ position: 'fixed', top: 0, width: '100%', zIndex: 1100, color: 'white', background: 'rgba(1, 10, 25, 0.85)', backdropFilter: 'blur(15px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <Container maxWidth="xl">
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', pb: 1, pt: 1.5 }}>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Select value={lang} onChange={(e) => setLang(e.target.value)} variant="standard" disableUnderline sx={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>
              <MenuItem value="RU">RU</MenuItem>
              <MenuItem value="EN">EN</MenuItem>
            </Select>
            <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)', my: 0.5 }} />
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)} variant="standard" disableUnderline sx={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>
              <MenuItem value="RUB">RUB (₽)</MenuItem>
              <MenuItem value="USD">USD ($)</MenuItem>
              <MenuItem value="AED">AED</MenuItem>
            </Select>
          </Box>

          <Typography onClick={() => navigate('/')} variant="h4" sx={{ flex: 1, textAlign: 'center', fontWeight: 500, letterSpacing: 12, cursor: 'pointer', fontFamily: 'Playfair Display' }}>
            DEEPBLUE
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={toggleTheme} color="inherit" size="small">
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>

            {user ? (
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                <Typography 
                  onClick={() => navigate('/profile')}
                  variant="body2" 
                  sx={{ fontWeight: 'bold', color: '#c1a37f', cursor: 'pointer', borderBottom: '1px solid transparent', '&:hover': { borderBottom: '1px solid' } }}
                >
                  {getUserDisplayName()}
                </Typography>
                <Button variant="outlined" color="inherit" onClick={onLogout} sx={{ borderRadius: 0, px: 2, fontSize: '0.7rem', fontWeight: 'bold' }}>
                  {lang === 'RU' ? 'ВЫЙТИ' : 'LOGOUT'}
                </Button>
              </Box>
            ) : (
              <Button variant="outlined" color="inherit" onClick={() => setOpenAuth(true)} sx={{ borderRadius: 0, px: 3, fontWeight: 'bold' }}>
                {lang === 'RU' ? 'ЛОГИН' : 'LOGIN'}
              </Button>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 8, py: 2 }}>
          {navItems.map((item) => (
            <Typography key={item.path} onClick={() => navigate(item.path)} sx={{ fontSize: '0.75rem', letterSpacing: 3, cursor: 'pointer', fontWeight: 700, opacity: location.pathname === item.path ? 1 : 0.6, borderBottom: location.pathname === item.path ? '1px solid white' : 'none', pb: 0.5, '&:hover': { opacity: 1, color: '#C5A059' } }}>
              {item.label}
            </Typography>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

function App() {
  const [mode, setMode] = useState(localStorage.getItem('deepblue_theme') || 'dark');
  const [lang, setLang] = useState(localStorage.getItem('deepblue_lang') || 'RU');
  const [currency, setCurrency] = useState(localStorage.getItem('deepblue_currency') || 'RUB');
  const [openAuth, setOpenAuth] = useState(false);
  const [user, setUser] = useState(null);

  const theme = getCustomTheme(mode);
  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem('deepblue_theme', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('deepblue_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('deepblue_currency', currency);
  }, [currency]);

  useEffect(() => {
    axios.get('http://localhost:3003/api/auth/me')
      .then(response => {
        if (response.data.isAuthenticated) {
          setUser(response.data.user);
        }
      })
      .catch(() => {
        setUser(null);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:3003/api/auth/logout');
      setUser(null);
      window.location.reload();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header 
        mode={mode} 
        toggleTheme={() => setMode(m => m === 'light' ? 'dark' : 'light')} 
        lang={lang} 
        setLang={setLang} 
        currency={currency} 
        setCurrency={setCurrency} 
        t={t} 
        setOpenAuth={setOpenAuth} 
        user={user}
        onLogout={handleLogout}
      />
      <Box sx={{ minHeight: '80vh' }}>
        <Routes>
          <Route path="/" element={<HomePage t={t} />} />
          <Route path="/rooms" element={<RoomsPage t={t} currency={currency} lang={lang} />} />
          <Route path="/rooms/:roomType" element={<RoomDetailPage t={t} currency={currency} lang={lang} />} />
          <Route path="/restaurants" element={<RestaurantPage t={t} currency={currency} lang={lang} user={user} />} />
          <Route path="/entertainment" element={<EntertainmentPage t={t} currency={currency} lang={lang} user={user} />} />
          <Route path="/spa" element={<SpaPage t={t} currency={currency} lang={lang} user={user} />} />
          <Route path="/parking" element={<ParkingPage t={t} currency={currency} lang={lang} user={user} />} />
          <Route path="/profile" element={<ProfilePage t={t} currency={currency} lang={lang} user={user} setUser={setUser} />} />
          <Route path="/terms" element={<TermsPage t={t} lang={lang} />} />
        </Routes>
      </Box>
      <AuthModal open={openAuth} onClose={() => setOpenAuth(false)} t={t} />
      <Footer t={t} />
    </ThemeProvider>
  );
}

export default App;