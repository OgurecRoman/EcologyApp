import express from express;

const app = express();
app.set('views', './views');

// Создание сервера
app.get('/', (req, res) => {
  res.send('Hello Vercel! This is my Node.js app.');
});

const PORT = 3000;

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`➡️ Откройте http://localhost:${PORT} в браузере`);
});