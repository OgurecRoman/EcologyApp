"use client"

import { useState, useEffect } from "react"
import type { Event, EventType } from "../types/event"
import { eventsApi } from "../api/eventsApi"

export const useEvents = (filters?: EventType[]) => {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await eventsApi.getEvents(filters)
        setEvents(data)
      } catch (err) {
        setError("Ошибка загрузки событий")
        console.error("[v0] Error fetching events:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [filters?.join(",")])

  return { events, loading, error, refetch: () => setEvents([]) }
}

export const useMyEvents = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMyEvents = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await eventsApi.getMyEvents()
      setEvents(data)
    } catch (err) {
      setError("Ошибка загрузки событий")
      console.error("[v0] Error fetching my events:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyEvents()
  }, [])

  return { events, loading, error, refetch: fetchMyEvents }
}
