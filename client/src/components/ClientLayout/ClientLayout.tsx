"use client"

import type React from "react"

import { SelectedEventProvider } from "../../context/SelectedEventContext"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <SelectedEventProvider>{children}</SelectedEventProvider>
}
