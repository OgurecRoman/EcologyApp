import * as dotenv from 'dotenv';
import { Bot } from '@maxhub/max-bot-api';

dotenv.config();

const token = process.env.BOT_TOKEN;
console.log(token);
const bot = new Bot(token);

// Добавьте слушатели обновлений
// MAX Bot API будет вызывать их, когда пользователи взаимодействуют с ботом

async function getBotInfo() {
  try {
    const response = await fetch("https://platform-api.max.ru/me", {
      method: 'GET',
      headers: {
        // Обязательный заголовок для авторизации
        'Authorization': token, 
        'Content-Type': 'application/json' 
      }
    });

    if (!response.ok) {
      // Обработка ошибок HTTP (например, 401 Unauthorized, 404 Not Found)
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Информация о боте:', data);
    
    // Здесь вы можете использовать data.id, data.name и т.д.
    return data;

  } catch (error) {
    console.error('Ошибка при получении информации о боте:', error);
  }
}

getBotInfo();

// Обработчик для команды '/start'
bot.command('start', (ctx) => ctx.reply('Добро пожаловать!'));

// Обработчик для любого другого сообщения
bot.on('message_created', (ctx) => ctx.reply('Новое сообщение'));

// Теперь можно запустить бота, чтобы он подключился к серверам MAX и ждал обновлений
bot.start();
