// services/user.js
import prisma from "../lib/prisma.js";
import { updateUserActivity, shouldResetRating } from '../utils/periodUtils.js';

export async function getUser(id, name) {
    try {
        console.log(`🔍 Поиск пользователя: id=${id}, name=${name}`);

        let user;

        if (id) {
            user = await prisma.user.findUnique({
                where: { id: id },
                include: {
                    events: true,
                    followers: true,
                    following: true
                }
            });
        }

        if (!user && name) {
            user = await prisma.user.findFirst({
                where: {
                    username: {
                        contains: name,
                        mode: 'insensitive'
                    }
                },
                include: {
                    events: true,
                    followers: true,
                    following: true
                }
            });
        }

        if (!user && id) {
            console.log(`🆕 Пользователь с id=${id} не найден, создаем нового`);
            user = await postUser(id, name);
        }

        return user;
    } catch (error) {
        console.error('❌ Ошибка в getUser service:', error);
        throw error;
    }
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

export async function getTopUsers(limit = 10) {
    try {
        console.log(`🔍 Поиск топ ${limit} пользователей по рейтингу`);

        const topUsers = await prisma.user.findMany({
            take: limit,
            orderBy: {
                rating: 'desc'
            },
            select: {
                id: true,
                username: true,
                rating: true,
                createdAt: true
            }
        });

        console.log(`📊 Найдено ${topUsers.length} пользователей`);
        return topUsers;
    } catch (error) {
        console.error('❌ Ошибка в getTopUsers service:', error);
        throw error;
    }
}
