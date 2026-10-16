import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import BookingManagement from './BookingManagement';
import Arrivals from './Arrivals';
import InHouseGuests from './InHouseGuests'; 
import Departures from './Departures';
import FrontDeskLog from './FrontDeskLog';

function EmployeePortal() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard activeTab={activeTab} />;
      case 'bookings':
        return <main className="main-content"><BookingManagement /></main>;
      case 'arrivals':
        return <main className="main-content"><Arrivals /></main>;
        
      case 'inhouse': 
        return <main className="main-content"><InHouseGuests /></main>;

        case 'departures':
         return <main className="main-content"><Departures /></main>;

        case 'logbook':
          return <main className="main-content"><FrontDeskLog /></main>;



      default:
        return <Dashboard activeTab={activeTab} />;

    }
  };

  return (
    <div className="portal-shell">
      <Sidebar 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      {renderContent()}
    </div>
  );
}

export default EmployeePortal;