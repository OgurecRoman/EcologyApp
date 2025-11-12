// App.js
import React, { useEffect, useState } from 'react';

function App() {
  const [events, setEvent] = useState([]);

  useEffect(() => {
    fetch('https://ecology-app-test.vercel.app/events')
      .then(res => res.json())
      .then(data => setEvent(data))
      .catch(err => console.error('Ошибка:', err));
  }, []);

  console.log(events);

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