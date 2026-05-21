import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, Container, Typography, Paper, Tab, Tabs, TextField, 
  Button, Divider, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Skeleton, Alert, Select, MenuItem, FormControlLabel, Switch, Dialog, DialogTitle, DialogContent 
} from '@mui/material';
import { formatPrice } from '../utils/price';

export default function ProfilePage({ t, currency, lang, user, setUser }) {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState('profile');
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
  const [profileData, setProfileData] = useState({ firstName: '', lastName: '', phone: '', country: '' });
  const [cardNumber, setCardNumber] = useState('');
  const [expireDate, setExpireDate] = useState('');
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);

  // Стейты задач и уборок
  const [cleaningStatus, setCleaningStatus] = useState([]); 
  const [employeeTasks, setEmployeeTasks] = useState({ schedules: [], assignedCleanings: [] }); 
  const [adminTasks, setAdminTasks] = useState({ cleaningRequests: [], schedules: [] }); 

  const guestsLog = [
    { firstName: 'Александр', lastName: 'Солоткин', room: 'Пентхаус №12', dates: '20.05.2026 — 28.05.2026', status: 'Проживает' },
    { firstName: 'Мария', lastName: 'Смирнова', room: 'Люкс №305', dates: '18.05.2026 — 25.05.2026', status: 'Проживает' },
    { firstName: 'Дмитрий', lastName: 'Кузнецов', room: 'Бизнес №201', dates: '19.05.2026 — 22.05.2026', status: 'Выселен' }
  ];

  const inputStyle = {
    '& .MuiOutlinedInput-root': { borderRadius: 0 }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        navigate('/');
      } else {
        setProfileData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          phone: user.phone || '',
          country: user.country || ''
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

      if (user.role === 'Admin') {
        const usersRes = await axios.get('http://localhost:3003/api/auth/admin/users');
        setAdminUsers(usersRes.data);
        
        const adminTasksRes = await axios.get('http://localhost:3003/api/auth/admin/tasks');
        setAdminTasks(adminTasksRes.data);
      }

      if (user.role === 'Guest') {
        const cleaningRes = await axios.get('http://localhost:3003/api/auth/cleaning/status');
        setCleaningStatus(cleaningRes.data);
      }

      if (user.role === 'Employee' || user.role === 'Admin') {
        const employeeTasksRes = await axios.get('http://localhost:3003/api/auth/employee/tasks');
        setEmployeeTasks(employeeTasksRes.data);
      }

      setLoading(false);
    } catch (error) {
      console.error(error);
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
      setAlert({ type: 'success', text: 'Профиль успешно сохранен!' });
    } catch (err) {
      setAlert({ type: 'error', text: 'Ошибка при сохранении' });
    }
  };

  const handleRefill = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(refillAmount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAlert({ type: 'error', text: 'Пожалуйста, введите корректное число больше нуля' });
      return;
    }

    if (cvc.length !== 3 || isNaN(parseInt(cvc))) {
      setAlert({ type: 'error', text: 'Неверный формат CVV/CVC кода (3 цифры)' });
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
      setAlert({ type: 'success', text: 'Баланс успешно пополнен!' });
      loadUserData();
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.error || 'Ошибка пополнения' });
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (cardNumber.length !== 16) {
      setAlert({ type: 'error', text: 'Номер карты должен состоять из 16 цифр' });
      return;
    }

    try {
      await axios.post('http://localhost:3003/api/auth/cards', { cardNumber, expireDate });
      setCardNumber('');
      setExpireDate('');
      setAlert({ type: 'success', text: 'Карта успешно привязана!' });
      loadUserData();
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.error || 'Ошибка привязки' });
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await axios.delete(`http://localhost:3003/api/auth/cards/${cardId}`);
      setAlert({ type: 'success', text: 'Карта успешно удалена' });
      setUseLinkedCard(false);
      loadUserData();
    } catch (err) {
      setAlert({ type: 'error', text: 'Ошибка удаления карты' });
    }
  };

  const handleLinkGoogle = async () => {
    try {
      await axios.put('http://localhost:3003/api/auth/google/link');
      setUser({ ...user, google_linked: true });
      setAlert({ type: 'success', text: 'Google аккаунт привязан' });
    } catch (err) {
      setAlert({ type: 'error', text: 'Ошибка привязки' });
    }
  };

  const handleLinkGoogleAndRedirect = async () => {
    try {
      const response = await axios.get('http://localhost:3003/api/auth/google/url');
      window.location.href = response.data.url;
    } catch (err) {
      setAlert({ type: 'error', text: 'Сервис привязки недоступен' });
    }
  };

  const handleUnlinkGoogle = async () => {
    try {
      await axios.put('http://localhost:3003/api/auth/google/unlink');
      setUser({ ...user, google_linked: false, google_email: '' });
      setAlert({ type: 'success', text: 'Google аккаунт успешно отвязан!' });
    } catch (err) {
      setAlert({ type: 'error', text: 'Ошибка отвязки Google аккаунта' });
    }
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      await axios.put(`http://localhost:3003/api/auth/admin/users/${targetUserId}/role`, { role: newRole });
      setAlert({ type: 'success', text: 'Роль успешно изменена!' });
      loadUserData();
    } catch (err) {
      setAlert({ type: 'error', text: 'Ошибка изменения роли' });
    }
  };

  const handleRequestCleaning = async () => {
    try {
      await axios.post('http://localhost:3003/api/auth/cleaning/request');
      setAlert({ type: 'success', text: 'Уборка запрошена! Задача отправлена сотрудникам.' });
      loadUserData();
    } catch (err) {
      setAlert({ type: 'error', text: 'Ошибка отправки запроса' });
    }
  };

  const handleUpdateTaskStatus = async (taskId, currentStatus, isCleaning) => {
    const nextStatus = currentStatus === 'Pending' || currentStatus === 'Assigned' ? 'InProgress' : 'Completed';
    try {
      await axios.put(`http://localhost:3003/api/auth/employee/tasks/${taskId}/status`, {
        status: nextStatus,
        isCleaningRequest: isCleaning
      });
      setAlert({ type: 'success', text: 'Статус задачи успешно обновлен!' });
      loadUserData();
    } catch (err) {
      setAlert({ type: 'error', text: 'Ошибка обновления задачи' });
    }
  };

  const handleAssignEmployee = async (taskId, employeeId) => {
    try {
      await axios.post('http://localhost:3003/api/auth/admin/tasks/assign', { taskId, employeeId });
      setAlert({ type: 'success', text: 'Задача назначена сотруднику!' });
      loadUserData();
    } catch (err) {
      setAlert({ type: 'error', text: 'Ошибка назначения' });
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

  return (
    <Box sx={{ pt: 22, pb: 10 }}>
      <Container maxWidth="xl">
        <Typography variant="h2" sx={{ fontFamily: 'Playfair Display', mb: 4 }}>Личный кабинет</Typography>

        {alert && <Alert severity={alert.type} sx={{ borderRadius: 0, mb: 4 }} onClose={() => setAlert(null)}>{alert.text}</Alert>}

        <Paper sx={{ borderRadius: 0, mb: 6 }}>
          <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} textColor="primary" indicatorColor="primary">
            <Tab label="Профиль" value="profile" sx={{ fontWeight: 'bold' }} />
            {(user?.role === 'Guest' || user?.role === 'Admin') && <Tab label="Баланс & Карты" value="balance" sx={{ fontWeight: 'bold' }} />}
            {(user?.role === 'Guest' || user?.role === 'Admin') && <Tab label="Активные брони" value="active" sx={{ fontWeight: 'bold' }} />}
            {(user?.role === 'Guest' || user?.role === 'Admin') && <Tab label="История транзакций" value="transactions" sx={{ fontWeight: 'bold' }} />}
            {(user?.role === 'Employee' || user?.role === 'Admin') && <Tab label="Задачи & Расписание" value="employee_tasks" sx={{ fontWeight: 'bold' }} />}
            {(user?.role === 'Employee' || user?.role === 'Admin') && <Tab label="Учет постояльцев" value="guests_log" sx={{ fontWeight: 'bold' }} />}
            {user?.role === 'Admin' && <Tab label="Админ-панель" value="admin" sx={{ fontWeight: 'bold' }} />}
          </Tabs>
        </Paper>

        {/* --- ВКЛАДКА 1: ДАННЫЕ ПРОФИЛЯ --- */}
        {tabValue === 'profile' && (
          <Paper sx={{ p: 5, borderRadius: 0 }}>
            <Box component="form" onSubmit={handleSaveProfile}>
              <Typography variant="h5" sx={{ mb: 4, fontFamily: 'Playfair Display', fontWeight: 'bold' }}>Личные данные</Typography>
              
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                gap: 4, 
                mb: 4 
              }}>
                <TextField fullWidth label="Имя" value={profileData.firstName} onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })} sx={inputStyle} />
                <TextField fullWidth label="Фамилия" value={profileData.lastName} onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })} sx={inputStyle} />
                <TextField fullWidth label="Телефон" value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} sx={inputStyle} />
                <TextField fullWidth label="Страна проживания" value={profileData.country} onChange={(e) => setProfileData({ ...profileData, country: e.target.value })} sx={inputStyle} />
              </Box>

              <Box sx={{ p: 3, mb: 4, bgcolor: 'background.default', border: '1px solid rgba(128,128,128,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2"><b>Роль в системе:</b> {user?.role === 'User' ? 'Пользователь' : user?.role === 'Guest' ? 'Постоялец' : user?.role}</Typography>
                <Box>
                  {user?.google_linked ? (
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: 'green', fontWeight: 'bold' }}>Google Account привязан ({user?.google_email || user?.email})</Typography>
                      <Button variant="outlined" color="error" size="small" onClick={handleUnlinkGoogle} sx={{ borderRadius: 0 }}>Отвязать Google Account</Button>
                    </Box>
                  ) : (
                    <Button variant="outlined" onClick={handleLinkGoogleAndRedirect} size="small" sx={{ borderRadius: 0 }}>Привязать Google Account</Button>
                  )}
                </Box>
              </Box>

              <Button type="submit" variant="contained" sx={{ bgcolor: '#c1a37f', color: 'white', borderRadius: 0 }}>СОХРАНИТЬ ИЗМЕНЕНИЯ</Button>
            </Box>
          </Paper>
        )}

        {/* --- ВКЛАДКА 2: БАЛАНС И КАРТЫ --- */}
        {tabValue === 'balance' && (user?.role === 'Guest' || user?.role === 'Admin') && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' }, gap: 6 }}>
            <Paper sx={{ p: 5, borderRadius: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
              <Typography variant="h5" sx={{ mb: 2, fontFamily: 'Playfair Display' }}>Текущий баланс</Typography>
              <Typography variant="h2" color="secondary" sx={{ fontWeight: 'bold', mb: 4 }}>{formatPrice(user?.balance, currency, lang)}</Typography>
              
              <Button variant="contained" onClick={() => setOpenRefillModal(true)} sx={{ bgcolor: '#c1a37f', color: 'white', py: 2, px: 6, borderRadius: 0 }}>
                ПОПОЛНИТЬ БАЛАНС
              </Button>
            </Paper>

            <Paper sx={{ p: 5, borderRadius: 0 }}>
              <Typography variant="h5" sx={{ mb: 4, fontFamily: 'Playfair Display' }}>Привязанная Карта</Typography>
              {cards.map(c => (
                <Box key={c.id} sx={{ p: 2, mb: 2, border: '1px solid rgba(128,128,128,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography>•••• •••• •••• {c.lastFour} (Карта привязана)</Typography>
                  <Button size="small" color="error" onClick={() => handleDeleteCard(c.id)}>Удалить</Button>
                </Box>
              ))}

              {cards.length === 0 && (
                <Box component="form" onSubmit={handleAddCard} sx={{ mt: 2, display: 'grid', gap: 3 }}>
                  <TextField fullWidth label="Номер карты (16 цифр)" value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))} sx={inputStyle} />
                  <TextField fullWidth placeholder="MM/YY" value={expireDate} onChange={(e) => setExpireDate(e.target.value.replace(/[^\d/]/g, '').slice(0, 5))} sx={inputStyle} />
                  <Button type="submit" variant="outlined" sx={{ width: '100%', borderRadius: 0 }}>Привязать карту</Button>
                </Box>
              )}
            </Paper>
          </Box>
        )}

        {/* --- ВКЛАДКА 3: АКТИВНЫЕ УСЛУГИ --- */}
        {tabValue === 'active' && (user?.role === 'Guest' || user?.role === 'Admin') && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.5fr 1fr' }, gap: 6 }}>
            <Paper sx={{ p: 5, borderRadius: 0 }}>
              <Typography variant="h5" sx={{ mb: 4, fontFamily: 'Playfair Display', fontWeight: 'bold' }}>Активные услуги</Typography>
              <Box sx={{ p: 4, border: '1px solid rgba(128,128,128,0.2)', mb: 4 }}>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>Номер: ПЕНТХАУС SIGNATURE</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Класс: Пентхаус | Даты: 20.05.2026 — 28.05.2026</Typography>
                <Chip label="Активен" color="success" sx={{ borderRadius: 0, mt: 2 }} />
              </Box>
              <Divider sx={{ my: 4 }} />
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>Включено в проживание:</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 4 }}>
                <Typography variant="body2">✔ Бассейн и термальные зоны SPA</Typography>
                <Typography variant="body2">✔ Всё включено (завтрак, обед, ужин)</Typography>
                <Typography variant="body2">✔ 42 часа доступа в игровую Cyberzone</Typography>
                <Typography variant="body2">✔ Парковочное место Сектор VIP, место №12</Typography>
              </Box>

              <Divider sx={{ my: 4 }} />

              <Button variant="contained" onClick={handleRequestCleaning} sx={{ bgcolor: '#002F6C', color: 'white', py: 2, borderRadius: 0 }}>
                Запросить уборку в номере
              </Button>
            </Paper>

            <Paper sx={{ p: 5, borderRadius: 0 }}>
              <Typography variant="h5" sx={{ mb: 4, fontFamily: 'Playfair Display' }}>Запросы на уборку</Typography>
              {cleaningStatus.map(req => (
                <Box key={req.id} sx={{ p: 2, mb: 2, border: '1px solid rgba(128,128,128,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2">Запрос от {new Date(req.created_at).toLocaleDateString()}</Typography>
                    {req.status === 'Completed' && (
                      <Typography variant="caption" sx={{ color: 'green', display: 'block', mt: 0.5, fontWeight: 'bold' }}>
                        Выполнено в: {new Date(req.updated_at || req.created_at).toLocaleTimeString()} ({new Date(req.updated_at || req.created_at).toLocaleDateString()})
                      </Typography>
                    )}
                  </Box>
                  <Chip 
                    label={req.status === 'Pending' ? 'Ожидает' : req.status === 'Assigned' ? 'Назначено' : req.status === 'InProgress' ? 'В процессе' : 'Выполнено'} 
                    color={req.status === 'Pending' ? 'warning' : req.status === 'Assigned' ? 'primary' : req.status === 'InProgress' ? 'secondary' : 'success'}
                    sx={{ borderRadius: 0 }}
                  />
                </Box>
              ))}
            </Paper>
          </Box>
        )}

        {/* --- ВКЛАДКА 4: ИСТОРИЯ ТРАНЗАКЦИЙ --- */}
        {tabValue === 'transactions' && (user?.role === 'Guest' || user?.role === 'Admin') && (
          <TableContainer component={Paper} sx={{ borderRadius: 0 }}>
            <Table>
              <TableHead sx={{ bgcolor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Тип</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Сумма</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Дата</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Описание</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tRow) => (
                  <TableRow key={tRow.id} hover>
                    <TableCell><Chip label={tRow.type === 'REFILL' ? 'Пополнение' : 'Списание'} color={tRow.type === 'REFILL' ? 'success' : 'error'} sx={{ borderRadius: 0 }} /></TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{tRow.type === 'REFILL' ? '+' : '-'} {formatPrice(parseFloat(tRow.amount), currency, lang)}</TableCell>
                    <TableCell>{new Date(tRow.created_at).toLocaleString()}</TableCell>
                    <TableCell>{tRow.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* --- ВКЛАДКА 5: ЗАДАЧИ СОТРУДНИКА --- */}
        {tabValue === 'employee_tasks' && (user?.role === 'Employee' || user?.role === 'Admin') && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
            <Paper sx={{ p: 5, borderRadius: 0 }}>
              <Typography variant="h5" sx={{ mb: 4, fontFamily: 'Playfair Display' }}>Мои Задачи на сегодня</Typography>
              {employeeTasks.assignedCleanings.length > 0 ? employeeTasks.assignedCleanings.map(task => {
                const isFreeTask = task.status === 'Pending' && !task.assigned_employee_id;
                return (
                  <Box key={task.id} sx={{ p: 3, mb: 2, border: '1px solid rgba(128,128,128,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">
                        {isFreeTask ? `Свободная задача на уборку` : `Уборка: Номер ${task.roomNumber} (${task.roomType})`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Сектор: VIP | Статус: {task.status}</Typography>
                    </Box>
                    <Button 
                      variant="contained" 
                      size="small" 
                      onClick={() => handleUpdateTaskStatus(task.id, task.status, true)}
                      disabled={task.status === 'Completed'}
                      sx={{ bgcolor: isFreeTask ? '#002F6C' : '#c1a37f', borderRadius: 0 }}
                    >
                      {isFreeTask ? 'Взять себе' : task.status === 'InProgress' ? 'Выполнено' : 'Завершено'}
                    </Button>
                  </Box>
                );
              }) : (
                <Typography color="text.secondary">На сегодня задач на уборку не назначено.</Typography>
              )}
            </Paper>
          </Box>
        )}

        {/* --- ВКЛАДКА 6: УЧЕТ ПОСТОЯЛЬЦЕВ --- */}
        {tabValue === 'guests_log' && (user?.role === 'Employee' || user?.role === 'Admin') && (
          <Paper sx={{ p: 5, borderRadius: 0 }}>
            <Typography variant="h5" sx={{ mb: 4, fontFamily: 'Playfair Display', fontWeight: 'bold' }}>Учет постояльцев</Typography>
            <TableContainer component={Paper} sx={{ borderRadius: 0 }}>
              <Table>
                <TableHead sx={{ bgcolor: 'primary.main' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Имя</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Фамилия</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Номер комнаты</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Даты проживания</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Статус</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {guestsLog.map((guest, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{guest.firstName}</TableCell>
                      <TableCell>{guest.lastName}</TableCell>
                      <TableCell>{guest.room}</TableCell>
                      <TableCell>{guest.dates}</TableCell>
                      <TableCell>
                        <Chip label={guest.status} color={guest.status === 'Проживает' ? 'success' : 'default'} sx={{ borderRadius: 0 }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* --- ВКЛАДКА 7: АДМИН-ПАНЕЛЬ --- */}
        {tabValue === 'admin' && user?.role === 'Admin' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
            <Paper sx={{ p: 5, borderRadius: 0 }}>
              <Typography variant="h5" sx={{ mb: 4, fontFamily: 'Playfair Display', fontWeight: 'bold' }}>Управление пользователями</Typography>
              <TableContainer component={Paper} sx={{ borderRadius: 0 }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'primary.main' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Пользователь</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Баланс</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Текущая роль</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Действие</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {adminUsers.map(u => (
                      <TableRow key={u.id}>
                        <TableCell>{u.first_name} {u.last_name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{formatPrice(u.balance, currency, lang)}</TableCell>
                        <TableCell><Chip label={u.role} color="primary" sx={{ borderRadius: 0 }} /></TableCell>
                        <TableCell>
                          <Select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} size="small" sx={{ borderRadius: 0, minWidth: 150 }}>
                            <MenuItem value="User">Пользователь (User)</MenuItem>
                            <MenuItem value="Guest">Постоялец (Guest)</MenuItem>
                            <MenuItem value="Employee">Сотрудник (Employee)</MenuItem>
                            <MenuItem value="Admin">Администратор (Admin)</MenuItem>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper sx={{ p: 5, borderRadius: 0 }}>
              <Typography variant="h5" sx={{ mb: 4, fontFamily: 'Playfair Display', fontWeight: 'bold' }}>Распределение задач</Typography>
              {adminTasks.cleaningRequests.filter(req => req.status === 'Pending').length > 0 ? (
                adminTasks.cleaningRequests.filter(req => req.status === 'Pending').map(req => (
                  <Box key={req.id} sx={{ p: 3, mb: 2, border: '1px solid rgba(128,128,128,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1">Запрос убоки комнаты №{req.roomNumber} ({req.roomType})</Typography>
                    <Button 
                      variant="contained" 
                      onClick={() => handleAssignEmployee(req.id, user.id)}
                      sx={{ bgcolor: '#c1a37f', borderRadius: 0 }}
                    >
                      Назначить на меня
                    </Button>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">Нет нераспределенных запросов на уборку.</Typography>
              )}
            </Paper>
          </Box>
        )}
      </Container>

      {/* --- МОДАЛЬНОЕ ОКНО ПОПОЛНЕНИЯ БАЛАНСА --- */}
      <Dialog 
        open={openRefillModal} 
        onClose={() => setOpenRefillModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 0, p: 4, bgcolor: 'background.paper', border: '1px solid rgba(128,128,128,0.2)' }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontFamily: 'Playfair Display', fontWeight: 'bold', fontSize: '1.8rem', pb: 2 }}>
          Пополнение баланса
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleRefill}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>
                  СУММА ПОПОЛНЕНИЯ (₽)
                </Typography>
                <TextField required fullWidth type="number" placeholder="e.g. 5000" value={refillAmount} onChange={(e) => setRefillAmount(e.target.value)} sx={inputStyle} />
              </Box>

              {cards.length > 0 ? (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>
                    СПОСОБ ОПЛАТЫ
                  </Typography>
                  <Select fullWidth value={useLinkedCard} onChange={(e) => setUseLinkedCard(e.target.value)} sx={{ borderRadius: 0 }}>
                    <MenuItem value={true}>Привязанная карта (•••• {cards[0].lastFour})</MenuItem>
                    <MenuItem value={false}>Использовать другую карту</MenuItem>
                  </Select>
                </Box>
              ) : null}

              {!useLinkedCard ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>
                      НОМЕР КАРТЫ
                    </Typography>
                    <TextField required fullWidth placeholder="16 цифр без пробелов" value={newCardNumber} onChange={(e) => setNewCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))} sx={inputStyle} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>
                      СРОК ДЕЙСТВИЯ
                    </Typography>
                    <TextField required fullWidth placeholder="MM/YY" value={newExpireDate} onChange={(e) => setNewExpireDate(e.target.value.replace(/[^\d/]/g, '').slice(0, 5))} sx={inputStyle} />
                  </Box>
                </Box>
              ) : null}

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1 }}>
                  КОД CVC/CVV
                </Typography>
                <TextField required fullWidth type="password" placeholder="***" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))} sx={inputStyle} />
              </Box>

              <Button type="submit" variant="contained" fullWidth sx={{ bgcolor: '#c1a37f', color: 'white', py: 1.8, fontWeight: 'bold', borderRadius: 0, '&:hover': { bgcolor: '#a68a64' } }}>
                ОПЛАТИТЬ {refillAmount ? `${refillAmount} ₽` : ''}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}