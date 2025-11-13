import * as dotenv from 'dotenv';
import { Bot, Keyboard } from '@maxhub/max-bot-api';
import { addSubscriber, removeSubscriber, sendNewEventNotification, getSubscribersCount } from './notification.js';

dotenv.config();

const token = process.env.BOT_TOKEN;
if (!token) {
    console.error('❌ ОШИБКА: BOT_TOKEN не найден');
    process.exit(1);
}

console.log('✅ Токен загружен');
const bot = new Bot(token);

const ECOLOGY_API_URL = 'https://ecology-app-test.vercel.app/events';

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
let isMonitoringActive = true;

// Улучшенная функция для получения событий с API
async function getEventsFromAPI() {
    try {
        console.log('📡 Запрос событий с:', ECOLOGY_API_URL);

        const response = await fetch(ECOLOGY_API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'EcologyBot/1.0'
            },
            timeout: 10000 // 10 секунд таймаут
        });

        if (!response.ok) {
            console.error(`❌ HTTP ошибка: ${response.status} ${response.statusText}`);

            // Попробуем получить текст ошибки
            const errorText = await response.text();
            console.error(`❌ Текст ошибки: ${errorText.substring(0, 200)}...`);

            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Сначала получаем текст, чтобы проверить формат
        const responseText = await response.text();
        console.log(`📄 Получен ответ, длина: ${responseText.length} символов`);

        // Проверяем, не HTML ли это
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
            console.error('❌ API вернул HTML вместо JSON. Возможно, неправильный URL или CORS ошибка');
            console.error('🔍 Первые 500 символов ответа:', responseText.substring(0, 500));
            return [];
        }

        // Пытаемся распарсить JSON
        let events;
        try {
            events = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ Ошибка парсинга JSON:', parseError.message);
            console.error('🔍 Ответ сервера:', responseText.substring(0, 500));
            return [];
        }

        // Проверяем, что events - массив
        if (!Array.isArray(events)) {
            console.error('❌ API вернул не массив событий:', typeof events);
            console.error('🔍 Ответ:', events);
            return [];
        }

        console.log(`✅ Получено ${events.length} событий`);
        return events;
    } catch (error) {
        console.error('❌ Ошибка при получении событий:', error.message);

        // Если это не таймаут, выводим полную ошибку
        if (!error.message.includes('timeout')) {
            console.error('🔍 Детали ошибки:', error);
        }

        return [];
    }
}

// Функция для сравнения событий
function findNewEvents(currentEvents, previousEvents) {
    if (!Array.isArray(currentEvents) || !Array.isArray(previousEvents)) {
        return [];
    }

    // Если это первая проверка, нет новых событий
    if (previousEvents.length === 0) {
        console.log('📝 Первая проверка, загружаем события без уведомлений');
        return [];
    }

    const newEvents = [];

    for (const currentEvent of currentEvents) {
        // Ищем событие с таким же ID
        const existingById = previousEvents.find(prev =>
            prev.id && currentEvent.id && prev.id === currentEvent.id
        );

        // Или ищем по названию и дате (на случай если ID нет или отличается)
        const existingByNameAndDate = previousEvents.find(prev =>
            prev.name === currentEvent.name &&
            prev.date === currentEvent.date &&
            prev.author === currentEvent.author
        );

        // Если события нет в предыдущем списке - оно новое
        if (!existingById && !existingByNameAndDate) {
            newEvents.push(currentEvent);
            console.log(`🆕 Обнаружено новое событие: "${currentEvent.name}"`);
        }
    }

    return newEvents;
}

// Улучшенная функция для проверки новых событий
async function checkForNewEvents() {
    try {
        console.log('🔍 Проверка новых событий...');

        const currentEvents = await getEventsFromAPI();

        // Добавляем подробное логирование
        console.log(`📊 Текущие события: ${currentEvents.length}, Последние события: ${lastEvents.length}`);

        // Если это первая проверка, просто сохраняем события
        if (lastEvents.length === 0) {
            console.log('📝 Первая проверка, сохраняем события без уведомлений');
            lastEvents = currentEvents;
            lastCheckTime = new Date();
            return [];
        }

        // Создаем уникальные идентификаторы для событий для сравнения
        const createEventSignature = (event) => {
            return `${event.name}-${event.date}-${event.author}`;
        };

        const lastEventSignatures = new Set(lastEvents.map(createEventSignature));
        const newEvents = [];

        for (const event of currentEvents) {
            const signature = createEventSignature(event);
            if (!lastEventSignatures.has(signature)) {
                newEvents.push(event);
                console.log(`🆕 Обнаружено новое событие: "${event.name}"`);
            }
        }

        console.log(`📊 Статистика: было ${lastEvents.length}, сейчас ${currentEvents.length}, новых: ${newEvents.length}`);

        // Логируем названия новых событий
        if (newEvents.length > 0) {
            console.log('🎯 Новые события:', newEvents.map(e => e.name).join(', '));
        }

        // Обновляем хранилище
        lastEvents = currentEvents;
        lastCheckTime = new Date();

        return newEvents;
    } catch (error) {
        console.error('❌ Ошибка при проверке новых событий:', error);
        return [];
    }
}

