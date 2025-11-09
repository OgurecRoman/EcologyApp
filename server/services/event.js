import prisma from "../lib/prisma.js";

export async function getEvents(filters = {}) {
    const events = await prisma.event.findMany({
        where: filters,
        orderBy: { date: 'asc' },
        include: { participants: true }
    });

    return events;
};

export async function postEvents(name, description, type, date, address, author, participantIds) {
    const event = await prisma.event.create({
        data: {
            name,
            description,
            type,
            date: new Date(date),
            address,
            author,
            participants: participantIds ? { connect: participantIds.map(id => ({ id })) } : undefined  // Связываем участников по ID
        },
        include: { participants: true }
    });

    return event;
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
    const event = await prisma.event.delete({
        where: { id: id }
    });
    
    return event;
};