import { Router } from 'express';
import * as eventsController from '../controllers/event.js';
import { updateEventsActualStatus } from '../services/event.js';

const router = Router();

// Существующие маршруты
router.get('/', eventsController.getEvents);
router.post('/', eventsController.postEvents);
router.patch('/', eventsController.patchEvents);
router.delete('/', eventsController.deleteEvents);
router.post('/join', eventsController.joinEvent);
router.get('/my', eventsController.getMyEvents);

<<<<<<< HEAD
router.post('/update-actual', async (req, res) => {
    try {
        const updatedCount = await updateEventsActualStatus();
        res.json({
            message: `Актуальность событий обновлена`,
            updatedCount
        });
    } catch (error) {
        console.error('Ошибка при обновлении актуальности:', error);
        res.status(500).json({ error: 'Ошибка при обновлении актуальности событий' });
    }
});

export default router;
=======
export default router;

router.post('/:id/join', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) return res.status(400).json({ error: 'userId required' });

        const event = await prisma.event.findUnique({ where: { id: parseInt(id) } });
        if (!event) return res.status(404).json({ error: 'Event not found' });

        const updated = await prisma.event.update({
            where: { id: parseInt(id) },
            data: {
                participants: {
                    push: userId
                }
            }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/my', async (req, res) => {
    try {
        const { user } = req.query;
        if (!user) return res.status(400).json({ error: 'user required' });

        const events = await prisma.event.findMany({
            where: {
                participants: {
                    has: user
                }
            }
        });

        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
>>>>>>> b5858486fdeb55e420cbc188bc05e3eb5c2d8b58
