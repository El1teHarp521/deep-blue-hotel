import React, { useState } from 'react';
import { Box, Container, Typography, CardMedia, Paper, Button, TextField } from '@mui/material';
import axios from 'axios';
import { formatPrice } from '../utils/price';

export default function EntertainmentPage({ t, currency, lang, user }) {
  const [pcHours, setPcHours] = useState(1);

  const handlePurchaseCyber = async () => {
    try {
      const response = await axios.post('http://localhost:3003/api/auth/services/purchase', {
        serviceName: 'cyber',
        quantity: pcHours
      });
      if (response.data.success) {
        window.alert(lang === 'RU' ? 'Часы аренды успешно добавлены в проживание!' : 'Gaming hours successfully added to stay!');
      }
    } catch (error) {
      window.alert(error.response?.data?.error || 'Ошибка при покупке');
    }
  };

  const showPurchaseBtn = user && ['Guest', 'Employee', 'Admin'].includes(user.role);

  return (
    <Box component="main" sx={{ pt: 22, pb: 10 }}>
      <Container maxWidth="xl">
        <Typography variant="h1" align="center" sx={{ fontSize: '3rem', fontWeight: 'bold', fontFamily: 'Playfair Display', mb: 10, color: 'text.primary' }}>
          {t.entTitle}
        </Typography>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
          gap: 6,
          mb: 8
        }}>
          {/* Блок 1 - ПК */}
          <Paper sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 0, border: '1px solid rgba(128,128,128,0.2)' }}>
            <CardMedia component="img" image="/images/service-gaming-1.jpg" alt={t.gaming1} sx={{ height: 450, borderRadius: 0, mb: 3, objectFit: 'cover' }} />
            <Typography variant="h2" sx={{ fontSize: '1.5rem', fontFamily: 'Playfair Display', fontWeight: 600, mb: 2, color: 'text.primary' }}>
              {t.gaming1}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8, whiteSpace: 'pre-line', minHeight: '150px' }}>
              {t.gaming1Desc}
            </Typography>
          </Paper>

          {/* Блок 2 - Консоли */}
          <Paper sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 0, border: '1px solid rgba(128,128,128,0.2)' }}>
            <CardMedia component="img" image="/images/service-gaming-2.jpg" alt={t.gaming2} sx={{ height: 450, borderRadius: 0, mb: 3, objectFit: 'cover' }} />
            <Typography variant="h2" sx={{ fontSize: '1.5rem', fontFamily: 'Playfair Display', fontWeight: 600, mb: 2, color: 'text.primary' }}>
              {t.gaming2}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.8, whiteSpace: 'pre-line', minHeight: '150px' }}>
              {t.gaming2Desc}
            </Typography>
          </Paper>
        </Box>

        {/* форма брони */}
        <Container maxWidth="md">
          <Paper sx={{ p: 6, borderRadius: 0, border: '1px solid rgba(128,128,128,0.2)', bgcolor: 'background.paper', textAlign: 'center' }}>
             <Typography variant="h2" sx={{ fontSize: '1.5rem', mb: 3, color: 'text.primary', fontWeight: 'bold' }}>
               {lang === 'RU' ? 'Забронировать игровое время' : 'Reserve Gaming Hours'}
             </Typography>
             
             <Typography sx={{ fontSize: '1.25rem', fontWeight: 'bold', mb: 4, color: 'secondary.main' }}>
               {formatPrice(210, currency, lang)} / {lang === 'RU' ? 'час' : 'hour'}
             </Typography>

             <Box sx={{ display: 'flex', gap: 2, maxWidth: '400px', mx: 'auto' }}>
                <TextField 
                  type="number" 
                  size="small" 
                  value={pcHours} 
                  aria-label={lang === 'RU' ? 'Количество игровых часов' : 'Select gaming hours'}
                  onChange={(e) => setPcHours(Math.max(1, parseInt(e.target.value) || 1))}
                  sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
                
                {showPurchaseBtn ? (
                  <Button variant="contained" onClick={handlePurchaseCyber} sx={{ bgcolor: '#c1a37f', color: 'white', borderRadius: 0, flex: 1 }}>
                    {lang === 'RU' ? 'Добавить в проживание' : 'Add to stay'}
                  </Button>
                ) : (
                  <Button variant="contained" disabled sx={{ borderRadius: 0, flex: 1 }}>
                    {lang === 'RU' ? 'Доступно гостям' : 'Guests Only'}
                  </Button>
                )}
             </Box>
          </Paper>
        </Container>
      </Container>
    </Box>
  );
}