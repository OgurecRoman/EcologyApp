import { Router } from 'express';
import * as notificationController from '../controllers/notification.js';

const router = Router();

router.post('/send', notificationController.sendNotification);

export default router;
