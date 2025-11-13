import * as eventsService from '../services/event.js';
import prisma from '../lib/prisma.js';

export async function getEvents(req, res) {
    try {
        const { city, types } = req.query || {};
        const typesArray = types ? types.split(',').filter(Boolean) : [];
        console.log('Фильтры (controller):', { city, types: typesArray });

        const events = await eventsService.getEvents({ city, types: typesArray });
        console.log(events);
        res.json(events);
    } catch (error) {
        console.error('Ошибка в getEvents:', error);
        res.status(500).json({ error: 'Ошибка при получении событий' });
    }
};

export async function getMyEvents(req, res) {
    try {
        const userId = parseInt(req.body.userId);
        if (!userId) {
            return res.status(400).json({ error: 'User ID обязателен' });
        }
        const events = await eventsService.getMyEvents(userId);
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при получении событий' });
    }
};

export async function postEvents(req, res) {
    try {
        const { name, description, type, date, address, author } = req.body;
        if (!name || !description || !type || !date || !address || !author) {
            return res.status(400).json({
                error: 'Все поля обязательны',
                received: { name, description, type, date, address, author }
            });
        }

        console.log("Полученные данные:", req.body);

        const event = await eventsService.postEvents(name, description, type, date, address, author);

        console.log("Событие создано:", event);
        res.status(201).json(event);

    } catch (error) {
        console.error('Полная ошибка в postEvents:', error);
        console.error('Stack trace:', error.stack);

        // Более информативный ответ об ошибке
        if (error.message.includes('Неверный тип события')) {
            return res.status(400).json({
                error: error.message,
                details: 'Проверьте тип события'
            });
        }

        res.status(500).json({
            error: 'Ошибка при создании события',
            details: error.message
        });
    }
}

export async function joinEvent(req, res) {
    try {
        console.log('=== JOIN EVENT REQUEST ===');
        console.log('Request body:', req.body);

        const userId = parseInt(req.body.userId);
        const eventId = parseInt(req.body.eventId);

        console.log('Parsed userId:', userId, 'eventId:', eventId);

        if (!userId || !eventId || isNaN(userId) || isNaN(eventId)) {
            console.log('Validation failed: userId or eventId missing or invalid');
            return res.status(400).json({
                error: 'User ID и Event ID обязательны и должны быть числами',
                received: { userId: req.body.userId, eventId: req.body.eventId }
            });
        }

        console.log('Calling eventsService.joinEvent...');
        const result = await eventsService.joinEvent(userId, eventId);

        // Получаем информацию о событии для определения типа
        const event = await prisma.event.findUnique({
            where: { id: eventId }
        });

        // Определяем количество баллов
        const ratingPoints = getRatingPointsByEventType(event.type);

        console.log('Join event successful:', result);
        res.json({
            message: 'Успешно присоединились к событию',
            event: result
        });

    } catch (error) {
        console.error('=== JOIN EVENT ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Error full:', error);

        if (error.message === 'Пользователь не найден') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Событие не найдено') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('уже участвует')) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({
            error: 'Ошибка при подписке на событие',
            details: error.message
        });
    }
};

export async function joinEvent(req, res) {
    try {
        const userId = req.body.userId;
        const eventId = req.body.eventId;
        if (!userId || !eventId) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }
        const user = await eventsService.joinEvent(userId, eventId);
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при подписке на событие' });
    }
};

// Добавляем функцию для определения баллов
function getRatingPointsByEventType(eventType) {
    const ratingPoints = {
        'SUBBOTNIK': 10,
        'PAPER_COLLECTION': 3,
        'BATTERY_COLLECTION': 3,
        'PLASTIC_COLLECTION': 3,
        'GLASS_COLLECTION': 3,
        'ELECTRONICS_COLLECTION': 3,
        'OTHER': 1
    };

    return ratingPoints[eventType] || 1;
};

export async function patchEvents(req, res) {
    try {
        const data = req.body || {};
        if (data.date) data.date = new Date(data.date);
        const event = await eventsService.patchEvents(data.id, data);
        res.json(event);
    } catch (error) {
        console.error('Ошибка в patchEvents:', error);
        res.status(500).json({ error: 'Ошибка при обновлении события' });
    }
};

export async function deleteEvents(req, res) {
    try {
        const id = parseInt(req.body?.id);
        if (!id) return res.status(400).json({ error: 'ID обязателен' });
        await eventsService.deleteEvents(id);
        res.status(204).send();
    } catch (error) {
        console.error('Ошибка в deleteEvents:', error);
        res.status(500).json({ error: 'Ошибка при удалении события' });
    }
};
