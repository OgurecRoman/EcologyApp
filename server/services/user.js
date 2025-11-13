import prisma from "../lib/prisma.js";
import { updateUserActivity, shouldResetRating } from '../utils/periodUtils.js';

export async function getUser(id, name) {
    let user = await prisma.user.findUnique({
        where: { id: id },
        include: { events: true }
    });

    if (!user){
        user = await postUser(id, name);
    } else {
        // Проверяем, не нужно ли сбросить рейтинг
        if (shouldResetRating(user.lastActivity)) {
            user = await prisma.user.update({
                where: { id: id },
                data: {
                    rating: 0,
                    lastActivity: new Date()
                },
                include: { events: true }
            });
        }
    }

    return user;
};

export async function postUser(id, name) {
    const user = await prisma.user.create({
        data: {
            id: id,
            username: name,
            rating: 0,
            lastActivity: new Date()  // Устанавливаем время создания
        },
        include: { events: true }
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
