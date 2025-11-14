// Event types enum
export const EventType = {
  SUBBOTNIK: "SUBBOTNIK",
  PAPER_COLLECTION: "PAPER_COLLECTION",
  BATTERY_COLLECTION: "BATTERY_COLLECTION",
  PLASTIC_COLLECTION: "PLASTIC_COLLECTION",
  GLASS_COLLECTION: "GLASS_COLLECTION",
  ELECTRONICS_COLLECTION: "ELECTRONICS_COLLECTION",
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
