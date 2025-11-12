import prisma from "../lib/prisma.js";

export async function getEvents(filters = []) {
    const whereCondition = {};
    
    if (filters && filters.length > 0) {
        whereCondition.type = {
            in: filters
        };
    }

    const events = await prisma.event.findMany({
        where: whereCondition,
        orderBy: { date: 'asc' },
        include: { participants: true }
    });

    return events;
};

export async function getMyEvents(userId) {
    let user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        include: { events: true }
    });
    
    return user.events;
};

export async function postEvents(name, description, type, date, address, author) {
    const event = await prisma.event.create({
        data: {
            name,
            description,
            type,
            date: new Date(date),
            address,
            author
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
    const event = await prisma.event.update({
        where: {id: id},
        data,
        include: { participants: true }
    });

    return event;
};

export async function deleteEvents(id) {
    await prisma.event.delete({
        where: { id: id }
    });
};