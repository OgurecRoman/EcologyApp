import React, { useState, useEffect, useCallback } from 'react';
import EventCard from './EventCard';
import AddEventTab from './AddEventTab';
import { Button } from '@maxhub/max-ui';

const EventsTab = () => {
    const [events, setEvents] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [showAddForm, setShowAddForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const BASE_URL = process.env.REACT_APP_URL || 'https://ecology-app-test.vercel.app';

    const userId = 79097811;
    const name = 'Роман';

    console.log(error);

    useEffect(() => {
        const getUser = async () => {
            try {
                const response = await fetch(`${BASE_URL}/user?id=${userId}&name=${name}`);
                if (!response.ok) {
                    throw new Error(`Ошибка загрузки пользователя: ${response.status}`);
                }
                const userData = await response.json();
                setUser(userData);
            } catch (err) {
                console.error(err);
                setError(err.message);
            }
        };

        getUser();
    }, [BASE_URL, userId, name]);

    // Оборачиваем fetchData в useCallback
    const fetchData = useCallback(async (url) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Ошибка: ${response.status}`);
            }
            const data = await response.json();
            if (activeTab === 'all') {
                setEvents(data);
            } else {
                setEvents(data.events || []);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [activeTab]); // Добавляем activeTab, так как она используется внутри

    // Теперь добавляем fetchData в зависимости
    useEffect(() => {
        const url = (activeTab === 'all') ? `${BASE_URL}/events` : `${BASE_URL}/user?id=${userId}&name=${name}`;
        fetchData(url);
    }, [activeTab, BASE_URL, fetchData]); // fetchData добавлен в зависимости

    const handleBack = () => {
        setShowAddForm(false);
    };

    if (showAddForm) {
        return (
            <div className="events-tab">
                <Button onClick={handleBack} className="back-button">
                    &larr; Назад к событиям
                </Button>
                <AddEventTab />
            </div>
        );
    }

    return (
        <div className="events-view">
            <div className="events-header">
                <Button onClick={() => setShowForm(true)} className="events-add-btn">
                    + Добавить
                </Button>
            </div>

            {showForm ? (
                <div>
                    <AddEventTab onClose={() => setShowForm(false)} userId={user?.id} />
                </div>
            ) : (
                <div>
                    <div className="events-tabs">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`events-tab ${activeTab === "all" ? "active" : ""}`}
                        >
                            Все события
                        </button>
                        <button
                            onClick={() => setActiveTab("my")}
                            className={`events-tab ${activeTab === "my" ? "active" : ""}`}
                        >
                            Мои события
                        </button>
                    </div>

                    {loading ? (
                        <div className="events-loading">
                            <div className="spinner"></div>
                            <p>Загрузка...</p>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="events-empty">
                            <p>Событий пока нет</p>
                        </div>
                    ) : (
                        <div className="events-list">
                            {events.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    user={user}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventsTab;