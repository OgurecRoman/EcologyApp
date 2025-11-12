import * as eventsService from '../services/event.js';

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
        const userId = req.body.userId;
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
            return res.status(400).json({ error: 'Все поля обязательны' });
        }
        const event = await eventsService.postEvents(name, description, type, date, 
            address, author);

        res.status(201).json(event);
    } catch (error) {
        console.error('Ошибка в postEvents:', error);
        res.status(500).json({ error: 'Ошибка при создании события' });
    }
}

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
}

export async function deleteEvents(req, res) {
    try {
        const id = req.body?.id;
        if (!id) return res.status(400).json({ error: 'ID обязателен' });
        await eventsService.deleteEvents(id);
        res.status(204).send();
    } catch (error) {
        console.error('Ошибка в deleteEvents:', error);
        res.status(500).json({ error: 'Ошибка при удалении события' });
    }
}