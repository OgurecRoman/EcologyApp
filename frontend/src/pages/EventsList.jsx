import { useEffect, useState } from 'react';
import axios from 'axios';
import EventCard from '../../../client/src/components/EventCard.jsx';
import { useLocation } from 'react-router';

const API = 'http://localhost:4000';

export default function EventsList({ user, setUser }) {
    const [events, setEvents] = useState([]);
    const location = useLocation();

    useEffect(() => {
        // MAX Login
        const urlParams = new URLSearchParams(location.search);
        const maxUser = urlParams.get('user');
        if (maxUser) setUser(maxUser);

        axios.get(`${API}/events`).then(res => setEvents(res.data));
    }, [location, setUser]);

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Все события</h2>
            {events.length === 0 ? (
                <p className="text-gray-600">Пока нет событий. Будь первым!</p>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {events.map(event => (
                        <EventCard key={event.id} event={event} user={user} />
                    ))}
                </div>
            )}
        </div>
    );
}