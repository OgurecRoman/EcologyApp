import { Router } from 'express';
import * as eventsController from '../controllers/event.js';

const router = Router();

router.get('/', eventsController.getEvents);
router.post('/', eventsController.postEvents);
router.patch('/', eventsController.patchEvents);
router.delete('/', eventsController.deleteEvents);

export default router;