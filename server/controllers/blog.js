import * as blogService from '../services/blog.js';

export async function getBlogs(req, res) {
    try {
        const { authorId } = req.query || {};
        const filters = authorId ? { authorId } : {};

        const blogs = await blogService.getBlogs(filters);
        res.json(blogs);
    } catch (error) {
        console.error('Ошибка в getBlogs:', error);
        res.status(500).json({ error: 'Ошибка при получении блогов' });
    }
}

export async function getSubscribedBlogs(req, res) {
    try {
        const userId = parseInt(req.body.userId);
        if (!userId) {
            return res.status(400).json({ error: 'User ID обязателен' });
        }

        const blogs = await blogService.getSubscribedBlogs(userId);
        res.json(blogs);
    } catch (error) {
        console.error('Ошибка в getSubscribedBlogs:', error);
        res.status(500).json({ error: 'Ошибка при получении подписанных блогов' });
    }
}

export async function createBlog(req, res) {
    try {
        const { title, content, authorId } = req.body;
        if (!title || !content || !authorId) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        const blog = await blogService.createBlog(title, content, authorId);
        res.status(201).json(blog);
    } catch (error) {
        console.error('Ошибка в createBlog:', error);
        res.status(500).json({ error: 'Ошибка при создании блога' });
    }
}

export async function subscribeToBlog(req, res) {
    try {
        const userId = parseInt(req.body.userId);
        const blogId = parseInt(req.body.blogId);

        if (!userId || !blogId) {
            return res.status(400).json({ error: 'User ID и Blog ID обязательны' });
        }

        const result = await blogService.subscribeToBlog(userId, blogId);
        res.json({
            message: 'Успешно подписались на блог',
            blog: result
        });
    } catch (error) {
        console.error('Ошибка в subscribeToBlog:', error);
        if (error.message === 'Пользователь уже подписан на этот блог') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Ошибка при подписке на блог' });
    }
}

export async function unsubscribeFromBlog(req, res) {
    try {
        const userId = parseInt(req.body.userId);
        const blogId = parseInt(req.body.blogId);

        if (!userId || !blogId) {
            return res.status(400).json({ error: 'User ID и Blog ID обязательны' });
        }

        const result = await blogService.unsubscribeFromBlog(userId, blogId);
        res.json(result);
    } catch (error) {
        console.error('Ошибка в unsubscribeFromBlog:', error);
        res.status(500).json({ error: 'Ошибка при отписке от блога' });
    }
}

export async function getUserBlogs(req, res) {
    try {
        const userId = parseInt(req.query.userId);
        if (!userId) {
            return res.status(400).json({ error: 'User ID обязателен' });
        }

        const blogs = await blogService.getUserBlogs(userId);
        res.json(blogs);
    } catch (error) {
        console.error('Ошибка в getUserBlogs:', error);
        res.status(500).json({ error: 'Ошибка при получении блогов пользователя' });
    }
}
