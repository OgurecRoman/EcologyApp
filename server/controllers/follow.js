import * as followService from '../services/follow.js';

export async function followUser(req, res) {
    try {
        const followerId = parseInt(req.body.followerId);
        const followingId = parseInt(req.body.followingId);

        if (!followerId || !followingId) {
            return res.status(400).json({ error: 'Follower ID и Following ID обязательны' });
        }

        const result = await followService.followUser(followerId, followingId);
        res.json({
            message: 'Успешно подписались на пользователя',
            user: result
        });
    } catch (error) {
        console.error('Ошибка в followUser:', error);
        if (error.message === 'Вы уже подписаны на этого пользователя') {
            return res.status(400).json({ error: error.message });
        }
        if (error.message === 'Нельзя подписаться на себя') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Ошибка при подписке на пользователя' });
    }
}

export async function unfollowUser(req, res) {
    try {
        const followerId = parseInt(req.body.followerId);
        const followingId = parseInt(req.body.followingId);

        if (!followerId || !followingId) {
            return res.status(400).json({ error: 'Follower ID и Following ID обязательны' });
        }

        const result = await followService.unfollowUser(followerId, followingId);
        res.json(result);
    } catch (error) {
        console.error('Ошибка в unfollowUser:', error);
        res.status(500).json({ error: 'Ошибка при отписке от пользователя' });
    }
}

export async function getFollowing(req, res) {
    try {
        const userId = parseInt(req.query.userId);
        if (!userId) {
            return res.status(400).json({ error: 'User ID обязателен' });
        }

        const following = await followService.getFollowing(userId);
        res.json(following);
    } catch (error) {
        console.error('Ошибка в getFollowing:', error);
        res.status(500).json({ error: 'Ошибка при получении подписок' });
    }
}

export async function getFollowers(req, res) {
    try {
        const userId = parseInt(req.query.userId);
        if (!userId) {
            return res.status(400).json({ error: 'User ID обязателен' });
        }

        const followers = await followService.getFollowers(userId);
        res.json(followers);
    } catch (error) {
        console.error('Ошибка в getFollowers:', error);
        res.status(500).json({ error: 'Ошибка при получении подписчиков' });
    }
}

export async function getRecommendations(req, res) {
    try {
        const userId = parseInt(req.query.userId);
        const limit = parseInt(req.query.limit) || 5;

        if (!userId) {
            return res.status(400).json({ error: 'User ID обязателен' });
        }

        const recommendations = await followService.getRecommendations(userId, limit);
        res.json(recommendations);
    } catch (error) {
        console.error('Ошибка в getRecommendations:', error);
        res.status(500).json({ error: 'Ошибка при получении рекомендаций' });
    }
}
