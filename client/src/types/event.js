// Event types enum
export const EventType = {
  SUBBOTNIK: "SUBBOTNIK",
  PAPER_COLLECTION: "PAPER COLLECTION",
  BATTERY_COLLECTION: "BATTERY COLLECTION",
  PLASTIC_COLLECTION: "PLASTIC COLLECTION",
  GLASS_COLLECTION: "GLASS COLLECTION",
  ELECTRONICS_COLLECTION: "ELECTRONICS COLLECTION",
  OTHER: "OTHER",
}

export const EventTypeLabels = {
  [EventType.SUBBOTNIK]: "Субботник",
  [EventType.PAPER_COLLECTION]: "Сбор бумаги",
  [EventType.BATTERY_COLLECTION]: "Сбор батареек",
  [EventType.PLASTIC_COLLECTION]: "Сбор пластика",
  [EventType.GLASS_COLLECTION]: "Сбор стекла",
  [EventType.ELECTRONICS_COLLECTION]: "Сбор электроники",
  [EventType.OTHER]: "Другое",
}
