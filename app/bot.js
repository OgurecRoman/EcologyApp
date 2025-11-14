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
// const ECOLOGY_API_URL = "http://localhost:3000/events"
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

// Обработчик для просмотра профиля другого пользователя
async function handleUserProfile(ctx, userId, targetUserId, userName) {
    try {
        const userResponse = await fetch(`https://ecology-app-test.vercel.app/user?id=${targetUserId}`);
        const targetUser = await userResponse.json();

        const postsResponse = await fetch(`https://ecology-app-test.vercel.app/posts/user?userId=${targetUserId}`);
        const userPosts = await postsResponse.json();

        const followersResponse = await fetch(`https://ecology-app-test.vercel.app/follow/followers?userId=${targetUserId}`);
        const followers = await followersResponse.json();

        const followingResponse = await fetch(`https://ecology-app-test.vercel.app/follow/following?userId=${targetUserId}`);
        const following = await followingResponse.json();

        // Проверяем, подписан ли текущий пользователь
        const isFollowing = followers.some(follower => follower.id === userId);

        const profileKeyboard = Keyboard.inlineKeyboard([
            [
                Keyboard.button.callback('📖 Посмотреть посты', `view_user_posts_${targetUserId}`, { intent: 'default' })
            ],
            [
                Keyboard.button.callback(
                    isFollowing ? '❌ Отписаться' : '✅ Подписаться',
                    isFollowing ? `unfollow_${targetUserId}` : `follow_${targetUserId}`,
                    { intent: isFollowing ? 'negative' : 'positive' }
                )
            ],
            [
                Keyboard.button.callback('⬅️ Назад к списку', 'other_users', { intent: 'default' })
            ]
        ]);

        const profileMessage = `👤 Профиль: ${targetUser.username}\n\n` +
            `⭐ Рейтинг: ${targetUser.rating || 0}\n` +
            `📄 Постов: ${userPosts.length}\n` +
            `👥 Подписчиков: ${followers.length}\n` +
            `📋 Подписок: ${following.length}\n\n` +
            `Статус: ${targetUser.status || "Эко-активист"}`;

        await ctx.reply(profileMessage, {
            attachments: [profileKeyboard]
        });

    } catch (error) {
        console.error('❌ Ошибка при загрузке профиля пользователя:', error);
        await ctx.reply('❌ Ошибка при загрузке профиля пользователя');
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

// Команда для принудительной проверки новых событий
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
    const eventExamples = lastEvents.slice(0, 3).map((e, i) =>
        `${i + 1}. ${e.name} (${new Date(e.date).toLocaleDateString('ru-RU')})`
    ).join('\n') || 'Нет событий';

    const statusMessage = `📊 Статус мониторинга событий\n\n` +
        `🔍 Последняя проверка: ${lastCheckTime.toLocaleString('ru-RU')}\n` +
        `📝 Отслеживается событий: ${lastEvents.length}\n` +
        `👥 Подписчиков: ${getSubscribersCount()}\n` +
        `📋 Отслеживаемые события:\n${eventExamples}\n\n` +
        `🌱 Бот проверяет новые события каждую минуту автоматически!`;

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

// Команда /start
bot.command('start', (ctx) => {
    const chatId = ctx.update.message?.recipient?.chat_id;
    const userName = ctx.update.message?.from?.first_name || 'Пользователь';

    addSubscriber(chatId, ctx);

    // Создаем кнопки в том же формате, что и в рабочем примере
    const keyboard = Keyboard.inlineKeyboard([
        [
            Keyboard.button.link('📅 Запланировать событие', 'https://max.ru/t211_hakaton_bot?startapp')
        ],
        [
            Keyboard.button.callback('👤 Профиль', 'profile', { intent: 'default' })
        ]
    ]);

    ctx.reply(
        `Привет, ${userName}! 👋\n\n` +
        `Я создан для того, чтобы сделать нашу планету чуточку лучше! 🌍\n\n` +
        `Доступные команды:\n` +
        `/events - 📅 Посмотреть все события\n` +
        `/profile - 👤 Посмотреть свой профиль\n` +
        `/monitor_status - 📊 Статус просматриваемых событий\n` +
        `/check_new - 🔍 Узнать о новых событиях\n` +
        `/help - ❓ Помощь по командам\n\n` +
        `Или ты можешь запланировать свое мероприятие прямо сейчас! :0`,
        {
            attachments: [keyboard]
        }
    );
});

// Команда /profile
bot.command('profile', async (ctx) => {
    const chatId = ctx.update.message?.recipient?.chat_id;
    const userName = ctx.update.message?.from?.first_name || 'Пользователь';

    // Используем chatId как ID пользователя (или можно получить из вашей системы)
    const userId = chatId;

    try {
        // Получаем данные пользователя из API
        const userResponse = await fetch(`https://ecology-app-test.vercel.app/user?id=${userId}&name=${encodeURIComponent(userName)}`);
        const user = await userResponse.json();

        const profileKeyboard = Keyboard.inlineKeyboard([
            [
                Keyboard.button.callback('⭐ Рейтинг', 'show_rating'),
                Keyboard.button.callback('📋 Подписки', 'show_following')
            ],
            [
                Keyboard.button.callback('👥 Подписчики', 'show_followers')
            ],
            [
                Keyboard.button.callback('⬅️ Назад', 'back_to_main')
            ]
        ]);

        let profileMessage = `👤 Профиль: ${userName}\n\n`;

        if (user && user.rating !== undefined) {
            profileMessage += `⭐ Текущий рейтинг: ${user.rating}\n`;
            profileMessage += `📅 Создан: ${new Date(user.createdAt).toLocaleDateString('ru-RU')}\n\n`;
        } else {
        profileMessage += `✨ Это твой профиль!\n`+
            `Начните участвовать в событиях для набора рейтинга.\n\n`+
            `ВАЖНО: Твой рейтинг под угрозой! Обязательно делай добрые дела в течении 30 дней, иначе твой рейтинг обнулится! (🔫🔫🔫)\n\n`;
    }


    profileMessage += `Используй кнопочки для навигации:`;

        await ctx.reply(profileMessage, {
            attachments: [profileKeyboard]
        });

    } catch (error) {
        console.error('❌ Ошибка при получении профиля:', error);

        const profileKeyboard = Keyboard.inlineKeyboard([
            [
                Keyboard.button.callback('⭐ Рейтинг', 'show_rating'),
                Keyboard.button.callback('📋 Подписки', 'show_following')
            ],
            [
                Keyboard.button.callback('👥 Подписчики', 'show_followers')
            ],
            [
                Keyboard.button.callback('⬅️ Назад', 'back_to_main')
            ]
        ]);

        await ctx.reply(
            `👤 Профиль: ${userName}\n\n` +
            `⭐ Твой рейтинг появится после участия в событиях!\n\n` +
            `Выберите действие:`,
            {
                attachments: [profileKeyboard]
            }
        );
    }
});

// Обработчик callback-ов для кнопок профиля
bot.on('message_callback', async (ctx) => {
    console.log('📨 Получен callback update:', JSON.stringify(ctx.update, null, 2));

    // Извлекаем данные из callback
    const callbackData = ctx.update.callback?.payload;
    const chatId = ctx.update.callback?.user?.user_id;
    const userName = ctx.update.callback?.user?.first_name || 'Пользователь';

    console.log('🔍 Извлеченные данные:', { callbackData, chatId, userName });

    if (!callbackData) {
        console.log('❌ Не удалось извлечь callback data');
        await ctx.reply('❌ Не удалось обработать нажатие кнопки');
        return;
    }

    try {
        switch (callbackData) {
            case 'profile':
                await handleProfile(ctx, chatId, userName);
                break;

            case 'show_rating':
                await handleShowRating(ctx, chatId, userName);
                break;

            case 'show_following':
                await handleShowFollowing(ctx, chatId, userName);
                break;

            case 'show_followers':
                await handleShowFollowers(ctx, chatId, userName);
                break;

            case 'show_top_rating':
                await handleTopRating(ctx, chatId, userName);
                break;

            case 'back_to_main':
                await handleBackToMain(ctx, userName);
                break;

            default:
                console.log(`❌ Неизвестный callback: ${callbackData}`);
                await ctx.reply(`❌ Неизвестная команда: ${callbackData}`);
        }
    } catch (error) {
        console.error('❌ Ошибка в обработчике callback:', error);
        await ctx.reply('❌ Произошла ошибка при обработке запроса');
    }
});

/// Функция для обработки профиля
async function handleProfile(ctx, userId, userName) {
    try {
        const userResponse = await fetch(`https://ecology-app-test.vercel.app/user?id=${userId}&name=${encodeURIComponent(userName)}`);
        const user = await userResponse.json();

        // Обновленные кнопки профиля - убираем блог, добавляем топ рейтинга
        const profileKeyboard = Keyboard.inlineKeyboard([
            [
                Keyboard.button.callback('⭐ Рейтинг', 'show_rating', { intent: 'default' }),
                Keyboard.button.callback('📋 Подписки', 'show_following', { intent: 'default' })
            ],
            [
                Keyboard.button.callback('👥 Подписчики', 'show_followers', { intent: 'default' }),
                Keyboard.button.callback('🏆 Топ рейтинга', 'show_top_rating', { intent: 'default' })
            ],
            [
                Keyboard.button.callback('⬅️ Назад', 'back_to_main', { intent: 'default' })
            ]
        ]);

        let profileMessage = `👤 Профиль: ${userName}\n\n`;

        if (user && user.rating !== undefined) {
            profileMessage += `⭐ Текущий рейтинг: ${user.rating}\n`;
            profileMessage += `📅 Создан: ${new Date(user.createdAt).toLocaleDateString('ru-RU')}\n\n`;
        } else {
            profileMessage += `ℹ️ Профиль создан! Начните участвовать в событиях для набора рейтинга.\n\n`;
        }

        profileMessage += `Выберите действие:`;

        await ctx.reply(profileMessage, {
            attachments: [profileKeyboard]
        });
    } catch (error) {
        console.error('❌ Ошибка при обработке профиля:', error);
        await ctx.reply('❌ Ошибка при загрузке профиля');
    }
}

// Функция для показа топа пользователей по рейтингу
async function handleTopRating(ctx, userId, userName) {
    try {
        console.log(`🏆 Запрос топа рейтинга для пользователя ${userId}`);

        // Используем локальный сервер
        // const response = await fetch("http://localhost:3000/user/top?limit=10");
        // Используем нелокальный сервер
        const response = await fetch("https://ecology-app-test.vercel.app/user/top?limit=10");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const topUsers = await response.json();
        console.log(`📊 Получено ${topUsers.length} пользователей для топа`);

        // Получаем текущего пользователя для сравнения
        const currentUserResponse = await fetch(`https://ecology-app-test.vercel.app/user?id=${userId}`);
        const currentUser = await currentUserResponse.json();

        let message = `🏆 Топ-10 пользователей по рейтингу:\n\n`;

        topUsers.forEach((user, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            const isCurrentUser = user.id === userId;
            const userPrefix = isCurrentUser ? '👉 ' : '';

            message += `${userPrefix}${medal} ${user.username}\n`;
            message += `   ⭐ Рейтинг: ${user.rating}\n`;

            if (index < topUsers.length - 1) {
                message += '\n';
            }
        });

        // Добавляем информацию о позиции текущего пользователя
        const currentUserInTop = topUsers.some(user => user.id === userId);

        if (!currentUserInTop && currentUser && currentUser.rating > 0) {
            // Находим позицию текущего пользователя
            const allUsersResponse = await fetch("https://ecology-app-test.vercel.app/user/top?limit=100");
            const allUsers = await allUsersResponse.json();
            const currentUserPosition = allUsers.findIndex(user => user.id === userId) + 1;

            message += `\n────────────────\n\n`;
            message += `📊 Ваша позиция: ${currentUserPosition || 'не в топ-100'}\n`;
            message += `⭐ Ваш рейтинг: ${currentUser.rating}\n\n`;
            message += `Продолжайте участвовать в событиях, чтобы попасть в топ!`;
        } else if (currentUserInTop) {
            message += `\n────────────────\n\n`;
            message += `🎉 Вы в топе! Поздравляем!`;
        } else {
            message += `\n────────────────\n\n`;
            message += `💫 Участвуйте в событиях, чтобы поднять свой рейтинг и попасть в топ!`;
        }

        const backKeyboard = Keyboard.inlineKeyboard([
            [
                Keyboard.button.callback('⭐ Мой рейтинг', 'show_rating', { intent: 'default' })
            ],
            [
                Keyboard.button.callback('⬅️ Назад к профилю', 'profile', { intent: 'default' })
            ]
        ]);

        await ctx.reply(message, {
            attachments: [backKeyboard]
        });

    } catch (error) {
        console.error('❌ Ошибка при загрузке топа рейтинга:', error);

        // Fallback сообщение с демо-данными
        const fallbackMessage = `🏆 Топ пользователей по рейтингу:\n\n` +
            `🥇 Эко-лидер - 150⭐\n` +
            `🥈 Зеленый воин - 120⭐\n` +
            `🥉 Природозащитник - 95⭐\n` +
            `4. Эко-активист - 80⭐\n` +
            `5. Чистая планета - 65⭐\n\n` +
            `💫 Участвуйте в событиях, чтобы поднять свой рейтинг!`;

        const backKeyboard = Keyboard.inlineKeyboard([
            [
                Keyboard.button.callback('⬅️ Назад к профилю', 'profile', { intent: 'default' })
            ]
        ]);

        await ctx.reply(fallbackMessage, {
            attachments: [backKeyboard]
        });
    }
}

// Функция для показа рейтинга
async function handleShowRating(ctx, userId, userName) {
    try {
        const userResponse = await fetch(`https://ecology-app-test.vercel.app/user?id=${userId}`);
        const user = await userResponse.json();

        const rating = user?.rating || 0;

        let ratingMessage = `⭐ Твой рейтинг: ${rating}\n\n`;

        // Добавляем информацию о системе рейтинга
        ratingMessage += `🎯 Как увеличить рейтинг:\n`;
        ratingMessage += `• Субботники: +10 баллов\n`;
        ratingMessage += `• Сбор отходов: +3 балла\n`;
        ratingMessage += `• Другие события: +1 балл\n\n`;
        ratingMessage += `📅 Рейтинг обновляется каждый месяц!\n\n`;
        ratingMessage += `Участвуй в событиях и повышай свой рейтинг! 🌟`;

        const backKeyboard = Keyboard.inlineKeyboard([
            [
                Keyboard.button.callback('⬅️ Назад к профилю', 'profile', { intent: 'default' })
            ]
        ]);

        await ctx.reply(ratingMessage, {
            attachments: [backKeyboard]
        });
    } catch (error) {
        console.error('❌ Ошибка при получении рейтинга:', error);
        await ctx.reply('❌ Ошибка при загрузке рейтинга');
    }
}

// Функция для показа подписок
async function handleShowFollowing(ctx, userId, userName) {
    try {
        const followingResponse = await fetch(`https://ecology-app-test.vercel.app/follow/following?userId=${userId}`);
        const following = await followingResponse.json();

        let followingMessage = `📋 Твои подписки:\n\n`;

        if (following && following.length > 0) {
            following.forEach((user, index) => {
                followingMessage += `${index + 1}. ${user.username} ⭐${user.rating || 0}\n`;
            });
            followingMessage += `\nВсего: ${following.length} подписок`;
        } else {
            followingMessage += `Ты пока ни на кого не подписан.\n\n`;
            followingMessage += `Найди интересных людей через события и подпишись на них!`;
        }

        const backKeyboard = Keyboard.inlineKeyboard([
            [
                Keyboard.button.callback('⬅️ Назад к профилю', 'profile', { intent: 'default' })
            ]
        ]);

        await ctx.reply(followingMessage, {
            attachments: [backKeyboard]
        });
    } catch (error) {
        console.error('❌ Ошибка при получении подписок:', error);
        await ctx.reply('❌ Ошибка при загрузке подписок');
    }
}

// Функция для показа подписчиков
async function handleShowFollowers(ctx, userId, userName) {
    try {
        const followersResponse = await fetch(`https://ecology-app-test.vercel.app/follow/followers?userId=${userId}`);
        const followers = await followersResponse.json();

        let followersMessage = `👥 Твои подписчики:\n\n`;

        if (followers && followers.length > 0) {
            followers.forEach((user, index) => {
                followersMessage += `${index + 1}. ${user.username} ⭐${user.rating || 0}\n`;
            });
            followersMessage += `\nВсего: ${followers.length} подписчиков`;
        } else {
            followersMessage += `У тебя пока нет подписчиков.\n\n`;
            followersMessage += `Будь активным в сообществе, и у тебя появятся подписчики!`;
        }

        const backKeyboard = Keyboard.inlineKeyboard([
            [
                Keyboard.button.callback('⬅️ Назад к профилю', 'profile', { intent: 'default' })
            ]
        ]);

        await ctx.reply(followersMessage, {
            attachments: [backKeyboard]
        });
    } catch (error) {
        console.error('❌ Ошибка при получении подписчиков:', error);
        await ctx.reply('❌ Ошибка при загрузке подписчиков');
    }
}

// Функция для подписки на пользователя
async function handleFollowUser(ctx, followerId, followingId, userName) {
    try {
        const response = await fetch('https://ecology-app-test.vercel.app/follow/follow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                followerId: followerId,
                followingId: followingId
            })
        });

        if (!response.ok) {
            throw new Error('Ошибка API');
        }

        const result = await response.json();

        await ctx.reply(
            `✅ Вы успешно подписались на пользователя!`,
            {
                attachments: [Keyboard.inlineKeyboard([
                    [Keyboard.button.callback('📖 Посмотреть посты', `view_user_posts_${followingId}`, { intent: 'default' })],
                    [Keyboard.button.callback('⬅️ Назад к профилю', `user_profile_${followingId}`, { intent: 'default' })]
                ])]
            }
        );

    } catch (error) {
        console.error('❌ Ошибка при подписке:', error);
        await ctx.reply('❌ Ошибка при подписке на пользователя');
    }
}

