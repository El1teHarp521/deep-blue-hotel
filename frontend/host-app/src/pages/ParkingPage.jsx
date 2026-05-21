import React, { useState } from 'react';
import { Box, Container, Typography, Button, CardMedia, Select, MenuItem, Paper } from '@mui/material';
import axios from 'axios';
import { formatPrice } from '../utils/price';

export default function ParkingPage({ t, currency, lang, user }) {
  const [spots, setSpots] = useState(1);
  const [booked, setBooked] = useState(null);

  const handleBooking = async () => {
    try {
      const response = await axios.post('http://localhost:3003/api/auth/services/purchase', {
        serviceName: 'parking',
        quantity: spots
      });
      if (response.data.success) {
        const startNum = Math.floor(Math.random() * 90) + 1;
        const result = [];
        for(let i=0; i<spots; i++) result.push(startNum + i);
        setBooked(result);
        window.alert(lang === 'RU' ? 'Места забронированы!' : 'Parking spots reserved!');
      }
    } catch (error) {
      window.alert(error.response?.data?.error || 'Ошибка при пополнении/оплате');
    }
  };

  const showPurchaseBtn = user && ['Guest', 'Employee', 'Admin'].includes(user.role);

  return (
    <Box sx={{ pt: 22, pb: 10 }}>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h2" sx={{ fontFamily: 'Playfair Display', color: 'text.primary', mb: 2 }}>{t.parkTitle}</Typography>
          <Typography variant="h5" color="secondary" sx={{ fontWeight: 700 }}>{t.parkSub}</Typography>
        </Box>

        <Paper sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 0, mb: 8 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 3 }}>
            <CardMedia component="img" image="/images/service-parking-1.jpg" sx={{ height: 450, objectFit: 'cover', borderRadius: 0 }} />
            <CardMedia component="img" image="/images/service-parking-2.jpg" sx={{ height: 450, objectFit: 'cover', borderRadius: 0 }} />
          </Box>
        </Paper>

        <Container maxWidth="md">
          <Paper sx={{ p: 6, borderRadius: 0, bgcolor: 'background.paper', textAlign: 'center' }}>
             <Typography variant="h5" sx={{ mb: 3, color: 'text.primary', fontWeight: 'bold' }}>{t.parkSelect}</Typography>
             <Typography variant="h6" color="secondary" sx={{ fontWeight: 'bold', mb: 3 }}>
               {formatPrice(3700, currency, lang)} / {lang === 'RU' ? 'место' : 'spot'}
             </Typography>
             <Select fullWidth value={spots} onChange={(e) => setSpots(e.target.value)} sx={{ mb: 4, borderRadius: 0 }}>
               <MenuItem value={1}>1 {lang === 'RU' ? 'место' : 'spot'}</MenuItem>
               <MenuItem value={2}>2 {lang === 'RU' ? 'места' : 'spots'}</MenuItem>
               <MenuItem value={3}>3 {lang === 'RU' ? 'места' : 'spots'}</MenuItem>
             </Select>
             
             {showPurchaseBtn && (
               <Button variant="contained" size="large" onClick={handleBooking} sx={{ px: 8, borderRadius: 0 }}>
                 {t.book}
               </Button>
             )}
             
             {booked && (
               <Box sx={{ mt: 4, p: 3, bgcolor: 'primary.main', color: 'text.primary', textAlign: 'center', borderRadius: 0 }}>
                 <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{t.parkBooked} {booked.join(', ')} (Сектор VIP)</Typography>
               </Box>
             )}
          </Paper>
        </Container>
      </Container>
    </Box>
  );
}