import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Container, Typography, CardMedia, Button, Paper, 
  Divider, IconButton, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, Alert, TextField, MenuItem, Select
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

  // Автоопределение языка
  const isRu = !lang || lang.toUpperCase() === 'RU';

  const [openCheckout, setOpenCheckout] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [bookingAlert, setBookingAlert] = useState(null);
  const [paymentAlert, setPaymentAlert] = useState(null);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);

  // Стейт для принятия пользовательского соглашения
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Стейты для карт оплаты
  const [cards, setCards] = useState([]);
  const [useLinkedCard, setUseLinkedCard] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newExpireDate, setNewExpireDate] = useState('');
  const [cvc, setCvc] = useState('');

  const gallery = {
    standard: ['/images/room-standard-1.jpg', '/images/room-standard-2.jpg', '/images/room-standard-3.jpg', '/images/room-standard-4.jpg'],
    business: ['/images/room-business-1.jpg', '/images/room-business-2.jpg', '/images/room-business-3.jpg', '/images/room-business-4.jpg', '/images/room-business-5.jpg'],
    lux: ['/images/room-lux-1.jpg', '/images/room-lux-2.jpg', '/images/room-lux-3.jpg', '/images/room-lux-4.jpg', '/images/room-lux-5.jpg', '/images/room-lux-6.jpg'],
    penthouse: ['/images/room-penthouse-1.jpg', '/images/room-penthouse-2.jpg', '/images/room-penthouse-3.jpg', '/images/room-penthouse-4.jpg', '/images/room-penthouse-5.jpg', '/images/room-penthouse-6.jpg']
  };

  const images = gallery[roomType] || gallery.standard;
  const details = t.roomDetails[roomType] || t.roomDetails.standard;

  const [activeSlide, setActiveSlide] = useState(0);

  const inputStyle = {
    '& .MuiOutlinedInput-root': { borderRadius: 0 }
  };

  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getTodayDateString();

  const maxGuestsMap = {
    standard: 3,
    business: 5,
    lux: 7,
    penthouse: 15
  };
  const maxGuests = maxGuestsMap[roomType] || 4;

  const getCustomCapacityString = () => {
    const capacities = {
      standard: isRu ? 'До 3 человек' : 'Up to 3 people',
      business: isRu ? 'До 5 человек' : 'Up to 5 people',
      lux: isRu ? 'До 7 человек' : 'Up to 7 people',
      penthouse: isRu ? 'До 15 человек' : 'Up to 15 people'
    };
    return capacities[roomType] || details.capacity;
  };

  useEffect(() => {
    if (openCheckout) {
      axios.get('http://localhost:3003/api/auth/cards')
        .then(res => {
          setCards(res.data);
          if (res.data.length > 0) setUseLinkedCard(true);
        })
        .catch(err => console.error("Ошибка загрузки карт:", err));
    }
  }, [openCheckout]);

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
  const handlePayNowClick = () => {
    setBookingAlert(null);

    if (!termsAccepted) {
      setBookingAlert({ type: 'error', text: isRu ? 'Пожалуйста, примите пользовательское соглашение!' : 'Please accept the User Agreement!' });
      return;
    }

    if (!checkIn || !checkOut) {
      setBookingAlert({ type: 'error', text: isRu ? 'Пожалуйста, заполните даты заезда и выезда!' : 'Please fill in check-in and check-out dates!' });
      return;
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (start >= end) {
      setBookingAlert({ type: 'error', text: isRu ? 'Дата выезда должна быть позже даты заселения!' : 'Check-out date must be later than check-in date!' });
      return;
    }

    setOpenCheckout(false);
    setOpenPaymentModal(true);
  };
  const handlePayLaterClick = () => {
    setBookingAlert(null);

    if (!termsAccepted) {
      setBookingAlert({ type: 'error', text: isRu ? 'Пожалуйста, примите пользовательское соглашение!' : 'Please accept the User Agreement!' });
      return;
    }

    handleConfirmBooking(false);
  };

  const handleConfirmBooking = async (payNow) => {
    setBookingAlert(null);
    setPaymentAlert(null);

    if (payNow && (cvc.length !== 3 || isNaN(parseInt(cvc)))) {
      setPaymentAlert({ type: 'error', text: isRu ? 'Неверный CVV (3 цифры)' : 'Invalid CVV (3 digits)' });
      return;
    }

    if (payNow && !useLinkedCard) {
      if (newCardNumber.length !== 16 || newExpireDate.length !== 5) {
        setPaymentAlert({ type: 'error', text: isRu ? 'Заполните корректно данные карты' : 'Please enter valid card details' });
        return;
      }
    }

    try {
      const response = await axios.post('http://localhost:3001/api/bookings', {
        category: roomType,
        checkIn,
        checkOut,
        totalPrice: calculateTotal(),
        payNow: payNow,
        guestsCount: guestsCount
      });

      if (response.data.success) {
        if (payNow) {
          setPaymentAlert({ type: 'success', text: response.data.message });
        } else {
          setBookingAlert({ type: 'success', text: response.data.message });
        }

        setTimeout(() => {
          setOpenCheckout(false);
          setOpenPaymentModal(false);
          navigate('/profile'); 
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      const errorText = error.response?.data?.error || 'Ошибка при создании бронирования.';
      if (payNow) {
        setPaymentAlert({ type: 'error', text: errorText });
      } else {
        setBookingAlert({ type: 'error', text: errorText });
      }
    }
  };

  return (
    <Box sx={{ pt: 22, pb: 10 }}>
      <Container maxWidth="xl">
        <Button onClick={() => navigate('/rooms')} sx={{ mb: 4, color: 'text.secondary', fontWeight: 'bold' }}>
          ← {isRu ? 'НАЗАД К СПИСКУ' : 'BACK TO LIST'}
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
                <b>{t.capacity}:</b> {getCustomCapacityString()}
              </Typography>
            </Paper>

            <Paper sx={{ p: 5, borderRadius: 0 }}>
              <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', mb: 3, fontWeight: 'bold', color: 'text.primary' }}>{t.includedTitle}</Typography>
              <List>
                {details.included.map((item, idx) => (
                  <ListItem key={idx} disablePadding sx={{ py: 1.5 }}>
                    <CheckIcon sx={{ color: 'secondary.main', mr: 2 }} />
                    <ListItemText 
                      primary={
                        <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: 'text.primary' }}>
                          {item}
                        </Typography>
                      } 
                    />
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

      {/* Модальное окно оформления брони */}
      <Dialog 
        open={openCheckout} 
        onClose={() => setOpenCheckout(false)}
        maxWidth="xs"
        fullWidth
        sx={{
          '& .MuiPaper-root': { borderRadius: 0, p: 4, bgcolor: 'background.paper', border: '1px solid rgba(128,128,128,0.2)' }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontFamily: 'Playfair Display', fontWeight: 'bold', fontSize: '1.8rem', pb: 2 }}>
          {isRu ? 'Оформление брони' : 'Room Checkout'}
        </DialogTitle>
        <DialogContent>
          {bookingAlert && (
            <Alert severity={bookingAlert.type} sx={{ borderRadius: 0, mb: 3 }}>
              {bookingAlert.text}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Выбор дат заезда/выезда с блокировкой дат */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>
                {isRu ? 'ДАТА ЗАЕЗДА' : 'CHECK-IN DATE'}
              </Typography>
              <input 
                type="date" 
                min={todayStr} 
                value={checkIn} 
                onChange={(e) => {
                  setCheckIn(e.target.value);
                  if (checkOut && e.target.value >= checkOut) {
                    setCheckOut('');
                  }
                }} 
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', outline: 'none', background: 'transparent', color: 'inherit' }} 
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>
                {isRu ? 'ДАТА ВЫЕЗДА' : 'CHECK-OUT DATE'}
              </Typography>
              <input 
                type="date" 
                min={checkIn || todayStr} 
                value={checkOut} 
                onChange={(e) => setCheckOut(e.target.value)} 
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', outline: 'none', background: 'transparent', color: 'inherit' }} 
              />
            </Box>

            {/* Выбор количества человек*/}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>
                {isRu ? 'КОЛИЧЕСТВО ГОСТЕЙ' : 'NUMBER OF GUESTS'}
              </Typography>
              <Select 
                fullWidth 
                value={guestsCount} 
                onChange={(e) => setGuestsCount(e.target.value)} 
                sx={{ borderRadius: 0 }}
              >
                {Array.from({ length: maxGuests }, (_, i) => i + 1).map(num => (
                  <MenuItem key={num} value={num}>
                    {num} {num === 1 ? (isRu ? 'человек' : 'person') : (isRu ? 'человека' : 'people')}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {/* пользовательское соглашение */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
              <input 
                type="checkbox" 
                id="terms-checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', lineHeight: 1.4 }}>
                {isRu ? 'Я согласен с ' : 'I agree to the '}
                <span 
                  onClick={() => {
                    setOpenCheckout(false);
                    navigate('/terms');
                  }} 
                  style={{ color: '#c1a37f', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {isRu ? 'пользовательским соглашением' : 'User Agreement'}
                </span>
              </Typography>
            </Box>

            <Divider />

            <Typography variant="h5" align="center" color="secondary" sx={{ fontWeight: 'bold', my: 1 }}>
              {isRu ? 'Итого:' : 'Total:'} {formatPrice(calculateTotal(), currency, lang)}
            </Typography>

            {/* Способы оплаты  */}
            <Paper 
              sx={{ 
                p: 3, 
                borderRadius: 0, 
                cursor: termsAccepted ? 'pointer' : 'not-allowed', 
                opacity: termsAccepted ? 1 : 0.5,
                border: '1px solid rgba(128,128,128,0.2)', 
                '&:hover': { borderColor: termsAccepted ? '#c1a37f' : 'rgba(128,128,128,0.2)' } 
              }} 
              onClick={handlePayNowClick}
            >
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                <AccountBalanceWalletIcon sx={{ color: 'secondary.main', fontSize: 30 }} />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {isRu ? 'Оплатить сейчас' : 'Pay Now'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isRu ? 'Списание средств с баланса аккаунта' : 'Deduct from your account balance'}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Paper 
              sx={{ 
                p: 3, 
                borderRadius: 0, 
                cursor: termsAccepted ? 'pointer' : 'not-allowed', 
                opacity: termsAccepted ? 1 : 0.5,
                border: '1px solid rgba(128,128,128,0.2)', 
                '&:hover': { borderColor: termsAccepted ? '#c1a37f' : 'rgba(128,128,128,0.2)' } 
              }} 
              onClick={handlePayLaterClick}
            >
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                <CreditCardIcon sx={{ color: '#c1a37f', fontSize: 30 }} />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {isRu ? 'Оплатить при заезде' : 'Reserve & Pay Later'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isRu ? 'Зарезервировать в долг (оплата позже)' : 'Reserve with debt (unpaid balance)'}
                  </Typography>
                </Box>
              </Box>
            </Paper>

          </Box>
        </DialogContent>
      </Dialog>

      {/* Второе модальное окно: Оплата картой при бронировании */}
      <Dialog 
        open={openPaymentModal} 
        onClose={() => setOpenPaymentModal(false)}
        maxWidth="xs"
        fullWidth
        sx={{
          '& .MuiPaper-root': { borderRadius: 0, p: 4, bgcolor: 'background.paper', border: '1px solid rgba(128,128,128,0.2)' }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontFamily: 'Playfair Display', fontWeight: 'bold', fontSize: '1.8rem', pb: 2 }}>
          {isRu ? 'Оплата картой' : 'Card Payment'}
        </DialogTitle>
        <DialogContent>
          {paymentAlert && (
            <Alert severity={paymentAlert.type} sx={{ borderRadius: 0, mb: 3 }}>
              {paymentAlert.text}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            <Typography variant="h6" align="center" color="secondary" sx={{ fontWeight: 'bold' }}>
              {isRu ? 'К оплате:' : 'To Pay:'} {formatPrice(calculateTotal(), currency, lang)}
            </Typography>

            {cards.length > 0 ? (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>
                  {isRu ? 'СПОСОБ ОПЛАТЫ' : 'PAYMENT METHOD'}
                </Typography>
                <Select fullWidth value={useLinkedCard} onChange={(e) => setUseLinkedCard(e.target.value)} sx={{ borderRadius: 0 }}>
                  <MenuItem value={true}>{isRu ? `Привязанная карта (•••• ${cards[0].lastFour})` : `Linked Card (•••• ${cards[0].lastFour})`}</MenuItem>
                  <MenuItem value={false}>{isRu ? 'Использовать другую карту' : 'Use another card'}</MenuItem>
                </Select>
              </Box>
            ) : null}

            {!useLinkedCard ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>
                    {isRu ? 'НОМЕР КАРТЫ' : 'CARD NUMBER'}
                  </Typography>
                  <TextField required fullWidth placeholder="16 digits" value={newCardNumber} onChange={(e) => setNewCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>
                    {isRu ? 'СРОК ДЕЙСТВИЯ' : 'EXPIRATION DATE'}
                  </Typography>
                  <TextField required fullWidth placeholder="MM/YY" value={newExpireDate} onChange={(e) => setNewExpireDate(e.target.value.replace(/[^\d/]/g, '').slice(0, 5))} sx={inputStyle} />
                </Box>
              </Box>
            ) : null}

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>
                CVC/CVV
              </Typography>
              <TextField required fullWidth type="password" placeholder="***" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))} sx={inputStyle} />
            </Box>

            <Button 
              variant="contained" 
              fullWidth 
              onClick={() => handleConfirmBooking(true)}
              sx={{ bgcolor: '#c1a37f', color: 'white', py: 1.8, fontWeight: 'bold', borderRadius: 0, '&:hover': { bgcolor: '#a68a64' } }}
            >
              {isRu ? 'ПОДТВЕРДИТЬ И ОПЛАТИТЬ' : 'CONFIRM & PAY'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}