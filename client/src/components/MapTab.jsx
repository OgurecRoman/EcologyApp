// MapTab.jsx
import { Button, Grid, Input, Panel, Switch, Typography } from '@maxhub/max-ui';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EventType, EventTypeLabels } from '../types/event'

const MapTab = () => {
  const [events, setEvents] = useState([]);
  const [filterCity, setFilterCity] = useState('');
  const [userCity, setUserCity] = useState('Москва');
  const [ymaps, setYmaps] = useState(null);
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState([])
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  const BASE_URL = process.env.REACT_APP_URL || 'https://ecology-app-test.vercel.app'

  console.log(events);

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

  const loadEventMarkers = useCallback(async (city = '', types = []) => {
    // Проверка на наличие ymaps и mapInstance.current важна
    if (!ymaps || !mapInstance.current) {
      console.log('Ymaps или карта не готовы');
      return;
    }

    try {
      console.log("ТИПЫ");
      console.log(types);
      const params = new URLSearchParams();
      if (city) params.append('city', city);
      if (types.length > 0) params.append('types', types.join(','));

      const url = `${BASE_URL}/events${params.toString() ? '?' + params.toString() : ''}`;
      console.log('Загрузка событий из:', url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // ✅ Правильно: получаем JSON и сразу обновляем состояние
      const fetchedEvents = await response.json();
      setEvents(fetchedEvents);

      // Очищаем существующие метки
      mapInstance.current.geoObjects.removeAll();

      // Добавляем новые метки
      fetchedEvents.forEach(event => {
        if (!event.address) {
          console.warn('Событие без адреса, пропущено:', event);
          return; // Пропускаем, если нет адреса
        }

        // Геокодируем адрес
        ymaps.geocode(event.address)
          .then(res => {
            const geoObject = res.geoObjects.get(0);
            if (!geoObject) {
              console.warn('Не удалось геокодировать адрес:', event.address);
              return; // Пропускаем, если не найден
            }

            const coords = geoObject.geometry.getCoordinates();
            const placemark = new ymaps.Placemark(coords, {
              balloonContentHeader: event.name,
              balloonContentBody: `
                <strong>Тип события:</strong> ${EventTypeLabels[event.type]}<br>
                <strong>Дата:</strong> ${new Date(event.date).toLocaleString('ru-RU')}<br>
                <strong>Адрес:</strong> ${event.address}<br>
                <strong>Автор:</strong> ${event.author}<br>
              `,
            });

            // Добавляем метку на карту
            mapInstance.current.geoObjects.add(placemark);
          })
          .catch(geocodeErr => {
            console.error('Ошибка геокодирования:', geocodeErr);
          });
      });
    } catch (err) {
      console.error('Ошибка загрузки событий:', err);
    }
  }, [ymaps, BASE_URL]); // Зависимость: ymaps, т.к. используется внутри

  // Инициализация карты
  useEffect(() => {
    if (ymaps && !mapInstance.current) {
      // Создаём экземпляр карты и сохраняем в ref
      mapInstance.current = new ymaps.Map(mapRef.current, {
        center: [55.751244, 37.618423],
        zoom: 10,
      });

      // Пытаемся определить местоположение пользователя
      ymaps.geolocation.get({ provider: 'browser' })
        .then(result => {
          const position = result.position;
          mapInstance.current.setCenter(position, 10);
          return ymaps.geocode(position);
        })
        .then(res => {
          const detectedCity = res.geoObjects.get(0).getLocalities()[0] || 'Москва';
          setUserCity(detectedCity);
          setFilterCity(detectedCity);
          // ✅ Теперь loadEventMarkers в зависимостях, ESLint доволен
          loadEventMarkers(detectedCity);
        })
        .catch(err => {
          console.error('Ошибка геолокации:', err);
          // Загружаем события для Москвы по умолчанию
          loadEventMarkers('Москва');
        });
    }
  }, [ymaps, loadEventMarkers]); // <--- ✅ Добавлен loadEventMarkers

  const handleFilterToggle = (type) => {
    const newFilters = selectedFilters.includes(type)
      ? selectedFilters.filter((f) => f !== type)
      : [...selectedFilters, type]

    setSelectedFilters(newFilters)
    loadEventMarkers(filterCity, newFilters)
  }

  const handleClearFilters = () => {
    // Сбрасываем фильтры
    setFilterCity(userCity);
    setSelectedFilters([]);
    // Загружаем события для текущего города
    loadEventMarkers(userCity, []);
  };

  return (
    <div style={{width: '100%'}}>
      {!ymaps ? (
        <div>Загрузка карты...</div>
      ) : (
        <>
          <Typography.Display style={{textAlign: 'center', width: '100%', marginBottom: '10px' }} >Карта событий</Typography.Display>
          <Input className='input'
            type="text"
            compact="true"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            placeholder="Ведите город: Москва, Санкт-Петербург"
          />

        <div mode="primary" id="map" ref={mapRef} style={{ width: '100%', marginBottom: '20px' }} />
          <Panel id="window">
            <Panel className="filter-group" style={{width: '100%'}}>
              <Button style={{width: '100%'}} onClick={() => setIsOpen(!isOpen)} className="filters-toggle">
                <span><Typography.Action>Фильтры</Typography.Action></span>
                {selectedFilters.length > 0 && <span>{selectedFilters.length}</span>}
                <span className={`arrow ${isOpen ? "open" : ""}`}>▼</span>
              </Button>

              {isOpen && (
                <Panel style={{width: '100%'}} className="filters-dropdown">

                  <Panel style={{width: '100%'}} className="filters-list">
                    <Grid
                      cols={2}
                      gapX={20}
                      gapY={10}
                      style={{
                        width: '100%'
                      }}
                    >
                    {Object.values(EventType).map((type) => (
                      
                      <label key={type}>
                        <Switch
                          type="checkbox"
                          checked={selectedFilters.includes(type)}
                          onChange={() => handleFilterToggle(type)}
                        />
                        <Typography.Body>{EventTypeLabels[type]}</Typography.Body>
                      </label>
                    ))}
                    </Grid>
                  </Panel>
                </Panel>
              )}
            </Panel>

            <Panel className="filter-buttons">
              <Button onClick={handleClearFilters}>Сбросить</Button>
            </Panel>
          </Panel>
          
        </>
      )}
    </div>
  );
};

export default MapTab;