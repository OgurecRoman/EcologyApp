import dotenv from 'dotenv';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем .env из корневой директории проекта
dotenv.config({ path: resolve(__dirname, '..', '.env') });

// Динамический импорт Prisma из корневой node_modules
const prismaModule = await import('@prisma/client');
const PrismaClient = prismaModule.PrismaClient;

const prisma = new PrismaClient();
const app = express();
app.use(express.json());


// GET /events - Получить все события
app.get('/events', async (req, res) => {
    try {
        const { type } = req.query;
        const filters = type ? { type } : {};

        const events = await prisma.event.findMany({
            where: filters,
            orderBy: { date: 'asc' },
            include: { participants: true }
        });

        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Ошибка при получении событий' });
    }
});

// POST /events - Создать новое событие
app.post('/events', async (req, res) => {
    try {
        const { name, description, type, date, address, author } = req.body;

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
                author
            },
            include: { participants: true }
        });

        res.status(201).json(event);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Ошибка при создании события' });
    }
});

// PATCH /events/:id - Обновить событие
app.patch('/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        if (data.date) data.date = new Date(data.date);

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

// Главная страница
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Экологическое приложение</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    margin-top: 50px; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .container {
                    background: rgba(255,255,255,0.1);
                    padding: 40px;
                    border-radius: 15px;
                    backdrop-filter: blur(10px);
                    max-width: 600px;
                    margin: 0 auto;
                }
                h1 { color: #fff; margin-bottom: 20px; }
                .status { 
                    background: #2ecc71; 
                    color: white; 
                    padding: 10px 20px; 
                    border-radius: 20px; 
                    display: inline-block;
                    margin: 10px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🌱 Экологическое приложение</h1>
                <div class="status">✅ Сервер работает корректно</div>
                <p>Текущее время: ${new Date().toLocaleTimeString('ru-RU')}</p>
                
                <h3>📡 Доступные endpoints:</h3>
                <ul style="text-align: left; display: inline-block;">
                    <li><strong>GET /events</strong> - получить все события</li>
                    <li><strong>POST /events</strong> - создать событие</li>
                    <li><strong>PATCH /events/:id</strong> - обновить событие</li>
                    <li><strong>DELETE /events/:id</strong> - удалить событие</li>
                </ul>
                
                <p style="margin-top: 30px;">
                    <a href="/events" style="color: #fff; text-decoration: underline;">Проверить события →</a>
                </p>
            </div>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`➡️ Откройте http://localhost:${PORT} в браузере`);
    console.log(`📡 API доступно по http://localhost:${PORT}/events`);
});
