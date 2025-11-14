// services/user.js
import prisma from "../lib/prisma.js";
import { updateUserActivity, shouldResetRating } from '../utils/periodUtils.js';

export async function getUser(id, name) {
    let user = await prisma.user.findUnique({
        where: { id: id },
        include: {
            events: true,
            posts: true,
            followers: true,
            following: true
        }
    });

    if (!user){
        user = await createUser(id, name);
    } else {
        if (shouldResetRating(user.lastActivity)) {
            user = await prisma.user.update({
                where: { id: id },
                data: {
                    rating: 0,
                    lastActivity: new Date()
                },
                include: {
                    events: true,
                    posts: true,
                    followers: true,
                    following: true
                }
            });
        }
    }

    return user;
};

export async function createUser(id, username) {
    const user = await prisma.user.create({
        data: {
            id: id,
            username: name,
            rating: 0,
            lastActivity: new Date()
        },
        include: {
            events: true,
            posts: true,
            followers: true,
            following: true
        }
    });

    return user;
};

export async function patchUser(userId, eventsToConnect) {
    const existingUser = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!existingUser) {
        console.error(`Попытка обновления: Пользователь с ID ${userId} не найден.`);
        throw new Error(`UserNotFound: Пользователь с ID ${userId} не существует в базе данных.`);
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                events: {
                    connect: eventsToConnect,
                },
            },
            include: {
                events: true,
            },
        });

        return updatedUser;
    } catch (error) {
        console.error(`Ошибка при привязке событий к пользователю ${userId}:`, error);
        throw new Error('Не удалось обновить список событий пользователя.');
    }
};

export async function getUserStats(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            events: {
                include: {
                    participants: true
                }
            },
            posts: {
                include: {
                    likes: true
                }
            },
            followers: true,
            following: true,
            _count: {
                select: {
                    events: true,
                    posts: true,
                    followers: true,
                    following: true,
                    likes: true
                }
            }
        }
    });

    if (!user) {
        throw new Error('Пользователь не найден');
    }

    // Подсчитываем общее количество лайков на постах пользователя
    const totalLikes = user.posts.reduce((sum, post) => sum + post.likes.length, 0);

    // Самый популярный пост
    const mostPopularPost = user.posts.length > 0
        ? user.posts.reduce((prev, current) =>
            (prev.likes.length > current.likes.length) ? prev : current
        )
        : null;

    return {
        user: {
            id: user.id,
            username: user.username,
            rating: user.rating,
            lastActivity: user.lastActivity
        },
        stats: {
            eventsCount: user._count.events,
            postsCount: user._count.posts,
            followersCount: user._count.followers,
            followingCount: user._count.following,
            totalLikes: totalLikes,
            mostPopularPost: mostPopularPost ? {
                id: mostPopularPost.id,
                title: mostPopularPost.title,
                likes: mostPopularPost.likes.length
            } : null
        },
        recentActivity: {
            lastEvents: user.events.slice(0, 5).map(event => ({
                id: event.id,
                name: event.name,
                type: event.type,
                date: event.date
            })),
            lastPosts: user.posts.slice(0, 3).map(post => ({
                id: post.id,
                title: post.title,
                likes: post.likes.length
            }))
        }
    };
}
