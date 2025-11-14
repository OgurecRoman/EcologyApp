import { useEffect, useState } from 'react';
import axios from 'axios';
import EventCard from '../../../client/src/components/EventCard';

const API = 'http://localhost:4000';

export default function MyEvents({ user }) {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        if (user) {
            axios.get(`${API}/events/my?user=${user}`).then(res => setEvents(res.data));
        }
    }, [user]);

    if (!user) {
        return <p className="text-red-600">Войди через MAX, чтобы видеть свои события.</p>;
    }

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Мои события</h2>
            {events.length === 0 ? (
                <p>Ты ещё не записался ни на одно событие.</p>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {events.map(event => <EventCard key={event.id} event={event} user={user} />)}
                </div>
            )}
        </div>
    );
}