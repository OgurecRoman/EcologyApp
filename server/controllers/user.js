// controllers/user.js
import * as userService from '../services/user.js';

export async function getUser(req, res) {
    try {
        const id = parseInt(req.query.id);
        const name = req.query.name;
        const user = await userService.getUser(id, name);
        console.log("User: ", user);
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при получении пользователя' });
    }
};

export async function createUser(req, res) {
    try {
        const { id, username } = req.body;
        if (!id || !username) {
            return res.status(400).json({ error: 'ID и username обязательны' });
        }
        const user = await userService.createUser(id, username);
        res.status(201).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при создании пользователя' });
    }
};

export async function patchUser(req, res) {
    try {
        const eventsId = req.body.eventsId;
        const eventsToConnect = eventsId.map(id => ({ id }));
        const user = await userService.patchUser(req.body.id, eventsToConnect);
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при обновлении пользователя' });
    }
};

export async function getUserStats(req, res) {
    try {
        const userId = parseInt(req.query.userId);
        if (!userId) {
            return res.status(400).json({ error: 'User ID обязателен' });
        }
        const stats = await userService.getUserStats(userId);
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при получении статистики пользователя' });
    }
};
