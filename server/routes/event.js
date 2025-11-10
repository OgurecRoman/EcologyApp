import { Router } from 'express';
import * as eventsController from '../controllers/event.js';

const router = Router();

router.get('/', eventsController.getEvents);
router.post('/', eventsController.postEvents);
router.patch('/', eventsController.patchEvents);
router.delete('/', eventsController.deleteEvents);

// router.get('/my', eventsController.getMyEvents);

export default router;