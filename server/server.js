import dotenv from 'dotenv';
import express from 'express';
import router from './routes/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs';
import { startEventsActualizationCron } from './utils/cron.js'; // Добавляем импорт

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer(){
    try{
        const app = express();
        app.use(express.json());
        const PORT = process.env.PORT || 3000;

        app.use(cors({
            origin: '*',
            credentials: true
        }));

        app.use('/', router);

        app.listen(PORT, () => {
            console.log(`🚀 Сервер запущен на порту ${PORT}`);
            console.log(`➡️ Откройте http://localhost:${PORT} в браузере`);

            // Запускаем cron-задачу для обновления актуальности событий
            startEventsActualizationCron();
        });
    }catch (error) {
        console.error('Failed to initialize server:', error);
        process.exit(1);
    }
}

startServer();
