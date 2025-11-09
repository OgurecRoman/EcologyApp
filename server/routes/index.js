import { Router } from 'express';
import eventRouter from './event.js';

const router = Router();

router.use('/events', eventRouter);

export default router;