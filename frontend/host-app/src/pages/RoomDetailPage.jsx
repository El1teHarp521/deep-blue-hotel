import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Container, Typography, CardMedia, Button, Paper, 
  Divider, IconButton, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, Stack, Alert, TextField 
} from '@mui/material';

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CheckIcon from '@mui/icons-material/Check';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { formatPrice } from '../utils/price';
import axios from 'axios';

export default function RoomDetailPage({ t, currency, lang }) {
  const { roomType } = useParams();
  const navigate = useNavigate();

  const [openCheckout, setOpenCheckout] = useState(false);
  const [bookingAlert, setBookingAlert] = useState(null);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

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

  const calculateTotal = () => {
    if (!checkIn || !checkOut) return details.priceRub;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (start >= end) return details.priceRub;
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return details.priceRub * nights;
  };

  const handleConfirmBooking = async (payNow) => {
    setBookingAlert(null);

    if (!checkIn || !checkOut) {
      setBookingAlert({ type: 'error', text: 'Пожалуйста, заполните даты заезда и выезда!' });
      return;
    }

    try {
      const response = await axios.post('http://localhost:3001/api/bookings', {
        category: roomType,
        checkIn,
        checkOut,
        totalPrice: calculateTotal(),
        payNow: payNow 
      });

      if (response.data.success) {
        setBookingAlert({ type: 'success', text: response.data.message });
        setTimeout(() => {
          setOpenCheckout(false);
          navigate('/profile'); 
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      setBookingAlert({ type: 'error', text: error.response?.data?.error || 'Ошибка при создании бронирования.' });
    }
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

          <Box sx={{ position: 'sticky', top: 180, alignSelf: 'start' }}>
            <Paper sx={{ p: 5, border: '1px solid rgba(128,128,128,0.2)', bgcolor: 'background.paper', textAlign: 'center', borderRadius: 0 }}>
              <Typography variant="caption" sx={{ letterSpacing: 2, display: 'block', mb: 1, color: 'text.secondary' }}>{t.pricePerNight}</Typography>
              <Typography variant="h2" color="secondary" sx={{ fontWeight: 'bold', mb: 4 }}>
                {formatPrice(details.priceRub, currency, lang)}
              </Typography>
              
              <Button 
                variant="contained" 
                fullWidth 
                onClick={() => setOpenCheckout(true)}
                sx={{ bgcolor: '#c1a37f', color: 'white', py: 2, fontWeight: 'bold', borderRadius: 0, '&:hover': { bgcolor: '#a68a64' } }}
              >
                {t.book}
              </Button>
            </Paper>
          </Box>
        </Box>
      </Container>

      {/* Модальное окно */}
      <Dialog 
        open={openCheckout} 
        onClose={() => setOpenCheckout(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 0, p: 4, bgcolor: 'background.paper', border: '1px solid rgba(128,128,128,0.2)' }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontFamily: 'Playfair Display', fontWeight: 'bold', fontSize: '1.8rem', pb: 2 }}>
          {lang === 'RU' ? 'Оформление брони' : 'Room Checkout'}
        </DialogTitle>
        <DialogContent>
          {bookingAlert && (
            <Alert severity={bookingAlert.type} sx={{ borderRadius: 0, mb: 3 }}>
              {bookingAlert.text}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Выбор дат заезда/выезда */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>ДАТА ЗАЕЗДА</Typography>
              <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', outline: 'none', background: 'transparent', color: 'inherit' }} />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>ДАТА ВЫЕЗДА</Typography>
              <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', outline: 'none', background: 'transparent', color: 'inherit' }} />
            </Box>

            <Divider />

            <Typography variant="h5" align="center" color="secondary" sx={{ fontWeight: 'bold', my: 1 }}>
              {lang === 'RU' ? 'Итого:' : 'Total:'} {formatPrice(calculateTotal(), currency, lang)}
            </Typography>

            {/* Способы оплаты */}
            <Paper sx={{ p: 3, borderRadius: 0, cursor: 'pointer', border: '1px solid rgba(128,128,128,0.2)', '&:hover': { borderColor: '#c1a37f' } }} onClick={() => handleConfirmBooking(true)}>
              <Stack direction="row" spacing={2} alignItems="center">
                <AccountBalanceWalletIcon sx={{ color: 'secondary.main', fontSize: 30 }} />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {lang === 'RU' ? 'Оплатить сейчас' : 'Pay Now'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lang === 'RU' ? 'Списание средств с баланса аккаунта' : 'Deduct from your account balance'}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 0, cursor: 'pointer', border: '1px solid rgba(128,128,128,0.2)', '&:hover': { borderColor: '#c1a37f' } }} onClick={() => handleConfirmBooking(false)}>
              <Stack direction="row" spacing={2} alignItems="center">
                <CreditCardIcon sx={{ color: '#c1a37f', fontSize: 30 }} />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {lang === 'RU' ? 'Оплатить при заезде' : 'Reserve & Pay Later'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lang === 'RU' ? 'Зарезервировать в долг (оплата позже)' : 'Reserve with debt (unpaid balance)'}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}