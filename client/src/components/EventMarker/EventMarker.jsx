"use client"

import { Placemark } from "@pbe/react-yandex-maps"
import { EventTypeLabels } from "../../types/event"

export default function EventMarker({ event, coordinates, onClick, isSelected }) {
  const balloonContent = `
    <div style="padding: 12px; max-width: 300px;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${event.name}</h3>
      <p style="margin: 4px 0; font-size: 14px; color: #666;"><strong>Тип:</strong> ${EventTypeLabels[event.type] || event.type}</p>
      <p style="margin: 4px 0; font-size: 14px; color: #666;"><strong>Дата:</strong> ${new Date(event.date).toLocaleDateString("ru-RU")}</p>
      <p style="margin: 4px 0; font-size: 14px; color: #666;"><strong>Адрес:</strong> ${event.address}</p>
      <p style="margin: 4px 0; font-size: 14px; color: #666;"><strong>Автор:</strong> ${event.author}</p>
      ${event.description ? `<p style="margin: 8px 0 0 0; font-size: 14px;">${event.description}</p>` : ""}
    </div>
  `

  return (
    <Placemark
      geometry={coordinates}
      properties={{
        balloonContent,
        hintContent: event.name,
      }}
      options={{
        preset: isSelected ? "islands#redIcon" : "islands#blueIcon",
        balloonMaxWidth: 350,
      }}
      onClick={onClick}
    />
  )
}
