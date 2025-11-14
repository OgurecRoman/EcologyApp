import { useState } from 'react';
import { ToolButton, Flex } from '@maxhub/max-ui';
import MapTab from './components/MapTab';
import EventTab from './components/AddEventTab';
import ProfileTab from './components/AddEventTab';
import mapIcon from './data/map.png';
import eventIcon from './data/events.png';
import profileIcon from './data/profile.png';

function App() {
  const [activeTab, setActiveTab] = useState('tab1');

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'tab1':
        return <MapTab id="window" />;
      case 'tab2':
        return <EventTab />;
      case 'tab3':
        return <ProfileTab />;
      default:
        return null;
    }
  };

  return <Flex direction="column" gap={16} style={{width: '100%'}}>
      {renderCurrentTab()}

      <Flex className='navigation' direction="row" gap={8}>
        <ToolButton
          icon={ <img src={mapIcon} style={{ width: '40px', height: '40px' }} alt='' /> }
          onClick={() => handleTabClick('tab1')}
          selected={activeTab === 'tab1'}
        >
          Карта
        </ToolButton>
        <ToolButton
          icon={ <img src={eventIcon} style={{ width: '40px', height: '40px' }} alt='' /> }
          onClick={() => handleTabClick('tab2')}
          selected={activeTab === 'tab2'}
        >
          События
        </ToolButton>
        <ToolButton
          icon={ <img src={profileIcon} style={{ width: '40px', height: '40px' }} alt='' /> }
          onClick={() => handleTabClick('tab3')}
          selected={activeTab === 'tab3'}
        >
          Профиль
        </ToolButton>
      </Flex>
    </Flex>
}

export default App;