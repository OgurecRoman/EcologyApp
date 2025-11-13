import React, { useState } from 'react';

const AddEventTab = ({ setActiveTab }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'SUBBOTNIK',
    date: '',
    address: '',
    city: '',
    author: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = `${process.env.REACT_APP_URL}/events`
      console.log(url);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Ошибка сервера');

      alert('Событие добавлено!');
      setFormData({
        name: '',
        description: '',
        type: 'SUBBOTNIK',
        date: '',
        address: '',
        city: '',
        author: '',
      });
      setActiveTab('map-tab'); // Переключаемся на карту
    } catch (err) {
      console.error(err);
      alert('Ошибка при добавлении события');
    }
  };

  return (
    <div>
      <h2>Добавить событие</h2>
      <form onSubmit={handleSubmit}>
        <label>Название:</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <label>Описание:</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
        />

        <label>Тип события:</label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
        >
          <option value="SUBBOTNIK">Субботник</option>
          <option value="PAPER_COLLECTION">Сбор бумаги</option>
          <option value="BATTERY_COLLECTION">Сбор батареек</option>
          <option value="PLASTIC_COLLECTION">Сбор пластика</option>
          <option value="GLASS_COLLECTION">Сбор стекла</option>
          <option value="ELECTRONICS_COLLECTION">Сбор электроники</option>
          <option value="OTHER">Другое</option>
        </select>

        <label>Дата и время:</label>
        <input
          type="datetime-local"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />

        <label>Адрес:</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
        />

        <label>Город:</label>
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
        />

        <label>Автор:</label>
        <input
          type="text"
          name="author"
          value={formData.author}
          onChange={handleChange}
          required
        />

        <button type="submit">Добавить событие</button>
      </form>
    </div>
  );
};

export default AddEventTab;