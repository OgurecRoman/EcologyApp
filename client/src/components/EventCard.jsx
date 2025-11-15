import { Button } from '@maxhub/max-ui';
import { EventTypeLabels } from "../types/event"
import { useState, useEffect } from 'react';

const API = process.env.REACT_APP_URL || 'https://ecology-app-test.vercel.app';

export default function EventCard({ event }) {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

    const [joined, setJoined] = useState(
        user && user.events.includes(event)
    );

    const data = window.WebApp.initDataUnsafe;
    const userId = data.user.id || null;
    const name = data.user.first_name || null;

    // const userId = 79097811;
    // const name = 'Рома';

    useEffect(() => {
        const getUser = async () => {
            try {
                const response = await fetch(`${API}/user?id=${userId}&name=${name}`);
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
    }, [API, userId, name]);


    const [loading, setLoading] = useState(false)

    const handleJoin = async () => {
        if (!user) {
            alert('Войди через MAX, чтобы участвовать!');
            return;
        }

        try {
            setLoading(true);
             await fetch(`${API}/events/join`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ userId: user.id, eventId: event.id }) });
            setJoined(true);
        } catch (error) {
            console.error('Ошибка при присоединении к событию:', error);
        }
    };

    // Проверка, что event определен
    if (!event) {
        return <div>Ошибка: событие не определено</div>;
    }

    return (
    <div className="event-card">
      <div className="event-card-header">
        <h3 className="event-card-title">{event.name}</h3>
        <span className="event-card-type">{EventTypeLabels[event.type] || event.type}</span>
      </div>

      <div className="event-card-body">
        {event.description && <p className="event-card-description">{event.description}</p>}

        <div className="event-card-info">
          <div className="event-card-info-item">
            <span className="event-card-label">Дата:</span>
            <span>{new Date(event.date).toLocaleDateString("ru-RU")}</span>
          </div>

          <div className="event-card-info-item">
            <span className="event-card-label">Адрес:</span>
            <span>{event.address}</span>
          </div>

          <div className="event-card-info-item">
            <span className="event-card-label">Автор:</span>
            <span>{event.author}</span>
          </div>
        </div>
      </div>

      <div className="event-card-actions">

        {joined ? (
          <div className="event-card-joined">Вы записаны!</div>
        ) : (
          <Button onClick={handleJoin} disabled={loading} className="event-card-btn-primary">
            {loading ? "Запись..." : "Записаться"}
          </Button>
        )}
      </div>
    </div>
    );
}