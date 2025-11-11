import * as dotenv from 'dotenv';
import { Bot, Keyboard } from '@maxhub/max-bot-api';

dotenv.config();

const token = process.env.BOT_TOKEN;
const bot = new Bot(token);

const keyboard = Keyboard.inlineKeyboard([
  [
    Keyboard.button.link('❤️', 'https://max.ru/t211_hakaton_bot?startapp')
  ]
]);

bot.command('start', (ctx) => {
  try{

    ctx.reply('Добро пожаловать!', {attachments: [keyboard]})
  }
  catch (error) {
    console.error('Ошибка при загрузке или отправке изображения:', error);
    ctx.reply('Произошла ошибка при загрузке файла.');
  }
});

bot.start();
