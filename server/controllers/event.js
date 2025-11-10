import prisma from '../lib/prisma.js';
import * as eventsService from '../services/event.js';

export async function getEvents(req, res) {
    try {
        const { type } = req.query;
        const filters = type ? { type } : {};
        const events = await eventsService.getEvents(filters);
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при получении событий' });
    }
};

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
