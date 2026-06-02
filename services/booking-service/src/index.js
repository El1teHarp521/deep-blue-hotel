const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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

// мидлавры двух токенов для синхронизаации С AUTH-SERVICE

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

    // Генерируем новый Access-токен
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role }, 
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
  const accessToken = req.cookies.deepblue_access;
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

//  настройки swagger (OPENAPI 3.0)
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'DeepBlue Booking Service API',
      version: '1.0.0',
      description: 'Документация эндпоинтов бронирования номеров, контроля доступности комнат и администрирования постояльцев',
      contact: { name: 'DeepBlue Development Team' }
    },
    servers: [{ url: 'http://localhost:3001' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Введите ваш JWT-токен для авторизации роутов'
        }
      }
    }
  },
  apis: [path.join(__dirname, 'index.js')] 
};

const swaggerDocs = swaggerUi.setup(swaggerJsDoc(swaggerOptions));
app.use('/swagger', swaggerUi.serve, swaggerDocs);
app.use('/api/docs', swaggerUi.serve, swaggerDocs);


// эндпоинты бронирование номеров

/**
 * @openapi
 * /api/rooms/seed:
 *   get:
 *     tags: [Rooms]
 *     summary: Наполнить базу данных номерами по умолчанию (Сиддинг фонда)
 *     responses:
 *       200:
 *         description: База номеров успешно инициализирована
 */
