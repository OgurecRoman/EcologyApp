import React from 'react';

const Tabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="tabs">
      <button
        className={`tab-button ${activeTab === 'map-tab' ? 'active' : ''}`}
        onClick={() => setActiveTab('map-tab')}
      >
        Карта
      </button>
      <button
        className={`tab-button ${activeTab === 'add-tab' ? 'active' : ''}`}
        onClick={() => setActiveTab('add-tab')}
      >
        Добавить событие
      </button>
    </div>
  );
};

export default Tabs;