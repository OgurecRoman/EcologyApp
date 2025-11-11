import * as userService from '../services/user.js';

// /user?id=&name=
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
