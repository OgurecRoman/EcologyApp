import { Button } from '@maxhub/max-ui';
import { EventTypeLabels } from "../types/event"
import { useState } from 'react';

const API = process.env.REACT_APP_URL || 'https://ecology-app-test.vercel.app';

export default function EventCard({ event, user }) {
    // Добавим проверку, чтобы избежать ошибки, если event или event.participants undefined
    const [joined, setJoined] = useState(
        user && event?.participants && event.participants.includes(user)
    );
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
        {/* <Button onClick={handleShowOnMap} className="event-card-btn-secondary">
          Показать на карте
        </Button> */}

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