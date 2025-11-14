// controllers/user.js
import * as userService from '../services/user.js';

export async function getUser(req, res) {
    try {
        const id = req.query.id ? parseInt(req.query.id) : null;
        const name = req.query.name || null;

        console.log(`🔄 Запрос пользователя: id=${id}, name=${name}`);

        if (!id && !name) {
            return res.status(400).json({
                error: 'Необходимо указать id или name пользователя',
                example: '/user?id=1 или /user?name=Username'
            });
        }

        const user = await userService.getUser(id, name);
        console.log("✅ Пользователь найден:", user ? user.username : 'не найден');
        res.json(user);
    } catch (error) {
        console.error('❌ Ошибка в getUser:', error);
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
<<<<<<< HEAD
}

export async function getTopUsers(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 10;
        console.log(`🔄 Запрос топа пользователей, лимит: ${limit}`);

        const topUsers = await userService.getTopUsers(limit);
        console.log(`✅ Найдено ${topUsers.length} пользователей для топа`);

        res.json(topUsers);
    } catch (error) {
        console.error('❌ Ошибка в getTopUsers:', error);
        res.status(500).json({ error: 'Ошибка при получении топа пользователей' });
    }
}
=======
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
>>>>>>> b5858486fdeb55e420cbc188bc05e3eb5c2d8b58
