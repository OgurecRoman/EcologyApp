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
