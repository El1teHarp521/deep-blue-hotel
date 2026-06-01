import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, Container, Typography, Paper, Tab, Tabs, TextField, 
  Button, Divider, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Skeleton, Alert, Select, MenuItem, Dialog, DialogTitle, DialogContent 
} from '@mui/material';
import { formatPrice } from '../utils/price';

export default function ProfilePage({ t, currency, lang, user, setUser }) {
  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(() => {
    return localStorage.getItem('profileActiveTab') || 'profile';
  });

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Стейты пополнения баланса
  const [openRefillModal, setOpenRefillModal] = useState(false);
  const [refillAmount, setRefillAmount] = useState('');
  const [cvc, setCvc] = useState('');
  const [useLinkedCard, setUseLinkedCard] = useState(false);

  // Свойства новой карты при пополнении
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newExpireDate, setNewExpireDate] = useState('');

  // Личные данные и привязанные карты
  const [profileData, setProfileData] = useState({ firstName: '', lastName: '', phone: '', country: 'Россия' });
  const [cardNumber, setCardNumber] = useState('');
  const [expireDate, setExpireDate] = useState('');
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);

  // Реальные данные активного бронирования и купленных услуг
  const [activeBooking, setActiveBooking] = useState(null);
  const [myServices, setMyServices] = useState([]); 
  const [myMassages, setMyMassages] = useState([]);  

  // Стейты задач и уборок
  const [cleaningStatus, setCleaningStatus] = useState([]); 
  const [employeeTasks, setEmployeeTasks] = useState({ schedules: [], assignedCleanings: [] }); 
  const [adminTasks, setAdminTasks] = useState({ cleaningRequests: [], schedules: [] }); 

  // Реальные данные постояльцев из базы данных
  const [guestsLog, setGuestsLog] = useState([]);

  // Стейты для административного управления отелем
  const [adminRooms, setAdminRooms] = useState([]);
  const [adminBookings, setAdminBookings] = useState([]);

  const inputStyle = {
    '& .MuiOutlinedInput-root': { borderRadius: 0 }
  };

  useEffect(() => {
    if (user) {
      const allowedTabs = ['profile'];
      if (user.role === 'Guest' || user.role === 'Admin') {
        allowedTabs.push('balance', 'active', 'transactions');
      }
      if (user.role === 'Employee' || user.role === 'Admin') {
        allowedTabs.push('employee_tasks', 'guests_log');
      }
      if (user.role === 'Admin') {
        allowedTabs.push('admin');
      }

      if (!allowedTabs.includes(tabValue)) {
        setTabValue('profile');
        localStorage.setItem('profileActiveTab', 'profile');
      }
    }
  }, [user, tabValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        navigate('/');
      } else {
        setProfileData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          phone: user.phone || '',
          country: user.country || 'Россия'
        });
        loadUserData();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    try {
      const cardsRes = await axios.get('http://localhost:3003/api/auth/cards');
      setCards(cardsRes.data);
      if (cardsRes.data.length > 0) setUseLinkedCard(true);

      const transRes = await axios.get('http://localhost:3003/api/auth/transactions');
      setTransactions(transRes.data);

      const bookingRes = await axios.get('http://localhost:3001/api/bookings/active');
      if (bookingRes.data.hasBooking) {
        setActiveBooking(bookingRes.data);
      }

      const servicesRes = await axios.get('http://localhost:3003/api/auth/services/my');
      setMyServices(servicesRes.data);

      const massagesRes = await axios.get('http://localhost:3003/api/auth/massage/my');
      setMyMassages(massagesRes.data);

      if (user.role === 'Admin') {
        const usersRes = await axios.get('http://localhost:3003/api/auth/admin/users');
        setAdminUsers(usersRes.data);
        
        const adminTasksRes = await axios.get('http://localhost:3003/api/auth/admin/tasks');
        setAdminTasks(adminTasksRes.data);

        // Загрузка комнат и всех бронирований для админа
        const roomsRes = await axios.get('http://localhost:3001/api/rooms');
        setAdminRooms(roomsRes.data);

        const bookingsRes = await axios.get('http://localhost:3001/api/admin/bookings');
        setAdminBookings(bookingsRes.data);
      }

      if (user.role === 'Guest' || user.role === 'Admin') {
        const cleaningRes = await axios.get('http://localhost:3003/api/auth/cleaning/status');
        setCleaningStatus(cleaningRes.data);
      }

      if (user.role === 'Employee' || user.role === 'Admin') {
        const employeeTasksRes = await axios.get('http://localhost:3003/api/auth/employee/tasks');
        setEmployeeTasks(employeeTasksRes.data);

        // Получение реального списка постояльцев с сервера
        const guestsRes = await axios.get('http://localhost:3003/api/auth/employee/guests');
        setGuestsLog(guestsRes.data);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:3003/api/auth/profile', {
        fullName: `${profileData.firstName} ${profileData.lastName}`,
        phone: profileData.phone,
        country: profileData.country
      });
      setUser({ ...user, ...profileData, fullName: `${profileData.firstName} ${profileData.lastName}` });
      setAlert({ type: 'success', text: lang === 'RU' ? 'Профиль успешно сохранен!' : 'Profile saved successfully!' });
    } catch (err) {
      setAlert({ type: 'error', text: 'Error saving profile' });
    }
  };

  const handleRefill = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(refillAmount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAlert({ type: 'error', text: lang === 'RU' ? 'Введите корректное число' : 'Please enter a valid amount' });
      return;
    }

    if (cvc.length !== 3 || isNaN(parseInt(cvc))) {
      setAlert({ type: 'error', text: lang === 'RU' ? 'Неверный CVV (3 цифры)' : 'Invalid CVV (3 digits)' });
      return;
    }

    try {
      const res = await axios.post('http://localhost:3003/api/auth/refill', {
        amount: parsedAmount,
        cvc: cvc,
        useLinkedCard: useLinkedCard,
        cardNumber: useLinkedCard ? undefined : newCardNumber,
        expireDate: useLinkedCard ? undefined : newExpireDate
      });
      
      setUser({ ...user, balance: res.data.newBalance });
      setRefillAmount('');
      setCvc('');
      setNewCardNumber('');
      setNewExpireDate('');
      setOpenRefillModal(false);
      setAlert({ type: 'success', text: lang === 'RU' ? 'Баланс успешно пополнен!' : 'Balance topped up successfully!' });
      loadUserData();
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.error || 'Ошибка пополнения' });
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (cardNumber.length !== 16) {
      setAlert({ type: 'error', text: 'Card number must be 16 digits' });
      return;
    }

    try {
      await axios.post('http://localhost:3003/api/auth/cards', { cardNumber, expireDate });
      setCardNumber('');
      setExpireDate('');
      setAlert({ type: 'success', text: lang === 'RU' ? 'Карта привязана!' : 'Card linked successfully!' });
      loadUserData();
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.error || 'Ошибка привязки' });
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await axios.delete(`http://localhost:3003/api/auth/cards/${cardId}`);
      setAlert({ type: 'success', text: lang === 'RU' ? 'Карта удалена' : 'Card unlinked' });
      setUseLinkedCard(false);
      loadUserData();
    } catch (err) {
      setAlert({ type: 'error', text: 'Error unlinking card' });
    }
  };

  const handlePayDebt = async () => {
    if (!activeBooking) return;
    try {
      const response = await axios.post('http://localhost:3003/api/auth/bookings/pay-debt', {
        bookingId: activeBooking.bookingId,
        amount: activeBooking.price
      });
      if (response.data.success) {
        setUser({ ...user, balance: response.data.newBalance });
        setAlert({ type: 'success', text: lang === 'RU' ? 'Задолженность успешно погашена!' : 'Debt paid successfully!' });
        loadUserData();
      }
    } catch (error) {
      setAlert({ type: 'error', text: error.response?.data?.error || 'Ошибка списания долга' });
    }
  };

  const handleLinkGoogle = async () => {
    try {
      await axios.put('http://localhost:3003/api/auth/google/link');
      setUser({ ...user, google_linked: true });
      setAlert({ type: 'success', text: 'Google Linked!' });
    } catch (err) {
      setAlert({ type: 'error', text: 'Error linking Google' });
    }
  };

  const handleLinkGoogleAndRedirect = async () => {
    try {
      const response = await axios.get('http://localhost:3003/api/auth/google/url');
      window.location.href = response.data.url;
    } catch (err) {
      setAlert({ type: 'error', text: 'Google service unavailable' });
    }
  };

  const handleUnlinkGoogle = async () => {
    try {
      await axios.put('http://localhost:3003/api/auth/google/unlink');
      setUser({ ...user, google_linked: false, google_email: '' });
      setAlert({ type: 'success', text: lang === 'RU' ? 'Google аккаунт отвязан!' : 'Google account unlinked!' });
    } catch (err) {
      setAlert({ type: 'error', text: 'Error unlinking Google' });
    }
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      await axios.put(`http://localhost:3003/api/auth/admin/users/${targetUserId}/role`, { role: newRole });
      setAlert({ type: 'success', text: 'Role updated!' });
      loadUserData();
    } catch (err) {
      setAlert({ type: 'error', text: 'Error changing role' });
    }
  };

  const handleRequestCleaning = async () => {
    try {
      await axios.post('http://localhost:3003/api/auth/cleaning/request');
      setAlert({ type: 'success', text: lang === 'RU' ? 'Уборка запрошена!' : 'Cleaning requested! Task assigned to employees.' });
      loadUserData();
    } catch (err) {
      setAlert({ type: 'error', text: 'Error requesting cleaning' });
    }
  };

  const handleUpdateTaskStatus = async (taskId, currentStatus, isCleaning) => {
    const nextStatus = currentStatus === 'Pending' || currentStatus === 'Assigned' ? 'InProgress' : 'Completed';
    try {
      await axios.put(`http://localhost:3003/api/auth/employee/tasks/${taskId}/status`, {
        status: nextStatus,
        isCleaningRequest: isCleaning
      });
      setAlert({ type: 'success', text: 'Task status updated!' });
      loadUserData();
    } catch (err) {
      setAlert({ type: 'error', text: 'Error updating task' });
    }
  };

  const handleAssignEmployee = async (taskId, employeeId) => {
    try {
      await axios.post('http://localhost:3003/api/auth/admin/tasks/assign', { taskId, employeeId });
      setAlert({ type: 'success', text: 'Employee assigned!' });
      loadUserData();
    } catch (err) {
      setAlert({ type: 'error', text: 'Error assigning task' });
    }
  };
  const handleCancelMassage = async (massageId) => {
    const confirm = window.confirm(lang === 'RU' ? 'Вы действительно хотите отменить запись на массаж? 1 200 ₽ будут возвращены на ваш баланс.' : 'Do you want to cancel this massage session? 1,200 ₽ will be refunded to your balance.');
    if (!confirm) return;
    try {
      const res = await axios.delete(`http://localhost:3003/api/auth/massage/my/${massageId}`);
      setUser({ ...user, balance: res.data.newBalance });
      setAlert({ type: 'success', text: res.data.message });
      loadUserData();
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.error || 'Error cancelling massage' });
    }
  };

  // пдмин функционал
  const handleUpdateRoomPrice = async (roomId, currentPrice) => {
    const newPrice = prompt(lang === 'RU' ? 'Введите новую цену номера (₽):' : 'Enter new price for the room:', currentPrice);
    if (newPrice === null || isNaN(parseFloat(newPrice))) return;
    try {
      await axios.put(`http://localhost:3001/api/admin/rooms/${roomId}`, { price: parseFloat(newPrice) });
      setAlert({ type: 'success', text: lang === 'RU' ? 'Цена номера успешно изменена!' : 'Room price updated successfully!' });
      loadUserData();
    } catch (err) {
      setAlert({ type: 'error', text: 'Error updating room price' });
    }
  };

  const handleUpdateRoomStatus = async (roomId, newStatus) => {
    try {
      await axios.put(`http://localhost:3001/api/admin/rooms/${roomId}`, { status: newStatus });
      setAlert({ type: 'success', text: lang === 'RU' ? 'Статус номера изменен!' : 'Room status updated!' });
      loadUserData();
    } catch (err) {
      setAlert({ type: 'error', text: 'Error updating room status' });
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const confirm = window.confirm(lang === 'RU' ? 'Вы уверены, что хотите снять бронь / выселить этого гостя?' : 'Are you sure you want to cancel this booking and checkout the guest?');
    if (!confirm) return;
    try {
      await axios.put(`http://localhost:3001/api/admin/bookings/${bookingId}/status`, { booking_status: 'Cancelled' });
      setAlert({ type: 'success', text: lang === 'RU' ? 'Бронирование успешно отменено!' : 'Booking successfully cancelled!' });
      loadUserData();
    } catch (err) {
      setAlert({ type: 'error', text: 'Error cancelling booking' });
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    const confirm = window.confirm(lang === 'RU' ? 'ВНИМАНИЕ! Вы действительно хотите ПОЛНОСТЬЮ удалить эту запись бронирования из базы данных?' : 'WARNING! Are you sure you want to COMPLETELY delete this booking record?');
    if (!confirm) return;
    try {
      await axios.delete(`http://localhost:3001/api/admin/bookings/${bookingId}`);
      setAlert({ type: 'success', text: lang === 'RU' ? 'Запись бронирования удалена из базы данных!' : 'Booking record deleted successfully!' });
      loadUserData();
    } catch (err) {
      setAlert({ type: 'error', text: 'Error deleting booking record' });
    }
  };

  // Вычисление динамического статуса номера (Свободен / Занят / Обслуживание)
  const getRoomStatusLabel = (room) => {
    if (room.status === 'Maintenance') {
      return lang === 'RU' ? 'Обслуживание' : 'Maintenance';
    }
    if (room.isOccupied) {
      return lang === 'RU' ? 'Занят (Проживают)' : 'Occupied';
    }
    return lang === 'RU' ? 'Свободен' : 'Available';
  };

  const getRoomStatusColor = (room) => {
    if (room.status === 'Maintenance') return 'warning';
    if (room.isOccupied) return 'error';
    return 'success';
  };

  const calculateTotalRevenue = () => {
    return adminBookings
      .filter(b => b.payment_status === 'Paid' && b.booking_status !== 'Cancelled')
      .reduce((acc, curr) => acc + parseFloat(curr.price || 0), 0);
  };

  const calculateOccupancyRate = () => {
    if (adminRooms.length === 0) return 0;
    const occupied = adminRooms.filter(r => r.isOccupied).length;
    return Math.round((occupied / adminRooms.length) * 100);
  };

  const getGroupedServices = () => {
    const grouped = [];
    myServices.forEach((srv) => {
      const existing = grouped.find(item => item.name === srv.name);
      if (existing) {
        existing.quantity += srv.quantity;
      } else {
        grouped.push({ ...srv });
      }
    });
    return grouped;
  };
  const handleExpireDateChange = (e) => {
    const val = e.target.value;
    const clean = val.replace(/\D/g, '');
    if (clean.length > 2) {
      setExpireDate(`${clean.slice(0, 2)}/${clean.slice(2, 4)}`);
    } else {
      setExpireDate(clean);
    }
  };
  const handleNewExpireDateChange = (e) => {
    const val = e.target.value;
    const clean = val.replace(/\D/g, '');
    if (clean.length > 2) {
      setNewExpireDate(`${clean.slice(0, 2)}/${clean.slice(2, 4)}`);
    } else {
      setNewExpireDate(clean);
    }
  };

  if (!user || loading) {
    return (
      <Container sx={{ pt: 25, pb: 10 }}>
        <Skeleton variant="rectangular" height={80} sx={{ mb: 4, borderRadius: 0 }} />
        <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 0 }} />
      </Container>
    );
  }

  const getIncludedPrivileges = (category) => {
    const privileges = {
      standard: [
        lang === 'RU' ? '✔ Бассейн и термальные зоны SPA' : '✔ SPA & thermal pool access',
        lang === 'RU' ? '✔ 2 часа доступа в игровую Cyberzone' : '✔ 2 hours of Cyberzone gaming'
      ],
      business: [
        lang === 'RU' ? '✔ Бассейн и термальные зоны SPA' : '✔ SPA & thermal pool access',
        lang === 'RU' ? '✔ Завтрак (шведский стол)' : '✔ Breakfast buffet included',
        lang === 'RU' ? '✔ 8 часов доступа в игровую Cyberzone' : '✔ 8 hours of Cyberzone gaming'
      ],
      lux: [
        lang === 'RU' ? '✔ Бассейн и бани в SPA-центре' : '✔ SPA Pools & Saunas access',
        lang === 'RU' ? '✔ Полный рацион питания (завтрак, обед, ужин)' : '✔ Full-board dining (breakfast, lunch, dinner)',
        lang === 'RU' ? '✔ 12 часов доступа в игровую Cyberzone' : '✔ 12 hours of Cyberzone gaming'
      ],
      penthouse: [
        lang === 'RU' ? '✔ Всё включено (Ultra All Inclusive)' : '✔ Ultra All Inclusive stays',
        lang === 'RU' ? '✔ 42 часа доступа в игровую Cyberzone' : '✔ 42 hours of Cyberzone gaming',
        lang === 'RU' ? '✔ Парковочное место Сектор VIP, место №12' : '✔ Private VIP Parking, spot #12'
      ]
    };
    return privileges[category] || privileges.standard;
  };

  const serviceTranslationMap = {
    breakfast: lang === 'RU' ? 'Завтрак' : 'Breakfast',
    lunch: lang === 'RU' ? 'Обед' : 'Lunch',
    dinner: lang === 'RU' ? 'Ужин' : 'Dinner',
    saunas: lang === 'RU' ? 'Бани в SPA' : 'SPA Saunas access',
    massage: lang === 'RU' ? 'Сеанс Массажа' : 'Massage Session',
    parking: lang === 'RU' ? 'Машинное место' : 'Parking Spot',
    cyber: lang === 'RU' ? 'Часы в Cyberzone' : 'Cyberzone Gaming Hours'
  };

  const getSpecialistName = (id) => {
    const names = {
      1: lang === 'RU' ? 'Алия Шарапова' : 'Alia Sharapova',
      2: lang === 'RU' ? 'Карина Воробьева' : 'Karina Vorobieva',
      3: lang === 'RU' ? 'Даниил Царев' : 'Daniil Tsarev'
    };
    return names[id] || 'Unknown';
  };

  return (
    <Box component="main" sx={{ pt: 22, pb: 10 }}>
      <Container maxWidth="xl">
        <Typography variant="h1" sx={{ fontSize: '3rem', fontWeight: 'bold', mb: 4, fontFamily: 'Playfair Display' }}>
          {t.cabinetTitle}
        </Typography>

        {alert && <Alert severity={alert.type} sx={{ borderRadius: 0, mb: 4 }} onClose={() => setAlert(null)}>{alert.text}</Alert>}

        <Paper sx={{ borderRadius: 0, mb: 6 }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, val) => {
              setTabValue(val);
              localStorage.setItem('profileActiveTab', val);
            }} 
            textColor="primary" 
            indicatorColor="primary"
          >
            <Tab label={t.tabProfile} value="profile" sx={{ fontWeight: 'bold' }} />
            {(user?.role === 'Guest' || user?.role === 'Admin') && <Tab label={t.tabBalance} value="balance" sx={{ fontWeight: 'bold' }} />}
            {(user?.role === 'Guest' || user?.role === 'Admin') && <Tab label={t.tabActive} value="active" sx={{ fontWeight: 'bold' }} />}
            {(user?.role === 'Guest' || user?.role === 'Admin') && <Tab label={t.tabHistory} value="transactions" sx={{ fontWeight: 'bold' }} />}
            {(user?.role === 'Employee' || user?.role === 'Admin') && <Tab label={t.tabEmployee} value="employee_tasks" sx={{ fontWeight: 'bold' }} />}
            {(user?.role === 'Employee' || user?.role === 'Admin') && <Tab label={t.tabGuests} value="guests_log" sx={{ fontWeight: 'bold' }} />}
            {user?.role === 'Admin' && <Tab label={t.tabAdmin} value="admin" sx={{ fontWeight: 'bold' }} />}
          </Tabs>
        </Paper>

        {/*  ВКЛАДКА 1: данные профиля  */}
        {tabValue === 'profile' && (
          <Paper sx={{ p: 5, borderRadius: 0 }}>
            <Box component="form" onSubmit={handleSaveProfile}>
              <Typography variant="h2" sx={{ fontSize: '1.5rem', mb: 4, fontFamily: 'Playfair Display', fontWeight: 'bold' }}>
                {t.personalData}
              </Typography>
              
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                gap: 4, 
                mb: 4 
              }}>
                <TextField fullWidth label={lang === 'RU' ? 'Имя' : 'First Name'} value={profileData.firstName} onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })} sx={inputStyle} />
                <TextField fullWidth label={lang === 'RU' ? 'Фамилия' : 'Last Name'} value={profileData.lastName} onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })} sx={inputStyle} />
                <TextField fullWidth label={lang === 'RU' ? 'Телефон' : 'Phone'} value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} sx={inputStyle} />
                
                {/* выбор страны из выпадающего списка */}
                <TextField 
                  select
                  fullWidth 
                  label={lang === 'RU' ? 'Страна проживания' : 'Country'} 
                  value={profileData.country} 
                  onChange={(e) => setProfileData({ ...profileData, country: e.target.value })} 
                  sx={inputStyle}
                >
                  <MenuItem value="Россия">{lang === 'RU' ? 'Россия' : 'Russia'}</MenuItem>
                  <MenuItem value="Беларусь">{lang === 'RU' ? 'Беларусь' : 'Belarus'}</MenuItem>
                  <MenuItem value="Казахстан">{lang === 'RU' ? 'Казахстан' : 'Kazakhstan'}</MenuItem>
                  <MenuItem value="ОАЭ">{lang === 'RU' ? 'ОАЭ' : 'UAE'}</MenuItem>
                  <MenuItem value="Турция">{lang === 'RU' ? 'Турция' : 'Turkey'}</MenuItem>
                  <MenuItem value="Китай">{lang === 'RU' ? 'Китай' : 'China'}</MenuItem>
                  <MenuItem value="Другая">{lang === 'RU' ? 'Другая страна' : 'Other Country'}</MenuItem>
                </TextField>
              </Box>

              <Box sx={{ p: 3, mb: 4, bgcolor: 'background.default', border: '1px solid rgba(128,128,128,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2"><b>{t.roleInSystem}:</b> {user?.role === 'User' ? t.roleUser : user?.role === 'Guest' ? t.roleGuest : user?.role}</Typography>
                <Box>
                  {user?.google_linked ? (
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: 'green', fontWeight: 'bold' }}>{t.googleStatusLinked} ({user?.google_email || user?.email})</Typography>
                      <Button variant="outlined" color="error" size="small" onClick={handleUnlinkGoogle} sx={{ borderRadius: 0 }}>{t.btnGoogleUnlink}</Button>
                    </Box>
                  ) : (
                    <Button variant="outlined" onClick={handleLinkGoogleAndRedirect} size="small" sx={{ borderRadius: 0 }}>{t.btnGoogleLink}</Button>
                  )}
                </Box>
              </Box>

              <Button type="submit" variant="contained" sx={{ bgcolor: '#c1a37f', color: 'white', borderRadius: 0 }}>{t.btnSave}</Button>
            </Box>
          </Paper>
        )}

        {/*  ВКЛАДКА 2: баланс и карты  */}
        {tabValue === 'balance' && (user?.role === 'Guest' || user?.role === 'Admin') && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' }, gap: 6 }}>
            <Paper sx={{ p: 5, borderRadius: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
              <Typography variant="h2" sx={{ fontSize: '1.5rem', mb: 2, fontFamily: 'Playfair Display', fontWeight: 'bold' }}>
                {t.currentBalance}
              </Typography>
              <Typography sx={{ fontSize: '2.5rem', fontWeight: 'bold', mb: 4, color: 'secondary.main' }}>
                {formatPrice(user?.balance, currency, lang)}
              </Typography>
              
              <Button variant="contained" onClick={() => setOpenRefillModal(true)} sx={{ bgcolor: '#c1a37f', color: 'white', py: 2, px: 6, borderRadius: 0 }}>
                {t.btnTopUp}
              </Button>
            </Paper>

            <Paper sx={{ p: 5, borderRadius: 0 }}>
              <Typography variant="h2" sx={{ fontSize: '1.5rem', mb: 4, fontFamily: 'Playfair Display', fontWeight: 'bold' }}>
                {lang === 'RU' ? 'Карты' : 'Linked Cards'}
              </Typography>
              {cards.map(c => (
                <Box key={c.id} sx={{ p: 2, mb: 2, border: '1px solid rgba(128,128,128,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography>•••• •••• •••• {c.lastFour} ({t.cardLinkedStatus})</Typography>
                  <Button size="small" color="error" onClick={() => handleDeleteCard(c.id)}>{t.cardDelete}</Button>
                </Box>
              ))}

              {cards.length === 0 && (
                <Box component="form" onSubmit={handleAddCard} sx={{ mt: 2, display: 'grid', gap: 3 }}>
                  <TextField fullWidth label={lang === 'RU' ? 'Номер карты (16 цифр)' : 'Card Number (16 digits)'} value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))} sx={inputStyle} />
                  <TextField fullWidth placeholder="MM/YY" value={expireDate} onChange={handleExpireDateChange} sx={inputStyle} />
                  
                  <Button type="submit" variant="outlined" sx={{ width: '100%', borderRadius: 0 }}>{t.cardAddBtn}</Button>
                </Box>
              )}
            </Paper>
          </Box>
        )}

        {/*  ВКЛАДКА 3: активные услуги  */}
        {tabValue === 'active' && (user?.role === 'Guest' || user?.role === 'Admin') && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
            <Paper sx={{ p: 5, borderRadius: 0 }}>
              <Typography variant="h2" sx={{ fontSize: '1.5rem', mb: 4, fontFamily: 'Playfair Display', fontWeight: 'bold' }}>
                {t.activeServicesTitle}
              </Typography>
              
              {activeBooking ? (
                <Box sx={{ p: 4, border: '1px solid rgba(128,128,128,0.2)', mb: 4 }}>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                    {lang === 'RU' ? `Номер: ${activeBooking.roomNumber} (${activeBooking.category.toUpperCase()})` : `Room: ${activeBooking.roomNumber} (${activeBooking.category.toUpperCase()})`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {lang === 'RU' ? `Даты: ${new Date(activeBooking.checkIn).toLocaleDateString()} — ${new Date(activeBooking.checkOut).toLocaleDateString()}` : `Dates: ${new Date(activeBooking.checkIn).toLocaleDateString()} — ${new Date(activeBooking.checkOut).toLocaleDateString()}`}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, mt: 2, alignItems: 'center' }}>
                    <Chip 
                      label={activeBooking.paymentStatus === 'Paid' ? (lang === 'RU' ? 'Оплачен' : 'Paid') : (lang === 'RU' ? 'Задолженность' : 'Debt')} 
                      color={activeBooking.paymentStatus === 'Paid' ? 'success' : 'error'} 
                      sx={{ borderRadius: 0 }} 
                    />
                    
                    {activeBooking.paymentStatus !== 'Paid' && (
                      <Button variant="contained" size="small" onClick={handlePayDebt} sx={{ bgcolor: '#002F6C', borderRadius: 0, color: 'white' }}>
                        {lang === 'RU' ? 'Погасить задолженность' : 'Pay Debt'}
                      </Button>
                    )}
                  </Box>
                </Box>
              ) : (
                <Typography sx={{ py: 4, color: 'text.secondary' }}>
                  {lang === 'RU' ? 'У вас нет активных бронирований.' : 'You have no active bookings.'}
                </Typography>
              )}
              
              <Divider sx={{ my: 4 }} />
              
              {activeBooking && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>{t.includedTitle}:</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.5, mb: 4 }}>
                    {getIncludedPrivileges(activeBooking.category).map((priv, idx) => (
                      <Typography key={idx} variant="body2">{priv}</Typography>
                    ))}
                  </Box>

                  {myServices.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                      <Divider sx={{ mb: 4 }} />
                      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: 'secondary.main' }}>
                        {lang === 'RU' ? 'Дополнительно приобретено:' : 'Additionally Purchased:'}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {getGroupedServices().map(srv => (
                          <Typography key={srv.id} variant="body2">
                            ✔ {serviceTranslationMap[srv.name] || srv.name} (x{srv.quantity}) — <span style={{ fontWeight: 'bold' }}>{formatPrice(srv.price * srv.quantity, currency, lang)}</span>
                          </Typography>
                        ))}
                        {myMassages.map(msg => (
                          <Box key={msg.id} sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2">
                              ✔ {lang === 'RU' ? `Запись на Массаж (Мастер: ${getSpecialistName(msg.specialist_id)})` : `Massage Session (Master: ${getSpecialistName(msg.specialist_id)})`} — {msg.date} в {msg.time}
                            </Typography>
                            <Button size="small" color="error" variant="outlined" onClick={() => handleCancelMassage(msg.id)} sx={{ borderRadius: 0, ml: 2 }}>
                              {lang === 'RU' ? 'Отменить' : 'Cancel'}
                            </Button>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Divider sx={{ my: 4 }} />
                  <Button variant="contained" onClick={handleRequestCleaning} sx={{ bgcolor: '#002F6C', color: 'white', py: 2, borderRadius: 0 }}>
                    {t.cleaningRequestBtn}
                  </Button>
                </Box>
              )}
            </Paper>

            {/* Статус уборки */}
            <Paper sx={{ p: 5, borderRadius: 0 }}>
              <Typography variant="h2" sx={{ fontSize: '1.5rem', mb: 4, fontFamily: 'Playfair Display', fontWeight: 'bold' }}>
                {lang === 'RU' ? 'Запросы на уборку' : 'Cleaning Requests'}
              </Typography>
              {cleaningStatus.map(req => (
                <Box key={req.id} sx={{ p: 2, mb: 2, border: '1px solid rgba(128,128,128,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2">{lang === 'RU' ? `Запрос от ${new Date(req.created_at).toLocaleDateString()}` : `Request from ${new Date(req.created_at).toLocaleDateString()}`}</Typography>
                    {req.status === 'Completed' && (
                      <Typography variant="caption" sx={{ color: 'green', display: 'block', mt: 0.5, fontWeight: 'bold' }}>
                        {lang === 'RU' ? 'Выполнено в' : 'Completed at'}: {new Date(req.updated_at || req.created_at).toLocaleTimeString()} ({new Date(req.updated_at || req.created_at).toLocaleDateString()})
                      </Typography>
                    )}
                  </Box>
                  <Chip 
                    label={req.status === 'Pending' ? t.cleaningStatusPending : req.status === 'Assigned' ? t.cleaningStatusAssigned : req.status === 'InProgress' ? t.cleaningStatusProgress : t.cleaningStatusCompleted} 
                    color={req.status === 'Pending' ? 'warning' : req.status === 'Assigned' ? 'primary' : req.status === 'InProgress' ? 'secondary' : 'success'}
                    sx={{ borderRadius: 0 }}
                  />
                </Box>
              ))}
            </Paper>
          </Box>
        )}

        {/*  ВКЛАДКА 4: история транзакций  */}
        {tabValue === 'transactions' && (user?.role === 'Guest' || user?.role === 'Admin') && (
          <TableContainer component={Paper} sx={{ borderRadius: 0 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#002F6C', '& .MuiTableCell-head': { bgcolor: '#002F6C', color: 'white', fontWeight: 'bold' } }}>
                <TableRow>
                  <TableCell>{t.transType}</TableCell>
                  <TableCell>{t.transAmount}</TableCell>
                  <TableCell>{t.transDate}</TableCell>
                  <TableCell>{t.transDesc}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tRow) => (
                  <TableRow key={tRow.id} hover>
                    <TableCell><Chip label={tRow.type === 'REFILL' ? t.transRefill : tRow.type === 'DEBT_PAY' ? (lang === 'RU' ? 'Оплата долга' : 'Pay Debt') : t.transWithdraw} color={tRow.type === 'REFILL' ? 'success' : 'error'} sx={{ borderRadius: 0 }} /></TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{tRow.type === 'REFILL' ? '+' : '-'} {formatPrice(parseFloat(tRow.amount), currency, lang)}</TableCell>
                    <TableCell>{new Date(tRow.created_at).toLocaleString()}</TableCell>
                    <TableCell>{tRow.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/*  ВКЛАДКА 5: задачи сотрудника */}
        {tabValue === 'employee_tasks' && (user?.role === 'Employee' || user?.role === 'Admin') && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
            <Paper sx={{ p: 5, borderRadius: 0 }}>
              <Typography variant="h2" sx={{ fontSize: '1.5rem', mb: 4, fontFamily: 'Playfair Display', fontWeight: 'bold' }}>
                {t.assignedTasksTitle}
              </Typography>
              {employeeTasks.assignedCleanings.length > 0 ? employeeTasks.assignedCleanings.map(task => {
                const isFreeTask = task.status === 'Pending' && !task.assigned_employee_id;
                return (
                  <Box key={task.id} sx={{ p: 3, mb: 2, border: '1px solid rgba(128,128,128,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">
                        {isFreeTask ? (lang === 'RU' ? `Свободный запрос: Уборка №${task.roomNumber} (${task.roomType})` : `Free Task: Cleaning Spot #${task.roomNumber} (${task.roomType})`) : (lang === 'RU' ? `Уборка: Номер ${task.roomNumber} (${task.roomType})` : `Cleaning: Room #${task.roomNumber} (${task.roomType})`)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Sector: VIP | Status: {task.status}</Typography>
                    </Box>
                    <Button 
                      variant="contained" 
                      size="small" 
                      onClick={() => handleUpdateTaskStatus(task.id, task.status, true)}
                      disabled={task.status === 'Completed'}
                      sx={{ bgcolor: isFreeTask ? '#002F6C' : '#c1a37f', borderRadius: 0 }}
                    >
                      {isFreeTask ? (lang === 'RU' ? 'Взять себе' : 'Claim Task') : task.status === 'InProgress' ? (lang === 'RU' ? 'Выполнено' : 'Complete') : (lang === 'RU' ? 'Завершено' : 'Finished')}
                    </Button>
                  </Box>
                );
              }) : (
                <Typography color="text.secondary">No tasks assigned for today.</Typography>
              )}
            </Paper>
            {employeeTasks.massageTasks && employeeTasks.massageTasks.length > 0 && (
              <Paper sx={{ p: 5, borderRadius: 0 }}>
                <Typography variant="h2" sx={{ fontSize: '1.5rem', mb: 3, fontWeight: 'bold', color: 'primary.main', fontFamily: 'Playfair Display' }}>
                  {lang === 'RU' ? 'Расписание сеансов массажа' : 'Massage Sessions Schedule'}
                </Typography>
                {employeeTasks.massageTasks.map(msg => (
                  <Box 
                    key={msg.id} 
                    sx={{ 
                      p: 3, 
                      mb: 2, 
                      borderRadius: 0, 
                      border: '1px solid rgba(128,128,128,0.2)', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      bgcolor: 'background.paper'
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {lang === 'RU' ? `Клиент: ${msg.clientName}` : `Client: ${msg.clientName}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {lang === 'RU' ? `Дата: ${msg.date} | Время: ${msg.time}` : `Date: ${msg.date} | Time: ${msg.time}`}
                      </Typography>
                      {user.role === 'Admin' && (
                        <Typography variant="caption" sx={{ color: 'secondary.main', display: 'block', mt: 0.5 }}>
                          {lang === 'RU' ? `Мастер: ${msg.specialistName}` : `Therapist: ${msg.specialistName}`}
                        </Typography>
                      )}
                    </Box>
                    <Chip label={lang === 'RU' ? 'Подтверждено' : 'Confirmed'} color="success" sx={{ borderRadius: 0 }} />
                  </Box>
                ))}
              </Paper>
            )}
          </Box>
        )}

        {/*  ВКЛАДКА 6: учет постояльцев  */}
        {tabValue === 'guests_log' && (user?.role === 'Employee' || user?.role === 'Admin') && (
          <Paper sx={{ p: 5, borderRadius: 0 }}>
            <Typography variant="h2" sx={{ fontSize: '1.5rem', mb: 4, fontFamily: 'Playfair Display', fontWeight: 'bold' }}>
              {t.guestLoggingTitle}
            </Typography>
            <TableContainer component={Paper} sx={{ borderRadius: 0 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#002F6C', '& .MuiTableCell-head': { bgcolor: '#002F6C', color: 'white', fontWeight: 'bold' } }}>
                  <TableRow>
                    <TableCell>{lang === 'RU' ? 'Имя' : 'First Name'}</TableCell>
                    <TableCell>{lang === 'RU' ? 'Фамилия' : 'Last Name'}</TableCell>
                    <TableCell>{lang === 'RU' ? 'Номер комнаты' : 'Room Number'}</TableCell>
                    <TableCell>{lang === 'RU' ? 'Даты проживания' : 'Stay Dates'}</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {guestsLog.map((guest, idx) => (
                    <TableRow key={guest.id || idx}>
                      <TableCell>{guest.firstName}</TableCell>
                      <TableCell>{guest.lastName}</TableCell>
                      <TableCell>{guest.room}</TableCell>
                      <TableCell>{guest.dates}</TableCell>
                      <TableCell>
                        <Chip 
                          label={lang === 'RU' ? guest.statusRU : guest.statusEN} 
                          color={
                            guest.statusRU === 'Проживает' 
                              ? 'success' 
                              : guest.statusRU === 'Выселен' 
                              ? 'default' 
                              : 'primary'
                          } 
                          sx={{ borderRadius: 0 }} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/*  ВКЛАДКА 7: админ панель  */}
        {tabValue === 'admin' && user?.role === 'Admin' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
            {/* Аналитический Дашборд отеля */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, gap: 3 }}>
              <Paper sx={{ p: 4, borderRadius: 0, border: '1px solid rgba(128,128,128,0.2)', bgcolor: 'background.paper' }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', letterSpacing: 1.5, display: 'block', mb: 1 }}>
                  {lang === 'RU' ? 'ОБЩАЯ ВЫРУЧКА' : 'TOTAL REVENUE'}
                </Typography>
                <Typography sx={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'secondary.main', fontFamily: 'Playfair Display' }}>
                  {formatPrice(calculateTotalRevenue(), currency, lang)}
                </Typography>
              </Paper>

              <Paper sx={{ p: 4, borderRadius: 0, border: '1px solid rgba(128,128,128,0.2)', bgcolor: 'background.paper' }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', letterSpacing: 1.5, display: 'block', mb: 1 }}>
                  {lang === 'RU' ? 'ЗАГРУЗКА ОТЕЛЯ' : 'OCCUPANCY RATE'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'primary.main', fontFamily: 'Playfair Display' }}>
                    {calculateOccupancyRate()}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lang === 'RU' ? `(${adminRooms.filter(r => r.isOccupied).length} из ${adminRooms.length} ном.)` : `(${adminRooms.filter(r => r.isOccupied).length} of ${adminRooms.length} rms)`}
                  </Typography>
                </Box>
              </Paper>

              <Paper sx={{ p: 4, borderRadius: 0, border: '1px solid rgba(128,128,128,0.2)', bgcolor: 'background.paper' }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', letterSpacing: 1.5, display: 'block', mb: 1 }}>
                  {lang === 'RU' ? 'АКТИВНЫЕ ПОСТОЯЛЬЦЫ' : 'ACTIVE GUESTS'}
                </Typography>
                <Typography sx={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'primary.main', fontFamily: 'Playfair Display' }}>
                  {adminBookings.filter(b => b.booking_status === 'Confirmed').length}
                </Typography>
              </Paper>

              <Paper sx={{ p: 4, borderRadius: 0, border: '1px solid rgba(128,128,128,0.2)', bgcolor: 'background.paper' }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', letterSpacing: 1.5, display: 'block', mb: 1 }}>
                  {lang === 'RU' ? 'ЗАДАЧИ НА УБОРКУ' : 'PENDING CLEANINGS'}
                </Typography>
                <Typography sx={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'error.main', fontFamily: 'Playfair Display' }}>
                  {adminTasks.cleaningRequests ? adminTasks.cleaningRequests.filter(r => r.status === 'Pending').length : 0}
                </Typography>
              </Paper>
            </Box>

            {/* Карточка 1: Управление пользователями */}
            <Paper sx={{ p: 5, borderRadius: 0 }}>
              <Typography variant="h2" sx={{ fontSize: '1.5rem', mb: 4, fontFamily: 'Playfair Display', fontWeight: 'bold' }}>
                {t.userManagementTitle}
              </Typography>
              <TableContainer component={Paper} sx={{ borderRadius: 0, maxHeight: 300 }}>
                <Table stickyHeader>
                  <TableHead sx={{ bgcolor: '#002F6C', '& .MuiTableCell-head': { bgcolor: '#002F6C', color: 'white', fontWeight: 'bold' } }}>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Balance</TableCell>
                      <TableCell>Current Role</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {adminUsers.map(u => (
                      <TableRow key={u.id} hover>
                        <TableCell>{u.first_name} {u.last_name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{formatPrice(u.balance, currency, lang)}</TableCell>
                        <TableCell><Chip label={u.role} color="primary" sx={{ borderRadius: 0 }} /></TableCell>
                        <TableCell>
                          <Select 
                            value={u.role} 
                            onChange={(e) => handleRoleChange(u.id, e.target.value)} 
                            size="small" 
                            inputProps={{ 'aria-label': 'Изменить роль пользователя' }}
                            sx={{ borderRadius: 0, minWidth: 150 }}
                          >
                            <MenuItem value="User">User</MenuItem>
                            <MenuItem value="Guest">Guest</MenuItem>
                            <MenuItem value="Employee">Employee</MenuItem>
                            <MenuItem value="Admin">Admin</MenuItem>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Карточка 2: Управление номерным фондом  */}
            <Paper sx={{ p: 5, borderRadius: 0 }}>
              <Typography variant="h2" sx={{ fontSize: '1.5rem', mb: 4, fontFamily: 'Playfair Display', fontWeight: 'bold' }}>
                {lang === 'RU' ? 'Управление отелем (Цены и статусы номеров)' : 'Hotel Rooms Management (Prices & Statuses)'}
              </Typography>
              <TableContainer component={Paper} sx={{ borderRadius: 0, maxHeight: 350 }}>
                <Table stickyHeader>
                  <TableHead sx={{ bgcolor: '#002F6C', '& .MuiTableCell-head': { bgcolor: '#002F6C', color: 'white', fontWeight: 'bold' } }}>
                    <TableRow>
                      <TableCell>{lang === 'RU' ? 'Номер' : 'Room Number'}</TableCell>
                      <TableCell>{lang === 'RU' ? 'Категория' : 'Category'}</TableCell>
                      <TableCell>{lang === 'RU' ? 'Текущая цена за ночь' : 'Price per Night'}</TableCell>
                      <TableCell>{lang === 'RU' ? 'Статус' : 'Status'}</TableCell>
                      <TableCell>{lang === 'RU' ? 'Действия' : 'Actions'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {adminRooms.map(room => (
                      <TableRow key={room.id} hover>
                        <TableCell sx={{ fontWeight: 'bold' }}>{room.room_number}</TableCell>
                        <TableCell>{room.category.toUpperCase()}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {formatPrice(parseFloat(room.price), currency, lang)}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getRoomStatusLabel(room)} 
                            color={getRoomStatusColor(room)} 
                            sx={{ borderRadius: 0 }} 
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            <Button variant="outlined" size="small" onClick={() => handleUpdateRoomPrice(room.id, room.price)} sx={{ borderRadius: 0 }}>
                              {lang === 'RU' ? 'Изменить цену' : 'Edit Price'}
                            </Button>
                            <Select 
                              value={room.status} 
                              onChange={(e) => handleUpdateRoomStatus(room.id, e.target.value)} 
                              size="small" 
                              inputProps={{ 'aria-label': 'Изменить статус номера' }}
                              sx={{ borderRadius: 0, minWidth: 120 }}
                            >
                              <MenuItem value="Available">{lang === 'RU' ? 'Свободен' : 'Available'}</MenuItem>
                              <MenuItem value="Maintenance">{lang === 'RU' ? 'Обслуживание' : 'Maintenance'}</MenuItem>
                            </Select>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Карточка 3: Управление бронированиями и постояльцами */}
            <Paper sx={{ p: 5, borderRadius: 0 }}>
              <Typography variant="h2" sx={{ fontSize: '1.5rem', mb: 4, fontFamily: 'Playfair Display', fontWeight: 'bold' }}>
                {lang === 'RU' ? 'Управление бронированиями и постояльцами' : 'Stay & Bookings Management'}
              </Typography>
              <TableContainer component={Paper} sx={{ borderRadius: 0, maxHeight: 350 }}>
                <Table stickyHeader>
                  <TableHead sx={{ bgcolor: '#002F6C', '& .MuiTableCell-head': { bgcolor: '#002F6C', color: 'white', fontWeight: 'bold' } }}>
                    <TableRow>
                      <TableCell>{lang === 'RU' ? 'Постоялец / Гость' : 'Guest'}</TableCell>
                      <TableCell>{lang === 'RU' ? 'Номер' : 'Room'}</TableCell>
                      <TableCell>{lang === 'RU' ? 'Кол-во гостей' : 'Guests'}</TableCell>
                      <TableCell>{lang === 'RU' ? 'Даты заселения' : 'Stay Dates'}</TableCell>
                      <TableCell>{lang === 'RU' ? 'Оплата' : 'Payment'}</TableCell>
                      <TableCell>{lang === 'RU' ? 'Статус брони' : 'Status'}</TableCell>
                      <TableCell>{lang === 'RU' ? 'Действия' : 'Actions'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {adminBookings.map(b => (
                      <TableRow key={b.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{b.guestName}</Typography>
                          <Typography variant="caption" color="text.secondary">{b.guestEmail}</Typography>
                        </TableCell>
                        <TableCell>{b.roomCategory.toUpperCase()} №{b.roomNumber}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{b.guests_count || 1}</TableCell>
                        <TableCell>
                          {new Date(b.check_in).toLocaleDateString()} — {new Date(b.check_out).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={b.payment_status === 'Paid' ? (lang === 'RU' ? 'Оплачено' : 'Paid') : (lang === 'RU' ? 'Долг' : 'Unpaid')} 
                            color={b.payment_status === 'Paid' ? 'success' : 'error'} 
                            sx={{ borderRadius: 0 }} 
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={b.booking_status === 'Confirmed' ? (lang === 'RU' ? 'Активно' : 'Active') : (lang === 'RU' ? 'Отменено/Выселен' : 'Cancelled')} 
                            color={b.booking_status === 'Confirmed' ? 'success' : 'default'} 
                            sx={{ borderRadius: 0 }} 
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {b.booking_status === 'Confirmed' && (
                              <Button variant="contained" size="small" color="error" onClick={() => handleCancelBooking(b.id)} sx={{ borderRadius: 0 }}>
                                {lang === 'RU' ? 'Выселить' : 'Checkout'}
                              </Button>
                            )}
                            <Button variant="outlined" size="small" color="error" onClick={() => handleDeleteBooking(b.id)} sx={{ borderRadius: 0 }}>
                              {lang === 'RU' ? 'Удалить запись' : 'Delete Record'}
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Карточка 4: Распределение задач на уборку */}
            <Paper sx={{ p: 5, borderRadius: 0 }}>
              <Typography variant="h5" sx={{ mb: 4, fontFamily: 'Playfair Display', fontWeight: 'bold' }}>{t.taskAssignTitle}</Typography>
              {adminTasks.cleaningRequests.filter(req => req.status === 'Pending').length > 0 ? (
                adminTasks.cleaningRequests.filter(req => req.status === 'Pending').map(req => (
                  <Box key={req.id} sx={{ p: 3, mb: 2, border: '1px solid rgba(128,128,128,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1">{lang === 'RU' ? `Запрос уборки комнаты №${req.roomNumber} (${req.roomType})` : `Cleaning Request Room #${req.roomNumber} (${req.roomType})`}</Typography>
                    <Button 
                      variant="contained" 
                      onClick={() => handleAssignEmployee(req.id, user.id)}
                      sx={{ bgcolor: '#c1a37f', borderRadius: 0 }}
                    >
                      {t.assignToMe}
                    </Button>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">No pending cleaning tasks available.</Typography>
              )}
            </Paper>
          </Box>
        )}
      </Container>

      {/* мпополнение баланса (модальное окно) */}
      <Dialog 
        open={openRefillModal} 
        onClose={() => setOpenRefillModal(false)}
        maxWidth="xs"
        fullWidth
        sx={{
          '& .MuiPaper-root': { borderRadius: 0, p: 4, bgcolor: 'background.paper', border: '1px solid rgba(128,128,128,0.2)' }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontFamily: 'Playfair Display', fontWeight: 'bold', fontSize: '1.8rem', pb: 2 }}>
          {lang === 'RU' ? 'Пополнение баланса' : 'Top Up Balance'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleRefill}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>
                  {lang === 'RU' ? 'СУММА ПОПОЛНЕНИЯ (₽)' : 'TOP UP AMOUNT'}
                </Typography>
                <TextField required fullWidth type="number" placeholder="e.g. 5000" value={refillAmount} onChange={(e) => setRefillAmount(e.target.value)} sx={inputStyle} />
              </Box>

              {cards.length > 0 ? (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>
                    {lang === 'RU' ? 'СПОСОБ ОПЛАТЫ' : 'PAYMENT METHOD'}
                  </Typography>
                  <Select 
                    fullWidth 
                    value={useLinkedCard} 
                    onChange={(e) => setUseLinkedCard(e.target.value)} 
                    inputProps={{ 'aria-label': 'Выбрать способ оплаты' }}
                    sx={{ borderRadius: 0 }}
                  >
                    <MenuItem value={true}>{lang === 'RU' ? `Привязанная карта (•••• ${cards[0].lastFour})` : `Linked Card (•••• ${cards[0].lastFour})`}</MenuItem>
                    <MenuItem value={false}>{lang === 'RU' ? 'Использовать другую карту' : 'Use another card'}</MenuItem>
                  </Select>
                </Box>
              ) : null}

              {!useLinkedCard ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>
                      {lang === 'RU' ? 'НОМЕР КАРТЫ' : 'CARD NUMBER'}
                    </Typography>
                    <TextField required fullWidth placeholder="16 digits" value={newCardNumber} onChange={(e) => setNewCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))} sx={inputStyle} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>
                      {lang === 'RU' ? 'СРОК ДЕЙСТВИЯ' : 'EXPIRATION DATE'}
                    </Typography>
                    <TextField required fullWidth placeholder="MM/YY" value={newExpireDate} onChange={handleNewExpireDateChange} sx={inputStyle} />
                  </Box>
                </Box>
              ) : null}

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>
                  CVC/CVV
                </Typography>
                <TextField required fullWidth type="password" placeholder="***" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))} sx={inputStyle} />
              </Box>

              <Button type="submit" variant="contained" fullWidth sx={{ bgcolor: '#c1a37f', color: 'white', py: 1.8, fontWeight: 'bold', borderRadius: 0, '&:hover': { bgcolor: '#a68a64' } }}>
                {lang === 'RU' ? `ОПЛАТИТЬ ${refillAmount ? `${refillAmount} ₽` : ''}` : `PAY ${refillAmount ? `${refillAmount} ₽` : ''}`}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}