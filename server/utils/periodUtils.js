// utils/periodUtils.js

// Утилита для работы с периодами рейтинга
export function getCurrentPeriod() {
    // пока для тестов период = минута
    const now = new Date();
    return {
        period: `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`,
        timestamp: now
    };
}

export function shouldResetRating(lastActivity) {
    if (!lastActivity) return true;

    const now = new Date();
    const lastActivityDate = new Date(lastActivity);

    // Для теста: сбрасываем рейтинг, если прошла минута
    const diffInMinutes = (now - lastActivityDate) / (1000 * 60);
    return diffInMinutes > 1;

    // (месяц):
    // return now.getMonth() !== lastActivityDate.getMonth() ||
    //        now.getFullYear() !== lastActivityDate.getFullYear();
}

export function updateUserActivity(user) {
    const currentPeriod = getCurrentPeriod();

    if (shouldResetRating(user.lastActivity)) {
        // Сбрасываем рейтинг, если период сменился
        return {
            rating: 0,
            lastActivity: currentPeriod.timestamp
        };
    }

    // Сохраняем текущий рейтинг, но обновляем время активности
    return {
        rating: user.rating,
        lastActivity: currentPeriod.timestamp
    };
}
