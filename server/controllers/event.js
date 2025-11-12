import { sendNewEventNotification } from '../notification.js';

export const postEvents = async (req, res) => {
    try {
        const { name, description, type, date, address, author } = req.body;

        if (!name || !description || !type || !date || !address || !author) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        // Создаем событие
        const event = await prisma.event.create({
            data: {
                name,
                description,
                type,
                date: new Date(date),
                address,
                author
            }
        });

        // Отправляем уведомление всем подписчикам (асинхронно)
        sendNewEventNotification(event)
            .then(results => {
                const successCount = results.filter(r => r.status === 'success').length;
                console.log(`📢 Уведомления отправлены: ${successCount}/${results.length} успешно`);
            })
            .catch(error => {
                console.error('❌ Ошибка отправки уведомлений:', error);
            });

        res.status(201).json(event);
    } catch (error) {
        console.error('Ошибка при создании события:', error);
        res.status(500).json({ error: 'Ошибка при создании события' });
    }
};
