import * as postService from '../services/post.js';

export async function getPosts(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const posts = await postService.getPosts(page, limit);
        res.json(posts);
    } catch (error) {
        console.error('Ошибка в getPosts:', error);
        res.status(500).json({ error: 'Ошибка при получении постов' });
    }
}

export async function getFeedPosts(req, res) {
    try {
        const userId = parseInt(req.body.userId);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        if (!userId) {
            return res.status(400).json({ error: 'User ID обязателен' });
        }

        const posts = await postService.getFeedPosts(userId, page, limit);
        res.json(posts);
    } catch (error) {
        console.error('Ошибка в getFeedPosts:', error);
        res.status(500).json({ error: 'Ошибка при получении ленты' });
    }
}

export async function getUserPosts(req, res) {
    try {
        const userId = parseInt(req.query.userId);
        if (!userId) {
            return res.status(400).json({ error: 'User ID обязателен' });
        }

        const posts = await postService.getUserPosts(userId);
        res.json(posts);
    } catch (error) {
        console.error('Ошибка в getUserPosts:', error);
        res.status(500).json({ error: 'Ошибка при получении постов пользователя' });
    }
}

export async function createPost(req, res) {
    try {
        const { title, content, imageUrl, authorId } = req.body;
        if (!title || !content || !authorId) {
            return res.status(400).json({ error: 'Заголовок, содержание и автор обязательны' });
        }

        const post = await postService.createPost(title, content, imageUrl, authorId);
        res.status(201).json(post);
    } catch (error) {
        console.error('Ошибка в createPost:', error);
        res.status(500).json({ error: 'Ошибка при создании поста' });
    }
}

export async function likePost(req, res) {
    try {
        const userId = parseInt(req.body.userId);
        const postId = parseInt(req.body.postId);

        if (!userId || !postId) {
            return res.status(400).json({ error: 'User ID и Post ID обязательны' });
        }

        const like = await postService.likePost(userId, postId);
        res.json({
            message: 'Пост лайкнут',
            like: like
        });
    } catch (error) {
        console.error('Ошибка в likePost:', error);
        if (error.message === 'Пользователь уже лайкнул этот пост') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Ошибка при лайке поста' });
    }
}

export async function unlikePost(req, res) {
    try {
        const userId = parseInt(req.body.userId);
        const postId = parseInt(req.body.postId);

        if (!userId || !postId) {
            return res.status(400).json({ error: 'User ID и Post ID обязательны' });
        }

        const result = await postService.unlikePost(userId, postId);
        res.json(result);
    } catch (error) {
        console.error('Ошибка в unlikePost:', error);
        res.status(500).json({ error: 'Ошибка при снятии лайка' });
    }
}
