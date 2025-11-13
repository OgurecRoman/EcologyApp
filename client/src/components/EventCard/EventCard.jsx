"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@maxhub/max-ui"
import { joinEvent } from "../../api/eventsApi"
import { EventTypeLabels } from "../../types/event"
import { useSelectedEvent } from "../../context/SelectedEventContext"
import "./EventCard.css"

export default function EventCard({ event, isJoined, userId, onJoinSuccess }) {
  const router = useRouter()
  const { setSelectedEvent } = useSelectedEvent()
  const [loading, setLoading] = useState(false)
  const [joined, setJoined] = useState(isJoined)

  const handleJoin = async () => {
    if (!userId) {
      alert("Необходима авторизация")
      return
    }

    try {
      setLoading(true)
      await joinEvent(userId, event.id)
      setJoined(true)
      if (onJoinSuccess) onJoinSuccess()
    } catch (error) {
      console.error("Failed to join event:", error)
      alert("Ошибка при записи на событие")
    } finally {
      setLoading(false)
    }
  }

  const handleShowOnMap = () => {
    setSelectedEvent(event)
    router.push("/")
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
        <Button onClick={handleShowOnMap} className="event-card-btn-secondary">
          Показать на карте
        </Button>

        {joined ? (
          <div className="event-card-joined">Вы записаны!</div>
        ) : (
          <Button onClick={handleJoin} disabled={loading} className="event-card-btn-primary">
            {loading ? "Запись..." : "Записаться"}
          </Button>
        )}
      </div>
    </div>
  )
}
