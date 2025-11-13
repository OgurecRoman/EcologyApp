// MapTab.jsx
import React, { useState, useEffect, useRef } from 'react';

const MapTab = () => {
  const [events, setEvents] = useState([]);
  const [filterCity, setFilterCity] = useState('');
  const [filterTypes, setFilterTypes] = useState([]);
  const [userCity, setUserCity] = useState('Москва');
  const [ymaps, setYmaps] = useState(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // Загрузка Yandex Maps API
  useEffect(() => {
    if (!window.ymaps) {
      const script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/2.1/?apikey=aa41fd1c-f570-4490-9b73-ae3db02fa604&lang=ru_RU';
      script.async = true;
      script.onload = () => {
        window.ymaps.ready(() => {
          setYmaps(window.ymaps);
        });
      };
      document.head.appendChild(script);
    } else {
      setYmaps(window.ymaps);
    }
  }, []);

  // Инициализация карты
  useEffect(() => {
    if (ymaps && !mapInstance.current) {
      mapInstance.current = new ymaps.Map(mapRef.current, {
        center: [55.751244, 37.618423],
        zoom: 10,
      });

      ymaps.geolocation.get({ provider: 'browser' })
        .then(result => {
          const position = result.position;
          mapInstance.current.setCenter(position, 10);
          ymaps.geocode(position)
            .then(res => {
              const detectedCity = res.geoObjects.get(0).getLocalities()[0] || 'Москва';
              setUserCity(detectedCity);
              setFilterCity(detectedCity);
              loadEventMarkers(detectedCity);
            });
        })
        .catch(() => {
          loadEventMarkers('Москва');
        });
    }
  }, [ymaps]);

  const loadEventMarkers = async (city = '', types = []) => {
    if (!ymaps || !mapInstance.current) return;

    try {
      const params = new URLSearchParams();
      if (city) params.append('city', city);
      if (types.length > 0) params.append('types', types.join(','));

      const url = `${process.env.REACT_APP_URL}/events${params.toString() ? '?' + params.toString() : ''}`;
      console.log(url);
      const response = await fetch(url);
      const events = await response.json();

      setEvents(events);

      mapInstance.current.geoObjects.removeAll();

      events.forEach(event => {
        if (!event.address) return;

        ymaps.geocode(event.address)
          .then(res => {
            const geoObject = res.geoObjects.get(0);
            if (!geoObject) return;

            const coords = geoObject.geometry.getCoordinates();
            const placemark = new ymaps.Placemark(coords, {
              balloonContentHeader: event.name,
              balloonContentBody: `
                <strong>Дата:</strong> ${new Date(event.date).toLocaleString('ru-RU')}<br>
                <strong>Адрес:</strong> ${event.address}<br>
                <strong>Автор:</strong> ${event.author}<br>
              `,
            });

            mapInstance.current.geoObjects.add(placemark);
          });
      });
    } catch (err) {
      console.error('Ошибка загрузки событий:', err);
    }
  };

  const handleApplyFilters = () => {
    loadEventMarkers(filterCity, filterTypes);
  };

  const handleClearFilters = () => {
    setFilterCity(userCity);
    setFilterTypes([]);
    loadEventMarkers(userCity, []);
  };

  const handleTypeChange = (e) => {
    const value = e.target.value;
    if (e.target.checked) {
      setFilterTypes(prev => [...prev, value]);
    } else {
      setFilterTypes(prev => prev.filter(t => t !== value));
    }
  };

  // ВАЖНО: Всегда возвращайте JSX, даже если ymaps не загрузился
  return (
    <div>
      {!ymaps ? (
        <div>Загрузка карты...</div>
      ) : (
        <>
          <div id="map" ref={mapRef} style={{ width: '100%', height: '500px', marginBottom: '20px' }}></div>

          <div id="filters">
            <h2>Фильтры</h2>

            <div className="filter-group">
              <label htmlFor="filterCity">Город:</label>
              <input
                type="text"
                id="filterCity"
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                placeholder="Например: Москва, Санкт-Петербург"
              />
            </div>

            <div className="filter-group">
              <label>Тип события (можно выбрать несколько):</label>
              <div className="checkbox-list" id="typeCheckboxes">
                {['SUBBOTNIK', 'PAPER_COLLECTION', 'BATTERY_COLLECTION', 'PLASTIC_COLLECTION', 'GLASS_COLLECTION', 'ELECTRONICS_COLLECTION', 'OTHER'].map(type => (
                  <label key={type}>
                    <input
                      type="checkbox"
                      value={type}
                      checked={filterTypes.includes(type)}
                      onChange={handleTypeChange}
                    /> {type.replace('_', ' ')}
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-buttons">
              <button onClick={handleApplyFilters}>Применить фильтры</button>
              <button onClick={handleClearFilters}>Сбросить</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MapTab;