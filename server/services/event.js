import prisma from "../lib/prisma.js";

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
        orderBy: { date: 'asc' },
        include: { participants: true }
    });
}

export async function getMyEvents(userId) {
    let user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        include: { events: true }
    });
    
    return user.events;
};

export async function postEvents(name, description, type, date, address, city, author) {
    const fullAddress = city ? `${city}, ${address}`.trim() : address;
    const event = await prisma.event.create({
        data: {
            name,
            description,
            type,
            date: new Date(date),
            address: fullAddress,
            author,
            participants: participantIds.length > 0
                ? { connect: participantIds.map(id => ({ id })) }
                : undefined
        },
        include: { participants: true }
    });

    return event;
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
        data,
        include: { participants: true }
    });
}

export async function deleteEvents(id) {
    await prisma.event.delete({
        where: { id }
    });
}