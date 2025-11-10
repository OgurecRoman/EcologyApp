import prisma from "../lib/prisma.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000; 

export default async function (req, res) {
  console.log("Начинаем проверку событий......");
  const now = new Date();
  
  const futureEvents = new Date(now.getTime() + ONE_DAY_MS);

  try {
    const eventsToNotify = await prisma.event.findMany({
      where: {
        date: {
          lte: futureEvents
        },
        isNotified: false,
      },
      include: { participants: true }
    });

    for (const event of eventsToNotify) {
        for (const user of event.participants){
            console.log(`[НАПОМИНАНИЕ]: Отправил напоминание для события ID: ${event.id} пользователю ${user.name}. Дата: ${event.date.toISOString()}`);
        }
        await prisma.event.update({
            where: { id: event.id },
            data: { isNotified: true }
        });
    }

    res.status(200).send('Cron Job выполнен успешно.');

  } catch (error) {
    console.error('Ошибка Cron Job:', error);
    res.status(500).send('Ошибка Cron Job.');
  }
};