import * as eventsService from '../services/event.js';

export async function getEvents(req, res) {
    try {
        const filters = req.body && req.body.types ? req.body.types : [];
        const events = await eventsService.getEvents(filters);
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при получении событий' });
    }
};

// export async function getMyEvents(req, res) {
//     try {
//         const events = await eventsService.getMyEvents(nick);
//         res.json(events);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Ошибка при получении событий' });
//     }
// };

export async function postEvents(req, res) {
    try {
        const { name, description, type, date, address, author, participantIds } = req.body;
        if (!name || !description || !type || !date || !address || !author) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }
        const event = await eventsService.postEvents(name, description, type, date, 
            address, author, participantIds);
        res.status(201).json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при создании события' });
    }
};

// После создания события
import fetch from 'node-fetch';

// ... после создания события
const newEvent = await prisma.event.create({ ... });

// Отправляем уведомление о новом событии
try {
    await fetch('http://localhost:3000/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chatIds: [/* массив chatId подписчиков */],
            message: `🎉 Новое событие: ${newEvent.name}\n📅 ${new Date(newEvent.date).toLocaleDateString('ru-RU')}\n📍 ${newEvent.address}`
        })
    });
} catch (error) {
    console.error('Ошибка при отправке уведомления:', error);
}

export async function patchEvents(req, res) {
    try {
        const data = req.body;
        if (data.date) data.date = new Date(data.date);
        if (data.participantIds) {
            data.participants = { set: data.participantIds.map(id => ({ id })) };  // Обновляем участников
            delete data.participantIds;
        }
        const event = await eventsService.patchEvents(data.id, data);
        res.json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при обновлении события' });
    }
};

// DELETE /events - Удалить событие
export async function deleteEvents(req, res) {
    try {
        const id = req.body.id;
        await eventsService.deleteEvents(id);
        res.status(204).send;
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при удалении события' });
    }
};
