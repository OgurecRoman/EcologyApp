"use client"

import { useState } from "react"
import EventCard from "../../components/EventCard/EventCard"
import EventForm from "../../components/EventForm/EventForm"
import { useEvents, useMyEvents } from "../../hooks/useEvents"
import "./EventsView.css"

const getWebApp = () => {
  if (typeof window !== "undefined" && window.WebApp) {
    return window.WebApp;
  }
  console.warn("WebApp is not available");
  return null;
};


export default function EventsView() {
  let user = null
  const webApp = getWebApp();
  if (webApp){
      console.log("Я получил виндовс")
      console.log(data.user.first_name)
      const data = window.WebApp.initDataUnsafe;
      user = data.user.id
  } else { console.log("Я ничево неполучил") }

  const [activeTab, setActiveTab] = useState("all")
  const [showForm, setShowForm] = useState(false)

  const { events: allEvents, loading: loadingAll, refetch: refetchAll } = useEvents()
  const { events: myEvents, loading: loadingMy } = useMyEvents(user)

  const currentEvents = activeTab === "all" ? allEvents : myEvents
  const loading = activeTab === "all" ? loadingAll : loadingMy

  const handleFormSuccess = () => {
    refetchAll()
  }

  return (
    <div className="events-view">
      <div className="events-header">
        <h1 className="events-title">События</h1>
        <button onClick={() => setShowForm(true)} className="events-add-btn">
          + Добавить
        </button>
      </div>

      <div className="events-tabs">
        <button onClick={() => setActiveTab("all")} className={`events-tab ${activeTab === "all" ? "active" : ""}`}>
          Все события
        </button>
        <button onClick={() => setActiveTab("my")} className={`events-tab ${activeTab === "my" ? "active" : ""}`}>
          Мои события
        </button>
      </div>

      {loading ? (
        <div className="events-loading">
          <div className="spinner"></div>
          <p>Загрузка...</p>
        </div>
      ) : currentEvents.length === 0 ? (
        <div className="events-empty">
          <p>Событий пока нет</p>
        </div>
      ) : (
        <div className="events-list">
          {currentEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isJoined={myEvents.some((e) => e.id === event.id)}
              userId={user}
              onJoinSuccess={refetchAll}
            />
          ))}
        </div>
      )}

      {showForm && <EventForm onClose={() => setShowForm(false)} onSuccess={handleFormSuccess} userId={MOCK_USER_ID} />}
    </div>
  )
}
