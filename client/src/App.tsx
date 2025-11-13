import type React from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { YMaps } from "@pbe/react-yandex-maps"
import { SelectedEventProvider } from "./context/SelectedEventContext"
import Layout from "./components/Layout/Layout"
import MapView from "./views/MapView/MapView"
import EventsView from "./views/EventsView/EventsView"
import ProfileView from "./views/ProfileView/ProfileView"
import "./App.css"

const App: React.FC = () => {
  return (
    <YMaps query={{ apikey: process.env.REACT_APP_YANDEX_API_KEY }}>
      <SelectedEventProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<MapView />} />
              <Route path="events" element={<EventsView />} />
              <Route path="profile" element={<ProfileView />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SelectedEventProvider>
    </YMaps>
  )
}

export default App
