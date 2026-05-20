import React, { useState } from 'react';
import { Box, Container, Typography, CardMedia, Button, Paper, TextField, MenuItem, Select, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../utils/price';

export default function RoomsPage({ t, currency, lang }) {
  const navigate = useNavigate();

  // Состояния фильтрации 
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [checkDate, setCheckDate] = useState('');

  // Базовые номера с числовыми ценами в рублях
  const rooms = [
    { id: 'standard', title: t.roomStandard, img: '/images/room-standard-1.jpg', d: t.roomStandardDesc, priceRub: 15000, category: 'standard', reservedDates: ['2026-05-20', '2026-05-25'] },
    { id: 'business', title: t.roomRoyal, img: '/images/room-business-1.jpg', d: t.roomRoyalDesc, priceRub: 34000, category: 'business', reservedDates: ['2026-05-21'] },
    { id: 'lux', title: t.roomLux, img: '/images/room-lux-1.jpg', d: t.roomLuxDesc, priceRub: 67000, category: 'lux', reservedDates: ['2026-05-22', '2026-05-23'] },
    { id: 'penthouse', title: t.roomPenthouse, img: '/images/room-penthouse-1.jpg', d: t.roomPenthouseDesc, priceRub: 152000, category: 'penthouse', reservedDates: ['2026-05-28'] }
  ];

  // ЛОГИКА ФИЛЬТРАЦИИ И ПОИСКА
  const filteredRooms = rooms.filter((room) => {
    // 1. Поиск по названию 
    const matchesSearch = room.title.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Фильтр по категориям
    const matchesCategory = category === 'all' || room.category === category;

    // 3. Фильтр по цене 
    const priceInRub = room.priceRub;
    const usdToRubRate = 90;

    const convertedMinRub = minPrice === '' ? 0 : parseFloat(minPrice) * usdToRubRate;
    const convertedMaxRub = maxPrice === '' ? Infinity : parseFloat(maxPrice) * usdToRubRate;

    const matchesMinPrice = priceInRub >= convertedMinRub;
    const matchesMaxPrice = priceInRub <= convertedMaxRub;

    return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice;
  });

  // Функция проверки статуса на выбранную дату
  const getAvailabilityStatus = (room) => {
    if (!checkDate) return null;
    const isOccupied = room.reservedDates.includes(checkDate);
    return isOccupied ? (
      <Chip label={t.statusOccupied} color="error" variant="outlined" sx={{ borderRadius: 0, fontWeight: 'bold' }} />
    ) : (
      <Chip label={t.statusFree} color="success" variant="outlined" sx={{ borderRadius: 0, fontWeight: 'bold' }} />
    );
  };

  return (
    <Box sx={{ pt: 22, pb: 10 }}>
      <Container maxWidth="xl">
        <Typography variant="h2" align="center" sx={{ fontFamily: 'Playfair Display', mb: 6, color: 'text.primary' }}>
          {t.roomsTitle}
        </Typography>

        {/* --- ПАНЕЛЬ ФИЛЬТРОВ И ПОИСКА --- */}
        <Paper sx={{ p: 4, mb: 8, bgcolor: 'background.paper', borderRadius: 0, border: '1px solid rgba(128,128,128,0.2)' }}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1.5fr 1fr 1fr 1fr 1fr' }, 
            gap: 3, 
            alignItems: 'end' 
          }}>
            {/* 1. Поиск по тексту */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'secondary.main', display: 'block', mb: 1 }}>ПОИСК ПО НАЗВАНИЮ</Typography>
              <TextField 
                fullWidth 
                placeholder={t.searchPlaceholder} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined" 
                size="small"
                InputProps={{ sx: { borderRadius: 0 } }}
              />
            </Box>

            {/* 2. Селектор категорий */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'secondary.main', display: 'block', mb: 1 }}>{t.categoryLabel}</Typography>
              <Select
                fullWidth
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                size="small"
                sx={{ borderRadius: 0 }}
              >
                <MenuItem value="all">{t.allCategories}</MenuItem>
                <MenuItem value="standard">{t.categoryStandard}</MenuItem>
                <MenuItem value="business">{t.categoryBusiness}</MenuItem>
                <MenuItem value="lux">{t.categoryLux}</MenuItem>
                <MenuItem value="penthouse">{t.categoryPenthouse}</MenuItem>
              </Select>
            </Box>

            {/* 3. Цена От (В долларах $) */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'secondary.main', display: 'block', mb: 1 }}>{t.priceFrom} ($)</Typography>
              <TextField 
                fullWidth 
                type="number"
                placeholder="e.g. 100"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                size="small"
                InputProps={{ sx: { borderRadius: 0 } }}
              />
            </Box>

            {/* 4. Цена До (В долларах $) */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'secondary.main', display: 'block', mb: 1 }}>{t.priceTo} ($)</Typography>
              <TextField 
                fullWidth 
                type="number"
                placeholder="e.g. 2000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                size="small"
                InputProps={{ sx: { borderRadius: 0 } }}
              />
            </Box>

            {/* 5. Выбор даты */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'secondary.main', display: 'block', mb: 1 }}>ПРОВЕРИТЬ НА ДАТУ</Typography>
              <input 
                type="date" 
                value={checkDate}
                onChange={(e) => setCheckDate(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8.5px 14px', 
                  border: '1px solid rgba(128,128,128,0.2)', 
                  fontFamily: 'inherit',
                  background: 'transparent',
                  color: 'inherit',
                  outline: 'none',
                  fontSize: '0.9rem'
                }} 
              />
            </Box>
          </Box>
        </Paper>

        {/* --- ВЫВОД НОМЕРОВ --- */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, 
          gap: 4 
        }}>
          {filteredRooms.map((room, i) => (
            <Paper key={i} sx={{ 
              p: 3, 
              bgcolor: 'background.paper', 
              borderRadius: 0,
              display: 'flex', 
              flexDirection: 'column',
              height: '100%'
            }}>
              <CardMedia component="img" image={room.img} sx={{ height: 350, objectFit: 'cover', borderRadius: 0, mb: 3 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 1 }}>
                <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 600, minHeight: 60, color: 'text.primary', flex: 1 }}>
                  {room.title}
                </Typography>
                {getAvailabilityStatus(room)}
              </Box>

              <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary', opacity: 0.8, minHeight: 100, lineHeight: 1.6 }}>
                {room.d}
              </Typography>
              
              <Box sx={{ mt: 'auto' }}>
                <Typography variant="h5" color="secondary" sx={{ fontWeight: 'bold', mb: 2 }}>
                  {formatPrice(room.priceRub, currency, lang)}
                </Typography>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => navigate(`/rooms/${room.id}`)}
                  sx={{ bgcolor: '#c1a37f', color: 'white', borderRadius: 0, boxShadow: 0, '&:hover': { bgcolor: '#a68a64' } }}
                >
                  {t.learnMore}
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
}