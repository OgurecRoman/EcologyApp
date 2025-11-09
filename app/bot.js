import * as dotenv from 'dotenv';
import { Bot, Keyboard } from '@maxhub/max-bot-api';

// Загружаем .env файл из корневой директории проекта
dotenv.config({ path: '../.env' });

// Проверяем токен
const token = process.env.BOT_TOKEN;
const API_URL = process.env.API_URL || 'http://localhost:3000';

if (!token) {
    console.error('❌ ОШИБКА: BOT_TOKEN не найден в .env файле');
    process.exit(1);
}

console.log('✅ Токен загружен');
const bot = new Bot(token);

// Хранилище состояний пользователей
const userStates = new Map();

// Типы событий для удобства
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

// Клавиатура для участия
const participationKeyboard = Keyboard.inlineKeyboard([
    [
        Keyboard.button.callback('не хочу', 'dont_want'),
        Keyboard.button.link('хочу', 'https://max.ru/t211_hakaton_bot?startapp')
    ],
]);

// Функция для работы с API
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

// Команда /start
bot.command('start', (ctx) => {
    const userId = ctx.update.message?.from?.id;
    const userName = ctx.update.message?.from?.first_name || 'Пользователь';

    console.log('Команда /start от пользователя:', userId);

    // Сбрасываем состояние пользователя
    userStates.set(userId, { state: 'awaiting_message' });

    ctx.reply(`Привет, ${userName}! 👋\n\nЯ бот для экологических мероприятий! Помоги планете или типо того, а нам заработать\n\nДоступные команды:\n/start - начать работу\n/addevent - добавить событие\n/events - посмотреть все события\n/help - помощь\n\nНапишите любое сообщение, чтобы продолжить.`);
});

// Команда /help
bot.command('help', (ctx) => {
    ctx.reply(`📋 **Доступные команды:**\n\n` +
        `/start - Начать работу с ботом\n` +
        `/addevent - Добавить новое событие\n` +
        `/events - Посмотреть все предстоящие события\n` +
        `/help - Показать эту справку\n\n` +
        `🌱 **Типы событий:**\n` +
        `• Субботник\n` +
        `• Сбор макулатуры\n` +
        `• Сбор батареек\n` +
        `• Сбор пластика\n` +
        `• Захват власти\n` +
        `• Высадка деревьев\n` +
        `• Другое`);
});

// Команда для добавления события
bot.command('addevent', (ctx) => {
    const userId = ctx.update.message?.from?.id;
    const userName = ctx.update.message?.from?.first_name || 'Аноним';

    console.log('Команда /addevent от пользователя:', userId);

    // Сбрасываем состояние и начинаем заново
    userStates.set(userId, {
        state: USER_STATES.ADDING_EVENT,
        step: EVENT_STEPS.NAME,
        eventData: {
            author: userName
        }
    });

    ctx.reply('Отлично! Давайте создадим новое экологическое событие. 🍃\n\n**Шаг 1 из 6**\nВведите название события:');
});

// Команда для просмотра событий
bot.command('events', async (ctx) => {
    try {
        console.log('Команда /events получена');

        const events = await apiRequest('/events');

        if (events.length === 0) {
            ctx.reply('📅 На данный момент нет запланированных событий.\n\nХотите создать первое событие? Используйте команду /addevent');
            return;
        }

        let message = '📅 **Предстоящие события:**\n\n';

        events.forEach((event, index) => {
            const date = new Date(event.date).toLocaleDateString('ru-RU');
            const type = EVENT_TYPES[event.type] || event.type;
            const participantsCount = event.participants ? event.participants.length : 0;

            message += `**${index + 1}. ${event.name}**\n` +
                `📝 ${event.description}\n` +
                `🏷️ Тип: ${type}\n` +
                `📅 Дата: ${date}\n` +
                `📍 Адрес: ${event.address}\n` +
                `👤 Организатор: ${event.author}\n` +
                `👥 Участников: ${participantsCount}\n\n`;
        });

        ctx.reply(message);

    } catch (error) {
        console.error('Ошибка при получении событий:', error);
        ctx.reply('❌ Произошла ошибка при получении списка событий. Попробуйте позже.');
    }
});

