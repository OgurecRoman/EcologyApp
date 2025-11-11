import { Router } from 'express';
import * as userController from '../controllers/user.js';

const router = Router();

router.get('/', userController.getUser);
router.patch('/', userController.patchUser);

export default router;