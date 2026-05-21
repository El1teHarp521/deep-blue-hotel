// services/auth-service/src/index.js

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
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// --- МИДЛВАРЫ БЕЗОПАСНОСТИ ---
const authenticateToken = (req, res, next) => {
  const token = req.cookies.deepblue_session || req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Неавторизован' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
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

// --- НАСТРОЙКИ SWAGGER (OPENAPI 3.0) ---
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
  // Абсолютный путь для стабильности парсинга на Windows/Linux
  apis: [path.join(__dirname, 'index.js')] 
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- ВАЛИДАТОРЫ ---
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^\+?[1-9]\d{1,14}$/.test(phone) && phone.length >= 10;

// --- ИНТЕЛЛЕКТУАЛЬНЫЙ МАППИНГ НОМЕРОВ И КЛАССОВ (ТЗ) ---
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


// ==========================================
// РАЗДЕЛ 1: АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ (AUTH)
// ==========================================

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Регистрация нового пользователя (роль User по умолчанию)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName, phone]
 *             properties:
 *               email: { type: string, example: "guest@deepblue.com" }
 *               password: { type: string, example: "123456" }
 *               firstName: { type: string, example: "Иван" }
 *               lastName: { type: string, example: "Иванов" }
 *               phone: { type: string, example: "+79991111112" }
 *               country: { type: string, example: "Россия" }
 *     responses:
 *       201:
 *         description: Пользователь успешно создан и авторизован
 *       400:
 *         description: Ошибка валидации или дубликат Email/Телефона
 */
