import prisma from "../lib/prisma.js";

// Получить все блоги
export async function getBlogs(filters = {}) {
    const where = {};

    if (filters.authorId) {
        where.authorId = parseInt(filters.authorId);
    }

    return await prisma.blog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    rating: true
                }
            },
            subscribers: {
                select: {
                    id: true,
                    username: true
                }
            }
        }
    });
}

// Получить блоги, на которые подписан пользователь
export async function getSubscribedBlogs(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            subscribedBlogs: {
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            rating: true
                        }
                    },
                    subscribers: {
                        select: {
                            id: true,
                            username: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    return user.subscribedBlogs;
}

// Создать блог
export async function createBlog(title, content, authorId) {
    const blog = await prisma.blog.create({
        data: {
            title,
            content,
            authorId: parseInt(authorId)
        },
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    rating: true
                }
            }
        }
    });

    return blog;
}

// Подписаться на блог
export async function subscribeToBlog(userId, blogId) {
    // Проверяем существование пользователя и блога
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        throw new Error('Пользователь не найден');
    }

    const blog = await prisma.blog.findUnique({
        where: { id: parseInt(blogId) }
    });

    if (!blog) {
        throw new Error('Блог не найден');
    }

    // Проверяем, не подписан ли уже пользователь
    const userWithSubscriptions = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscribedBlogs: true }
    });

    const isAlreadySubscribed = userWithSubscriptions.subscribedBlogs.some(blog => blog.id === parseInt(blogId));
    if (isAlreadySubscribed) {
        throw new Error('Пользователь уже подписан на этот блог');
    }

    // Добавляем подписку
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            subscribedBlogs: {
                connect: { id: parseInt(blogId) }
            }
        },
        include: { subscribedBlogs: true }
    });

    console.log(`Пользователь (ID: ${userId}) успешно подписался на блог: ${blog.title}`);
    return blog;
}

// Отписаться от блога
export async function unsubscribeFromBlog(userId, blogId) {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        throw new Error('Пользователь не найден');
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            subscribedBlogs: {
                disconnect: { id: parseInt(blogId) }
            }
        },
        include: { subscribedBlogs: true }
    });

    console.log(`Пользователь (ID: ${userId}) отписался от блога: ${blogId}`);
    return { message: 'Успешно отписались от блога' };
}

// Получить блоги пользователя
export async function getUserBlogs(userId) {
    const blogs = await prisma.blog.findMany({
        where: { authorId: parseInt(userId) },
        orderBy: { createdAt: 'desc' },
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    rating: true
                }
            },
            subscribers: {
                select: {
                    id: true,
                    username: true
                }
            }
        }
    });

    return blogs;
}
