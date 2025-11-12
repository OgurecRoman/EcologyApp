import * as dotenv from 'dotenv';
import express from 'express';
import { Bot, Keyboard } from '@maxhub/max-bot-api';
import { Client } from 'pg';

// Загружаем .env
dotenv.config({ path: '../.env' });

const token = process.env.BOT_TOKEN;
if (!token) {
    console.error('❌ ОШИБКА: BOT_TOKEN не найден');
    process.exit(1);
}

console.log('✅ Токен загружен');

// Подключаемся к PostgreSQL
const client = new Client({
    connectionString: process.env.DATABASE_URL
});

// Функция для подключения к базе
async function connectDB() {
    try {
        await client.connect();
        console.log('✅ Подключение к PostgreSQL установлено');
    } catch (error) {
        console.error('❌ Ошибка подключения к PostgreSQL:', error);
        process.exit(1);
    }
}

connectDB();

const bot = new Bot(token);

// Хранилище состояний пользователей
const userStates = new Map();

// Типы событий
const EVENT_TYPES = {
    SUBBOTNIK: 'Субботник',
    PAPER_COLLECTION: 'Сбор макулатуры',
    BATTERY_COLLECTION: 'Сбор батареек',
    PLASTIC_COLLECTION: 'Сбор пластика',
    MITTING: 'Захват власти',
    PLANTING_TREES: 'Высадка деревьев',
    OTHER: 'Другое'
};

// Типы состояний
const USER_STATES = {
    AWAITING_MESSAGE: 'awaiting_message',
    ASKED_PARTICIPATION: 'asked_participation',
    ADDING_EVENT: 'adding_event',
    IDLE: 'idle'
};

// Шаги создания события
const EVENT_STEPS = {
    NAME: 'name',
    DESCRIPTION: 'description',
    TYPE: 'type',
    DATE: 'date',
    ADDRESS: 'address'
};

// Функция для создания клавиатуры
function createEventKeyboard(showBack = false) {
    const buttons = [];
    if (showBack) {
        buttons.push([Keyboard.button.callback('◀️ Назад', 'back_button', { intent: 'default' })]);
    }
    buttons.push([Keyboard.button.callback('❌ Отменить создание', 'cancel_button', { intent: 'default' })]);
    return Keyboard.inlineKeyboard(buttons);
}

// Клавиатура для участия
const participationKeyboard = Keyboard.inlineKeyboard([
    [
        Keyboard.button.callback('не хочу', 'dont_want', { intent: 'default' }),
        Keyboard.button.link('хочу', 'https://max.ru/t211_hakaton_bot?startapp')
    ],
]);

// Функции для работы с базой данных напрямую
async function getAllEvents() {
    try {
        const result = await client.query(`
            SELECT * FROM "Event" 
            ORDER BY date ASC
        `);
        return result.rows;
    } catch (error) {
        console.error('Ошибка при получении событий:', error);
        throw error;
    }
}

async function createEvent(eventData) {
    try {
        const result = await client.query(`
            INSERT INTO "Event" (name, description, type, date, address, author, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING *
        `, [
            eventData.name,
            eventData.description,
            eventData.type,
            new Date(eventData.date),
            eventData.address,
            eventData.author
        ]);
        return result.rows[0];
    } catch (error) {
        console.error('Ошибка при создании события:', error);
        throw error;
    }
}

// Команда /start
bot.command('start', (ctx) => {
    const chatId = ctx.update.message?.recipient?.chat_id;
    const userName = ctx.update.message?.from?.first_name || 'Пользователь';

    userStates.set(chatId, { state: USER_STATES.AWAITING_MESSAGE });

    ctx.reply(`Привет, ${userName}! 👋\n\nЯ бот для экологических мероприятий!\n\nДоступные команды:\n/start - начать работу\n/addevent - добавить событие\n/events - посмотреть все события\n/help - помощь\n\nНапишите любое сообщение, чтобы продолжить.`);
});

// Команда /help
bot.command('help', (ctx) => {
    ctx.reply(`📋 **Доступные команды:**\n\n` +
        `/start - Начать работу с ботом\n` +
        `/addevent - Добавить новое событие\n` +
        `/events - Посмотреть все предстоящие события\n` +
        `/help - Показать эту справку`);
});

// Команда /addevent
bot.command('addevent', (ctx) => {
    const chatId = ctx.update.message?.recipient?.chat_id;
    const userName = ctx.update.message?.from?.first_name || 'Аноним';

    userStates.set(chatId, {
        state: USER_STATES.ADDING_EVENT,
        step: EVENT_STEPS.NAME,
        eventData: { author: userName },
        previousSteps: []
    });

    const keyboard = createEventKeyboard(false);
    ctx.reply('Отлично! Давайте создадим новое экологическое событие. 🍃\n\n**Шаг 1 из 5**\nВведите название события:', {
        attachments: [keyboard]
    });
});

