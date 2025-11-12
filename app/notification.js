// Хранилище контекстов подписчиков
let subscriberContexts = new Map();

const EVENT_TYPES = {
    SUBBOTNIK: '🌿 Субботник',
    PAPER_COLLECTION: '📄 Сбор макулатуры',
    BATTERY_COLLECTION: '🔋 Сбор батареек',
    PLASTIC_COLLECTION: '🫙 Сбор пластика',
    MITTING: '🎯 Захват власти',
    PLANTING_TREES: '🌳 Высадка деревьев',
    OTHER: '❓ Другое'
};

export function addSubscriber(chatId, ctx) {
    subscriberContexts.set(chatId, ctx);
    console.log(`✅ Добавлен подписчик: ${chatId}`);
    console.log(`📊 Всего подписчиков: ${subscriberContexts.size}`);
    return true;
}

export function removeSubscriber(chatId) {
    const existed = subscriberContexts.delete(chatId);
    if (existed) {
        console.log(`❌ Удален подписчик: ${chatId}`);
        console.log(`📊 Всего подписчиков: ${subscriberContexts.size}`);
    }
    return existed;
}

export function getSubscribers() {
    return Array.from(subscriberContexts.keys());
}

// Добавьте в конец notification.js
export function getSubscribersCount() {
    return subscriberContexts.size;
}

export async function sendNewEventNotification(event) {
    try {
        console.log(`📢 Отправка уведомления о событии: "${event.name}"`);
        console.log(`📊 Подписчиков для уведомления: ${subscriberContexts.size}`);

        if (subscriberContexts.size === 0) {
            console.log('ℹ️ Нет подписчиков для уведомления');
            return [];
        }

        // Форматируем дату с обработкой ошибок
        let eventDate;
        try {
            eventDate = new Date(event.date).toLocaleDateString('ru-RU');
        } catch (error) {
            console.error('❌ Ошибка форматирования даты:', event.date);
            eventDate = event.date || 'Дата не указана';
        }

        const eventType = EVENT_TYPES[event.type] || event.type;

        const message = `🎉 **НОВОЕ СОБЫТИЕ!**\n\n` +
            `**${event.name}**\n` +
            `📝 ${event.description}\n` +
            `🏷️ ${eventType}\n` +
            `📅 ${eventDate}\n` +
            `📍 ${event.address}\n` +
            `👤 Организатор: ${event.author}\n\n` +
            `_Вы получили это уведомление, потому что подписаны на новые события._\n` +
            `_Чтобы отписаться, используйте /unsubscribe_`;

        console.log(`📝 Текст уведомления подготовлен, отправка...`);

        // Отправляем уведомление всем подписчикам
        const results = [];
        const subscribers = Array.from(subscriberContexts.entries());

        for (const [chatId, ctx] of subscribers) {
            try {
                await ctx.reply(message);
                results.push({ chatId, status: 'success' });
                console.log(`✅ Уведомление отправлено в чат ${chatId}`);

                // Небольшая задержка между отправками чтобы не превысить лимиты
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`❌ Ошибка отправки в чат ${chatId}:`, error.message);

                // Если пользователь заблокировал бота, удаляем его из подписчиков
                if (error.message.includes('blocked') ||
                    error.message.includes('not found') ||
                    error.message.includes('Forbidden')) {
                    console.log(`🗑️ Удаляем недоступного подписчика: ${chatId}`);
                    removeSubscriber(chatId);
                }
                results.push({ chatId, status: 'error', error: error.message });
            }
        }

        console.log(`📊 Итоги отправки: ${results.filter(r => r.status === 'success').length}/${results.length} успешно`);
        return results;

    } catch (error) {
        console.error('❌ Критическая ошибка при отправке уведомлений:', error);
        throw error;
    }
}