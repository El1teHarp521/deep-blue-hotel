import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, CardMedia, Button, Paper, TextField, MenuItem, Select, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatPrice } from '../utils/price';

export default function RoomsPage({ t, currency, lang }) {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [checkDate, setCheckDate] = useState('');

  const [dbRooms, setDbRooms] = useState([]); 

  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getTodayDateString();

  const categories = [
    { id: 'standard', title: t.roomStandard, img: '/images/room-standard-1.jpg', d: t.roomStandardDesc, priceRub: 15000 },
    { id: 'business', title: t.roomRoyal, img: '/images/room-business-1.jpg', d: t.roomRoyalDesc, priceRub: 34000 },
    { id: 'lux', title: t.roomLux, img: '/images/room-lux-1.jpg', d: t.roomLuxDesc, priceRub: 67000 },
    { id: 'penthouse', title: t.roomPenthouse, img: '/images/room-penthouse-1.jpg', d: t.roomPenthouseDesc, priceRub: 152000 }
  ];

  useEffect(() => {
    const url = checkDate 
      ? `http://localhost:3001/api/rooms?date=${checkDate}` 
      : 'http://localhost:3001/api/rooms';

    axios.get(url)
      .then(res => setDbRooms(res.data))
      .catch(err => console.error("Ошибка загрузки номеров:", err));
  }, [checkDate]);

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'all' || cat.id === category;

    const priceInRub = cat.priceRub;
    const usdToRubRate = 90;
    const convertedMinRub = minPrice === '' ? 0 : parseFloat(minPrice) * usdToRubRate;
    const convertedMaxRub = maxPrice === '' ? Infinity : parseFloat(maxPrice) * usdToRubRate;

    const matchesMinPrice = priceInRub >= convertedMinRub;
    const matchesMaxPrice = priceInRub <= convertedMaxRub;

    return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice;
  });

  const getAvailabilityStatus = (categoryKey) => {
    if (!checkDate) return null;

    const roomsInCat = dbRooms.filter(r => r.category === categoryKey);
    if (roomsInCat.length === 0) return null;

    const hasAvailableRoom = roomsInCat.some(room => !room.isOccupied);

    return hasAvailableRoom ? (
      <Chip label={t.statusFree} color="success" variant="outlined" sx={{ borderRadius: 0, fontWeight: 'bold' }} />
    ) : (
      <Chip label={t.statusOccupied} color="error" variant="outlined" sx={{ borderRadius: 0, fontWeight: 'bold' }} />
    );
  };

  return (
    <Box sx={{ pt: 22, pb: 10 }}>
      <Container maxWidth="xl">
        <Typography variant="h2" align="center" sx={{ fontFamily: 'Playfair Display', mb: 6, color: 'text.primary' }}>
          {t.roomsTitle}
        </Typography>

        <Paper sx={{ p: 4, mb: 8, bgcolor: 'background.paper', borderRadius: 0, border: '1px solid rgba(128,128,128,0.2)' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.5fr 1fr 1fr 1fr 1fr' }, gap: 3, alignItems: 'end' }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'secondary.main', display: 'block', mb: 1 }}>ПОИСК ПО НАЗВАНИЮ</Typography>
              <TextField fullWidth placeholder={t.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} variant="outlined" size="small" InputProps={{ sx: { borderRadius: 0 } }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'secondary.main', display: 'block', mb: 1 }}>{t.categoryLabel}</Typography>
              <Select fullWidth value={category} onChange={(e) => setCategory(e.target.value)} size="small" sx={{ borderRadius: 0 }}>
                <MenuItem value="all">{t.allCategories}</MenuItem>
                <MenuItem value="standard">{t.categoryStandard}</MenuItem>
                <MenuItem value="business">{t.categoryBusiness}</MenuItem>
                <MenuItem value="lux">{t.categoryLux}</MenuItem>
                <MenuItem value="penthouse">{t.categoryPenthouse}</MenuItem>
              </Select>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'secondary.main', display: 'block', mb: 1 }}>{t.priceFrom} ($)</Typography>
              <TextField fullWidth type="number" placeholder="e.g. 100" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} size="small" InputProps={{ sx: { borderRadius: 0 } }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'secondary.main', display: 'block', mb: 1 }}>{t.priceTo} ($)</Typography>
              <TextField fullWidth type="number" placeholder="e.g. 2000" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} size="small" InputProps={{ sx: { borderRadius: 0 } }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'secondary.main', display: 'block', mb: 1 }}>ПРОВЕРИТЬ НА ДАТУ</Typography>
              <input 
                type="date" 
                min={todayStr} 
                value={checkDate} 
                onChange={(e) => setCheckDate(e.target.value)} 
                style={{ width: '100%', padding: '8.5px 14px', border: '1px solid rgba(128,128,128,0.2)', fontFamily: 'inherit', background: 'transparent', color: 'inherit', outline: 'none', fontSize: '0.9rem' }} 
              />
            </Box>
          </Box>
        </Paper>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, gap: 4 }}>
          {filteredCategories.map((cat, i) => (
            <Paper key={i} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CardMedia component="img" image={cat.img} sx={{ height: 350, objectFit: 'cover', borderRadius: 0, mb: 3 }} />
              <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 1 }}>
                <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 600, minHeight: 60, color: 'text.primary', flex: 1 }}>{cat.title}</Typography>
                {getAvailabilityStatus(cat.id)}
              </Box>
              <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary', opacity: 0.8, minHeight: 100, lineHeight: 1.6 }}>{cat.d}</Typography>
              <Box sx={{ mt: 'auto' }}>
                <Typography variant="h5" color="secondary" sx={{ fontWeight: 'bold', mb: 2 }}>{formatPrice(cat.priceRub, currency, lang)}</Typography>
                <Button variant="contained" fullWidth onClick={() => navigate(`/rooms/${cat.id}`)} sx={{ bgcolor: '#c1a37f', color: 'white', borderRadius: 0, boxShadow: 0, '&:hover': { bgcolor: '#a68a64' } }}>{t.learnMore}</Button>
              </Box>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
}