// Функция для отписки от пользователя
async function handleUnfollowUser(ctx, followerId, followingId, userName) {
    try {
        const response = await fetch('https://ecology-app-test.vercel.app/follow/unfollow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                followerId: followerId,
                followingId: followingId
            })
        });

        if (!response.ok) {
            throw new Error('Ошибка API');
        }

        await ctx.reply(
            `❌ Вы отписались от пользователя.`,
            {
                attachments: [Keyboard.inlineKeyboard([
                    [Keyboard.button.callback('⬅️ Назад к профилю', `user_profile_${followingId}`, { intent: 'default' })]
                ])]
            }
        );

    } catch (error) {
        console.error('❌ Ошибка при отписке:', error);
        await ctx.reply('❌ Ошибка при отписке от пользователя');
    }
}

// Функция для возврата в главное меню
async function handleBackToMain(ctx, userName) {
    const mainKeyboard = Keyboard.inlineKeyboard([
        [
            Keyboard.button.link('✨ Приложение', 'https://max.ru/t211_hakaton_bot?startapp')
        ],
        [
            Keyboard.button.callback('👤 Профиль', 'profile', { intent: 'default' })
        ]
    ]);

    await ctx.reply(
        `Привет, ${userName}! 👋\n\n` +
        `Ты пришел в главное меню, можешь перейти в наше ✨прекрасное✨ приложение или в свой профиль) \n\n` +
        `Выбери действие:`,
        {
            attachments: [mainKeyboard]
        }
    );
}

