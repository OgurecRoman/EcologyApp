import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Get all events with optional filters
const getEvents = async (filters = []) => {
  const params = new URLSearchParams()
  filters.forEach((type) => params.append("type", type))

  const url = `/events${params.toString() ? "?" + params.toString() : ""}`
  const response = await api.get(url)
  return response.data
}

// Get user's events
const getMyEvents = async (userId) => {
  const response = await api.get(`/events/my?userId=${userId}`)
  return response.data
}

// Create new event
const createEvent = async (eventData) => {
  const response = await api.post("/events", eventData)
  return response.data
}

// Join event
const joinEvent = async (userId, eventId) => {
  const response = await api.post("/join", { userId, eventId })
  return response.data
}

export const eventsApi = {
  getEvents,
  getMyEvents,
  createEvent,
  joinEvent,
}

export { getEvents, getMyEvents, createEvent, joinEvent }

export default api
