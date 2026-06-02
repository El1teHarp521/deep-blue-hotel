import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, CardMedia, Select, MenuItem, Paper, Dialog, DialogTitle, DialogContent, Divider, Alert, Stack } from '@mui/material';
import axios from 'axios';
import { formatPrice } from '../utils/price';

export default function ParkingPage({ t, currency, lang, user }) {
  const [spots, setSpots] = useState(1);
  const [booked, setBooked] = useState(null);

  // Стейты для модального окна бронирования парковки
  const [openModal, setOpenModal] = useState(false);
  const [parkingIn, setParkingIn] = useState('');
  const [parkingOut, setParkingOut] = useState('');
  const [alertMessage, setAlertMessage] = useState(null);
  
  const [activeBooking, setActiveBooking] = useState(null);
  useEffect(() => {
    if (user) {
      axios.get('http://localhost:3001/api/bookings/active')
        .then(res => {
          if (res.data.hasBooking) {
            setActiveBooking(res.data);
          }
        })
        .catch(err => console.error("Ошибка загрузки активного бронирования:", err));
    }
  }, [user]);

  // Парсинг дат заезда и выезда
  const minDate = activeBooking ? activeBooking.checkIn.split('T')[0] : '';
  const maxDate = activeBooking ? activeBooking.checkOut.split('T')[0] : '';

  // Расчет количества суток парковки
  const calculateParkingNights = () => {
    if (!parkingIn || !parkingOut) return 0;
    const start = new Date(parkingIn);
    const end = new Date(parkingOut);
    if (start >= end) return 0;
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  const parkingNights = calculateParkingNights();
  const totalPrice = 3700 * spots * parkingNights;

  const handleBooking = async (e) => {
    e.preventDefault();
    setAlertMessage(null);

    if (!parkingIn || !parkingOut) {
      setAlertMessage({ type: 'error', text: lang === 'RU' ? 'Пожалуйста, выберите даты аренды парковки!' : 'Please select parking dates!' });
      return;
    }

    if (parkingNights <= 0) {
      setAlertMessage({ type: 'error', text: lang === 'RU' ? 'Дата выезда должна быть позже даты въезда!' : 'Check-out date must be later than check-in date!' });
      return;
    }

    try {
      const response = await axios.post('http://localhost:3003/api/auth/services/purchase', {
        serviceName: 'parking',
        quantity: spots,
        days: parkingNights
      });

      if (response.data.success) {
        const startNum = Math.floor(Math.random() * 90) + 1;
        const result = [];
        for(let i=0; i<spots; i++) result.push(startNum + i);
        setBooked(result);
        
        setAlertMessage({ type: 'success', text: lang === 'RU' ? 'Места успешно забронированы!' : 'Parking spots reserved successfully!' });
        
        setTimeout(() => {
          setOpenModal(false);
          setParkingIn('');
          setParkingOut('');
        }, 1500);
      }
    } catch (error) {
      setAlertMessage({ type: 'error', text: error.response?.data?.error || 'Ошибка при пополнении/оплате' });
    }
  };

  const showPurchaseBtn = user && ['Guest', 'Employee', 'Admin'].includes(user.role);

  return (
    <Box component="main" sx={{ pt: 22, pb: 10 }}>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h1" sx={{ fontSize: '3rem', fontWeight: 'bold', fontFamily: 'Playfair Display', color: 'text.primary', mb: 2 }}>{t.parkTitle}</Typography>
          <Typography variant="body1" color="secondary" sx={{ fontSize: '1.25rem', fontWeight: 700 }}>{t.parkSub}</Typography>
        </Box>

        <Paper sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 0, mb: 8 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 3 }}>
            <CardMedia component="img" image="/images/service-parking-1.jpg" alt={`${t.parkTitle} - Общий вид`} sx={{ height: 450, objectFit: 'cover', borderRadius: 0 }} />
            <CardMedia component="img" image="/images/service-parking-2.jpg" alt={`${t.parkTitle} - Охраняемая зона`} sx={{ height: 450, objectFit: 'cover', borderRadius: 0 }} />
          </Box>
        </Paper>

        <Container maxWidth="md">
          <Paper sx={{ p: 6, borderRadius: 0, bgcolor: 'background.paper', textAlign: 'center' }}>
             <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 'bold', mb: 3, color: 'text.primary' }}>{t.parkSelect}</Typography>
             <Typography sx={{ fontSize: '1.25rem', fontWeight: 'bold', mb: 3, color: 'secondary.main' }}>
               {formatPrice(3700, currency, lang)} / {lang === 'RU' ? 'сутки за 1 место' : 'spot per day'}
             </Typography>
             
             {showPurchaseBtn ? (
               <Button variant="contained" size="large" onClick={() => setOpenModal(true)} sx={{ px: 8, borderRadius: 0 }}>
                 {t.book}
               </Button>
             ) : (
               <Button variant="contained" disabled sx={{ borderRadius: 0, px: 8 }}>
                 {lang === 'RU' ? 'Доступно гостям' : 'Guests Only'}
               </Button>
             )}
             
             {booked && (
               <Box sx={{ mt: 4, p: 3, bgcolor: '#002F6C', color: 'white', textAlign: 'center', borderRadius: 0 }}>
                 <Typography sx={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{t.parkBooked} {booked.join(', ')} (Сектор VIP)</Typography>
               </Box>
             )}
          </Paper>
        </Container>
      </Container>

      {/*модальное окно бронирования парковки*/}
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)}
        maxWidth="xs"
        fullWidth
        sx={{
          '& .MuiPaper-root': { borderRadius: 0, p: 4, bgcolor: 'background.paper', border: '1px solid rgba(128,128,128,0.2)' }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontFamily: 'Playfair Display', fontWeight: 'bold', fontSize: '1.8rem', pb: 2 }}>
          {lang === 'RU' ? 'Аренда парковки' : 'Reserve Parking'}
        </DialogTitle>
        <DialogContent>
          {alertMessage && (
            <Alert severity={alertMessage.type} sx={{ borderRadius: 0, mb: 3 }}>
              {alertMessage.text}
            </Alert>
          )}

          <Box component="form" onSubmit={handleBooking}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Дата въезда на парковку с ограничением по дате заезда в отель */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>ДАТА НАЧАЛА АРЕНДЫ</Typography>
                <input 
                  type="date" 
                  required
                  min={minDate} 
                  max={maxDate}
                  value={parkingIn} 
                  aria-label="Дата начала аренды парковки"
                  onChange={(e) => {
                    setParkingIn(e.target.value);
                    setParkingOut('');
                  }} 
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', outline: 'none', background: 'transparent', color: 'inherit' }} 
                />
              </Box>

              {/* Дата выезда с парковки с ограничением по дате выезда из отеля */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>ДАТА ОКОНЧАНИЯ АРЕНДЫ</Typography>
                <input 
                  type="date" 
                  required
                  min={parkingIn || minDate} 
                  max={maxDate}
                  value={parkingOut} 
                  aria-label="Дата окончания аренды парковки"
                  onChange={(e) => setParkingOut(e.target.value)} 
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', outline: 'none', background: 'transparent', color: 'inherit' }} 
                />
              </Box>

              {/* Выбор количества мест (от 1 до 3) */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>КОЛИЧЕСТВО МЕСТ (МАКС. 3)</Typography>
                <Select 
                  fullWidth 
                  value={spots} 
                  onChange={(e) => setSpots(e.target.value)} 
                  sx={{ borderRadius: 0 }}
                >
                  <MenuItem value={1}>1 {lang === 'RU' ? 'место' : 'spot'}</MenuItem>
                  <MenuItem value={2}>2 {lang === 'RU' ? 'места' : 'spots'}</MenuItem>
                  <MenuItem value={3}>3 {lang === 'RU' ? 'места' : 'spots'}</MenuItem>
                </Select>
              </Box>

              {activeBooking && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1, textAlign: 'center' }}>
                  {lang === 'RU' 
                    ? `Ваш период проживания в отеле: с ${new Date(activeBooking.checkIn).toLocaleDateString()} по ${new Date(activeBooking.checkOut).toLocaleDateString()}`
                    : `Your hotel stay period: from ${new Date(activeBooking.checkIn).toLocaleDateString()} to ${new Date(activeBooking.checkOut).toLocaleDateString()}`}
                </Typography>
              )}

              <Divider />

              {/* Посуточный расчет суммы */}
              <Typography variant="h5" align="center" color="secondary" sx={{ fontWeight: 'bold' }}>
                {lang === 'RU' ? 'К оплате:' : 'Total:'} {formatPrice(totalPrice, currency, lang)} 
                <span style={{ fontSize: '0.9rem', display: 'block', fontWeight: 'normal', color: 'gray', marginTop: '5px' }}>
                  {lang === 'RU' 
                    ? `(${parkingNights} сут. х ${spots} мест. х 3 700 ₽)`
                    : `(${parkingNights} days x ${spots} spots x 3,700 ₽)`}
                </span>
              </Typography>

              <Button 
                type="submit" 
                variant="contained" 
                fullWidth 
                sx={{ bgcolor: '#c1a37f', color: 'white', py: 1.8, fontWeight: 'bold', borderRadius: 0, '&:hover': { bgcolor: '#a68a64' } }}
              >
                {lang === 'RU' ? 'ОПЛАТИТЬ И ЗАБРОНИРОВАТЬ' : 'PAY & RESERVE'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}