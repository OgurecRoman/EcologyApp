import { Router } from 'express';
import * as userController from '../controllers/user.js';

const router = Router();

router.get('/', userController.getUser);
router.patch('/', userController.patchUser);
router.get('/top', userController.getTopUsers);

export default router;

router.get('/top', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const topUsers = await prisma.user.findMany({
            take: limit,
            orderBy: { rating: 'desc' },
            select: {
                id: true,
                username: true,
                rating: true
            }
        });

        res.json(topUsers);
    } catch (error) {
        console.error('Ошибка при получении топа пользователей:', error);
        res.status(500).json({ error: 'Ошибка при получении топа пользователей' });
    }
});
