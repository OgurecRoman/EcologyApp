"use client"

import { useState, useEffect } from "react"
import { YMaps, Map } from "@pbe/react-yandex-maps"
import EventFilters from "../../components/EventFilters/EventFilters"
import EventMarker from "../../components/EventMarker/EventMarker"
import { useEvents } from "../../hooks/useEvents"
import { geocodeAddress } from "../../services/geocoding"
import { useSelectedEvent } from "../../context/SelectedEventContext"
import "./MapView.css"

export default function MapView() {
  const [filters, setFilters] = useState([])
  const [mapState, setMapState] = useState({
    center: [55.751574, 37.573856],
    zoom: 10,
  })
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [eventCoordinates, setEventCoordinates] = useState({})

  const { events, loading } = useEvents(filters)
  const { selectedEvent, setSelectedEvent } = useSelectedEvent()

  useEffect(() => {
    const geocodeEvents = async () => {
      const coordinates = {}
      for (const event of events) {
        if (!eventCoordinates[event.id]) {
          const coords = await geocodeAddress(event.address)
          if (coords) {
            coordinates[event.id] = coords
          }
        }
      }
      if (Object.keys(coordinates).length > 0) {
        setEventCoordinates((prev) => ({ ...prev, ...coordinates }))
      }
    }

    if (events.length > 0) {
      geocodeEvents()
    }
  }, [events])

  useEffect(() => {
    if (selectedEvent && eventCoordinates[selectedEvent.id]) {
      const coords = eventCoordinates[selectedEvent.id]
      setMapState({ center: coords, zoom: 15 })
      setSelectedEventId(selectedEvent.id)
      setSelectedEvent(null)
    }
  }, [selectedEvent, eventCoordinates, setSelectedEvent])

  return (
    <div className="map-view">
      <div className="map-filters-container">
        <EventFilters onFiltersChange={setFilters} />
      </div>

      {loading && (
        <div className="map-loading">
          <div className="spinner"></div>
          <p>Загрузка событий...</p>
        </div>
      )}

      <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_API_KEY }}>
        <Map state={mapState} className="yandex-map" modules={["geoObject.addon.balloon", "geoObject.addon.hint"]}>
          {events.map((event) => {
            const coordinates = eventCoordinates[event.id]
            if (!coordinates) return null

            return (
              <EventMarker
                key={event.id}
                event={event}
                coordinates={coordinates}
                isSelected={selectedEventId === event.id}
                onClick={() => setSelectedEventId(event.id)}
              />
            )
          })}
        </Map>
      </YMaps>
    </div>
  )
}
