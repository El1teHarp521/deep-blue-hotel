const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());


// рейт лиммитер (ограничение запросов) 
const rateLimits = new Map();

const rateLimiter = (limitCount = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!rateLimits.has(ip)) {
      rateLimits.set(ip, []);
    }

    let timestamps = rateLimits.get(ip);
    timestamps = timestamps.filter(time => now - time < windowMs);

    if (timestamps.length >= limitCount) {
      return res.status(429).json({ error: 'Слишком много запросов с вашего IP. Пожалуйста, попробуйте позже.' });
    }

    timestamps.push(now);
    rateLimits.set(ip, timestamps);
    next();
  };
};


// мидлавры двух токенов (ACCESS + REFRESH)

const handleRefresh = async (req, res, next, refreshToken) => {
  if (!refreshToken) {
    return res.status(401).json({ error: 'Сессия истекла. Пожалуйста, авторизуйтесь заново.' });
  }

  try {
    const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_2026');
    const user = await prisma.users.findUnique({ where: { id: decodedRefresh.userId } });

    if (!user || user.is_blocked) {
      return res.status(403).json({ error: 'Пользователь не найден или заблокирован.' });
    }

    // Выписываем новый Access-токен на 15 минут
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.role, role: user.role }, 
      process.env.JWT_SECRET || 'super_secret_deep_blue_resort_key_2026', 
      { expiresIn: '15m' }
    );

    res.cookie('deepblue_access', newAccessToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 15 * 60 * 1000, 
      sameSite: 'lax' 
    });

    req.user = { userId: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Необходима повторная авторизация.' });
  }
};

const authenticateToken = (req, res, next) => {
  const accessToken = req.cookies.deepblue_access || req.headers['authorization']?.split(' ')[1];
  const refreshToken = req.cookies.deepblue_refresh;

  if (!accessToken) {
    return handleRefresh(req, res, next, refreshToken);
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'super_secret_deep_blue_resort_key_2026');
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return handleRefresh(req, res, next, refreshToken);
    }
    return res.status(403).json({ error: 'Сессия недействительна' });
  }
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    next();
  };
};

// настройки swagger (OPENAPI 3.0)
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'DeepBlue Ultimate API Document',
      version: '1.0.0',
      description: 'Документация всех эндпоинтов системы DeepBlue: авторизация, профиль, платежи, админ-панель, задачи и уборка',
      contact: { name: 'Lead Architect DeepBlue' }
    },
    servers: [{ url: 'http://localhost:3003' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Введите ваш JWT-токен сессии для авторизации protected routes'
        }
      }
    }
  },
  apis: [path.join(__dirname, 'index.js')] 
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// валидаторы
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^\+?[1-9]\d{1,14}$/.test(phone) && phone.length >= 10;

const mapCleaningRequest = (req) => {
  const roomMap = {
    '00000000-0000-0000-0000-000000000101': { number: '101', type: 'Стандарт' },
    '00000000-0000-0000-0000-000000000102': { number: '201', type: 'Бизнес' },
    '00000000-0000-0000-0000-000000000103': { number: '305', type: 'Люкс' },
    '00000000-0000-0000-0000-000000000104': { number: '502', type: 'Пентхаус' }
  };
  const room = roomMap[req.room_id] || { number: '502', type: 'Пентхаус' };
  return {
    ...req,
    roomNumber: room.number,
    roomType: room.type
  };
};

async function seedAdditionalServices() {
  try {
    const count = await prisma.additionalServices.count();
    if (count === 0) {
      await prisma.additionalServices.createMany({
        data: [
          { name: 'breakfast', price: 3100 },
          { name: 'lunch', price: 7200 },
          { name: 'dinner', price: 5400 },
          { name: 'saunas', price: 7800 },
          { name: 'massage', price: 1200 },
          { name: 'parking', price: 3700 },
          { name: 'cyber', price: 210 }
        ]
      });
      console.log('🌱 Дополнительные услуги успешно загружены в базу данных!');
    }
  } catch (error) {
    console.error('Ошибка сиддинга услуг:', error);
  }
}


// авторизация и регистрация

