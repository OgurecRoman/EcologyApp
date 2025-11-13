// App.js
import React, { useState, useEffect } from 'react';
import MapTab from './components/MapTab';
import AddEventTab from './components/AddEventTab';
import Tabs from './components/Tabs';

function App() {
  const [activeTab, setActiveTab] = useState('map-tab');

  console.log('Текущая вкладка:', activeTab); // Добавьте это

  return (
    <div className="app">
      <h1>🗺️ Карта событий</h1>

      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="tab-content">
        {activeTab === 'map-tab' && (
          <>
            <MapTab />
          </>
        )}
        {activeTab === 'add-tab' && (
          <>
            <AddEventTab setActiveTab={setActiveTab} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;