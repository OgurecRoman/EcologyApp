"use client"

import { useState, useEffect } from "react"
import { getEvents } from "../api/eventsApi"

export function useEvents(filters = []) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const data = await getEvents(filters)
        setEvents(data)
        setError(null)
      } catch (err) {
        setError(err.message)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [filters.join(",")])

  return { events, loading, error, refetch: () => getEvents(filters).then(setEvents) }
}

export function useMyEvents(userId) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        setLoading(true)
        const { getMyEvents } = await import("../api/eventsApi")
        const data = await getMyEvents(userId)
        setEvents(data)
        setError(null)
      } catch (err) {
        setError(err.message)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchMyEvents()
    }
  }, [userId])

  return { events, loading, error }
}
