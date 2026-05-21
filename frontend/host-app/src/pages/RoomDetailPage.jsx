import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, CardMedia, Button, Paper, Divider, IconButton, List, ListItem, ListItemText } from '@mui/material';

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CheckIcon from '@mui/icons-material/Check';
import { formatPrice } from '../utils/price';

export default function RoomDetailPage({ t, currency, lang }) {
  const { roomType } = useParams();
  const navigate = useNavigate();

  const gallery = {
    standard: ['/images/room-standard-1.jpg', '/images/room-standard-2.jpg', '/images/room-standard-3.jpg', '/images/room-standard-4.jpg'],
    business: ['/images/room-business-1.jpg', '/images/room-business-2.jpg', '/images/room-business-3.jpg', '/images/room-business-4.jpg', '/images/room-business-5.jpg'],
    lux: ['/images/room-lux-1.jpg', '/images/room-lux-2.jpg', '/images/room-lux-3.jpg', '/images/room-lux-4.jpg', '/images/room-lux-5.jpg', '/images/room-lux-6.jpg'],
    penthouse: ['/images/room-penthouse-1.jpg', '/images/room-penthouse-2.jpg', '/images/room-penthouse-3.jpg', '/images/room-penthouse-4.jpg', '/images/room-penthouse-5.jpg', '/images/room-penthouse-6.jpg']
  };

  const images = gallery[roomType] || gallery.standard;
  const details = t.roomDetails[roomType] || t.roomDetails.standard;

  const [activeSlide, setActiveSlide] = useState(0);

  const handleNext = () => {
    setActiveSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setActiveSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <Box sx={{ pt: 22, pb: 10 }}>
      <Container maxWidth="xl">
        <Button onClick={() => navigate('/rooms')} sx={{ mb: 4, color: 'text.secondary', fontWeight: 'bold' }}>
          ← {lang === 'RU' ? 'НАЗАД К СПИСКУ' : 'BACK TO LIST'}
        </Button>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 6 }}>
          
          <Box>
            <Paper sx={{ position: 'relative', height: 600, overflow: 'hidden', mb: 6, borderRadius: 0 }}>
              <CardMedia 
                component="img" 
                image={images[activeSlide]} 
                sx={{ height: '100%', objectFit: 'cover', transition: 'opacity 0.4s ease-in-out', borderRadius: 0 }} 
              />
              <IconButton onClick={handlePrev} sx={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: 0, p: 2 }}>
                <ArrowBackIosNewIcon />
              </IconButton>
              <IconButton onClick={handleNext} sx={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: 0, p: 2 }}>
                <ArrowForwardIosIcon />
              </IconButton>
            </Paper>

            {/* Описание */}
            <Paper sx={{ p: 5, mb: 6, borderRadius: 0 }}>
              <Typography variant="h3" sx={{ fontFamily: 'Playfair Display', mb: 3, color: 'text.primary' }}>{details.title}</Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 2, mb: 4 }}>
                {details.desc}
              </Typography>
              <Divider sx={{ my: 3 }} />
              <Typography variant="body1" sx={{ color: 'text.primary' }}>
                <b>{t.capacity}:</b> {details.capacity}
              </Typography>
            </Paper>

            {/* Включено в проживание */}
            <Paper sx={{ p: 5, borderRadius: 0 }}>
              <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', mb: 3, fontWeight: 'bold', color: 'text.primary' }}>{t.includedTitle}</Typography>
              <List>
                {details.included.map((item, idx) => (
                  <ListItem key={idx} disablePadding sx={{ py: 1.5 }}>
                    <CheckIcon sx={{ color: 'secondary.main', mr: 2 }} />
                    <ListItemText primary={item} primaryTypographyProps={{ style: { fontWeight: 600, fontSize: '1rem', color: 'text.primary' } }} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>

          {/* ПРАВАЯ КОЛОНКА */}
          <Box sx={{ position: 'sticky', top: 180, alignSelf: 'start' }}>
            <Paper sx={{ p: 5, border: '1px solid rgba(128,128,128,0.2)', bgcolor: 'background.paper', textAlign: 'center', borderRadius: 0 }}>
              <Typography variant="caption" sx={{ letterSpacing: 2, display: 'block', mb: 1, color: 'text.secondary' }}>{t.pricePerNight}</Typography>
              <Typography variant="h2" color="secondary" sx={{ fontWeight: 'bold', mb: 4 }}>
                {formatPrice(details.priceRub, currency, lang)}
              </Typography>
              <Button 
                variant="contained" 
                fullWidth 
                sx={{ bgcolor: '#c1a37f', color: 'white', py: 2, fontWeight: 'bold', borderRadius: 0, '&:hover': { bgcolor: '#a68a64' } }}
              >
                {t.book}
              </Button>
            </Paper>
          </Box>

        </Box>
      </Container>
    </Box>
  );
}