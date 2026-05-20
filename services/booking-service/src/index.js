const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// --- НАСТРОЙКИ SWAGGER ---
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Deep Blue Booking API',
            version: '1.0.0',
            description: 'API для управления номерами и бронированием отеля Deep Blue',
            contact: { name: 'Архитектор проекта' }
        },
        servers: [{ url: 'http://localhost:3001', description: 'Основной сервер' }],
    },
    apis: ['./src/index.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @openapi
 * /api/rooms:
 *   get:
 *     tags: [Rooms]
 *     summary: Получить список всех доступных номеров
 *     responses:
 *       200:
 *         description: Список номеров успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   type: { type: string }
 *                   price_per_night: { type: number }
 */
app.get('/api/rooms', async (req, res) => {
    try {
        const rooms = await prisma.rooms.findMany();
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Booking API + Swagger: http://localhost:${PORT}/api-docs`));