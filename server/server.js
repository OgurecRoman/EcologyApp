import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
app.use(express.json());  // Для парсинга JSON в req.body

// Заглушка: in-memory хранилище событий (массив вместо БД)
let events = [];  // Здесь будут храниться события
let nextId = 1;   // Автоинкремент для ID

// GET /events - Получить все события (с фильтрацией по типу)
app.get('/events', (req, res) => {
    try {
        const { type } = req.query;  // ?type=SUBBOTNIK для фильтра
        let filteredEvents = events;
        if (type) {
            filteredEvents = events.filter(event => event.type === type);
        }
        filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));  // Сортировка по дате
        res.json(filteredEvents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при получении событий' });
    }
});

// POST /events - Создать новое событие
app.post('/events', (req, res) => {
    try {
        const { name, author, date, address, description, type } = req.body;
        if (!name || !author || !date || !address || !description || !type) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }
        const newEvent = {
            id: nextId++,
            name,
            author,
            date: new Date(date),  // Преобразование в Date
            address,
            description,
            type,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        events.push(newEvent);
        res.status(201).json(newEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при создании события' });
    }
});

// PATCH /events/:id - Обновить событие
app.patch('/events/:id', (req, res) => {
    try {
        const { id } = req.params;
        const eventId = parseInt(id);
        const eventIndex = events.findIndex(event => event.id === eventId);
        if (eventIndex === -1) {
            return res.status(404).json({ error: 'Событие не найдено' });
        }
        const data = req.body;
        if (data.date) data.date = new Date(data.date);
        const updatedEvent = {
            ...events[eventIndex],
            ...data,
            updatedAt: new Date()
        };
        events[eventIndex] = updatedEvent;
        res.json(updatedEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при обновлении события' });
    }
});

// DELETE /events/:id - Удалить событие
app.delete('/events/:id', (req, res) => {
    try {
        const { id } = req.params;
        const eventId = parseInt(id);
        const eventIndex = events.findIndex(event => event.id === eventId);
        if (eventIndex === -1) {
            return res.status(404).json({ error: 'Событие не найдено' });
        }
        events.splice(eventIndex, 1);
        res.status(204).send();  // No Content
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при удалении события' });
    }
});

// Главная страница (текущий код, но с динамическим временем)
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