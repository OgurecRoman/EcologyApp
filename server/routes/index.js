import { Router } from 'express';
import eventRouter from './event.js';
import userRouter from './user.js';
import blogRouter from './blog.js';
import postRouter from './post.js';
import followRouter from './follow.js';
// import notificationRouter from './notification.js';

const router = Router();

router.use('/events', eventRouter);
router.use('/user', userRouter);
router.use('/blogs', blogRouter);
router.use('/posts', postRouter);
router.use('/follow', followRouter);
// router.use('/notifications', notificationRouter);

export default router;