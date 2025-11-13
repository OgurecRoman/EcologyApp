"use client"

import { createContext, useContext, useState } from "react"

const SelectedEventContext = createContext(undefined)

export function SelectedEventProvider({ children }) {
  const [selectedEvent, setSelectedEvent] = useState(null)

  return (
    <SelectedEventContext.Provider value={{ selectedEvent, setSelectedEvent }}>
      {children}
    </SelectedEventContext.Provider>
  )
}

export function useSelectedEvent() {
  const context = useContext(SelectedEventContext)
  if (context === undefined) {
    throw new Error("useSelectedEvent must be used within SelectedEventProvider")
  }
  return context
}
