import dotenv from 'dotenv';
import express from 'express';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

// GET /events - Получить все события (с фильтрацией по типу)
app.get('/events', async (req, res) => {
    try {
        const { type } = req.query;
        const filters = type ? { type } : {};
        const events = await prisma.event.findMany({
            where: filters,
            orderBy: { date: 'asc' },
            include: { participants: true }  // Включаем участников
        });
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при получении событий' });
    }
});

// POST /events - Создать новое событие
app.post('/events', async (req, res) => {
    try {
        const { name, description, type, date, address, author, participantIds } = req.body;
        if (!name || !description || !type || !date || !address || !author) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }
        const event = await prisma.event.create({
            data: {
                name,
                description,
                type,
                date: new Date(date),
                address,
                author,
                participants: participantIds ? { connect: participantIds.map(id => ({ id })) } : undefined  // Связываем участников по ID
            },
            include: { participants: true }
        });
        res.status(201).json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при создании события' });
    }
});

// PATCH /events/:id - Обновить событие
app.patch('/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        if (data.date) data.date = new Date(data.date);
        if (data.participantIds) {
            data.participants = { set: data.participantIds.map(id => ({ id })) };  // Обновляем участников
            delete data.participantIds;
        }
        const event = await prisma.event.update({
            where: { id: parseInt(id) },
            data,
            include: { participants: true }
        });
        res.json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при обновлении события' });
    }
});

// DELETE /events/:id - Удалить событие
app.delete('/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.event.delete({
            where: { id: parseInt(id) }
        });
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при удалении события' });
    }
});

app.get('/', (req, res) => {
    try {
        const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Дарова</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background-color: #f4f4f4; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>👋 Привет от простого сервера на Node.js!</h1>
    <p>Текущее время на сервере: ${new Date().toLocaleTimeString('ru-RU')}</p>
</body>
</html>`;
        res.send(htmlContent);
    } catch (error) {
        res.send('Ошибка!!!');
        console.log(error);
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`➡️ Откройте http://localhost:${PORT} в браузере`);
});