// Команда /events
bot.command('events', async (ctx) => {
    try {
        const events = await getAllEvents();

        if (events.length === 0) {
            ctx.reply('📅 На данный момент нет запланированных событий.\n\nХотите создать первое событие? Используйте команду /addevent');
            return;
        }

        let message = '📅 **Предстоящие события:**\n\n';
        events.forEach((event, index) => {
            const date = new Date(event.date).toLocaleDateString('ru-RU');
            const type = EVENT_TYPES[event.type] || event.type;

            message += `**${index + 1}. ${event.name}**\n` +
                `📝 ${event.description}\n` +
                `🏷️ Тип: ${type}\n` +
                `📅 Дата: ${date}\n` +
                `📍 Адрес: ${event.address}\n` +
                `👤 Организатор: ${event.author}\n\n`;
        });

        ctx.reply(message);
    } catch (error) {
        console.error('Ошибка при получении событий:', error);
        ctx.reply('❌ Произошла ошибка при получении списка событий.');
    }
});

// Обработчик текстовых сообщений
bot.on('message_created', async (ctx) => {
    const chatId = ctx.update.message?.recipient?.chat_id;
    const text = ctx.update.message?.body?.text;
    const userName = ctx.update.message?.from?.first_name || 'Пользователь';

    if (text && text.startsWith('/')) return;

    const userState = userStates.get(chatId);
    if (!userState) {
        ctx.reply('Для начала работы с ботом отправьте команду /start');
        return;
    }

    if (userState.state === USER_STATES.ADDING_EVENT) {
        await handleEventCreation(ctx, chatId, text, userState);
        return;
    }

    if (userState.state === USER_STATES.AWAITING_MESSAGE) {
        userStates.set(chatId, { state: USER_STATES.ASKED_PARTICIPATION });
        ctx.reply(`Приятно познакомиться, ${userName}! 😊\n\nХотите ли вы принять участие в экологических мероприятиях?`, {
            attachments: [participationKeyboard]
        });
    } else if (userState.state === USER_STATES.ASKED_PARTICIPATION) {
        ctx.reply('Вы уже получили вопрос об участии. Пожалуйста, используйте кнопки выше для ответа. 👍');
    }
});

// Функция создания события (использует прямой SQL)
async function handleEventCreation(ctx, chatId, text, userState) {
    const eventData = userState.eventData;
    const currentStep = userState.step;
    const previousSteps = userState.previousSteps || [];

    try {
        switch (currentStep) {
            case EVENT_STEPS.NAME:
                if (!text?.trim()) {
                    ctx.reply('❌ Название не может быть пустым. Введите название события:', {
                        attachments: [createEventKeyboard(false)]
                    });
                    return;
                }
                eventData.name = text.trim();
                previousSteps.push(EVENT_STEPS.NAME);
                userStates.set(chatId, { ...userState, step: EVENT_STEPS.DESCRIPTION, previousSteps });
                ctx.reply('**Шаг 2 из 5**\nОтлично! Теперь введите описание события:', {
                    attachments: [createEventKeyboard(true)]
                });
                break;

            case EVENT_STEPS.DESCRIPTION:
                if (!text?.trim()) {
                    ctx.reply('❌ Описание не может быть пустым. Введите описание события:', {
                        attachments: [createEventKeyboard(true)]
                    });
                    return;
                }
                eventData.description = text.trim();
                previousSteps.push(EVENT_STEPS.DESCRIPTION);
                userStates.set(chatId, { ...userState, step: EVENT_STEPS.TYPE, previousSteps });
                ctx.reply('**Шаг 3 из 5**\nВыберите тип события:\n\n1. Субботник\n2. Сбор макулатуры\n3. Сбор батареек\n4. Сбор пластика\n5. Захват власти\n6. Высадка деревьев\n7. Другое\n\nВведите номер типа:', {
                    attachments: [createEventKeyboard(true)]
                });
                break;

            case EVENT_STEPS.TYPE:
                const typeMap = {
                    '1': 'SUBBOTNIK', '2': 'PAPER_COLLECTION', '3': 'BATTERY_COLLECTION',
                    '4': 'PLASTIC_COLLECTION', '5': 'MITTING', '6': 'PLANTING_TREES', '7': 'OTHER'
                };
                const typeKey = typeMap[text];
                if (!typeKey) {
                    ctx.reply('❌ Пожалуйста, введите номер от 1 до 7', {
                        attachments: [createEventKeyboard(true)]
                    });
                    return;
                }
                eventData.type = typeKey;
                previousSteps.push(EVENT_STEPS.TYPE);
                userStates.set(chatId, { ...userState, step: EVENT_STEPS.DATE, previousSteps });
                ctx.reply('**Шаг 4 из 5**\nВведите дату события в формате ДД.ММ.ГГГГ (например, 25.12.2024):', {
                    attachments: [createEventKeyboard(true)]
                });
                break;

            case EVENT_STEPS.DATE:
                const dateMatch = text.match(/(\d{2})\.(\d{2})\.(\d{4})/);
                if (!dateMatch) {
                    ctx.reply('❌ Неверный формат даты. Используйте ДД.ММ.ГГГГ (например, 25.12.2024)', {
                        attachments: [createEventKeyboard(true)]
                    });
                    return;
                }
                const [_, day, month, year] = dateMatch;
                const dateObj = new Date(`${year}-${month}-${day}`);
                if (isNaN(dateObj.getTime())) {
                    ctx.reply('❌ Неверная дата. Проверьте правильность ввода', {
                        attachments: [createEventKeyboard(true)]
                    });
                    return;
                }
                eventData.date = dateObj.toISOString();
                previousSteps.push(EVENT_STEPS.DATE);
                userStates.set(chatId, { ...userState, step: EVENT_STEPS.ADDRESS, previousSteps });
                ctx.reply('**Шаг 5 из 5**\nВведите адрес проведения события:', {
                    attachments: [createEventKeyboard(true)]
                });
                break;

            case EVENT_STEPS.ADDRESS:
                if (!text?.trim()) {
                    ctx.reply('❌ Адрес не может быть пустым. Введите адрес проведения события:', {
                        attachments: [createEventKeyboard(true)]
                    });
                    return;
                }
                eventData.address = text.trim();

                // Сохраняем в PostgreSQL напрямую
                const newEvent = await createEvent(eventData);
                const eventDate = new Date(newEvent.date).toLocaleDateString('ru-RU');
                const eventType = EVENT_TYPES[newEvent.type] || newEvent.type;

                ctx.reply(`🎉 **Событие успешно создано!**\n\n` +
                    `**Название:** ${newEvent.name}\n` +
                    `**Описание:** ${newEvent.description}\n` +
                    `**Тип:** ${eventType}\n` +
                    `**Дата:** ${eventDate}\n` +
                    `**Адрес:** ${newEvent.address}\n\n` +
                    `Теперь другие пользователи могут увидеть его через команду /events`);

                userStates.set(chatId, { state: USER_STATES.IDLE });
                break;
        }
    } catch (error) {
        console.error('Ошибка при создании события:', error);
        ctx.reply('❌ Произошла ошибка. Начните заново с команды /addevent');
        userStates.set(chatId, { state: USER_STATES.IDLE });
    }
}

