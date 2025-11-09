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

// Добавьте в начало файла, после импортов
console.log('=== BOT DEBUG MODE ===');

// Обработчик всех входящих обновлений
bot.on('raw', (update) => {
    console.log('📨 RAW UPDATE:', JSON.stringify(update, null, 2));
});

// Функция для создания клавиатуры с кнопками Отмена
function createEventKeyboard(showBack = false) {
    const buttons = [];

    buttons.push([
        Keyboard.button.callback('❌ Отменить создание', 'cancel_button', { intent: 'default' })
    ]);

    console.log('🔘 Создана клавиатура с кнопками:', showBack ? 'Отмена' : 'Только Отмена');
    return Keyboard.inlineKeyboard(buttons);
}

// Клавиатура для участия
const participationKeyboard = Keyboard.inlineKeyboard([
    [
        Keyboard.button.callback('не хочу', 'dont_want', { intent: 'default' }),
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
        },
        previousSteps: []
    });

    const keyboard = createEventKeyboard(false);

    ctx.reply('Отлично! Давайте создадим новое экологическое событие. 🍃\n\n**Шаг 1 из 5**\nВведите название события:', {
        attachments: [keyboard]
    });
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

        ctx.reply(`Приятно познакомиться, ${userName}! 😊\n\nХотите ли вы принять участие в экологических мероприятиях? (даже не думай, что у тебя есть выбор :) )`, {
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
    const previousSteps = userState.previousSteps || [];

    console.log(`Обработка шага: ${currentStep}, текст: "${text}"`);

    try {
        // Обрабатываем текущий шаг
        switch (currentStep) {
            case EVENT_STEPS.NAME:
                if (!text || text.trim() === '') {
                    const keyboard = createEventKeyboard(false);
                    ctx.reply('❌ Название не может быть пустым. Введите название события:', {
                        attachments: [keyboard]
                    });
                    return;
                }
                eventData.name = text.trim();

                // Сохраняем текущий шаг в историю
                previousSteps.push(EVENT_STEPS.NAME);

                // Переходим к описанию
                userStates.set(userId, {
                    ...userState,
                    step: EVENT_STEPS.DESCRIPTION,
                    previousSteps: previousSteps
                });

                const keyboardDesc = createEventKeyboard(true);
                ctx.reply('**Шаг 2 из 5**\nОтлично! Теперь введите описание события:', {
                    attachments: [keyboardDesc]
                });
                break;

            case EVENT_STEPS.DESCRIPTION:
                if (!text || text.trim() === '') {
                    const keyboard = createEventKeyboard(true);
                    ctx.reply('❌ Описание не может быть пустым. Введите описание события:', {
                        attachments: [keyboard]
                    });
                    return;
                }
                eventData.description = text.trim();

                // Сохраняем текущий шаг в историю
                previousSteps.push(EVENT_STEPS.DESCRIPTION);

                // Переходим к типу
                userStates.set(userId, {
                    ...userState,
                    step: EVENT_STEPS.TYPE,
                    previousSteps: previousSteps
                });

                const keyboardType = createEventKeyboard(true);
                ctx.reply('**Шаг 3 из 5**\nВыберите тип события:\n\n' +
                    '1. 🌿 Субботник\n' +
                    '2. 📄 Сбор макулатуры\n' +
                    '3. 🔋 Сбор батареек\n' +
                    '4. 🫙 Сбор пластика\n' +
                    '5. 🍶 Сбор стекла\n' +
                    '6. 💻 Сбор электроники\n' +
                    '7. ❓ Другое\n\n' +
                    'Введите номер типа:', {
                    attachments: [keyboardType]
                });
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
                    const keyboard = createEventKeyboard(true);
                    ctx.reply('❌ Пожалуйста, введите номер от 1 до 7', {
                        attachments: [keyboard]
                    });
                    return;
                }
                eventData.type = typeKey;

                // Сохраняем текущий шаг в историю
                previousSteps.push(EVENT_STEPS.TYPE);

                // Переходим к дате
                userStates.set(userId, {
                    ...userState,
                    step: EVENT_STEPS.DATE,
                    previousSteps: previousSteps
                });

                const keyboardDate = createEventKeyboard(true);
                ctx.reply('**Шаг 4 из 5**\nВведите дату события в формате ДД.ММ.ГГГГ (например, 25.12.2024):', {
                    attachments: [keyboardDate]
                });
                break;

            case EVENT_STEPS.DATE:
                const dateMatch = text.match(/(\d{2})\.(\d{2})\.(\d{4})/);
                if (!dateMatch) {
                    const keyboard = createEventKeyboard(true);
                    ctx.reply('❌ Неверный формат даты. Используйте ДД.ММ.ГГГГ (например, 25.12.2024)', {
                        attachments: [keyboard]
                    });
                    return;
                }

                const [_, day, month, year] = dateMatch;
                // Проверяем валидность даты
                const dateObj = new Date(`${year}-${month}-${day}`);
                if (isNaN(dateObj.getTime())) {
                    const keyboard = createEventKeyboard(true);
                    ctx.reply('❌ Неверная дата. Проверьте правильность ввода (например, 25.12.2024)', {
                        attachments: [keyboard]
                    });
                    return;
                }

                // Проверяем, что дата не в прошлом
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (dateObj < today) {
                    const keyboard = createEventKeyboard(true);
                    ctx.reply('❌ Дата не может быть в прошлом. Введите будущую дату:', {
                        attachments: [keyboard]
                    });
                    return;
                }

                eventData.date = dateObj.toISOString();

                // Сохраняем текущий шаг в историю
                previousSteps.push(EVENT_STEPS.DATE);

                // Переходим к адресу
                userStates.set(userId, {
                    ...userState,
                    step: EVENT_STEPS.ADDRESS,
                    previousSteps: previousSteps
                });

                const keyboardAddress = createEventKeyboard(true);
                ctx.reply('**Шаг 5 из 5**\nВведите адрес проведения события:', {
                    attachments: [keyboardAddress]
                });
                break;

            case EVENT_STEPS.ADDRESS:
                if (!text || text.trim() === '') {
                    const keyboard = createEventKeyboard(true);
                    ctx.reply('❌ Адрес не может быть пустым. Введите адрес проведения события:', {
                        attachments: [keyboard]
                    });
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

// Основной обработчик для callback кнопок
bot.on('message_callback', (ctx) => {
    try {
        const callbackData = ctx.update.callback?.payload;
        const userId = ctx.update.callback?.user?.user_id;

        console.log('🎯 MESSAGE_CALLBACK получен:', callbackData);
        console.log('User ID:', userId);

        // Обрабатываем кнопки
        if (callbackData === 'cancel_button') {
            console.log('❌ Кнопка "Отмена" нажата');
            handleCancelButton(ctx, userId);
        } else if (callbackData === 'dont_want') {
            console.log('🙅 Кнопка "не хочу" нажата');
            handleDontWantButton(ctx, userId);
        } else if (callbackData && callbackData.startsWith('test_')) {
            console.log(`🧪 Тестовая кнопка: ${callbackData}`);
            ctx.reply(`Вы нажали: ${callbackData}`);
        }
    } catch (error) {
        console.error('Ошибка в обработчике message_callback:', error);
    }
});

// Функция для показа сообщения шага
function showStepMessage(ctx, step, eventData) {
    const showBack = step !== EVENT_STEPS.NAME;
    const keyboard = createEventKeyboard(showBack);

    let message = '';
    let currentValue = '';

    switch (step) {
        case EVENT_STEPS.NAME:
            message = '**Шаг 1 из 5**\nВведите название события:';
            currentValue = eventData.name ? `\n\n📝 Текущее значение: "${eventData.name}"` : '';
            break;

        case EVENT_STEPS.DESCRIPTION:
            message = '**Шаг 2 из 5**\nВведите описание события:';
            currentValue = eventData.description ? `\n\n📝 Текущее значение: "${eventData.description}"` : '';
            break;

        case EVENT_STEPS.TYPE:
            message = '**Шаг 3 из 5**\nВыберите тип события:\n\n' +
                '1. 🌿 Субботник\n' +
                '2. 📄 Сбор макулатуры\n' +
                '3. 🔋 Сбор батареек\n' +
                '4. 🫙 Сбор пластика\n' +
                '5. 🍶 Сбор стекла\n' +
                '6. 💻 Сбор электроники\n' +
                '7. ❓ Другое\n\n' +
                'Введите номер типа:';
            currentValue = eventData.type ? `\n\n✅ Текущий выбор: ${EVENT_TYPES[eventData.type]}` : '';
            break;

        case EVENT_STEPS.DATE:
            message = '**Шаг 4 из 5**\nВведите дату события в формате ДД.ММ.ГГГГ (например, 25.12.2024):';
            currentValue = eventData.date ? `\n\n📅 Текущая дата: ${new Date(eventData.date).toLocaleDateString('ru-RU')}` : '';
            break;

        case EVENT_STEPS.ADDRESS:
            message = '**Шаг 5 из 5**\nВведите адрес проведения события:';
            currentValue = eventData.address ? `\n\n📍 Текущий адрес: ${eventData.address}` : '';
            break;
    }

    ctx.reply(message + currentValue, { attachments: [keyboard] });
}

// Функция для обработки кнопки "Отмена"
function handleCancelButton(ctx, userId) {
    try {
        userStates.set(userId, { state: USER_STATES.IDLE });
        console.log('🛑 Отправляем сообщение об отмене');
        ctx.reply('❌ Создание события отменено.\n\nЕсли передумаете - используйте команду /addevent (я советую тебе хорошо подумать.)');
        console.log('✅ Сообщение об отмене отправлено');
    } catch (error) {
        console.error('Ошибка в handleCancelButton:', error);
    }
}

// Функция для обработки кнопки "не хочу"
function handleDontWantButton(ctx, userId) {
    try {
        userStates.set(userId, { state: USER_STATES.IDLE });
        ctx.reply('Жаль, что вы не хотите участвовать в экологических мероприятиях 😔(сволочь ты бессердечная) \n\nЕсли передумаете - всегда можете написать /start снова! (советую поторопиться.)\n\nА пока можете посмотреть существующие события командой /events (чтоб совесть проснулась.)');
    } catch (error) {
        console.error('Ошибка в handleDontWantButton:', error);
    }
}

// Обработчик ошибок
bot.on('error', (error) => {
    console.error('Ошибка бота:', error);
});

// Добавляем в конец файла, перед запуском бота
console.log('=== БОТ ЗАПУЩЕН ===');
console.log('Ожидаемые callback payloads:');
console.log('- cancel_button: кнопка "Отмена"');
console.log('- dont_want: кнопка "не хочу"');

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