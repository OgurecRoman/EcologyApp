import { Router } from 'express';
import * as followController from '../controllers/follow.js';

const router = Router();

// Подписаться на пользователя
router.post('/follow', followController.followUser);

// Отписаться от пользователя
router.post('/unfollow', followController.unfollowUser);

// Получить подписки пользователя
router.get('/following', followController.getFollowing);

// Получить подписчиков пользователя
router.get('/followers', followController.getFollowers);

// Получить рекомендации для подписки
router.get('/recommendations', followController.getRecommendations);

export default router;
