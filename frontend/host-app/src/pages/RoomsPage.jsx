import React from 'react';
import { Box, Container, Typography, CardMedia, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function RoomsPage({ t }) {
  const navigate = useNavigate();

  const rooms = [
    { id: 'standard', title: t.roomStandard, img: '/images/room-standard-1.jpg', d: t.roomStandardDesc },
    { id: 'business', title: t.roomRoyal, img: '/images/room-business-1.jpg', d: t.roomRoyalDesc },
    { id: 'lux', title: t.roomLux, img: '/images/room-lux-1.jpg', d: t.roomLuxDesc },
    { id: 'penthouse', title: t.roomPenthouse, img: '/images/room-penthouse-1.jpg', d: t.roomPenthouseDesc }
  ];

  return (
    <Box sx={{ pt: 22, pb: 10 }}>
      <Container maxWidth="xl">
        <Typography variant="h2" align="center" sx={{ fontFamily: 'Playfair Display', mb: 8, color: 'text.primary' }}>
          {t.roomsTitle}
        </Typography>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, 
          gap: 4 
        }}>
          {rooms.map((room, i) => (
            <Paper key={i} sx={{ 
              p: 3, 
              bgcolor: 'background.paper', 
              borderRadius: 0,
              display: 'flex', 
              flexDirection: 'column',
              height: '100%'
            }}>
              <CardMedia component="img" image={room.img} sx={{ height: 350, objectFit: 'cover', borderRadius: 0, mb: 3 }} />
              <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 600, mb: 2, minHeight: 60, color: 'text.primary' }}>
                {room.title}
              </Typography>
              <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary', opacity: 0.8, minHeight: 100, lineHeight: 1.6 }}>
                {room.d}
              </Typography>
              <Box sx={{ mt: 'auto' }}>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => navigate(`/rooms/${room.id}`)} // Навигация на страницу деталей
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