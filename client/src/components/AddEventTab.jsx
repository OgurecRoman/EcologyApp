"use client"

import { useState } from "react"
import { Button } from "@maxhub/max-ui"
import { EventType, EventTypeLabels } from "../types/event"

const API = process.env.REACT_APP_URL || 'https://ecology-app-test.vercel.app';

export default function AddEventTab({ onClose, userId }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: EventType.SUBBOTNIK,
    date: "",
    address: "",
    author: "",
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) newErrors.name = "Название обязательно"
    if (!formData.type) newErrors.type = "Выберите тип события"
    if (!formData.date) newErrors.date = "Дата обязательна"
    if (!formData.address.trim()) newErrors.address = "Адрес обязателен"
    if (!formData.author.trim()) newErrors.author = "Автор обязателен"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    try {
      setLoading(true)
      await fetch(`${API}/events`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(formData)});
      onClose()
    } catch (error) {
      console.error("Failed to create event:", error)
      alert("Ошибка при создании события")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="event-form-overlay" onClick={onClose}>
      <div className="event-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="event-form-header">
          <h2>Добавить событие</h2>
          <Button onClick={onClose} className="event-form-close">
            ×
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="event-form">
          <div className="event-form-field">
            <label>Название *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Введите название события"
            />
            {errors.name && <span className="event-form-error">{errors.name}</span>}
          </div>

          <div className="event-form-field">
            <label>Описание</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Описание события"
              rows={4}
            />
          </div>

          <div className="event-form-field">
            <label>Тип события *</label>
            <select name="type" value={formData.type} onChange={handleChange}>
              {Object.values(EventType).map((type) => (
                <option key={type} value={type}>
                  {EventTypeLabels[type]}
                </option>
              ))}
            </select>
            {errors.type && <span className="event-form-error">{errors.type}</span>}
          </div>

          <div className="event-form-field">
            <label>Дата *</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} />
            {errors.date && <span className="event-form-error">{errors.date}</span>}
          </div>

          <div className="event-form-field">
            <label>Адрес *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Введите адрес"
            />
            {errors.address && <span className="event-form-error">{errors.address}</span>}
          </div>

          <div className="event-form-field">
            <label>Автор *</label>
            <input type="text" name="author" value={formData.author} onChange={handleChange} placeholder="Ваше имя" />
            {errors.author && <span className="event-form-error">{errors.author}</span>}
          </div>

          <div className="event-form-actions">
            <Button type="button" onClick={onClose} className="event-form-btn-cancel">
              Отмена
            </Button>
            <Button type="submit" disabled={loading} className="event-form-btn-submit">
              {loading ? "Создание..." : "Создать"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
