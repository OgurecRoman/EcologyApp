const YANDEX_API_KEY = process.env.NEXT_PUBLIC_YANDEX_API_KEY

export const geocodeAddress = async (address) => {
  try {
    const response = await fetch(
      `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_API_KEY}&geocode=${encodeURIComponent(address)}&format=json`,
    )
    const data = await response.json()

    const geoObject = data.response.GeoObjectCollection.featureMember[0]
    if (geoObject) {
      const pos = geoObject.GeoObject.Point.pos.split(" ")
      return [Number.parseFloat(pos[1]), Number.parseFloat(pos[0])] // [lat, lon]
    }

    return null
  } catch (error) {
    console.error("Geocoding error:", error)
    return null
  }
}
