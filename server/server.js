import dotenv from 'dotenv';
import express from 'express';
import router from './routes/index.js'

dotenv.config();

async function startServer(){
    try{
        const app = express();
        app.use(express.json());
        const PORT = process.env.PORT || 3000;

        app.get('/', (req, res) => {
            try {
                const htmlContent = `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Дарова</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background-color: #f4f4f4; }
                h1 { color: #333; }
            </style>
        </head>
        <body>
            <h1>👋 Привет от простого сервера на Node.js!</h1>
            <p>Текущее время на сервере: ${new Date().toLocaleTimeString('ru-RU')}</p>
        </body>
        </html>`;
                res.send(htmlContent);
            } catch (error) {
                res.send('Ошибка!!!');
                console.log(error);
            }
        });

        app.use('/', router);

        app.listen(PORT, () => {
            console.log(`🚀 Сервер запущен на порту ${PORT}`);
            console.log(`➡️ Откройте http://localhost:${PORT} в браузере`);
        });
    }catch (error) {
        console.error('Failed to initialize server:', error);
        process.exit(1);
    }
}

startServer();