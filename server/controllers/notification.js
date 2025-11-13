import fetch from 'node-fetch';

// тут жоска уведомления отправляем ёу
async function sendMessageToUser(chatId, message) {
    try {
        const BOT_URL = process.env.BOT_URL || 'http://localhost:3001';

        const response = await fetch(`${BOT_URL}/send-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatId: chatId,
                message: message
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Ошибка при отправке сообщения через бота:', error);
        throw error;
    }
}

export const sendNotification = async (req, res) => {
    try {
        const { chatIds, message, eventId } = req.body;

        if (!chatIds || !message) {
            return res.status(400).json({
                error: 'Обязательные поля: chatIds, message'
            });
        }

        // отправляем всем
        const chatIdsArray = Array.isArray(chatIds) ? chatIds : [chatIds];

        const results = [];

        for (const chatId of chatIdsArray) {
            try {
                const result = await sendMessageToUser(chatId, message);
                results.push({
                    chatId: chatId,
                    status: 'success',
                    result: result
                });
            } catch (error) {
                results.push({
                    chatId: chatId,
                    status: 'error',
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            sent: results.filter(r => r.status === 'success').length,
            failed: results.filter(r => r.status === 'error').length,
            results: results
        });

    } catch (error) {
        console.error('Ошибка при отправке уведомления:', error);
        res.status(500).json({
            error: 'Ошибка при отправке уведомления'
        });
    }
};