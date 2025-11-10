import prisma from "../lib/prisma.js";

export async function postUser() {
    await prisma.user.create({
        data: {
            username: "Соня",
        },
    });
    await prisma.user.create({
        data: {
            username: "Настя",
        },
    });
    console.log("Добавили юзеров");

};