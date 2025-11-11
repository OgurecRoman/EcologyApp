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

export async function postEvents(name, description, type, date, address, city, author, participantIds = []) {
    const fullAddress = city ? `${city}, ${address}`.trim() : address;

    return await prisma.event.create({
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
}

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