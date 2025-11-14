import { Router } from 'express';
import * as eventsController from '../controllers/event.js';

const router = Router();

router.get('/', eventsController.getEvents);
router.post('/', eventsController.postEvents);
router.patch('/', eventsController.patchEvents);
router.delete('/', eventsController.deleteEvents);

router.post('/join', eventsController.joinEvent);
router.get('/my', eventsController.getMyEvents);

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