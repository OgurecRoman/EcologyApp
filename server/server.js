import express from 'express';

const app = express();
app.set('view engine', 'ejs');
app.set('views', './views');

// Создание сервера
app.get('/', (req, res) => {
  try {
    res.render('index');
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