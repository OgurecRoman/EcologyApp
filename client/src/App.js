import React, { useEffect, useState } from 'react';

function App() {
  const [events, setEvent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Запрос к API начат...');

    fetch('https://ecology-app-test.vercel.app/events')
      .then(res => {
        console.log('Ответ получен:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Данные получены:', data);
        setEvent(data);
      })
      .catch(err => {
        console.error('Ошибка при загрузке событий:', err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div>
      <h1>События</h1>
      <ul>
        {events.map(event => (
          <li key={event.id}>{event.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;