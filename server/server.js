import express from 'express';

const app = express();
// app.set('view engine', 'ejs');
// app.set('views', './views');

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
</html>`

// Создание сервера
app.get('/', (req, res) => {
    try {
        res.send(htmlContent)
    } catch (error) {
        res.send('Ошибка!!!');
        console.log(error);
    }
});

const PORT = 3000;

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`➡️ Откройте http://localhost:${PORT} в браузере`);
});