app.get('/api/rooms/seed', async (req, res) => {
  try {
    await prisma.rooms.deleteMany();
    const roomsToCreate = [];

    // Стандарт: с 210 по 320 (Цена: 15 000 ₽)
    for (let i = 210; i <= 320; i++) {
      roomsToCreate.push({
        id: crypto.randomUUID(),
        room_number: i.toString(),
        category: 'standard',
        price: 15000,
        description: 'Standard Cozy Room'
      });
    }

    // Бизнес: с 421 по 470 (Цена: 34 000 ₽)
    for (let i = 421; i <= 470; i++) {
      roomsToCreate.push({
        id: crypto.randomUUID(),
        room_number: i.toString(),
        category: 'business',
        price: 34000,
        description: 'Business Class Room'
      });
    }

    // Люкс: с 560 по 607 (Цена: 67 000 ₽)
    for (let i = 560; i <= 607; i++) {
      roomsToCreate.push({
        id: crypto.randomUUID(),
        room_number: i.toString(),
        category: 'lux',
        price: 67000,
        description: 'Luxury Suite with Ocean View'
      });
    }

    // Пентхаус: 1 номер (№701, Цена: 152 000 ₽)
    roomsToCreate.push({
      id: crypto.randomUUID(),
      room_number: '701',
      category: 'penthouse',
      price: 152000,
      description: 'Signature Presidential Penthouse Suite'
    });

    await prisma.rooms.createMany({ data: roomsToCreate });
    res.json({ success: true, message: `База данных успешно наполнена номерным фондом! Создано номеров: ${roomsToCreate.length}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Создать новое бронирование отеля
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category, checkIn, checkOut, guestsCount]
 *             properties:
 *               category: { type: string, example: "standard" }
 *               checkIn: { type: string, example: "2026-06-01" }
 *               checkOut: { type: string, example: "2026-06-08" }
 *               guestsCount: { type: number, example: 2 }
 *               payNow: { type: boolean, example: true }
 */
app.post('/api/bookings', authenticateToken, async (req, res) => {
  const { category, checkIn, checkOut, payNow, guestsCount } = req.body;

  if (!category || !checkIn || !checkOut) {
    return res.status(400).json({ error: 'Пожалуйста, заполните все поля бронирования' });
  }

  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (start >= end) {
    return res.status(400).json({ error: 'Дата выезда должна быть позже даты заселения' });
  }

  // Валидация количества проживающих гостей
  const guestsNum = parseInt(guestsCount) || 1;
  if (guestsNum <= 0) {
    return res.status(400).json({ error: 'Количество гостей должно быть не менее 1 человека.' });
  }

  // Вместимость номеров
  const maxGuestsMap = {
    standard: 3,
    business: 5,
    lux: 7,
    penthouse: 15
  };
  const maxAllowed = maxGuestsMap[category.toLowerCase()] || 4;
  if (guestsNum > maxAllowed) {
    return res.status(400).json({ 
      error: `В категории "${category.toUpperCase()}" может проживать максимум ${maxAllowed} человек(а).` 
    });
  }
  const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  try {
    const user = await prisma.users.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    const existingActiveBooking = await prisma.bookings.findFirst({
      where: {
        user_id: req.user.userId,
        booking_status: 'Confirmed'
      }
    });

    if (existingActiveBooking) {
      return res.status(400).json({ 
        error: 'По правилам отеля, вы не можете забронировать более одного номера одновременно на одну учетную запись.' 
      });
    }
    const availableRooms = await prisma.rooms.findMany({
      where: {
        category: category,
        status: 'Available',
        NOT: {
          id: {
            in: await prisma.bookings.findMany({
              where: {
                booking_status: 'Confirmed',
                NOT: {
                  OR: [
                    { check_out: { lte: start } },
                    { check_in: { gte: end } }
                  ]
                }
              },
              select: { room_id: true }
            }).then(list => list.map(b => b.room_id))
          }
        }
      }
    });

    if (availableRooms.length === 0) {
      return res.status(400).json({ error: 'К сожалению, все номера этой категории заняты на выбранные даты.' });
    }

    const selectedRoom = availableRooms[0];
    const finalPrice = parseFloat(selectedRoom.price.toString()) * nights;

    let paymentStatus = 'Unpaid';
    let newBalance = parseFloat(user.balance.toString());

    if (payNow) {
      paymentStatus = 'Paid';
    } else {
      newBalance -= finalPrice;
      paymentStatus = 'Unpaid';
    }

    const result = await prisma.$transaction([
      prisma.bookings.create({
        data: {
          id: crypto.randomUUID(),
          user_id: req.user.userId,
          room_id: selectedRoom.id, 
          check_in: start,
          check_out: end,
          payment_status: paymentStatus,
          booking_status: 'Confirmed',
          guests_count: guestsNum
        }
      }),
      prisma.users.update({
        where: { id: req.user.userId },
        data: { balance: newBalance, role: 'Guest' }
      }),
      prisma.transactions.create({
        data: {
          id: crypto.randomUUID(),
          user_id: req.user.userId,
          type: 'BOOKING',
          amount: finalPrice,
          description: payNow 
            ? `Оплата картой номера №${selectedRoom.room_number} (${nights} ноч.)` 
            : `Резерв номера №${selectedRoom.room_number} в долг (${nights} ноч.)`
        }
      })
    ]);

    res.status(201).json({ 
      success: true, 
      message: payNow 
        ? `Номер №${selectedRoom.room_number} успешно забронирован и оплачен картой на ${nights} ночей!` 
        : `Номер №${selectedRoom.room_number} успешно зарезервирован на ${nights} ночей в долг!`,
      booking: result[0],
      newBalance
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//  получение номеров с данима проверкой занятости
app.get('/api/rooms', async (req, res) => {
  const { date } = req.query;

  try {
    let rooms = await prisma.rooms.findMany({ orderBy: { room_number: 'asc' } });
    const checkDate = date ? new Date(date) : new Date();

    const activeBookings = await prisma.bookings.findMany({
      where: {
        booking_status: 'Confirmed',
        check_in: { lte: checkDate },
        check_out: { gte: checkDate }
      },
      select: { room_id: true }
    });

    const bookedRoomIds = activeBookings.map(b => b.room_id);
    rooms = rooms.map(room => ({
      ...room,
      isOccupied: bookedRoomIds.includes(room.id)
    }));

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/bookings/active', authenticateToken, async (req, res) => {
  try {
    const activeBooking = await prisma.bookings.findFirst({
      where: { user_id: req.user.userId, booking_status: 'Confirmed' },
      orderBy: { created_at: 'desc' }
    });

    if (!activeBooking) {
      return res.json({ hasBooking: false });
    }

    const room = await prisma.rooms.findFirst({
      where: { id: activeBooking.room_id }
    });

    if (!room) {
      return res.status(404).json({ error: 'Номер, связанный с вашим бронированием, не найден.' });
    }

    res.json({
      hasBooking: true,
      bookingId: activeBooking.id,
      checkIn: activeBooking.check_in,
      checkOut: activeBooking.check_out,
      paymentStatus: activeBooking.payment_status,
      roomNumber: room.room_number,
      category: room.category,
      price: parseFloat(room.price.toString())
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// админ роуты

// 1. Получить все бронирования отеля с именами гостей и номерами комнат
app.get('/api/admin/bookings', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Доступ запрещен. Требуются права Администратора.' });
  }

  try {
    const list = await prisma.bookings.findMany({ orderBy: { created_at: 'desc' } });

    const userIds = [...new Set(list.map(b => b.user_id))];
    const roomIds = [...new Set(list.map(b => b.room_id))];

    const users = await prisma.users.findMany({ where: { id: { in: userIds } } });
    const rooms = await prisma.rooms.findMany({ where: { id: { in: roomIds } } });

    const joined = list.map(booking => {
      const user = users.find(u => u.id === booking.user_id);
      const room = rooms.find(r => r.id === booking.room_id);
      return {
        ...booking,
        guestName: user ? `${user.first_name} ${user.last_name}` : 'Удаленный пользователь',
        guestEmail: user ? user.email : '',
        roomNumber: room ? room.room_number : 'Неизвестно',
        roomCategory: room ? room.category : 'Неизвестно'
      };
    });

    res.json(joined);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Изменить цену или статус номера
app.put('/api/admin/rooms/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Доступ запрещен. Требуются права Администратора.' });
  }

  const { price, status } = req.body;

  try {
    const updatedRoom = await prisma.rooms.update({
      where: { id: req.params.id },
      data: {
        price: price ? parseFloat(price) : undefined,
        status: status || undefined
      }
    });
    res.json({ success: true, room: updatedRoom });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Выселить постояльца / Снять бронь (изменение статуса бронирования)
app.put('/api/admin/bookings/:id/status', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Доступ запрещен. Требуются права Администратора.' });
  }

  const { booking_status } = req.body;

  try {
    const updatedBooking = await prisma.bookings.update({
      where: { id: req.params.id },
      data: { booking_status }
    });
    res.json({ success: true, booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Полностью удалить запись бронирования из БД
app.delete('/api/admin/bookings/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Доступ запрещен. Требуются права Администратора.' });
  }

  try {
    await prisma.bookings.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Запись бронирования удалена.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Booking Service запущен на порту ${PORT}`));