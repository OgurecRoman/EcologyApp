import { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:4000';

export default function CreateEvent({ user }) {
    const [form, setForm] = useState({
        name: '', description: '', type: 'SUBBOTNIK', date: '', address: '', author: user || ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await axios.post(`${API}/events`, form);
        alert('Событие создано!');
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Добавить событие</h2>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
                <input placeholder="Название" required className="w-full p-2 mb-3 border rounded" onChange={e => setForm({...form, name: e.target.value})} />
                <textarea placeholder="Описание" className="w-full p-2 mb-3 border rounded" onChange={e => setForm({...form, description: e.target.value})} />
                <select className="w-full p-2 mb-3 border rounded" onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="SUBBOTNIK">Субботник</option>
                    <option value="PLASTIC_COLLECTION">Сбор пластика</option>
                </select>
                <input type="datetime-local" required className="w-full p-2 mb-3 border rounded" onChange={e => setForm({...form, date: e.target.value})} />
                <input placeholder="Адрес" required className="w-full p-2 mb-3 border rounded" onChange={e => setForm({...form, address: e.target.value})} />
                <input placeholder="Организатор" required className="w-full p-2 mb-3 border rounded" value={form.author} onChange={e => setForm({...form, author: e.target.value})} />
                <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                    Создать событие
                </button>
            </form>
        </div>
    );
}