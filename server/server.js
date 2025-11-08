import http from 'http';

// HTML-содержимое для отправки
const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Простой Node.js Сервер</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background-color: #f4f4f4; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>👋 Привет от простого сервера на Node.js!</h1>
    <p>Эта страничка была отправлена вам через модуль 'http'.</p>
    <p>Текущее время на сервере: ${new Date().toLocaleTimeString('ru-RU')}</p>
</body>
</html>
`;

// Создание сервера
const server = http.createServer((req, res) => {
    try {
        // ... ваш код здесь ...
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(htmlContent);
    } catch (error) {
        console.error('Ошибка при обработке запроса:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Внутренняя ошибка сервера.');
    }
});

const PORT = 3000;

// Запуск сервера
server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`➡️ Откройте http://localhost:${PORT} в браузере`);
});