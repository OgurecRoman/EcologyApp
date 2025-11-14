// routes/user.js
import { Router } from 'express';
import * as userController from '../controllers/user.js';

const router = Router();

router.get('/', userController.getUser);
router.post('/', userController.createUser);
router.patch('/', userController.patchUser);
router.get('/stats', userController.getUserStats);

export default router;