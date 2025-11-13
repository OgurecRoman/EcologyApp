"use client"

import BottomNavigation from "../BottomNavigation/BottomNavigation"
import "./Layout.css"

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <main className="app-content">{children}</main>
      <BottomNavigation />
    </div>
  )
}
