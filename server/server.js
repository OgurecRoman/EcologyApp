import dotenv from 'dotenv';
import express from 'express';
import router from './routes/index.js';
import checkEvent from './api/check_event.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer(){
    try{
        const app = express();
        app.use(express.json());
        const PORT = process.env.PORT || 3000;

        app.use('/', router);

        app.get('/', (req, res) => {
            try {
                const htmlFilePath = path.join(__dirname, 'templates', 'index.html');
                console.log(htmlFilePath);
                fs.readFile(htmlFilePath, 'utf8', (err, data) => {
                if (err) {
                    console.error('Ошибка при чтении файла:', err);
                    return res.status(500).send('Ошибка сервера при загрузке HTML');
                }

                res.send(data);
                });
            } catch (error) {
                res.send('Ошибка!!!');
                console.log(error);
            }
        });

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
