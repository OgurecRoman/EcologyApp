import { Router } from 'express';
import * as postController from '../controllers/post.js';

const router = Router();

// Получить все посты
router.get('/', postController.getPosts);

// Получить ленту постов (от пользователей, на которых подписан)
router.get('/feed', postController.getFeedPosts);

// Получить посты конкретного пользователя
router.get('/user', postController.getUserPosts);

// Создать пост
router.post('/', postController.createPost);

// Лайкнуть пост
router.post('/like', postController.likePost);

// Убрать лайк
router.post('/unlike', postController.unlikePost);

export default router;
