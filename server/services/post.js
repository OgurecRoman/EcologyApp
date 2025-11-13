import prisma from "../lib/prisma.js";

// Получить все посты (с пагинацией)
export async function getPosts(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    return await prisma.post.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    rating: true
                }
            },
            likes: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    likes: true
                }
            }
        }
    });
}

// Получить посты пользователей, на которых подписан текущий пользователь
export async function getFeedPosts(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            following: {
                select: { id: true }
            }
        }
    });

    const followingIds = user.following.map(follow => follow.id);

    return await prisma.post.findMany({
        where: {
            authorId: {
                in: followingIds
            }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    rating: true
                }
            },
            likes: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    likes: true
                }
            }
        }
    });
}

// Получить посты конкретного пользователя
export async function getUserPosts(userId) {
    return await prisma.post.findMany({
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
            likes: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    likes: true
                }
            }
        }
    });
}

// Создать пост
export async function createPost(title, content, imageUrl, authorId) {
    const post = await prisma.post.create({
        data: {
            title,
            content,
            imageUrl,
            authorId: parseInt(authorId)
        },
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    rating: true
                }
            },
            likes: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    likes: true
                }
            }
        }
    });

    return post;
}

// Лайкнуть пост
export async function likePost(userId, postId) {
    // Проверяем существование пользователя и поста
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        throw new Error('Пользователь не найден');
    }

    const post = await prisma.post.findUnique({
        where: { id: parseInt(postId) }
    });

    if (!post) {
        throw new Error('Пост не найден');
    }

    // Проверяем, не лайкнул ли уже пользователь
    const existingLike = await prisma.like.findUnique({
        where: {
            userId_postId: {
                userId: userId,
                postId: parseInt(postId)
            }
        }
    });

    if (existingLike) {
        throw new Error('Пользователь уже лайкнул этот пост');
    }

    // Создаем лайк
    const like = await prisma.like.create({
        data: {
            userId: userId,
            postId: parseInt(postId)
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true
                }
            },
            post: true
        }
    });

    console.log(`Пользователь (ID: ${userId}) лайкнул пост: ${post.title}`);
    return like;
}

// Убрать лайк с поста
export async function unlikePost(userId, postId) {
    const like = await prisma.like.findUnique({
        where: {
            userId_postId: {
                userId: userId,
                postId: parseInt(postId)
            }
        }
    });

    if (!like) {
        throw new Error('Лайк не найден');
    }

    await prisma.like.delete({
        where: {
            userId_postId: {
                userId: userId,
                postId: parseInt(postId)
            }
        }
    });

    console.log(`Пользователь (ID: ${userId}) убрал лайк с поста: ${postId}`);
    return { message: 'Лайк удален' };
}