app.post('/api/auth/register', rateLimiter(15, 15 * 60 * 1000), async (req, res) => {
  const { email, password, firstName, lastName, phone, country } = req.body;

  if (!validateEmail(email)) return res.status(400).json({ error: 'Неверный формат Email' });
  if (!validatePhone(phone)) return res.status(400).json({ error: 'Неверный формат телефона' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Пароль должен быть от 6 символов' });

  try {
    const existingEmail = await prisma.users.findUnique({ where: { email } });
    if (existingEmail) return res.status(400).json({ error: 'Этот Email уже зарегистрирован' });

    const existingPhone = await prisma.users.findFirst({ where: { phone } });
    if (existingPhone) return res.status(400).json({ error: 'Этот номер телефона уже занят' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.users.create({
      data: { email, password_hash: passwordHash, first_name: firstName, last_name: lastName, phone, country, role: 'User' }
    });

    //  двух токенов
    const accessToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'super_secret_deep_blue_resort_key_2026', { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_2026', { expiresIn: '7d' });

    res.cookie('deepblue_access', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000, sameSite: 'lax' });
    res.cookie('deepblue_refresh', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });

    res.status(201).json({ success: true, user: { id: user.id, email: user.email, fullName: `${user.first_name} ${user.last_name}`, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', rateLimiter(15, 15 * 60 * 1000), async (req, res) => {
  const { loginInput, password } = req.body;

  try {
    const user = await prisma.users.findFirst({
      where: { OR: [{ email: loginInput }, { phone: loginInput }] }
    });

    if (!user) return res.status(400).json({ error: 'Пользователь не найден' });
    if (user.is_blocked) return res.status(403).json({ error: 'Ваш аккаунт заблокирован' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Неверный пароль' });

    //  двух токенов
    const accessToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'super_secret_deep_blue_resort_key_2026', { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_2026', { expiresIn: '7d' });

    res.cookie('deepblue_access', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000, sameSite: 'lax' });
    res.cookie('deepblue_refresh', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });

    res.json({ success: true, user: { id: user.id, email: user.email, fullName: `${user.first_name} ${user.last_name}`, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', rateLimiter(100, 15 * 60 * 1000), authenticateToken, async (req, res) => {
  try {
    const user = await prisma.users.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ isAuthenticated: false });

    res.json({
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: `${user.first_name} ${user.last_name}`,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone.startsWith('google_') ? '' : user.phone,
        country: user.country || '',
        balance: parseFloat(user.balance),
        google_linked: user.google_linked,
        google_email: user.google_email || ''
      }
    });
  } catch (error) {
    res.status(401).json({ isAuthenticated: false });
  }
});

app.put('/api/auth/profile', rateLimiter(50, 15 * 60 * 1000), authenticateToken, async (req, res) => {
  const { fullName, phone, country } = req.body;
  const names = fullName ? fullName.split(' ') : [];
  try {
    const updatedUser = await prisma.users.update({
      where: { id: req.user.userId },
      data: { first_name: names[0] || '', last_name: names[1] || '', phone, country }
    });
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('deepblue_access');
  res.clearCookie('deepblue_refresh');
  res.json({ success: true });
});


// связка и отвязка GOOGLE OAUTH


app.get('/api/auth/google/url', (req, res) => {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'].join(' ')
  };
  res.json({ url: `${rootUrl}?${new URLSearchParams(options).toString()}` });
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  const tokenFromCookie = req.cookies.deepblue_access;

  if (!code) return res.status(400).send('Код Google не найден');

  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    const { id_token, access_token } = tokenResponse.data;
    const googleUserResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      { headers: { Authorization: `Bearer ${id_token}` } }
    );

    const { id: googleId, email: googleEmail, name } = googleUserResponse.data;

    if (tokenFromCookie) {
      const decoded = jwt.verify(tokenFromCookie, process.env.JWT_SECRET || 'super_secret_deep_blue_resort_key_2026');
      const googleIdInUse = await prisma.users.findUnique({ where: { google_id: googleId } });
      if (googleIdInUse && googleIdInUse.id !== decoded.userId) {
        return res.status(400).send('Этот Google-аккаунт уже привязан к другому пользователю!');
      }

      await prisma.users.update({
        where: { id: decoded.userId },
        data: { google_linked: true, google_id: googleId, google_email: googleEmail }
      });

      return res.redirect(`${process.env.FRONTEND_URL}/profile`);
    }

    let user = await prisma.users.findUnique({ where: { google_id: googleId } });

    if (!user) {
      user = await prisma.users.findUnique({ where: { email: googleEmail } });

      if (user) {
        user = await prisma.users.update({
          where: { id: user.id },
          data: { google_linked: true, google_id: googleId, google_email: googleEmail }
        });
      } else {
        const names = name.split(' ');
        user = await prisma.users.create({
          data: { 
            email: googleEmail, 
            first_name: names[0] || 'Google', 
            last_name: names[1] || 'User', 
            password_hash: 'google_oauth_bypass', 
            phone: `google_${Date.now()}`,
            role: 'Guest', 
            google_linked: true,
            google_id: googleId,
            google_email: googleEmail
          }
        });
      }
    }

    if (user.is_blocked) return res.status(403).send('Ваш аккаунт заблокирован');

    const accessToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'super_secret_deep_blue_resort_key_2026', { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_2026', { expiresIn: '7d' });

    res.cookie('deepblue_access', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000, sameSite: 'lax' });
    res.cookie('deepblue_refresh', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    res.redirect(process.env.FRONTEND_URL);

  } catch (error) {
    res.status(500).send('Ошибка привязки / авторизации Google');
  }
});

app.put('/api/auth/google/unlink', authenticateToken, async (req, res) => {
  try {
    await prisma.users.update({
      where: { id: req.user.userId },
      data: { google_linked: false, google_id: null, google_email: null }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// карты и платежи

app.post('/api/auth/cards', rateLimiter(20, 15 * 60 * 1000), authenticateToken, async (req, res) => {
  const { cardNumber, expireDate } = req.body;
  if (!cardNumber || cardNumber.length !== 16) return res.status(400).json({ error: 'Неверный номер карты' });

  try {
    const last4 = cardNumber.slice(-4);
    const token = `tok_secure_${Math.random().toString(36).substr(2, 9)}`;
    const card = await prisma.linkedCards.create({ data: { user_id: req.user.userId, last4, token, expire_date: expireDate } });
    res.json({ success: true, card });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/cards', authenticateToken, async (req, res) => {
  try {
    const cards = await prisma.linkedCards.findMany({ where: { user_id: req.user.userId } });
    res.json(cards.map(c => ({ id: c.id, lastFour: c.last4 })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/auth/cards/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.linkedCards.deleteMany({ where: { id: req.params.id, user_id: req.user.userId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/refill', rateLimiter(15, 15 * 60 * 1000), authenticateToken, async (req, res) => {
  const { amount, cvc, useLinkedCard, cardNumber, expireDate } = req.body;
  const parsedAmount = parseFloat(amount);

  if (isNaN(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ error: 'Сумма пополнения должна быть числом больше нуля' });
  if (!cvc || cvc.length !== 3 || isNaN(parseInt(cvc))) return res.status(400).json({ error: 'Невалидный CVV/CVC код (3 цифры)' });

  try {
    if (!useLinkedCard) {
      if (!cardNumber || cardNumber.length !== 16 || isNaN(parseFloat(cardNumber))) {
        return res.status(400).json({ error: 'Номер карты должен состоять из 16 цифр' });
      }
      if (!expireDate || expireDate.length !== 5) {
        return res.status(400).json({ error: 'Укажите срок действия карты (MM/YY)' });
      }
    }

    const result = await prisma.$transaction([
      prisma.users.update({ where: { id: req.user.userId }, data: { balance: { increment: parsedAmount } } }),
      prisma.transactions.create({ data: { id: crypto.randomUUID(), user_id: req.user.userId, type: 'REFILL', amount: parsedAmount, description: useLinkedCard ? 'Пополнение баланса (привязанная карта)' : 'Пополнение баланса (новая карта)' } })
    ]);
    res.json({ success: true, newBalance: parseFloat(result[0].balance) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/transactions', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.transactions.findMany({ where: { user_id: req.user.userId }, orderBy: { created_at: 'desc' } });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/bookings/pay-debt', rateLimiter(15, 15 * 60 * 1000), authenticateToken, async (req, res) => {
  const { bookingId, amount } = req.body;
  const price = parseFloat(amount);

  try {
    const user = await prisma.users.findUnique({ where: { id: req.user.userId } });
    if (parseFloat(user.balance) < price) {
      return res.status(400).json({ error: 'Недостаточно средств на балансе для покупки услуги' });
    }

    const newBalance = parseFloat(user.balance) - price;

    await prisma.$transaction([
      prisma.users.update({ where: { id: req.user.userId }, data: { balance: newBalance } }),
      prisma.bookings.update({ where: { id: bookingId }, data: { payment_status: 'Paid' } }),
      prisma.transactions.create({
        data: {
          id: crypto.randomUUID(),
          user_id: req.user.userId,
          type: 'DEBT_PAY',
          amount: price,
          description: 'Погашение задолженности за проживание'
        }
      })
    ]);

    res.json({ success: true, message: 'Задолженность успешно погашена!', newBalance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// активные услуги и уборки

app.post('/api/auth/cleaning/request', rateLimiter(30, 15 * 60 * 1000), authenticateToken, requireRole(['Guest', 'Admin']), async (req, res) => {
  try {
    const activeBooking = await prisma.bookings.findFirst({
      where: { user_id: req.user.userId, booking_status: 'Confirmed' }
    });

    const roomId = activeBooking ? activeBooking.room_id : '00000000-0000-0000-0000-000000000101';

    const request = await prisma.cleaningRequests.create({
      data: {
        id: crypto.randomUUID(),
        user_id: req.user.userId,
        room_id: roomId,
        status: 'Pending'
      }
    });

    res.status(201).json({ success: true, message: 'Уборка успешно запрошена!', request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/cleaning/status', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.cleaningRequests.findMany({ where: { user_id: req.user.userId }, orderBy: { created_at: 'desc' } });
    res.json(list.map(mapCleaningRequest));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/employee/tasks', authenticateToken, requireRole(['Employee', 'Admin']), async (req, res) => {
  try {
    const schedules = await prisma.employeeSchedules.findMany({
      where: { employee_id: req.user.userId },
      orderBy: { date: 'asc' }
    });

    const assignedCleanings = await prisma.cleaningRequests.findMany({
      where: {
        OR: [
          { assigned_employee_id: req.user.userId },
          { assigned_employee_id: null, status: 'Pending' }
        ]
      },
      orderBy: { created_at: 'desc' }
    });

    const user = await prisma.users.findUnique({ where: { id: req.user.userId } });
    const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : '';

    let matchedSpecialistId = null;
    if (fullName.includes('Алия') && fullName.includes('Шарапова')) matchedSpecialistId = 1;
    else if (fullName.includes('Карина') && fullName.includes('Воробьева')) matchedSpecialistId = 2;
    else if (fullName.includes('Даниил') && fullName.includes('Царев')) matchedSpecialistId = 3;

    let massageBookingsRaw = [];
    if (req.user.role === 'Admin') {
      massageBookingsRaw = await prisma.massageBookings.findMany({
        where: { status: 'Confirmed' },
        orderBy: [{ date: 'asc' }, { time: 'asc' }]
      });
    } else if (req.user.role === 'Employee' && matchedSpecialistId !== null) {
      massageBookingsRaw = await prisma.massageBookings.findMany({
        where: { specialist_id: matchedSpecialistId, status: 'Confirmed' },
        orderBy: [{ date: 'asc' }, { time: 'asc' }]
      });
    }

    const clientIds = [...new Set(massageBookingsRaw.map(m => m.user_id))];
    const clients = await prisma.users.findMany({
      where: { id: { in: clientIds } }
    });

    const mappedMassages = massageBookingsRaw.map(task => {
      const client = clients.find(c => c.id === task.user_id);
      const specialistName = {
        1: 'Алия Шарапова',
        2: 'Карина Воробьева',
        3: 'Даниил Царев'
      }[task.specialist_id] || 'Неизвестно';

      return {
        id: task.id,
        clientName: client ? `${client.first_name} ${client.last_name}` : 'Гость',
        clientPhone: client ? client.phone : '',
        date: task.date,
        time: task.time,
        specialistName,
        status: task.status
      };
    });

    res.json({ 
      schedules, 
      assignedCleanings: assignedCleanings.map(mapCleaningRequest),
      massageTasks: mappedMassages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/auth/employee/tasks/:id/status', rateLimiter(50, 15 * 60 * 1000), authenticateToken, requireRole(['Employee', 'Admin']), async (req, res) => {
  const { status, isCleaningRequest } = req.body;
  try {
    if (isCleaningRequest) {
      const task = await prisma.cleaningRequests.findUnique({ where: { id: req.params.id } });
      const updateData = { status };

      if (status === 'Completed') {
        updateData.updated_at = new Date();
      }

      if (task.status === 'Pending' && !task.assigned_employee_id) {
        updateData.assigned_employee_id = req.user.userId;
        updateData.status = 'InProgress';
      }

      await prisma.cleaningRequests.update({
        where: { id: req.params.id },
        data: updateData
      });
    } else {
      await prisma.employeeSchedules.update({
        where: { id: req.params.id },
        data: { status }
      });
    }
    res.json({ success: true, message: 'Статус задачи успешно обновлен!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/massage/book', rateLimiter(15, 15 * 60 * 1000), authenticateToken, requireRole(['Guest', 'Employee', 'Admin']), async (req, res) => {
  const { specialistId, date, time } = req.body;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const selectedBookingDate = new Date(date);
    if (isNaN(selectedBookingDate.getTime())) {
      return res.status(400).json({ error: 'Указана некорректная или невалидная дата.' });
    }

    if (selectedBookingDate < tomorrow) {
      return res.status(400).json({ error: 'Запись на массаж возможна только начиная со следующего дня.' });
    }

    const existingBooking = await prisma.massageBookings.findFirst({
      where: {
        specialist_id: parseInt(specialistId),
        date: date,
        time: time,
        status: 'Confirmed'
      }
    });

    if (existingBooking) {
      return res.status(400).json({ error: 'Выбранный специалист уже занят на это время.' });
    }

    const user = await prisma.users.findUnique({ where: { id: req.user.userId } });
    const cost = 1200;

    if (parseFloat(user.balance) < cost) {
      return res.status(400).json({ error: 'Недостаточно средств для записи на массаж.' });
    }

    const newBalance = parseFloat(user.balance) - cost;

    const result = await prisma.$transaction([
      prisma.users.update({ where: { id: req.user.userId }, data: { balance: newBalance } }),
      prisma.massageBookings.create({
        data: {
          id: crypto.randomUUID(),
          user_id: req.user.userId,
          specialist_id: parseInt(specialistId),
          date,
          time
        }
      }),
      prisma.transactions.create({
        data: {
          id: crypto.randomUUID(),
          user_id: req.user.userId,
          type: 'SERVICE',
          amount: cost,
          description: `Запись на массаж (Мастер ID: ${specialistId})`
        }
      })
    ]);

    res.json({ success: true, message: 'Запись на массаж успешно подтверждена!', newBalance: parseFloat(result[0].balance) });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/massage/my', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.massageBookings.findMany({
      where: { user_id: req.user.userId },
      orderBy: { date: 'asc' }
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/auth/massage/my/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await prisma.massageBookings.findUnique({
      where: { id: req.params.id }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Запись на массаж не найдена.' });
    }

    if (booking.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Вы не можете отменить чужую запись.' });
    }

    const cost = 1200;

    const result = await prisma.$transaction([
      prisma.users.update({
        where: { id: req.user.userId },
        data: { balance: { increment: cost } }
      }),
      prisma.massageBookings.delete({
        where: { id: req.params.id }
      }),
      prisma.transactions.create({
        data: {
          id: crypto.randomUUID(),
          user_id: req.user.userId,
          type: 'REFUND',
          amount: cost,
          description: 'Возврат средств за отмену сеанса массажа'
        }
      })
    ]);

    res.json({ success: true, message: 'Запись отменена, 1 200 ₽ возвращены на ваш баланс!', newBalance: parseFloat(result[0].balance) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/employee/guests', authenticateToken, requireRole(['Employee', 'Admin']), async (req, res) => {
  try {
    const bookings = await prisma.bookings.findMany({
      where: { booking_status: 'Confirmed' },
      orderBy: { check_in: 'desc' }
    });

    const userIds = [...new Set(bookings.map(b => b.user_id))];
    const roomIds = [...new Set(bookings.map(b => b.room_id))];

    const users = await prisma.users.findMany({
      where: { id: { in: userIds } }
    });

    const rooms = await prisma.rooms.findMany({
      where: { id: { in: roomIds } }
    });

    const categoryMap = {
      standard: 'Стандарт',
      business: 'Бизнес',
      lux: 'Люкс',
      penthouse: 'Пентхаус'
    };

    const guestsLog = bookings.map(booking => {
      const user = users.find(u => u.id === booking.user_id);
      const room = rooms.find(r => r.id === booking.room_id);

      const now = new Date();
      const checkInDate = new Date(booking.check_in);
      const checkOutDate = new Date(booking.check_out);

      let statusRU = 'Ожидается';
      let statusEN = 'Expected';

      if (now >= checkInDate && now <= checkOutDate) {
        statusRU = 'Проживает';
        statusEN = 'Checked In';
      } else if (now > checkOutDate) {
        statusRU = 'Выселен';
        statusEN = 'Checked Out';
      }

      const roomCategory = room ? (categoryMap[room.category] || room.category) : '';
      const roomInfo = room ? `${roomCategory} №${room.room_number}` : 'Неизвестно';

      return {
        id: booking.id,
        firstName: user ? user.first_name : 'Удален',
        lastName: user ? user.last_name : 'Пользователь',
        room: roomInfo,
        dates: `${checkInDate.toLocaleDateString('ru-RU')} — ${checkOutDate.toLocaleDateString('ru-RU')}`,
        statusRU,
        statusEN
      };
    });

    res.json(guestsLog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//администрирование

app.get('/api/auth/admin/users', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const users = await prisma.users.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/auth/admin/users/:id/role', rateLimiter(30, 15 * 60 * 1000), authenticateToken, requireRole(['Admin']), async (req, res) => {
  const { role } = req.body;
  try {
    await prisma.users.update({ where: { id: req.params.id }, data: { role } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/auth/admin/users/:id/block', rateLimiter(30, 15 * 60 * 1000), authenticateToken, requireRole(['Admin']), async (req, res) => {
  const { isBlocked } = req.body;
  try {
    await prisma.users.update({ where: { id: req.params.id }, data: { is_blocked: isBlocked } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/auth/admin/users/:id', rateLimiter(30, 15 * 60 * 1000), authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    await prisma.users.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/admin/tasks', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const cleaningRequests = await prisma.cleaningRequests.findMany({ orderBy: { created_at: 'desc' } });
    const schedules = await prisma.employeeSchedules.findMany({ orderBy: { date: 'asc' } });
    res.json({ cleaningRequests: cleaningRequests.map(mapCleaningRequest), schedules });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/admin/tasks/assign', rateLimiter(50, 15 * 60 * 1000), authenticateToken, requireRole(['Admin']), async (req, res) => {
  const { taskId, employeeId } = req.body;
  try {
    await prisma.cleaningRequests.update({
      where: { id: taskId },
      data: { assigned_employee_id: employeeId, status: 'Assigned' }
    });
    res.json({ success: true, message: 'Сотрудник успешно назначен!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// дополнительные услуги и сиддинг 

app.post('/api/auth/services/purchase', rateLimiter(15, 15 * 60 * 1000), authenticateToken, requireRole(['Guest', 'Employee', 'Admin']), async (req, res) => {
  const { serviceName, quantity } = req.body;
  const qty = parseInt(quantity) || 1;

  if (qty <= 0) {
    return res.status(400).json({ error: 'Количество должно быть больше нуля.' });
  }

  const normalizedServiceName = serviceName ? serviceName.trim().toLowerCase() : '';

  try {
    const service = await prisma.additionalServices.findUnique({ where: { name: normalizedServiceName } });
    if (!service) return res.status(404).json({ error: `Услуга "${serviceName}" не найдена в базе данных.` });

    const activeBooking = await prisma.bookings.findFirst({
      where: { user_id: req.user.userId, booking_status: 'Confirmed' },
      orderBy: { created_at: 'desc' }
    });

    if (!activeBooking) {
      return res.status(400).json({ error: 'Приобретать дополнительные услуги могут только гости с активным бронированием.' });
    }

    const room = await prisma.rooms.findFirst({ 
      where: { id: activeBooking.room_id } 
    });

    if (!room) {
      return res.status(400).json({ error: 'Номер, привязанный к вашему бронированию, не найден в базе данных. Обратитесь к администратору.' });
    }

    const roomCategory = room.category ? room.category.trim().toLowerCase() : 'none';

    const stayNights = Math.ceil((new Date(activeBooking.check_out) - new Date(activeBooking.check_in)) / (1000 * 60 * 60 * 24)) || 1;

    // блокировка повторных покупок
    if (normalizedServiceName !== 'massage' && normalizedServiceName !== 'cyber') {
      
      if (normalizedServiceName !== 'parking') {
        const alreadyPurchased = await prisma.userServices.findFirst({
          where: { user_id: req.user.userId, service_id: service.id }
        });
        if (alreadyPurchased) {
          return res.status(400).json({ 
            error: `Вы уже приобрели услугу "${service.name.toUpperCase()}". Повторная покупка недоступна.` 
          });
        }
      }

      // А. Проверка питания
      if (normalizedServiceName === 'breakfast') {
        if (['business', 'lux', 'penthouse'].includes(roomCategory)) {
          return res.status(400).json({ error: 'Завтрак уже включен в стоимость вашего номера по тарифу.' });
        }
      }

      if (normalizedServiceName === 'lunch') {
        if (['lux', 'penthouse'].includes(roomCategory)) {
          return res.status(400).json({ error: 'Обед уже включен в стоимость вашего номера по тарифу.' });
        }
      }

      if (normalizedServiceName === 'dinner') {
        if (['lux', 'penthouse'].includes(roomCategory)) {
          return res.status(400).json({ error: 'Ужин уже включен в стоимость вашего номера по тарифу.' });
        }
      }

      // Б. Проверка Спа и Бань
      if (normalizedServiceName === 'saunas' || normalizedServiceName === 'sauna') {
        if (['standard', 'business', 'lux', 'penthouse'].includes(roomCategory)) {
          return res.status(400).json({ error: 'Доступ в SPA и термальные зоны уже включен в стоимость вашего номера.' });
        }
      }

      // В. Проверка и лимиты парковки
      if (normalizedServiceName === 'parking') {
        if (roomCategory === 'penthouse') {
          return res.status(400).json({ error: 'VIP-парковка уже включена в стоимость вашего Пентхауса.' });
        }

        const existingParkingPurchases = await prisma.userServices.findMany({
          where: { user_id: req.user.userId, service_id: service.id }
        });
        const totalParkingQty = existingParkingPurchases.reduce((acc, curr) => acc + curr.quantity, 0);

        if (totalParkingQty + qty > 3) {
          return res.status(400).json({ 
            error: `Превышен лимит парковочных мест. Вы можете забронировать максимум 3 места. У вас уже забронировано: ${totalParkingQty} из 3.` 
          });
        }
      }
    }

    // 4. Списание средств и проведение транзакции
    const user = await prisma.users.findUnique({ where: { id: req.user.userId } });
    
    let cost = parseFloat(service.price) * qty;
    if (normalizedServiceName === 'parking') {
      cost = parseFloat(service.price) * qty * stayNights;
    }

    if (parseFloat(user.balance) < cost) {
      return res.status(400).json({ error: 'Недостаточно средств на балансе для покупки услуги' });
    }

    const newBalance = parseFloat(user.balance) - cost;

    const result = await prisma.$transaction([
      prisma.users.update({ where: { id: req.user.userId }, data: { balance: newBalance } }),
      prisma.userServices.create({ 
        data: { 
          id: crypto.randomUUID(), 
          user_id: req.user.userId, 
          service_id: service.id, 
          quantity: qty, 
          payment_status: 'Paid' 
        } 
      }),
      prisma.transactions.create({ 
        data: { 
          id: crypto.randomUUID(), 
          user_id: req.user.userId, 
          type: 'SERVICE', 
          amount: cost, 
          description: normalizedServiceName === 'parking'
            ? `Покупка услуги: PARKING (x${qty}) на ${stayNights} сут.`
            : `Покупка услуги: ${serviceName.toUpperCase()} (x${qty})` 
        } 
      })
    ]);

    res.json({ success: true, message: 'Услуга добавлена в проживание!', newBalance: parseFloat(result[0].balance) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/services/my', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.userServices.findMany({
      where: { user_id: req.user.userId },
      orderBy: { created_at: 'desc' }
    });

    const services = await prisma.additionalServices.findMany();
    const result = list.map(item => {
      const s = services.find(srv => srv.id === item.service_id);
      return {
        id: item.id,
        name: s ? s.name : 'Unknown',
        quantity: item.quantity,
        price: s ? parseFloat(s.price) : 0,
        createdAt: item.created_at
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/google/url', (req, res) => {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'].join(' ')
  };
  res.json({ url: `${rootUrl}?${new URLSearchParams(options).toString()}` });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, async () => {
  console.log(`🔒 Auth Service & Swagger запущен на порту ${PORT}`);
  await seedAdditionalServices();
});