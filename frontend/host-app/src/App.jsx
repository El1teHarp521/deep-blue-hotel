import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Typography, IconButton, MenuItem, Select, Container, Divider } from '@mui/material';

// ИМПОРТ ИКОНОК
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { getCustomTheme } from './theme';
import { translations } from './translations';

// ИМПОРТ СТРАНИЦ
import HomePage from './pages/HomePage';
import RoomsPage from './pages/RoomsPage';
import RestaurantPage from './pages/RestaurantPage';
import EntertainmentPage from './pages/EntertainmentPage';
import SpaPage from './pages/SpaPage';
import ParkingPage from './pages/ParkingPage';
import RoomDetailPage from './pages/RoomDetailPage';

const Footer = ({ t }) => (
  <Box sx={{ bgcolor: '#0b0f19', color: 'white', pt: 8, pb: 4, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
    <Container maxWidth="xl">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr 1fr' }, gap: 8, mb: 6 }}>
        
        {/* Описание */}
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

      <Typography variant="body2" align="center" sx={{ color: 'grey.600' }}>
        {t.footerCopyright}
      </Typography>
    </Container>
  </Box>
);

const Header = ({ mode, toggleTheme, lang, setLang, t }) => {
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

  return (
    <Box sx={{ 
      position: 'fixed', top: 0, width: '100%', zIndex: 1100, 
      color: 'white', background: 'rgba(1, 10, 25, 0.85)', backdropFilter: 'blur(15px)', 
      borderBottom: '1px solid rgba(255,255,255,0.08)' 
    }}>
      <Container maxWidth="xl">
        {/* ВЕРХНИЙ РЯД */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', pb: 1, pt: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Select value={lang} onChange={(e) => setLang(e.target.value)} variant="standard" disableUnderline sx={{ color: 'white', fontWeight: 700 }}>
              <MenuItem value="RU">RU</MenuItem>
              <MenuItem value="EN">EN</MenuItem>
            </Select>
          </Box>
          <Typography onClick={() => navigate('/')} variant="h4" sx={{ flex: 1, textAlign: 'center', fontWeight: 500, letterSpacing: 12, cursor: 'pointer', fontFamily: 'Playfair Display' }}>
            DEEPBLUE
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <IconButton onClick={toggleTheme} color="inherit" size="small">
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* НИЖНИЙ РЯД */}
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
  const [mode, setMode] = useState('dark');
  const [lang, setLang] = useState('RU');
  const theme = getCustomTheme(mode);
  const t = translations[lang];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header mode={mode} toggleTheme={() => setMode(m => m === 'light' ? 'dark' : 'light')} lang={lang} setLang={setLang} t={t} />
      <Box sx={{ minHeight: '80vh' }}>
        <Routes>
          <Route path="/" element={<HomePage t={t} />} />
          <Route path="/rooms" element={<RoomsPage t={t} />} />
          <Route path="/restaurants" element={<RestaurantPage t={t} />} />
          <Route path="/entertainment" element={<EntertainmentPage t={t} />} />
          <Route path="/spa" element={<SpaPage t={t} />} />
          <Route path="/parking" element={<ParkingPage t={t} />} />
          <Route path="/rooms/:roomType" element={<RoomDetailPage t={t} />} />
        </Routes>
      </Box>
      <Footer t={t} />
    </ThemeProvider>
  );
}

export default App;