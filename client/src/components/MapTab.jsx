// MapTab.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

const MapTab = () => {
  const [events, setEvents] = useState([]);
  const [filterCity, setFilterCity] = useState('');
  const [filterTypes, setFilterTypes] = useState([]);
  const [userCity, setUserCity] = useState('Москва');
  const [ymaps, setYmaps] = useState(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

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

  // Оберните loadEventMarkers в useCallback
  // Укажите все зависимости, которые использует функция
  const loadEventMarkers = useCallback(async (city = '', types = []) => {
    // Проверка на наличие ymaps и mapInstance.current важна
    if (!ymaps || !mapInstance.current) {
      console.log('Ymaps или карта не готовы');
      return;
    }

    try {
      const params = new URLSearchParams();
      if (city) params.append('city', city);
      if (types.length > 0) params.append('types', types.join(','));

      // Убедитесь, что REACT_APP_URL в .env.local содержит ваш API URL
      const url = `${process.env.REACT_APP_URL}/events${params.toString() ? '?' + params.toString() : ''}`;
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
  }, [ymaps]); // Зависимость: ymaps, т.к. используется внутри

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

  const handleApplyFilters = () => {
    // Вызываем загрузку с фильтрами
    loadEventMarkers(filterCity, filterTypes);
  };

  const handleClearFilters = () => {
    // Сбрасываем фильтры
    setFilterCity(userCity);
    setFilterTypes([]);
    // Загружаем события для текущего города
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