import { updateEventsActualStatus } from '../services/event.js';

// Функция для запуска обновления статуса событий
export async function startEventsActualization() {
    try {
        console.log('🔄 Запуск автоматического обновления актуальности событий...');
        const updatedCount = await updateEventsActualStatus();
        console.log(`✅ Автоматическое обновление завершено. Обновлено: ${updatedCount} событий`);
    } catch (error) {
        console.error('❌ Ошибка при автоматическом обновлении актуальности событий:', error);
    }
}

// Запускаем обновление каждые 5 минут
export function startEventsActualizationCron() {
    // Обновляем сразу при запуске
    startEventsActualization();

    // Затем каждые 5 минут
    const interval = 5 * 60 * 1000; // 5 минут в миллисекундах
    setInterval(startEventsActualization, interval);

    console.log(`⏰ Cron для обновления актуальности событий запущен (интервал: 5 минут)`);
}
