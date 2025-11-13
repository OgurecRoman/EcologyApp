"use client"

import ClientLayout from "../src/components/ClientLayout/ClientLayout";
import MapView from "../src/views/MapView/MapView"

export default function Home() {
  return (
    <ClientLayout>
      <MapView />
    </ClientLayout>
  )
}