// Обработчик текстовых сообщений
bot.on('message_created', async (ctx) => {
    const userId = ctx.update.message?.from?.id;
    const text = ctx.update.message?.body?.text;
    const userName = ctx.update.message?.from?.first_name || 'Пользователь';

    // Игнорируем команды
    if (text && text.startsWith('/')) {
        return;
    }

    console.log('Сообщение от пользователя:', userId, 'Имя:', userName, 'Текст:', text);

    const userState = userStates.get(userId);

    if (!userState) {
        // Пользователь написал сообщение без /start
        ctx.reply('Для начала работы с ботом отправьте команду /start');
        return;
    }

    // Обработка создания события
    if (userState.state === USER_STATES.ADDING_EVENT) {
        await handleEventCreation(ctx, userId, text, userState);
        return;
    }

    // Стандартный поток после /start
    if (userState.state === USER_STATES.AWAITING_MESSAGE) {
        userStates.set(userId, {
            state: USER_STATES.ASKED_PARTICIPATION
        });

        ctx.reply(`Приятно познакомиться, ${userName}! 😊\n\nХотите ли вы принять участие в экологических мероприятиях?`, {
            attachments: [participationKeyboard]
        });
    } else if (userState.state === USER_STATES.ASKED_PARTICIPATION) {
        ctx.reply('Вы уже получили вопрос об участии. Пожалуйста, используйте кнопки выше для ответа. 👍');
    }
});


// Функция для обработки создания события
async function handleEventCreation(ctx, userId, text, userState) {
    const eventData = userState.eventData;
    const currentStep = userState.step;

    console.log(`Обработка шага: ${currentStep}, текст: "${text}"`);

    try {
        // Обрабатываем текущий шаг
        switch (currentStep) {
            case EVENT_STEPS.NAME:
                if (!text || text.trim() === '') {
                    ctx.reply('❌ Название не может быть пустым. Введите название события:');
                    return;
                }
                eventData.name = text.trim();

                // Переходим к описанию
                userStates.set(userId, {
                    ...userState,
                    step: EVENT_STEPS.DESCRIPTION
                });
                ctx.reply('**Шаг 2 из 5**\nОтлично! Теперь введите описание события:');
                break;

            case EVENT_STEPS.DESCRIPTION:
                if (!text || text.trim() === '') {
                    ctx.reply('❌ Описание не может быть пустым. Введите описание события:');
                    return;
                }
                eventData.description = text.trim();

                // Переходим к типу
                userStates.set(userId, {
                    ...userState,
                    step: EVENT_STEPS.TYPE
                });
                ctx.reply('**Шаг 3 из 5**\nВыберите тип события:\n\n' +
                    '1. 🌿 Субботник\n' +
                    '2. 📄 Сбор макулатуры\n' +
                    '3. 🔋 Сбор батареек\n' +
                    '4. 🫙 Сбор пластика\n' +
                    '5. 🍶 Сбор стекла\n' +
                    '6. 💻 Сбор электроники\n' +
                    '7. ❓ Другое\n\n' +
                    'Введите номер типа:');
                break;

            case EVENT_STEPS.TYPE:
                const typeMap = {
                    '1': 'SUBBOTNIK',
                    '2': 'PAPER_COLLECTION',
                    '3': 'BATTERY_COLLECTION',
                    '4': 'PLASTIC_COLLECTION',
                    '5': 'GLASS_COLLECTION',
                    '6': 'ELECTRONICS_COLLECTION',
                    '7': 'OTHER'
                };

                const typeKey = typeMap[text];
                if (!typeKey) {
                    ctx.reply('❌ Пожалуйста, введите номер от 1 до 7');
                    return;
                }
                eventData.type = typeKey;

                // Переходим к дате
                userStates.set(userId, {
                    ...userState,
                    step: EVENT_STEPS.DATE
                });
                ctx.reply('**Шаг 4 из 5**\nВведите дату события в формате ДД.ММ.ГГГГ (например, 25.12.2024):');
                break;

            case EVENT_STEPS.DATE:
                const dateMatch = text.match(/(\d{2})\.(\d{2})\.(\d{4})/);
                if (!dateMatch) {
                    ctx.reply('❌ Неверный формат даты. Используйте ДД.ММ.ГГГГ (например, 25.12.2024)');
                    return;
                }

                const [_, day, month, year] = dateMatch;
                // Проверяем валидность даты
                const dateObj = new Date(`${year}-${month}-${day}`);
                if (isNaN(dateObj.getTime())) {
                    ctx.reply('❌ Неверная дата. Проверьте правильность ввода (например, 25.12.2024)');
                    return;
                }

                // Проверяем, что дата не в прошлом
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (dateObj < today) {
                    ctx.reply('❌ Дата не может быть в прошлом. Введите будущую дату:');
                    return;
                }

                eventData.date = dateObj.toISOString();

                // Переходим к адресу
                userStates.set(userId, {
                    ...userState,
                    step: EVENT_STEPS.ADDRESS
                });
                ctx.reply('**Шаг 5 из 5**\nВведите адрес проведения события:');
                break;

            case EVENT_STEPS.ADDRESS:
                if (!text || text.trim() === '') {
                    ctx.reply('❌ Адрес не может быть пустым. Введите адрес проведения события:');
                    return;
                }
                eventData.address = text.trim();

                // Все данные собраны, создаем событие
                await createEventInDatabase(ctx, userId, eventData);
                break;

            default:
                console.error('Неизвестный шаг:', currentStep);
                ctx.reply('❌ Произошла ошибка. Начните заново с команды /addevent');
                userStates.set(userId, { state: USER_STATES.IDLE });
                break;
        }

    } catch (error) {
        console.error('Ошибка при обработке шага создания события:', error);
        ctx.reply('❌ Произошла ошибка. Начните заново с команды /addevent');
        userStates.set(userId, { state: USER_STATES.IDLE });
    }
}

