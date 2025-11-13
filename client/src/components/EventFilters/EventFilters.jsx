"use client"

import { useState } from "react"
import { Button } from "@maxhub/max-ui"
import { EventType, EventTypeLabels } from "../../types/event"
import "./EventFilters.css"

export default function EventFilters({ onFiltersChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState([])

  const handleFilterToggle = (type) => {
    const newFilters = selectedFilters.includes(type)
      ? selectedFilters.filter((f) => f !== type)
      : [...selectedFilters, type]

    setSelectedFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    setSelectedFilters([])
    onFiltersChange([])
  }

  return (
    <div className="event-filters">
      <Button onClick={() => setIsOpen(!isOpen)} className="filters-toggle">
        <span>Фильтры</span>
        {selectedFilters.length > 0 && <span className="filters-badge">{selectedFilters.length}</span>}
        <span className={`arrow ${isOpen ? "open" : ""}`}>▼</span>
      </Button>

      {isOpen && (
        <div className="filters-dropdown">
          <div className="filters-header">
            <h3>Типы событий</h3>
            {selectedFilters.length > 0 && (
              <Button onClick={clearFilters} className="clear-btn">
                Очистить
              </Button>
            )}
          </div>

          <div className="filters-list">
            {Object.values(EventType).map((type) => (
              <label key={type} className="filter-item">
                <input
                  type="checkbox"
                  checked={selectedFilters.includes(type)}
                  onChange={() => handleFilterToggle(type)}
                />
                <span>{EventTypeLabels[type]}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
