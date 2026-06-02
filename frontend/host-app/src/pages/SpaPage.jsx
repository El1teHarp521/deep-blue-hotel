import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, CardMedia, Button, Divider, Paper, 
  Table, TableBody, TableCell, TableContainer, TableRow, Dialog, DialogTitle, DialogContent, MenuItem, Select, Alert, Chip 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatPrice } from '../utils/price';

export default function SpaPage({ t, currency, lang, user, setUser }) {
  const navigate = useNavigate();

  // Автоопределение языка
  const isRu = !lang || lang.toUpperCase() === 'RU';

  const [openMassageModal, setOpenMassageModal] = useState(false);
  const [massageAlert, setMassageAlert] = useState(null);
  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const tomorrowStr = getTomorrowDateString();

  const [massageDate, setMassageDate] = useState(tomorrowStr);
  const [massageTime, setMassageTime] = useState('14:00');
  const [selectedSpecialist, setSelectedSpecialist] = useState(1);

  // Стейт для хранения статусов занятости мастеров массажа
  const [specialistStatus, setSpecialistStatus] = useState([]);
  useEffect(() => {
    if (openMassageModal && massageDate && massageTime) {
      axios.get(`http://localhost:3003/api/auth/massage/availability?date=${massageDate}&time=${massageTime}`)
        .then(res => setSpecialistStatus(res.data))
        .catch(err => console.error("Ошибка загрузки доступности мастеров:", err));
    }
  }, [openMassageModal, massageDate, massageTime]);

  const handlePurchaseService = async (serviceName) => {
    try {
      const response = await axios.post('http://localhost:3003/api/auth/services/purchase', {
        serviceName, quantity: 1
      });
      if (response.data.success) {
        if (setUser && user) {
          setUser({ ...user, balance: response.data.newBalance });
        }
        window.alert(isRu ? 'Успешно добавлено в проживание!' : 'Successfully added to stay!');
      }
    } catch (error) {
      window.alert(error.response?.data?.error || 'Ошибка при покупке');
    }
  };

  // Валидация при выборе даты в календаре
  const handleDateChange = (e) => {
    const val = e.target.value;
    if (val < tomorrowStr) {
      setMassageAlert({ 
        type: 'error', 
        text: isRu ? 'Запись на массаж возможна только со следующего дня!' : 'Massage booking is only available from tomorrow!' 
      });
      setMassageDate(tomorrowStr);
    } else {
      setMassageAlert(null);
      setMassageDate(val);
    }
  };

  const handleBookMassage = async (e) => {
    e.preventDefault();
    setMassageAlert(null);

    if (!massageDate || !massageTime) {
      setMassageAlert({ type: 'error', text: isRu ? 'Пожалуйста, заполните дату и время!' : 'Please fill date and time!' });
      return;
    }

    const selectedDate = new Date(massageDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (selectedDate < tomorrow) {
      setMassageAlert({ type: 'error', text: isRu ? 'Вы не можете записаться на прошедшую дату или сегодня!' : 'You cannot book a past date or today!' });
      return;
    }

    try {
      const response = await axios.post('http://localhost:3003/api/auth/massage/book', {
        specialistId: selectedSpecialist,
        date: massageDate,
        time: massageTime
      });

      if (response.data.success) {
        if (setUser && user) {
          setUser({ ...user, balance: response.data.newBalance });
        }
        setMassageAlert({ type: 'success', text: response.data.message });
        setTimeout(() => {
          setOpenMassageModal(false);
          setMassageDate(tomorrowStr);
        }, 1500);
      }
    } catch (error) {
      setMassageAlert({ type: 'error', text: error.response?.data?.error || 'Ошибка при записи.' });
    }
  };

  const showPurchaseBtn = user && ['Guest', 'Employee', 'Admin'].includes(user.role);

  return (
    <Box sx={{ pt: 22, pb: 10 }}>
      <Container maxWidth="xl">
        <Paper sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 0, mb: 10 }}>
          <CardMedia component="img" height="700" image="/images/service-spa-1.jpg" alt="Спа-салон отеля DeepBlue Resort" />
        </Paper>
        
        {/* бассейн + баня */}
        <Paper sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 0, mb: 10 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' }, gap: 6, alignItems: 'center' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <CardMedia component="img" image="/images/service-spa-1.jpg" height="350" alt="Бассейн в термальной зоне SPA" sx={{ borderRadius: 0 }} />
              <CardMedia component="img" image="/images/service-spa-2.jpg" height="350" alt="Интерьер финской сауны" sx={{ borderRadius: 0 }} />
            </Box>
            <Box sx={{ pl: { lg: 4 } }}>
              <Typography variant="h3" sx={{ mb: 3, color: 'text.primary', fontFamily: 'Playfair Display' }}>DeepBlue SPA & Бани</Typography>
              <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', lineHeight: 1.8 }}>
                {isRu ? 'Погрузитесь в атмосферу термальных источников и традиционных бань курорта. Доступ предоставляется на весь период проживания.' : 'Immerse yourself in thermal pools and saunas. Unlimited access is granted for the entire period of your stay.'}
              </Typography>
              
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 'bold', mb: 3, color: 'secondary.main' }}>
                {isRu ? 'Бани (на весь период проживания):' : 'Saunas (For the entire stay):'} {formatPrice(7800, currency, lang)}
              </Typography>

              {showPurchaseBtn && (
                <Button variant="contained" onClick={() => handlePurchaseService('saunas')} sx={{ bgcolor: '#c1a37f', color: 'white', borderRadius: 0, mb: 3 }}>
                  {isRu ? 'Добавить в проживание' : 'Add to stay'}
                </Button>
              )}

              <TableContainer component={Paper} sx={{ borderRadius: 0, border: '1px solid rgba(128,128,128,0.2)', bgcolor: 'background.default', boxShadow: 0 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', border: 0 }}>{t.workHours}</TableCell>
                      <TableCell align="right" sx={{ color: 'secondary.main', fontWeight: 'bold', border: 0 }}>{t.spaHours}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </Paper>

        {/* массаж */}
        <Paper sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 0, mb: 10 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.3fr' }, alignItems: 'center' }}>
            <Box sx={{ p: { xs: 2, lg: 4 } }}>
               <Typography variant="h2" gutterBottom sx={{ fontSize: '2.5rem', fontFamily: 'Playfair Display', color: 'text.primary', fontWeight: 'bold' }}>
                 {t.massageTitle}
               </Typography>
               <Typography variant="body1" sx={{ fontSize: '1.5rem', fontWeight: 'bold', mb: 1 }}>{t.massageSub}</Typography>
               <Typography sx={{ fontSize: '1.5rem', fontWeight: 'bold', mb: 3, color: 'secondary.main' }}>
                 {formatPrice(1200, currency, lang)}
               </Typography>
               <Typography sx={{ mb: 4, color: 'text.secondary', lineHeight: 1.8 }}>{t.massageDesc}</Typography>
               
               {/* кнопка брони массажа*/}
               {showPurchaseBtn ? (
                 <Button variant="contained" onClick={() => setOpenMassageModal(true)} sx={{ bgcolor: '#c1a37f', color: 'white', borderRadius: 0 }}>
                   {isRu ? 'ЗАБРОНИРОВАТЬ' : 'BOOK SESSION'}
                 </Button>
               ) : (
                 <Button variant="contained" disabled sx={{ borderRadius: 0 }}>
                   {isRu ? 'Доступно гостям' : 'Guests Only'}
                 </Button>
               )}
            </Box>
            <CardMedia component="img" image="/images/service-spa-3.jpg" height="550" alt="Профессиональный сеанс массажа" sx={{ borderRadius: 0 }} />
          </Box>
        </Paper>

        <Typography variant="h2" align="center" sx={{ mb: 8, color: 'text.primary', fontFamily: 'Playfair Display', fontWeight: 'bold', fontSize: '2.5rem' }}>
          {t.specialists}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
          {t.specialistsList.map((spec, i) => (
            <Paper key={i} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CardMedia component="img" image={spec.img} alt={`Мастер массажа - ${spec.name}`} sx={{ height: 400, borderRadius: 0, mb: 3, objectFit: 'cover' }} />
              <Typography variant="h3" sx={{ fontFamily: 'Playfair Display', fontSize: '1.5rem', fontWeight: 600, color: 'text.primary', mb: 1 }}>
                {spec.name}
              </Typography>
              <Typography variant="body2" color="secondary" sx={{ fontWeight: 'bold', mb: 2 }}>{spec.age} | {spec.experience}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>{spec.desc}</Typography>
            </Paper>
          ))}
        </Box>
      </Container>

      <Dialog 
        open={openMassageModal} 
        onClose={() => setOpenMassageModal(false)}
        maxWidth="xs"
        fullWidth
        sx={{
          '& .MuiPaper-root': { borderRadius: 0, p: 4, bgcolor: 'background.paper', border: '1px solid rgba(128,128,128,0.2)' }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontFamily: 'Playfair Display', fontWeight: 'bold', fontSize: '1.8rem', pb: 2 }}>
          {isRu ? 'Запись на массаж' : 'Book Massage'}
        </DialogTitle>
        <DialogContent>
          {massageAlert && (
            <Alert severity={massageAlert.type} sx={{ borderRadius: 0, mb: 3 }}>
              {massageAlert.text}
            </Alert>
          )}

          <Box component="form" onSubmit={handleBookMassage}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Выбор специалиста */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>
                  {isRu ? 'ВЫБЕРИТЕ СПЕЦИАЛИСТА' : 'SELECT SPECIALIST'}
                </Typography>
                <Select
                  fullWidth
                  value={selectedSpecialist}
                  onChange={(e) => setSelectedSpecialist(e.target.value)}
                  sx={{ borderRadius: 0 }}
                >
                  <MenuItem value={1} disabled={specialistStatus.find(s => s.id === 1)?.isOccupied}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <Typography variant="body2">{isRu ? 'Алия Шарапова' : 'Alia Sharapova'}</Typography>
                      <Chip 
                        size="small" 
                        label={specialistStatus.find(s => s.id === 1)?.isOccupied ? (isRu ? 'Занят' : 'Occupied') : (isRu ? 'Свободен' : 'Free')} 
                        color={specialistStatus.find(s => s.id === 1)?.isOccupied ? 'error' : 'success'} 
                        sx={{ borderRadius: 0, fontSize: '0.75rem', height: 20 }}
                      />
                    </Box>
                  </MenuItem>
                  <MenuItem value={2} disabled={specialistStatus.find(s => s.id === 2)?.isOccupied}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <Typography variant="body2">{isRu ? 'Карина Воробьева' : 'Karina Vorobieva'}</Typography>
                      <Chip 
                        size="small" 
                        label={specialistStatus.find(s => s.id === 2)?.isOccupied ? (isRu ? 'Занят' : 'Occupied') : (isRu ? 'Свободен' : 'Free')} 
                        color={specialistStatus.find(s => s.id === 2)?.isOccupied ? 'error' : 'success'} 
                        sx={{ borderRadius: 0, fontSize: '0.75rem', height: 20 }}
                      />
                    </Box>
                  </MenuItem>
                  <MenuItem value={3} disabled={specialistStatus.find(s => s.id === 3)?.isOccupied}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <Typography variant="body2">{isRu ? 'Даниил Царев' : 'Daniil Tsarev'}</Typography>
                      <Chip 
                        size="small" 
                        label={specialistStatus.find(s => s.id === 3)?.isOccupied ? (isRu ? 'Занят' : 'Occupied') : (isRu ? 'Свободен' : 'Free')} 
                        color={specialistStatus.find(s => s.id === 3)?.isOccupied ? 'error' : 'success'} 
                        sx={{ borderRadius: 0, fontSize: '0.75rem', height: 20 }}
                      />
                    </Box>
                  </MenuItem>
                </Select>
              </Box>

              {/* Выбор даты с блокировкой дат */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>
                  {isRu ? 'ВЫБЕРИТЕ ДАТУ' : 'SELECT DATE'}
                </Typography>
                <input 
                  type="date" 
                  required
                  min={tomorrowStr}
                  value={massageDate} 
                  aria-label={isRu ? 'Выбрать дату записи на массаж' : 'Select massage date'}
                  onChange={handleDateChange}
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', outline: 'none', background: 'transparent', color: 'inherit' }} 
                />
              </Box>

              {/* Выбор времени */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>
                  {isRu ? 'ВЫБЕРИТЕ ВРЕМЯ' : 'SELECT TIME'}
                </Typography>
                <Select
                  fullWidth
                  value={massageTime}
                  onChange={(e) => setMassageTime(e.target.value)}
                  sx={{ borderRadius: 0 }}
                >
                  <MenuItem value="09:00">09:00</MenuItem>
                  <MenuItem value="11:00">11:00</MenuItem>
                  <MenuItem value="14:00">14:00</MenuItem>
                  <MenuItem value="16:00">16:00</MenuItem>
                  <MenuItem value="18:00">18:00</MenuItem>
                </Select>
              </Box>

              <Divider />

              <Typography variant="h5" align="center" color="secondary" sx={{ fontWeight: 'bold' }}>
                {isRu ? 'К оплате:' : 'Total:'} {formatPrice(1200, currency, lang)}
              </Typography>

              <Button 
                type="submit" 
                variant="contained" 
                fullWidth 
                sx={{ bgcolor: '#c1a37f', color: 'white', py: 1.8, fontWeight: 'bold', borderRadius: 0, '&:hover': { bgcolor: '#a68a64' } }}
              >
                {isRu ? 'ОПЛАТИТЬ И ЗАПИСАТЬСЯ' : 'PAY & BOOK'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}