// Обработчики callback (без изменений)
bot.on('message_callback', (ctx) => {
    try {
        const callbackData = ctx.update.callback?.payload;
        const chatId = ctx.update.message?.recipient?.chat_id;

        if (callbackData === 'back_button') {
            handleBackButton(ctx, chatId);
        } else if (callbackData === 'cancel_button') {
            handleCancelButton(ctx, chatId);
        } else if (callbackData === 'dont_want') {
            handleDontWantButton(ctx, chatId);
        }
    } catch (error) {
        console.error('Ошибка в обработчике message_callback:', error);
    }
});

// Функции обработки кнопок (без изменений)
function handleBackButton(ctx, chatId) {
    // ... существующий код
}

function handleCancelButton(ctx, chatId) {
    userStates.set(chatId, { state: USER_STATES.IDLE });
    ctx.reply('❌ Создание события отменено.\n\nЕсли передумаете - используйте команду /addevent');
}

function handleDontWantButton(ctx, chatId) {
    userStates.set(chatId, { state: USER_STATES.IDLE });
    ctx.reply('Жаль, что вы не хотите участвовать 😔\n\nЕсли передумаете - всегда можете написать /start снова!\n\nА пока можете посмотреть существующие события командой /events');
}

// мяумяумямумумямяумяумуямуямумяямумуямяумяумямяумуямяумяумяумуямяумямяумяумяумуямяумяуммяумуямяумяумяумяумяумуямяумяуммяумяумуямуямуямуямуямяумуямяумяумумяумямяумуямяумяумуямуямуямуяммуямумумумуямяумуяммумумуямуямуямуямуямумумуммумумумуямумумуямуямяумяумуямяум
// Создаем Express сервер для бота
const botApp = express();
botApp.use(express.json());

const BOT_PORT = process.env.BOT_PORT || 3001;

// Эндпоинт для отправки сообщений через API
botApp.post('/send-message', async (req, res) => {
    try {
        const { chatId, message } = req.body;

        if (!chatId || !message) {
            return res.status(400).json({
                error: 'Обязательные поля: chatId, message'
            });
        }

        // Отправляем сообщение через бота
        await bot.sendMessage(chatId, message);

        res.json({
            success: true,
            message: 'Сообщение отправлено',
            chatId: chatId
        });

    } catch (error) {
        console.error('Ошибка при отправке сообщения:', error);
        res.status(500).json({
            error: 'Ошибка при отправке сообщения'
        });
    }
});

// Запускаем сервер бота
botApp.listen(BOT_PORT, () => {
    console.log(`🤖 Сервер бота запущен на порту ${BOT_PORT}`);
});

// Запуск бота
console.log('🚀 Запуск автономного бота с прямым PostgreSQL...');
bot.start().then(() => {
    console.log('✅ Бот запущен успешно');
    console.log('🗄️ Прямое подключение к PostgreSQL');
}).catch(error => {
    console.error('❌ Ошибка запуска бота:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Остановка бота...');
    await client.end();
    process.exit(0);
});
