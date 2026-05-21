import React from 'react';
import { Box, Typography, Container, CardMedia, Paper } from '@mui/material';

export default function HomePage({ t }) {
  const offers = [
    { 
      t: t.cardHotelTitle, 
      i: '/images/hero-bg.jpg', 
      d: t.cardHotelDesc 
    }, 
    { 
      t: t.cardRestTitle, 
      i: '/images/service-restaurant-1.jpg', 
      d: t.cardRestDesc 
    }, 
    { 
      t: t.cardSpaTitle, 
      i: '/images/service-spa-1.jpg', 
      d: t.cardSpaDesc 
    }
  ];

  return (
    <Box sx={{ overflowX: 'hidden' }}>
      <Box sx={{ 
        height: '95vh', 
        width: '100%',
        backgroundImage: 'url(/images/hero-bg.jpg)', 
        backgroundSize: 'cover', 
        backgroundPosition: 'center'
      }} />

      {/* ИНФОРМАЦИОННЫЙ БЛОК */}
      <Container maxWidth="xl" sx={{ mt: 20, mb: 20, textAlign: 'center' }}>
        <Typography variant="h2" color="primary" sx={{ mb: 4, fontSize: '3.5rem' }}>{t.offerTitle}</Typography>
        <Typography variant="body1" sx={{ maxWidth: '900px', mx: 'auto', mb: 12, color: 'text.primary', opacity: 0.8, lineHeight: 2.2, fontSize: '1.1rem' }}>
          {t.offerSub}
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 6 }}>
          {offers.map((item, idx) => (
            <Box key={idx} sx={{ textAlign: 'left' }}>
              <Paper sx={{ p: 0, mb: 3, border: 'none', borderRadius: 0 }}>
                <CardMedia component="img" image={item.i} sx={{ height: 500, borderRadius: 0 }} />
              </Paper>
              <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Playfair Display', mb: 2, color: 'text.primary' }}>{item.t}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8, opacity: 0.9 }}>{item.d}</Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}