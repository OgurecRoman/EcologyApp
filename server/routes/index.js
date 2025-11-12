import { Router } from 'express';
import eventRouter from './event.js';
import userRouter from './user.js';
import notificationRouter from './notification.js';

const router = Router();

router.use('/events', eventRouter);
router.use('/user', userRouter);
router.use('/notifications', notificationRouter);

export default router;