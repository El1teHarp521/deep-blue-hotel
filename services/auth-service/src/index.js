const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

// Настройка CORS для работы с куками
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true // Обязательно для передачи кук
}));
app.use(express.json());
app.use(cookieParser());

// --- 1. ГЕНЕРАЦИЯ URL ДЛЯ ВХОДА ЧЕРЕЗ GOOGLE ---
app.get('/api/auth/google/url', (req, res) => {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ].join(' ')
  };

  const queryString = new URLSearchParams(options).toString();
  res.json({ url: `${rootUrl}?${queryString}` });
});

// --- 2. CALLBACK ДЛЯ ОБМЕНА КОДА НА ПРОФИЛЬ И ВЫДАЧИ JWT ---
app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Код авторизации не найден');
  }

  try {
    // Обмениваем код авторизации на токены Google
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    const { id_token, access_token } = tokenResponse.data;

    // Запрашиваем информацию о пользователе из Google
    const googleUserResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      { headers: { Authorization: `Bearer ${id_token}` } }
    );

    const { email, name, verified_email } = googleUserResponse.data;

    if (!verified_email && !email) {
      return res.status(403).send('Email не подтвержден в системе Google');
    }

    // Проверяем, существует ли пользователь в нашей БД
    let user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      // Автоматическая бесшовная регистрация (Релиз 2)
      user = await prisma.users.create({
        data: {
          email,
          full_name: name,
          password_hash: 'google_oauth_bypass', // Пароль не нужен при OAuth
          role: 'Guest' // Роль по умолчанию
        }
      });
    }

    // Создаем сессионный JWT-токен
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Отправляем токен в безопасном HTTP-Only Cookie
    res.cookie('deepblue_session', token, {
      httpOnly: true, // Защита от XSS-скриптов
      secure: process.env.NODE_ENV === 'production', // Только по HTTPS в проде
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней жизни куки
      sameSite: 'lax'
    });

    // Перенаправляем пользователя обратно на фронтенд
    res.redirect(process.env.FRONTEND_URL);

  } catch (error) {
    console.error('Ошибка Google OAuth:', error.response?.data || error.message);
    res.status(500).send('Внутренняя ошибка авторизации');
  }
});

// --- 3. ПРОВЕРКА АКТИВНОЙ СЕССИИ (GET /me) ---
app.get('/api/auth/me', async (req, res) => {
  const token = req.cookies.deepblue_session;

  if (!token) {
    return res.status(401).json({ isAuthenticated: false });
  }

  try {
    // Проверяем валидность токена
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(404).json({ isAuthenticated: false });
    }

    res.json({
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(401).json({ isAuthenticated: false, error: 'Сессия устарела или невалидна' });
  }
});

// --- 4. ВЫХОД ИЗ СИСТЕМЫ (LOGOUT) ---
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('deepblue_session');
  res.json({ success: true, message: 'Вы успешно вышли из системы' });
});

// Настройка package.json скриптов
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`🔒 Auth Service запущен на порту ${PORT}`));