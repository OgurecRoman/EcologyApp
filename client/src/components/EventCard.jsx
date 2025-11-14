import { MapPin, Users, Calendar } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:4000';

export default function EventCard({ event, user }) {
    const [joined, setJoined] = useState(user && event.participants.includes(user));
    const [showMap, setShowMap] = useState(false);

    const handleJoin = async () => {
        if (!user) {
            alert('Войди через MAX, чтобы участвовать!');
            return;
        }

        await axios.post(`${API}/events/${event.id}/join`, { userId: user });
        setJoined(true);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition">
            <h3 className="text-xl font-bold text-green-700">{event.name}</h3>
            <p className="text-gray-600 mt-2">{event.description}</p>

            <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                {new Date(event.date).toLocaleDateString('ru-RU')}
            </div>

            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <MapPin className="w-4 h-4" />
                {event.address}
            </div>

            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                {event.participants.length} участников
            </div>

            <div className="flex gap-2 mt-4">
                <button
                    onClick={() => setShowMap(!showMap)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                    На карте
                </button>

                <button
                    onClick={handleJoin}
                    disabled={joined}
                    className={`flex-1 py-2 rounded ${
                        joined
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                    {joined ? 'Уже участвую' : 'Участвовать'}
                </button>
            </div>

            {showMap && (
                <div className="mt-4 h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-600">Карта (вставь Leaflet ниже)</p>
                </div>
            )}
        </div>
    );
}