// Функция для создания события в базе данных
async function createEventInDatabase(ctx, userId, eventData) {
    try {
        console.log('Создание события с данными:', eventData);

        const newEvent = await apiRequest('/events', {
            method: 'POST',
            body: JSON.stringify(eventData)
        });

        const eventDate = new Date(newEvent.date).toLocaleDateString('ru-RU');
        const eventType = EVENT_TYPES[newEvent.type] || newEvent.type;

        ctx.reply(`🎉 **Событие успешно создано!**\n\n` +
            `**Название:** ${newEvent.name}\n` +
            `**Описание:** ${newEvent.description}\n` +
            `**Тип:** ${eventType}\n` +
            `**Дата:** ${eventDate}\n` +
            `**Адрес:** ${newEvent.address}\n\n` +
            `Теперь другие пользователи могут увидеть его через команду /events`);

        // Сбрасываем состояние
        userStates.set(userId, { state: USER_STATES.IDLE });

    } catch (error) {
        console.error('Ошибка при создании события:', error);
        ctx.reply('❌ Произошла ошибка при создании события. Попробуйте позже.');
        userStates.set(userId, { state: USER_STATES.IDLE });
    }
}

// обнов команды /start для использования новых состояний
bot.command('start', (ctx) => {
    const userId = ctx.update.message?.from?.id;
    const userName = ctx.update.message?.from?.first_name || 'Пользователь';

    console.log('Команда /start от пользователя:', userId, 'Имя:', userName);

    // Сбрасываем состояние пользователя
    userStates.set(userId, {
        state: USER_STATES.AWAITING_MESSAGE
    });

    ctx.reply(`Привет, ${userName}! 👋\n\nЯ бот для экологических мероприятий!\n\nДоступные команды:\n/start - начать работу\n/addevent - добавить событие\n/events - посмотреть все события\n/help - помощь\n\nНапишите любое сообщение, чтобы продолжить.`);
});

// Обработчик нажатия на кнопку "не хочу"
bot.on('callback_query', (ctx) => {
    const callbackData = ctx.update.callback_query?.data;
    const userId = ctx.update.callback_query?.from?.id;

    console.log('Callback от пользователя:', userId, 'Данные:', callbackData);

    if (callbackData === 'dont_want') {
        // Отвечаем на callback
        ctx.answerCallbackQuery();

        // Отправляем сообщение
        ctx.reply('Жаль, что вы не хотите участвовать в экологических мероприятиях 😔\n\nЕсли передумаете - всегда можете написать /start снова!\n\nА пока можете посмотреть существующие события командой /events');
    }
});

// Обработчик ошибок
bot.on('error', (error) => {
    console.error('Ошибка бота:', error);
});

console.log('🚀 Запуск бота...');
bot.start().then(() => {
    console.log('✅ Бот запущен успешно');
    console.log('📝 Доступные команды:');
    console.log('• /start - начать работу');
    console.log('• /addevent - добавить событие');
    console.log('• /events - посмотреть события');
    console.log('• /help - помощь');
}).catch(error => {
    console.error('Ошибка запуска бота:', error);
});