import prisma from "../lib/prisma.js";
import { shouldResetRating } from '../utils/periodUtils.js';

export async function getEvents(filters = {}) {
    console.log('Фильтры (service):', filters);
    const where = {};

    if (Array.isArray(filters.types) && filters.types.length > 0) {
        where.type = { in: filters.types };
    }

    if (filters.city) {
        where.address = { contains: filters.city, mode: 'insensitive' };
    }

    return await prisma.event.findMany({
        where,
        orderBy: { date: 'asc' }
        // Убираем include, если отношение не настроено
    });
};


export async function getMyEvents(userId) {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        include: { events: true }
    });

    if (!user) {
        throw new Error('Пользователь не найден');
    }

    return user.events;
};

export async function postEvents(name, description, type, date, address, author) {
    // Валидация типа события
    const validTypes = ['SUBBOTNIK', 'PAPER_COLLECTION', 'BATTERY_COLLECTION', 'PLASTIC_COLLECTION', 'GLASS_COLLECTION', 'ELECTRONICS_COLLECTION', 'OTHER'];

    if (!validTypes.includes(type)) {
        throw new Error(`Неверный тип события. Допустимые значения: ${validTypes.join(', ')}`);
    }

    try {
        const event = await prisma.event.create({
            data: {
                name,
                description,
                type: type,
                date: new Date(date),
                address: address,
                author
            }
            // Убираем include, так как при создании события участников еще нет
        });

        return event;
    } catch (error) {
        console.error('Ошибка при создании события в БД:', error);
        throw error;
    }
};

// Функция для определения баллов по типу события
function getRatingPointsByEventType(eventType) {
    const ratingPoints = {
        'SUBBOTNIK': 10,
        'PAPER_COLLECTION': 3,
        'BATTERY_COLLECTION': 3,
        'PLASTIC_COLLECTION': 3,
        'GLASS_COLLECTION': 3,
        'ELECTRONICS_COLLECTION': 3,
        'OTHER': 1
    };

    return ratingPoints[eventType] || 1; // По умолчанию 1 балл
}

export async function joinEvent(userId, eventId) {
    console.log('=== JOIN EVENT SERVICE ===');
    console.log('userId:', userId, 'eventId:', eventId);

    try {
        // Проверяем существование пользователя
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        console.log('User found:', user);

        if (!user) {
            throw new Error('Пользователь не найден');
        }

        // Проверяем существование события
        const event = await prisma.event.findUnique({
            where: { id: eventId }
        });

        console.log('Event found:', event);

        if (!event) {
            throw new Error('Событие не найдено');
        }

        // Проверяем, не участвует ли уже пользователь в событии
        const userWithEvents = await prisma.user.findUnique({
            where: { id: userId },
            include: { events: true }
        });

        const isAlreadyParticipant = userWithEvents.events.some(event => event.id === eventId);
        console.log('Is already participant:', isAlreadyParticipant);

        if (isAlreadyParticipant) {
            throw new Error('Пользователь уже участвует в этом событии');
        }

        // Определяем количество баллов за это событие
        const ratingPoints = getRatingPointsByEventType(event.type);
        console.log(`Event type: ${event.type}, Rating points: ${ratingPoints}`);

        // Проверяем, не нужно ли сбросить рейтинг из-за смены периода
        let newRating = user.rating;
        const currentTime = new Date();

        if (shouldResetRating(user.lastActivity)) {
            // Сбрасываем рейтинг и начинаем новый период
            newRating = ratingPoints;
            console.log(`Rating reset to ${newRating} (new period started)`);
        } else {
            // Увеличиваем рейтинг в текущем периоде на баллы за событие
            newRating = user.rating + ratingPoints;
            console.log(`Rating increased from ${user.rating} to ${newRating}`);
        }

        // Обновляем пользователя, добавляя событие и обновляя рейтинг
        console.log('Updating user...');
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                events: {
                    connect: { id: eventId }
                },
                rating: newRating,
                lastActivity: currentTime  // Обновляем время последней активности
            },
            include: { events: true }
        });

        console.log('User updated successfully. New rating:', updatedUser.rating);
        console.log('Last activity:', updatedUser.lastActivity);
        console.log('User events count:', updatedUser.events.length);

        return event;

    } catch (error) {
        console.error('Error in joinEvent service:', error);
        console.error('Prisma error code:', error.code);
        console.error('Prisma error meta:', error.meta);
        throw error;
    }
};

export async function joinEvent(userId, eventId) {
    const updatedEvent = await prisma.event.update({
      where: {
        id: eventId,
      },
      data: {
        participants: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        participants: true,
      },
    });

    console.log(`Пользователь (ID: ${userId}) успешно присоединился к событию: ${updatedEvent.name}`);
    return updatedEvent;
};

export async function patchEvents(id, data) {
    return await prisma.event.update({
        where: { id },
        data
    });
}

export async function deleteEvents(id) {
    await prisma.event.delete({
        where: { id }
    });
}
