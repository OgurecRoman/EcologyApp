import * as dotenv from 'dotenv';
import { Bot, Keyboard } from '@maxhub/max-bot-api';
import { addSubscriber, removeSubscriber, sendNewEventNotification } from './notification.js';

dotenv.config();

const token = process.env.BOT_TOKEN;
if (!token) {
    console.error('❌ ОШИБКА: BOT_TOKEN не найден');
    process.exit(1);
}

console.log('✅ Токен загружен');
const bot = new Bot(token);

const ECOLOGY_API_URL = 'https://ecology-app.vercel.app/events';

const EVENT_TYPES = {
    SUBBOTNIK: '🌿 Субботник',
    PAPER_COLLECTION: '📄 Сбор макулатуры',
    BATTERY_COLLECTION: '🔋 Сбор батареек',
    PLASTIC_COLLECTION: '🫙 Сбор пластика',
    MITTING: '🎯 Захват власти',
    PLANTING_TREES: '🌳 Высадка деревьев',
    OTHER: '❓ Другое'
};

// Хранилище для отслеживания последних событий
let lastEvents = [];
let lastCheckTime = new Date();

// Функция для получения событий с API
async function getEventsFromAPI() {
    try {
        console.log('📡 Запрос событий с:', ECOLOGY_API_URL);

        const response = await fetch(ECOLOGY_API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const events = await response.json();
        console.log(`✅ Получено ${events.length} событий`);
        return events;
    } catch (error) {
        console.error('❌ Ошибка при получении событий:', error);
        throw error;
    }
}

// Функция для проверки новых событий
async function checkForNewEvents() {
    try {
        console.log('🔍 Проверка новых событий...');

        const currentEvents = await getEventsFromAPI();

        if (lastEvents.length === 0) {
            // Первая проверка - просто сохраняем события
            lastEvents = currentEvents;
            console.log('📝 Первоначальная загрузка событий');
            return [];
        }

        // Находим новые события (те, которых не было в предыдущей проверке)
        const newEvents = currentEvents.filter(currentEvent =>
            !lastEvents.some(lastEvent =>
                lastEvent.id === currentEvent.id ||
                (lastEvent.name === currentEvent.name &&
                    lastEvent.date === currentEvent.date)
            )
        );

        console.log(`🆕 Найдено новых событий: ${newEvents.length}`);

        // Обновляем хранилище
        lastEvents = currentEvents;
        lastCheckTime = new Date();

        return newEvents;
    } catch (error) {
        console.error('❌ Ошибка при проверке новых событий:', error);
        return [];
    }
}

// Функция для отправки уведомлений о новых событиях
async function notifyAboutNewEvents() {
    try {
        const newEvents = await checkForNewEvents();

        if (newEvents.length === 0) {
            console.log('ℹ️ Новых событий нет');
            return;
        }

        console.log(`📢 Найдено ${newEvents.length} новых событий для уведомления`);

        // Отправляем уведомления для каждого нового события
        for (const event of newEvents) {
            console.log(`📨 Отправка уведомления о событии: "${event.name}"`);
            await sendNewEventNotification(event);

            // Небольшая пауза между отправками
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

    } catch (error) {
        console.error('❌ Ошибка при отправке уведомлений о новых событиях:', error);
    }
}

// Запускаем периодическую проверку новых событий
function startEventMonitoring() {
    const CHECK_INTERVAL = 2 * 60 * 1000; // 2 минуты

    console.log(`🕐 Запуск мониторинга событий (интервал: ${CHECK_INTERVAL/1000} секунд)`);

    // Первоначальная загрузка событий
    getEventsFromAPI().then(events => {
        lastEvents = events;
        console.log(`📝 Загружено ${events.length} событий для мониторинга`);
    });

    // Периодическая проверка
    setInterval(notifyAboutNewEvents, CHECK_INTERVAL);

    // Также проверяем каждую минуту для более оперативного оповещения
    setInterval(notifyAboutNewEvents, 60 * 1000);
}

// Команда для принудительной проверки новых событий (для тестирования)
bot.command('check_new', async (ctx) => {
    try {
        await ctx.reply('🔍 Проверяю новые события...');

        const newEvents = await checkForNewEvents();

        if (newEvents.length === 0) {
            await ctx.reply('ℹ️ Новых событий не найдено');
        } else {
            await ctx.reply(`🎉 Найдено ${newEvents.length} новых событий! Уведомления отправляются...`);

            for (const event of newEvents) {
                await sendNewEventNotification(event);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    } catch (error) {
        console.error('❌ Ошибка при ручной проверке:', error);
        await ctx.reply('❌ Ошибка при проверке новых событий');
    }
});

// Команда для просмотра статуса мониторинга
bot.command('monitor_status', async (ctx) => {
    const statusMessage = `📊 **Статус мониторинга событий**\n\n` +
        `🔍 Последняя проверка: ${lastCheckTime.toLocaleString('ru-RU')}\n` +
        `📝 Отслеживается событий: ${lastEvents.length}\n` +
        `👥 Подписчиков: ${getSubscribersCount()}\n\n` +
        `_Бот проверяет новые события каждые 1-2 минуты_`;

    await ctx.reply(statusMessage);
});

function getSubscribersCount() {
    return 0; // Заглушка
}

bot.command('test_notify', async (ctx) => {
    try {
        const testEvent = {
            name: "Тестовое событие",
            description: "Это тестовое уведомление от бота",
            type: "SUBBOTNIK",
            date: new Date().toISOString(),
            address: "Тестовый адрес",
            author: "Бот"
        };

        const results = await sendNewEventNotification(testEvent);
        ctx.reply(`✅ Тестовое уведомление отправлено! Успешно: ${results.filter(r => r.status === 'success').length}`);
    } catch (error) {
        console.error('❌ Ошибка тестового уведомления:', error);
        ctx.reply('❌ Ошибка при отправке тестового уведомления');
    }
});

// Функция для форматирования даты
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        console.error('❌ Ошибка форматирования даты:', dateString);
        return dateString;
    }
}

bot.command('start', (ctx) => {
    const chatId = ctx.update.message?.recipient?.chat_id;
    const userName = ctx.update.message?.from?.first_name || 'Пользователь';

    addSubscriber(chatId, ctx);

    const keyboard = Keyboard.inlineKeyboard([
        [
            Keyboard.button.link('📅 Запланировать событие', 'https://ecology-app.vercel.app')
        ]
    ]);

    ctx.reply(
        `Привет, ${userName}! 👋\n\n` +
        `Я создан для того, чтобы сделать нашу планету чуточку лучше! 🌍\n\n` +
        `Теперь я буду автоматически уведомлять тебя о новых событиях! 📢\n\n` +
        `Доступные команды:\n` +
        `/events - 📅 Посмотреть все события\n` +
        `/unsubscribe - 🔕 Отписаться от уведомлений\n` +
        `/monitor_status - 📊 Статус мониторинга\n` +
        `/help - ❓ Помощь по командам\n\n` +
        `Или ты можешь запланировать свое мероприятие прямо сейчас! :0`,
        {
            attachments: [keyboard]
        }
    );
});

// Команда для отписки от уведомлений
bot.command('unsubscribe', (ctx) => {
    const chatId = ctx.update.message?.recipient?.chat_id;
    const userName = ctx.update.message?.from?.first_name || 'Пользователь';

    const removed = removeSubscriber(chatId);

    if (removed) {
        ctx.reply(
            `🔕 ${userName}, ну и пожалуйста(.\n\n` +
            `Но если вдруг передумаешь, то просто тык на команду /start`
        );
    } else {
        ctx.reply(
            `ℹ️ ${userName}, так ты и не был подписан на уведомления)\n\n` +
            `Чтобы подписаться, тык на команду /start`
        );
    }
});

bot.command('help', (ctx) => {
    const keyboard = Keyboard.inlineKeyboard([
        [
            Keyboard.button.link('🌐 Тык сюда', 'https://ecology-app.vercel.app')
        ]
    ]);

    ctx.reply(
        `📋 Доступные команды:\n\n` +
        `/start - Начать работу с ботом и подписаться на уведомления\n` +
        `/unsubscribe - Отписаться от уведомлений\n` +
        `/events - Посмотреть все предстоящие события\n` +
        `/monitor_status - Показать статус мониторинга новых событий\n` +
        `/check_new - Принудительно проверить новые события\n` +
        `/help - Показать эту справку\n\n` +
        `🔔 После /start вы будете автоматически получать уведомления о новых событиях!\n\n` +
        `🌱 Бот проверяет новые события каждые 1-2 минуты автоматически!`,
        {
            attachments: [keyboard]
        }
    );
});

// Команда для просмотра событий
bot.command('events', async (ctx) => {
    try {
        console.log('🔄 Запрос событий от пользователя');

        const loadingMessage = await ctx.reply('🔄 Загружаю актуальные события...');

        const events = await getEventsFromAPI();

        const keyboard = Keyboard.inlineKeyboard([
            [
                Keyboard.button.link('📅 Запланировать своё событие', 'https://ecology-app.vercel.app')
            ]
        ]);

        if (events.length === 0) {
            await ctx.reply(
                'Пока что запланированных событий нет :9(\n\n' +
                'Но ты можешь стать первым!',
                {
                    attachments: [keyboard]
                }
            );
            return;
        }

        let message = `📅 Актуальные события (${events.length}):\n\n`;

        events.forEach((event, index) => {
            const eventType = EVENT_TYPES[event.type] || event.type;
            const eventDate = formatDate(event.date);

            message += `${index + 1}. ${event.name}\n` +
                `📝 ${event.description}\n` +
                `🏷️ ${eventType}\n` +
                `📅 ${eventDate}\n` +
                `📍 ${event.address}\n` +
                `👤 Организатор: ${event.author}\n`;

            if (index < events.length - 1) {
                message += '\n' + '─'.repeat(15) + '\n\n';
            }
        });

        message += `\n🎯 Хочешь организовать своё событие?`;

        await ctx.reply(message, {
            attachments: [keyboard]
        });

    } catch (error) {
        console.error('❌ Ошибка при получении событий:', error);

        const keyboard = Keyboard.inlineKeyboard([
            [
                Keyboard.button.link('Тык на кнопочку', 'https://ecology-app.vercel.app')
            ]
        ]);

        await ctx.reply(
            '❌ Не удалось загрузить события.\n\n' +
            'У нас технические шоколадки, попробуй немного позже',
            {
                attachments: [keyboard]
            }
        );
    }
});

bot.on('message_created', (ctx) => {
    const text = ctx.update.message?.body?.text;
    const userName = ctx.update.message?.from?.first_name || 'Пользователь';

    if (text && text.startsWith('/')) {
        return;
    }

    const keyboard = Keyboard.inlineKeyboard([
        [
            Keyboard.button.link('📅 Запланировать событие', 'https://ecology-app.vercel.app')
        ]
    ]);

    ctx.reply(
        `Привет, ${userName}! 👋\n\n` +
        `Хочешь посмотреть актуальные события?\n\n` +
        `Тык на команду /events чтобы увидеть все мероприятия!\n\n` +
        `Или можешь тыкнуть ну кнопочку ниже, чтобы запланировать свое событие!`,
        {
            attachments: [keyboard]
        }
    );
});

// Обработчик ошибок
bot.on('error', (error) => {
    console.error('❌ Ошибка бота:', error);
});

// Запуск бота и мониторинга
console.log('🚀 Запуск бота для Ecology App...');
console.log(`🌐 API источник: ${ECOLOGY_API_URL}`);

bot.start().then(() => {
    console.log('✅ Бот запущен успешно');
    console.log('📡 Бот получает события с внешнего API');
    console.log('🔔 Система уведомлений активирована');
    console.log('👁️  Запуск мониторинга новых событий');
    console.log('💬 Доступные команды:');
    console.log('   • /start - начать работу и подписаться');
    console.log('   • /events - посмотреть события');
    console.log('   • /unsubscribe - отписаться от уведомлений');
    console.log('   • /monitor_status - статус мониторинга');
    console.log('   • /check_new - принудительная проверка');
    console.log('   • /help - помощь');

    // Запускаем мониторинг после успешного старта бота
    startEventMonitoring();
}).catch(error => {
    console.error('❌ Ошибка запуска бота:', error);
});