app.post('/api/auth/register', async (req, res) => {
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

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('deepblue_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });

    res.status(201).json({ success: true, user: { id: user.id, email: user.email, fullName: `${user.first_name} ${user.last_name}`, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Вход по Email или номеру телефона
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [loginInput, password]
 *             properties:
 *               loginInput: { type: string, example: "guest@deepblue.com" }
 *               password: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: Успешный вход
 *       400:
 *         description: Неверные учетные данные
 */
app.post('/api/auth/login', async (req, res) => {
  const { loginInput, password } = req.body;

  try {
    const user = await prisma.users.findFirst({
      where: { OR: [{ email: loginInput }, { phone: loginInput }] }
    });

    if (!user) return res.status(400).json({ error: 'Пользователь не найден' });
    if (user.is_blocked) return res.status(403).json({ error: 'Ваш аккаунт заблокирован' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Неверный пароль' });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('deepblue_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });

    res.json({ success: true, user: { id: user.id, email: user.email, fullName: `${user.first_name} ${user.last_name}`, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Проверка активной сессии
 *     responses:
 *       200:
 *         description: Профиль пользователя получен
 */
app.get('/api/auth/me', async (req, res) => {
  const token = req.cookies.deepblue_session;
  if (!token) return res.status(401).json({ isAuthenticated: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.users.findUnique({ where: { id: decoded.userId } });
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

/**
 * @openapi
 * /api/auth/profile:
 *   put:
 *     tags: [Auth]
 *     summary: Редактирование информации профиля
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string, example: "Петр Петров" }
 *               phone: { type: string, example: "+79993333333" }
 *               country: { type: string, example: "ОАЭ" }
 */
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
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

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Выход из аккаунта (Очистка кук)
 */
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('deepblue_session');
  res.json({ success: true });
});


// ========================================================
// РАЗДЕЛ 2: СВЯЗКА И ОТВЯЗКА GOOGLE OAUTH
// ========================================================

/**
 * @openapi
 * /api/auth/google/url:
 *   get:
 *     tags: [Google OAuth]
 *     summary: Получить безопасный URL для авторизации Google
 */
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

/**
 * @openapi
 * /api/auth/google/callback:
 *   get:
 *     tags: [Google OAuth]
 *     summary: Callback обработчик Google
 */
app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  const tokenFromCookie = req.cookies.deepblue_session;

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
      const decoded = jwt.verify(tokenFromCookie, process.env.JWT_SECRET);
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

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('deepblue_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    res.redirect(process.env.FRONTEND_URL);

  } catch (error) {
    res.status(500).send('Ошибка привязки / авторизации Google');
  }
});

/**
 * @openapi
 * /api/auth/google/unlink:
 *   put:
 *     tags: [Google OAuth]
 *     summary: Отвязать аккаунт Google от текущего профиля
 *     security:
 *       - bearerAuth: []
 */
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


// ========================================================
// РАЗДЕЛ 3: КАРТЫ И ПЛАТЕЖИ (PAYMENTS)
// ========================================================

/**
 * @openapi
 * /api/auth/cards:
 *   post:
 *     tags: [Payments]
 *     summary: Безопасное привязывание карты
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cardNumber, expireDate]
 *             properties:
 *               cardNumber: { type: string, example: "1111222233334444" }
 *               expireDate: { type: string, example: "12/29" }
 */
app.post('/api/auth/cards', authenticateToken, async (req, res) => {
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

/**
 * @openapi
 * /api/auth/cards:
 *   get:
 *     tags: [Payments]
 *     summary: Получить список всех привязанных карт пользователя
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/auth/cards', authenticateToken, async (req, res) => {
  try {
    const cards = await prisma.linkedCards.findMany({ where: { user_id: req.user.userId } });
    res.json(cards.map(c => ({ id: c.id, lastFour: c.last4 })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/auth/cards/{id}:
 *   delete:
 *     tags: [Payments]
 *     summary: Удалить карту по ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
app.delete('/api/auth/cards/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.linkedCards.deleteMany({ where: { id: req.params.id, user_id: req.user.userId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/auth/refill:
 *   post:
 *     tags: [Payments]
 *     summary: Пополнение баланса (C защитой от NaN и поддержкой привязанных карт)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, cvc]
 *             properties:
 *               amount: { type: number, example: 5000 }
 *               cvc: { type: string, example: "123" }
 *               useLinkedCard: { type: boolean, example: true }
 *               cardNumber: { type: string, example: "1111222233334444" }
 *               expireDate: { type: string, example: "12/29" }
 */
app.post('/api/auth/refill', authenticateToken, async (req, res) => {
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
      prisma.transactions.create({ data: { user_id: req.user.userId, type: 'REFILL', amount: parsedAmount, description: useLinkedCard ? 'Пополнение баланса (привязанная карта)' : 'Пополнение баланса (новая карта)' } })
    ]);
    res.json({ success: true, newBalance: parseFloat(result[0].balance) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/auth/transactions:
 *   get:
 *     tags: [Payments]
 *     summary: Получить историю транзакций
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/auth/transactions', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.transactions.findMany({ where: { user_id: req.user.userId }, orderBy: { created_at: 'desc' } });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ========================================================
// РАЗДЕЛ 4: АКТИВНЫЕ УСЛУГИ И УБОРКИ (GUEST & EMPLOYEE)
// ========================================================

/**
 * @openapi
 * /api/auth/cleaning/request:
 *   post:
 *     tags: [Guest Services]
 *     summary: Запрос постояльца на уборку в номере (Guest Only)
 *     security:
 *       - bearerAuth: []
 */
app.post('/api/auth/cleaning/request', authenticateToken, requireRole(['Guest', 'Admin']), async (req, res) => {
  try {
    const activeBooking = await prisma.bookings.findFirst({ where: { user_id: req.user.userId, status: 'Confirmed' } });
    const roomId = activeBooking ? activeBooking.room_id : '00000000-0000-0000-0000-000000000101';
    const request = await prisma.cleaningRequests.create({ data: { user_id: req.user.userId, room_id: roomId, status: 'Pending' } });
    res.status(201).json({ success: true, request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/auth/cleaning/status:
 *   get:
 *     tags: [Guest Services]
 *     summary: Получение статуса уборок постояльца
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/auth/cleaning/status', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.cleaningRequests.findMany({ where: { user_id: req.user.userId }, orderBy: { created_at: 'desc' } });
    res.json(list.map(mapCleaningRequest));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/auth/employee/tasks:
 *   get:
 *     tags: [Employee Services]
 *     summary: Получение списка задач сотрудника (Включая нераспределенные)
 *     security:
 *       - bearerAuth: []
 */
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

    res.json({ schedules, assignedCleanings: assignedCleanings.map(mapCleaningRequest) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/auth/employee/tasks/{id}/status:
 *   put:
 *     tags: [Employee Services]
 *     summary: Обновление статуса задачи сотрудником
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, example: "Completed" }
 *               isCleaningRequest: { type: boolean, example: true }
 */
app.put('/api/auth/employee/tasks/:id/status', authenticateToken, requireRole(['Employee', 'Admin']), async (req, res) => {
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


// ========================================================
// РАЗДЕЛ 5: АДМИНИСТРИРОВАНИЕ (ADMIN & CRUD)
// ========================================================

/**
 * @openapi
 * /api/auth/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Получение всех пользователей в системе (Admin Only)
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/auth/admin/users', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const users = await prisma.users.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/auth/admin/users/{id}/role:
 *   put:
 *     tags: [Admin]
 *     summary: Изменение роли (Admin Only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role: { type: string, example: "Employee" }
 */
app.put('/api/auth/admin/users/:id/role', authenticateToken, requireRole(['Admin']), async (req, res) => {
  const { role } = req.body;
  try {
    await prisma.users.update({ where: { id: req.params.id }, data: { role } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/auth/admin/users/{id}/block:
 *   put:
 *     tags: [Admin]
 *     summary: Блокировка / разблокировка пользователя (Admin Only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isBlocked: { type: boolean, example: true }
 */
app.put('/api/auth/admin/users/:id/block', authenticateToken, requireRole(['Admin']), async (req, res) => {
  const { isBlocked } = req.body;
  try {
    await prisma.users.update({ where: { id: req.params.id }, data: { is_blocked: isBlocked } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/auth/admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Полное удаление пользователя (Admin Only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
app.delete('/api/auth/admin/users/:id', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    await prisma.users.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/auth/admin/tasks:
 *   get:
 *     tags: [Admin]
 *     summary: Получение всех запросов на уборку и задач в системе (Admin Only)
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/auth/admin/tasks', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const cleaningRequests = await prisma.cleaningRequests.findMany({ orderBy: { created_at: 'desc' } });
    const schedules = await prisma.employeeSchedules.findMany({ orderBy: { date: 'asc' } });
    res.json({ cleaningRequests: cleaningRequests.map(mapCleaningRequest), schedules });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/auth/admin/tasks/assign:
 *   post:
 *     tags: [Admin]
 *     summary: Назначение уборки или задачи конкретному сотруднику (Admin Only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [taskId, employeeId]
 *             properties:
 *               taskId: { type: string, example: "uuid" }
 *               employeeId: { type: string, example: "uuid" }
 */
app.post('/api/auth/admin/tasks/assign', authenticateToken, requireRole(['Admin']), async (req, res) => {
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

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`🔒 Auth Service & Swagger запущен на порту ${PORT}`));