// Улучшенная функция для отправки уведомлений о новых событиях
async function notifyAboutNewEvents() {
    try {
        if (!isMonitoringActive) {
            console.log('⏸️ Мониторинг не активен, пропускаем проверку');
            return;
        }

        console.log('🔄 Запуск автоматической проверки новых событий...');
        const newEvents = await checkForNewEvents();

        if (newEvents.length === 0) {
            console.log('ℹ️ Новых событий нет');
            return;
        }

        console.log(`📢 Найдено ${newEvents.length} новых событий для уведомления`);

        // Отправляем уведомления для каждого нового события
        for (const event of newEvents) {
            console.log(`📨 Отправка уведомления о событии: "${event.name}"`);
            try {
                await sendNewEventNotification(event);
                console.log(`✅ Уведомление о "${event.name}" отправлено успешно`);
            } catch (error) {
                console.error(`❌ Ошибка отправки уведомления о "${event.name}":`, error);
            }

            // Пауза между отправками
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('✅ Автоматическая отправка уведомлений завершена');

    } catch (error) {
        console.error('❌ Критическая ошибка при отправке уведомлений о новых событиях:', error);
    }
}

// Команда для принудительного обновления кэша событий
bot.command('force_refresh', async (ctx) => {
    try {
        await ctx.reply('🔄 Принудительное обновление кэша событий...');

        const oldCount = lastEvents.length;
        const events = await getEventsFromAPI();
        lastEvents = events;
        lastCheckTime = new Date();

        await ctx.reply(`✅ Кэш обновлен! Было: ${oldCount}, стало: ${events.length}\n\nСледующая проверка будет сравнивать с новым списком.`);

        // Немедленно проверяем новые события после обновления кэша
        setTimeout(() => {
            notifyAboutNewEvents();
        }, 2000);

    } catch (error) {
        console.error('❌ Ошибка при обновлении кэша:', error);
        await ctx.reply('❌ Ошибка при обновлении кэша событий');
    }
});

// Запускаем периодическую проверку новых событий
function startEventMonitoring() {
    const CHECK_INTERVAL = 60 * 1000; // 1 минута

    console.log(`🕐 Запуск мониторинга событий (интервал: ${CHECK_INTERVAL/1000} секунд)`);

    // Включаем мониторинг по умолчанию
    isMonitoringActive = true;

    // Первоначальная загрузка событий
    getEventsFromAPI().then(events => {
        lastEvents = events;
        console.log(`📝 Загружено ${events.length} событий для мониторинга`);
        console.log('✅ Мониторинг активирован по умолчанию');

        // Логируем первые несколько событий для отладки
        if (events.length > 0) {
            console.log('📋 Первые 3 события для мониторинга:');
            events.slice(0, 3).forEach((event, index) => {
                console.log(`  ${index + 1}. ${event.name} (${event.date})`);
            });
        }
    }).catch(error => {
        console.error('❌ Ошибка при первоначальной загрузке событий:', error);
    });

    // Периодическая проверка
    const intervalId = setInterval(() => {
        if (isMonitoringActive) {
            console.log(`🔄 Автоматическая проверка (интервал ${CHECK_INTERVAL/1000}с)`);
            notifyAboutNewEvents();
        } else {
            console.log('⏸️ Мониторинг отключен, пропускаем проверку');
        }
    }, CHECK_INTERVAL);

    console.log('🔔 Автоматические уведомления включены по умолчанию');

    // Сохраняем ID интервала для возможной остановки
    monitoringIntervalId = intervalId;
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

// Команда для тестирования API
bot.command('test_api', async (ctx) => {
    try {
        await ctx.reply('🧪 Тестирую подключение к API...');

        console.log('🧪 Тестирование API...');
        const events = await getEventsFromAPI();

        if (events.length === 0) {
            await ctx.reply('❌ Не удалось получить события с API. Проверьте URL и доступность сервера.');
        } else {
            await ctx.reply(`✅ API работает! Получено ${events.length} событий:\n\n` +
                events.map(event => `• ${event.name}`).join('\n'));
        }
    } catch (error) {
        console.error('❌ Ошибка тестирования API:', error);
        await ctx.reply('❌ Ошибка при тестировании API');
    }
});

// Тестовая функция для проверки автоматических уведомлений
let testIntervalId = null;

function startTestNotifications() {
    let counter = 1;

    console.log('🧪 Запуск тестовых уведомлений каждые 10 секунд');

    testIntervalId = setInterval(async () => {
        try {
            const testEvent = {
                name: `Тестовое событие #${counter}`,
                description: `Это автоматическое тестовое уведомление #${counter}`,
                type: "SUBBOTNIK",
                date: new Date().toISOString(),
                address: "Тестовый адрес",
                author: "Авто-тест"
            };

            console.log(`🧪 Отправка тестового уведомления #${counter}`);
            const results = await sendNewEventNotification(testEvent);
            console.log(`🧪 Тест #${counter} завершен. Успешно: ${results.filter(r => r.status === 'success').length}`);

            counter++;

            // Останавливаем после 5 тестов
            if (counter > 5) {
                stopTestNotifications();
                console.log('🧪 Тестирование завершено (5 уведомлений отправлено)');
            }
        } catch (error) {
            console.error('❌ Ошибка в тестовом уведомлении:', error);
        }
    }, 10000); // 10 секунд
}

function stopTestNotifications() {
    if (testIntervalId) {
        clearInterval(testIntervalId);
        testIntervalId = null;
        console.log('🧪 Тестовые уведомления остановлены');
    }
}
// Команда для запуска тестовых уведомлений
bot.command('test_auto', async (ctx) => {
    if (testIntervalId) {
        await ctx.reply('⚠️ Тестовые уведомления уже запущены');
        return;
    }

    await ctx.reply('🧪 Запускаю тестовые уведомления...\n\nБот будет отправлять тестовые события каждые 10 секунд (всего 5 раз)');
    startTestNotifications();
});

// Команда для остановки тестовых уведомлений
bot.command('test_stop', async (ctx) => {
    if (!testIntervalId) {
        await ctx.reply('ℹ️ Тестовые уведомления не запущены');
        return;
    }

    stopTestNotifications();
    await ctx.reply('✅ Тестовые уведомления остановлены');
});

// Команда для проверки статуса теста
bot.command('test_status', async (ctx) => {
    const status = testIntervalId ? '✅ Активен' : '❌ Неактивен';
    await ctx.reply(`🧪 Статус тестовых уведомлений: ${status}`);
});


// Команда для просмотра статуса мониторинга
bot.command('monitor_status', async (ctx) => {
    const eventExamples = lastEvents.slice(0, 3).map((e, i) =>
        `${i + 1}. ${e.name} (${new Date(e.date).toLocaleDateString('ru-RU')})`
    ).join('\n') || 'Нет событий';

    const statusMessage = `📊 **Статус мониторинга событий**\n\n` +
        `🔍 Последняя проверка: ${lastCheckTime.toLocaleString('ru-RU')}\n` +
        `📝 Отслеживается событий: ${lastEvents.length}\n` +
        `👥 Подписчиков: ${getSubscribersCount()}\n` +
        `🔔 Автоматические уведомления: ${isMonitoringActive ? '✅ ВКЛ' : '❌ ВЫКЛ'}\n\n` +
        `📋 Примеры отслеживаемых событий:\n${eventExamples}\n\n` +
        `_Бот проверяет новые события каждую минуту_`;

    await ctx.reply(statusMessage);
});
// Команда для включения/выключения мониторинга
bot.command('toggle_monitor', async (ctx) => {
    isMonitoringActive = !isMonitoringActive;
    const status = isMonitoringActive ? 'включен' : 'выключен';
    const emoji = isMonitoringActive ? '✅' : '❌';

    await ctx.reply(`${emoji} Автоматический мониторинг событий **${status}**`);
    console.log(`🔔 Мониторинг ${status} пользователем`);
});

// Команда для сброса кэша событий
bot.command('reset_events', async (ctx) => {
    const oldCount = lastEvents.length;
    lastEvents = [];
    const events = await getEventsFromAPI();
    lastEvents = events;

    await ctx.reply(`🔄 Кэш событий сброшен! Было: ${oldCount}, сейчас: ${events.length}`);
});

// Тестовая команда для проверки уведомлений
bot.command('test_notify', async (ctx) => {
    try {
        const testEvent = {
            name: "Тестовое событие " + new Date().toLocaleTimeString(),
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

// Остальной код бота (start, help, events и т.д.) остается без изменений
// ... [остальной код из предыдущего примера] ...

// Команда /start
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
        `/check_new - 🔍 Принудительная проверка\n` +
        `/test_api - 🧪 Проверить API\n` +
        `/help - ❓ Помощь по командам\n\n` +
        `Или ты можешь запланировать свое мероприятие прямо сейчас! :0`,
        {
            attachments: [keyboard]
        }
    );
});

// Команда /help
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
        `/test_api - Проверить работу API\n` +
        `/reset_events - Сбросить кэш событий (если что-то сломалось)\n` +
        `/help - Показать эту справку\n\n` +
        `🔔 После /start вы будете автоматически получать уведомления о новых событиях!\n\n` +
        `🌱 Бот проверяет новые события каждую минуту автоматически!`,
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

// Обработчик текстовых сообщений
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
    console.log('   • /test_api - тест API');
    console.log('   • /reset_events - сброс кэша');
    console.log('   • /help - помощь');

    // Запускаем мониторинг после успешного старта бота
    startEventMonitoring();
}).catch(error => {
    console.error('❌ Ошибка запуска бота:', error);
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