import prisma from "../lib/prisma.js";

// Подписаться на пользователя
export async function followUser(followerId, followingId) {
    // Проверяем существование пользователей
    const follower = await prisma.user.findUnique({
        where: { id: followerId }
    });

    const following = await prisma.user.findUnique({
        where: { id: parseInt(followingId) }
    });

    if (!follower || !following) {
        throw new Error('Пользователь не найден');
    }

    // Проверяем, не подписан ли уже
    const existingFollow = await prisma.user.findFirst({
        where: {
            id: followerId,
            following: {
                some: {
                    id: parseInt(followingId)
                }
            }
        }
    });

    if (existingFollow) {
        throw new Error('Вы уже подписаны на этого пользователя');
    }

    // Нельзя подписаться на себя
    if (followerId === parseInt(followingId)) {
        throw new Error('Нельзя подписаться на себя');
    }

    // Добавляем подписку
    const updatedUser = await prisma.user.update({
        where: { id: followerId },
        data: {
            following: {
                connect: { id: parseInt(followingId) }
            }
        },
        include: {
            following: {
                select: {
                    id: true,
                    username: true,
                    rating: true
                }
            }
        }
    });

    console.log(`Пользователь (ID: ${followerId}) подписался на пользователя: ${following.username}`);
    return following;
}

// Отписаться от пользователя
export async function unfollowUser(followerId, followingId) {
    const follower = await prisma.user.findUnique({
        where: { id: followerId }
    });

    if (!follower) {
        throw new Error('Пользователь не найден');
    }

    const updatedUser = await prisma.user.update({
        where: { id: followerId },
        data: {
            following: {
                disconnect: { id: parseInt(followingId) }
            }
        },
        include: {
            following: {
                select: {
                    id: true,
                    username: true,
                    rating: true
                }
            }
        }
    });

    console.log(`Пользователь (ID: ${followerId}) отписался от пользователя: ${followingId}`);
    return { message: 'Успешно отписались' };
}

// Получить подписки пользователя
export async function getFollowing(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            following: {
                select: {
                    id: true,
                    username: true,
                    rating: true,
                    _count: {
                        select: {
                            posts: true,
                            followers: true
                        }
                    }
                }
            }
        }
    });

    return user.following;
}

// Получить подписчиков пользователя
export async function getFollowers(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            followers: {
                select: {
                    id: true,
                    username: true,
                    rating: true,
                    _count: {
                        select: {
                            posts: true,
                            followers: true
                        }
                    }
                }
            }
        }
    });

    return user.followers;
}

// Получить рекомендации для подписки (пользователи, на которых еще не подписан)
export async function getRecommendations(userId, limit = 5) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            following: {
                select: { id: true }
            }
        }
    });

    const followingIds = user.following.map(follow => follow.id);
    followingIds.push(userId); // Исключаем себя

    return await prisma.user.findMany({
        where: {
            id: {
                notIn: followingIds
            }
        },
        take: limit,
        select: {
            id: true,
            username: true,
            rating: true,
            _count: {
                select: {
                    posts: true,
                    followers: true
                }
            }
        },
        orderBy: {
            rating: 'desc'
        }
    });
}
