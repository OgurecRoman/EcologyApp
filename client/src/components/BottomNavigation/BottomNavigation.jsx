"use client"

import { usePathname, useRouter } from "next/navigation"
import { ToolButton } from "@maxhub/max-ui"
import "./BottomNavigation.css"

export default function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  const tabs = [
    { path: "/", label: "Карты" },
    { path: "/events", label: "События" },
    { path: "/profile", label: "Профиль" },
  ]

  return (
    <nav className="bottom-navigation">
      {tabs.map((tab) => (
        <ToolButton
          key={tab.path}
          onClick={() => router.push(tab.path)}
          className={pathname === tab.path ? "active" : ""}
        >
          {tab.label}
        </ToolButton>
      ))}
    </nav>
  )
}
