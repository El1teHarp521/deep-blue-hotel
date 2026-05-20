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

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Deep Blue HR API',
            version: '1.0.0',
            description: 'API для работы с персоналом и рабочими графиками',
        },
        servers: [{ url: 'http://localhost:3002' }],
    },
    apis: ['./src/index.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @openapi
 * /api/schedule/{userId}:
 *   get:
 *     tags: [Schedule]
 *     summary: Получить расписание смен конкретного сотрудника
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         description: ID пользователя (User UUID)
 *     responses:
 *       200:
 *         description: Список смен успешно получен
 */
app.get('/api/schedule/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const employee = await prisma.employees.findFirst({ where: { user_id: userId } });
        if (!employee) return res.status(404).json({ message: "Сотрудник не найден" });

        const schedule = await prisma.work_schedule.findMany({
            where: { employee_id: employee.id },
            orderBy: { shift_date: 'asc' }
        });
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`💼 HR API + Swagger: http://localhost:${PORT}/api-docs`));