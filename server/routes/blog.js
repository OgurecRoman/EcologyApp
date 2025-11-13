import { Router } from 'express';
import * as blogController from '../controllers/blog.js';

const router = Router();

// Получить все блоги или блоги конкретного автора
router.get('/', blogController.getBlogs);

// Получить блоги пользователя
router.get('/my', blogController.getUserBlogs);

// Получить блоги, на которые подписан пользователь
router.get('/subscribed', blogController.getSubscribedBlogs);

// Создать блог
router.post('/', blogController.createBlog);

// Подписаться на блог
router.post('/subscribe', blogController.subscribeToBlog);

// Отписаться от блога
router.post('/unsubscribe', blogController.unsubscribeFromBlog);

export default router;