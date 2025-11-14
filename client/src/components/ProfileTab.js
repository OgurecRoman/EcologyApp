// ProfileTab.jsx
import React, { useState, useEffect } from 'react';

const ProfileTab = () => {
    const [userData, setUserData] = useState({
        username: 'Пользователь',
        rating: 0,
        lastActivity: null
    });
    const [stats, setStats] = useState({
        eventsCount: 0,
        rank: 0,
        followersCount: 0,
        followingCount: 0
    });
    const [loading, setLoading] = useState(true);

    const BASE_URL = process.env.REACT_APP_URL || 'https://ecology-app-test.vercel.app';

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            let userId;

            // Пытаемся получить реального пользователя из Max
            if (window.max && window.max.user) {
                try {
                    const maxUser = await window.max.user.get();
                    userId = maxUser.id;
                    console.log('Реальный пользователь Max:', maxUser);
                } catch (error) {
                    console.warn('Не удалось получить пользователя из Max:', error);
                    userId = 1; // fallback
                }
            } else {
                console.log('Max Bridge недоступен, используем тестовый ID');
                userId = 1; // fallback
            }

            // Получаем данные пользователя с бэкенда
            const userResponse = await fetch(`${BASE_URL}/user?id=${userId}`);

            if (userResponse.ok) {
                const user = await userResponse.json();
                setUserData({
                    username: user.username,
                    rating: user.rating,
                    lastActivity: user.lastActivity
                });

                await loadUserStats(userId);
            } else {
                // Если пользователь не найден на бэкенде, создаем его
                await createUser(userId);
            }
        } catch (error) {
            console.error('Ошибка загрузки данных пользователя:', error);
            // Используем тестовые данные при ошибке
            setUserData({
                username: 'Пользователь',
                rating: 0,
                lastActivity: new Date().toISOString()
            });
        } finally {
            setLoading(false);
        }

        const createUser = async (userId) => {
            try {
                // Получаем имя пользователя из Max или используем дефолтное
                let username = 'Пользователь Max';
                if (window.max && window.max.user) {
                    const maxUser = await window.max.user.get();
                    username = maxUser.name || maxUser.username || username;
                }

                const response = await fetch(`${BASE_URL}/user`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: userId,
                        username: username
                    }),
                });

                if (response.ok) {
                    const newUser = await response.json();
                    setUserData({
                        username: newUser.username,
                        rating: newUser.rating,
                        lastActivity: newUser.lastActivity
                    });
                    await loadUserStats(userId);
                }
            } catch (error) {
                console.error('Ошибка создания пользователя:', error);
            }
        };
    };

    const loadUserStats = async (userId) => {
        try {
            // Здесь можно добавить запросы для получения статистики
            // Пока используем тестовые данные
            setStats({
                eventsCount: 5,
                rank: 0,
                followersCount: 15,
                followingCount: 10
            });
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                Загрузка профиля...
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ textAlign: 'center', width: '100%', marginBottom: '20px' }}>
                Профиль
            </h2>

            {/* Основная информация */}
            <div style={{
                background: '#7e5959',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
            }}>
                <h3 style={{ marginBottom: '10px' }}>
                    {userData.username}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span>Рейтинг:</span>
                    <span style={{ color: '#fbe3ae', fontWeight: 'bold', fontSize: '20px' }}>
            {userData.rating} ★
          </span>
                </div>

                {userData.lastActivity && (
                    <div style={{ color: '#f5f5f5', fontSize: '14px' }}>
                        Последняя активность: {new Date(userData.lastActivity).toLocaleDateString('ru-RU')}
                    </div>
                )}
            </div>

            {/* Статистика */}
            <h3 style={{ marginBottom: '15px' }}>Статистика</h3>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginBottom: '20px'
            }}>
                <div style={{ background: '#557085', padding: '15px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                        {stats.eventsCount}
                    </div>
                    <div style={{ fontSize: '14px', color: '#f5f5f5' }}>Участий в событиях</div>
                </div>

                <div style={{ background: '#527a52', padding: '15px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                        {stats.postsCount}
                    </div>
                    <div style={{ fontSize: '14px', color: '#f5f5f5' }}>Рейтинг в топе</div>
                </div>

                <div style={{ background: '#73654d', padding: '15px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                        {stats.followersCount}
                    </div>
                    <div style={{ fontSize: '14px', color: '#f5f5f5' }}>Подписчиков</div>
                </div>

                <div style={{ background: '#7b5880', padding: '15px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                        {stats.followingCount}
                    </div>
                    <div style={{ fontSize: '14px', color: '#f5f5f5' }}>Подписок</div>
                </div>
            </div>

            {/* Дополнительная информация */}
            <div style={{ background: '#55687e', padding: '15px', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '10px' }}>О пользователе</h4>
                <p>
                    Активный участник экологических мероприятий. Любит природу и заботится об окружающей среде.
                </p>
            </div>
        </div>
    );
};

export default ProfileTab;
