import React, { useState, useEffect, useCallback } from 'react';
import EventCard from './EventCard';
import AddEventTab from './AddEventTab';
import { Button } from '@maxhub/max-ui';

const EventsTab = () => {
    const [events, setEvents] = useState([]); // Все события, полученные с сервера
    const [displayedEvents, setDisplayedEvents] = useState([]); // События для отображения
    const [activeTab, setActiveTab] = useState('all');
    const [showAddForm, setShowAddForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loadedCount, setLoadedCount] = useState(0); // Сколько событий уже показано

    const BASE_URL = process.env.REACT_APP_URL || 'https://ecology-app-test.vercel.app';
    const EVENTS_PER_PAGE = 5; // Количество событий на "порцию"

    const data = window.WebApp.initDataUnsafe;
    // const userId = 79097811;
    // const name = 'Рома';
    const userId = data?.user?.id || null;
    const name = data?.user?.first_name || null;

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

        if (userId && name) {
            getUser();
        }
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
            const fetchedEvents = (activeTab === 'all') ? data : (data.events || []);
            setEvents(fetchedEvents); // Сохраняем все события
            setLoadedCount(0); // Сбрасываем счетчик при смене вкладки
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [activeTab, BASE_URL]);

    // Теперь добавляем fetchData в зависимости
    useEffect(() => {
        const url = (activeTab === 'all') ? `${BASE_URL}/events` : `${BASE_URL}/user?id=${userId}&name=${name}`;
        fetchData(url);
    }, [activeTab, BASE_URL, fetchData]);

    // Эффект для обновления отображаемых событий при изменении общего списка или loadedCount
    useEffect(() => {
        const end = loadedCount + EVENTS_PER_PAGE;
        const newEventsToShow = events.slice(0, end);
        setDisplayedEvents(newEventsToShow);
    }, [events, loadedCount]);

    const handleLoadMore = () => {
        setLoadedCount(prev => prev + EVENTS_PER_PAGE);
    };

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

    const hasMoreEvents = displayedEvents.length < events.length;

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
                    ) : displayedEvents.length === 0 ? (
                        <div className="events-empty">
                            <p>Событий пока нет</p>
                        </div>
                    ) : (
                        <div>
                            <div className="events-list">
                                {displayedEvents.map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                    />
                                ))}
                            </div>
                            {hasMoreEvents && (
                                <div className="load-more-container" style={{ textAlign: 'center', margin: '20px 0' }}>
                                    <Button onClick={handleLoadMore}>
                                        Показать еще
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventsTab;