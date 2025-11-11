import { Router } from 'express';
import eventRouter from './event.js';
import userRouter from './user.js';

const router = Router();

router.use('/events', eventRouter);
router.use('/user', userRouter);

export default router;