// Команда /help
bot.command('help', (ctx) => {
    const keyboard = Keyboard.inlineKeyboard([
        [
            Keyboard.button.link('🌐 Тык сюда', 'https://max.ru/t211_hakaton_bot?startapp')
        ]
    ]);

    ctx.reply(
        `📋 Доступные команды:\n\n` +
        `/start - Начать работу с ботом\n` +
        `/events - Посмотреть все предстоящие события\n` +
        `/profile - Посмотреть свой профиль и рейтинг\n` +
        `/monitor_status - Показать статус мониторинга новых событий\n` +
        `/check_new - Проверить новые события\n` +
        `/reset_events - Сбросить кэш событий (если что-то сломалось)\n` +
        `/help - Показать эту справку`,
        {
            attachments: [keyboard]
        }
    );
});

// Команда для просмотра событий
bot.command('events', async (ctx) => {
    try {
        console.log('🔄 Запрос актуальных событий от пользователя');

        const events = await getEventsFromAPI();

        const keyboard = Keyboard.inlineKeyboard([
            [
                Keyboard.button.link('📅 Запланировать своё событие', 'https://max.ru/t211_hakaton_bot?startapp')
            ]
        ]);

        if (events.length === 0) {
            await ctx.reply(
                'На данный момент актуальных событий нет 😔\n\n' +
                'Но ты можешь стать первым и создать свое мероприятие!',
                {
                    attachments: [keyboard]
                }
            );
            return;
        }

        // Ограничиваем количество событий для показа
        const eventsToShow = events.slice(0, 10);

        let message = `📅 Ближайшие события (показано ${eventsToShow.length} из ${events.length}):\n\n`;

        eventsToShow.forEach((event, index) => {
            const eventType = EVENT_TYPES[event.type] || event.type;
            const eventDate = formatDate(event.date);

            message += `${index + 1}. ${event.name}\n` +
                `📝 ${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}\n` +
                `🏷️ ${eventType}\n` +
                `📅 ${eventDate}\n` +
                `📍 ${event.address}\n` +
                `👤 ${event.author}\n\n`;
        });

        message += `\n🎯 Хочешь организовать своё событие?`;

        await ctx.reply(message, {
            attachments: [keyboard]
        });

    } catch (error) {
        console.error('❌ Ошибка при получении событий:', error);

        const keyboard = Keyboard.inlineKeyboard([
            [
                Keyboard.button.link('Тык на кнопочку', 'https://max.ru/t211_hakaton_bot?startapp')
            ]
        ]);

        await ctx.reply(
            '❌ Не удалось загрузить события.\n\n' +
            '🍫 У нас технические шоколадки, попробуй немного позже 🍫\n\n'+
            '✨ А пока что можешь перейти в наше мини-приложении, оно более удобное и там точно все работает!',
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
            Keyboard.button.link('📅 Запланировать событие', 'https://max.ru/t211_hakaton_bot?startapp')
        ],
        [
            Keyboard.button.callback('👤 Профиль', 'profile', { intent: 'default' })
        ]
    ]);

    ctx.reply(
        `Привет, ${userName}! 👋\n\n` +
        `Хочешь посмотреть актуальные события?\n\n` +
        `Тык на команду /events чтобы увидеть все мероприятия!\n` +
        `Или тык /profile чтобы посмотреть свой профиль и рейтинг!\n\n` +
        `Или тыкай на кнопочки ниже!`,
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
    console.log('   • /monitor_status - статус мониторинга');
    console.log('   • /check_new - принудительная проверка');
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



// Кнопка узнать свой рейтинг















