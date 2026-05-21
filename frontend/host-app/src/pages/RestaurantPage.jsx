import React, { useState } from 'react';
import { Box, Container, Typography, CardMedia, Paper, Button, IconButton } from '@mui/material'; // ДОБАВИЛ ICONBUTTON В ИМПОРТ
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import axios from 'axios';
import { formatPrice } from '../utils/price';

export default function RestaurantPage({ t, currency, lang, user }) {
  const restaurantImages = [
    '/images/service-restaurant-1.jpg',
    '/images/service-restaurant-2.jpg',
    '/images/service-restaurant-3.jpg'
  ];

  const [activeSlide, setActiveSlide] = useState(0);

  const handleNext = () => {
    setActiveSlide((prev) => (prev === restaurantImages.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setActiveSlide((prev) => (prev === 0 ? restaurantImages.length - 1 : prev - 1));
  };

  const handlePurchaseService = async (serviceName) => {
    try {
      const response = await axios.post('http://localhost:3003/api/auth/services/purchase', {
        serviceName,
        quantity: 1
      });
      if (response.data.success) {
        window.alert(lang === 'RU' ? 'Успешно добавлено в проживание!' : 'Successfully added to stay!');
      }
    } catch (error) {
      window.alert(error.response?.data?.error || 'Ошибка при покупке');
    }
  };

  const showPurchaseBtn = user && ['Guest', 'Employee', 'Admin'].includes(user.role);

  return (
    <Box sx={{ pt: 22, pb: 10 }}>
      <Container maxWidth="xl">
        <Paper sx={{ 
          position: 'relative', 
          p: 0, 
          bgcolor: 'background.paper', 
          borderRadius: 0, 
          mb: 8,
          overflow: 'hidden',
          height: '600px',
          border: '1px solid rgba(128,128,128,0.2)'
        }}>
          <CardMedia 
            component="img" 
            image={restaurantImages[activeSlide]} 
            sx={{ 
              height: '100%', 
              objectFit: 'cover',
              transition: 'opacity 0.5s ease-in-out',
              borderRadius: 0
            }} 
          />

          <IconButton 
            onClick={handlePrev}
            sx={{ 
              position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
              bgcolor: 'rgba(1, 10, 25, 0.6)', color: 'white', borderRadius: 0, p: 2,
              backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(197, 160, 89, 0.8)', color: 'black' }
            }}
          >
            <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
          </IconButton>

          <IconButton 
            onClick={handleNext}
            sx={{ 
              position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
              bgcolor: 'rgba(1, 10, 25, 0.6)', color: 'white', borderRadius: 0, p: 2,
              backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(197, 160, 89, 0.8)', color: 'black' }
            }}
          >
            <ArrowForwardIosIcon sx={{ fontSize: 18 }} />
          </IconButton>

          <Box sx={{ 
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 1.5, zIndex: 5
          }}>
            {restaurantImages.map((_, idx) => (
              <Box 
                key={idx}
                onClick={() => setActiveSlide(idx)}
                sx={{ 
                  width: 10, height: 10, borderRadius: 0, cursor: 'pointer',
                  bgcolor: activeSlide === idx ? '#c1a37f' : 'rgba(255,255,255,0.4)',
                  transition: '0.3s'
                }}
              />
            ))}
          </Box>
        </Paper>

        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h2" color="text.primary" sx={{ mb: 2, fontFamily: 'Playfair Display' }}>
            {t.restTitle}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
            {t.restSub}
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, 
          gap: 4 
        }}>
          {[
            { key: 'breakfast', title: t.breakfast, time: '6:30 - 9:00', price: 3100 },
            { key: 'lunch', title: t.lunch, time: '13:00 - 15:00', price: 7200 },
            { key: 'dinner', title: t.dinner, time: '18:30 - 01:00', price: 5400 }
          ].map((item, idx) => (
            <Paper key={idx} sx={{ p: 5, borderRadius: 0, bgcolor: 'background.paper', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="secondary" sx={{ fontWeight: 'bold', mb: 2 }}>{item.title}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>{item.time}</Typography>
                <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold', mb: 3 }}>
                  {formatPrice(item.price, currency, lang)}
                </Typography>
              </Box>

              {showPurchaseBtn && (
                <Button variant="contained" onClick={() => handlePurchaseService(item.key)} sx={{ bgcolor: '#c1a37f', color: 'white', borderRadius: 0 }}>
                  {lang === 'RU' ? 'Добавить в проживание' : 'Add to stay'}
                </Button>
              )}
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
}