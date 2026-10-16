import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import usePageNavigation from '../../hooks/usePageNavigation';
import { PortalThemeProvider } from '../common/ThemePortal';
import Dashboard from './Dashboard';
import BookingManagement from './BookingManagement';
import Arrivals from './Arrivals';
import InHouseGuests from './InHouseGuests'; 
import Departures from './Departures';
import FrontDeskLog from './FrontDeskLog'
import HousekeepingStatus from '../admin/rooms/HousekeepingStatus';
import CleaningTasks from './CleaningTasks';
import Maintenance from './Maintenance';
import EmployeeSettings from './Settings';
import WalkIn from './WalkIn';
import RoomRack from './RoomRack';
import Transactions from '../admin/finance/Transactions';
import AuditTrail from '../admin/finance/AuditTrail';
import HousekeepingDashboard from './HousekeepingDashboard';
import GuestRequests from './GuestRequests';
import HousekeepingLogs from './HousekeepingLogs';
import LostAndFound from './LostAndFound';

function EmployeePortal({employeeRole, employee, onLogout, suspended = false}) {
  // Live profile shared across the sidebar, dashboards, and settings.
  // Seeded from the logged-in employee; updated when they edit their profile,
  // so the change reflects everywhere (mirrors the admin adminProfile pattern).
  const [employeeProfile, setEmployeeProfile] = useState(employee);
  // Keep in sync if the logged-in employee prop changes (e.g. re-login).
  useEffect(() => { setEmployeeProfile(employee); }, [employee]);

  // Called by EmployeeSettings after a successful save.
  const handleProfileUpdate = (updated) => {
    setEmployeeProfile(prev => ({
      ...prev,
      name:  updated.fullName ?? prev?.name,
      email: updated.email ?? prev?.email,
      photo: updated.photo ?? prev?.photo,
    }));
  };
  const frontDeskTabs = [
  'dashboard',
  'bookings',
  'arrivals',
  'inhouse',
  'departures',
  'logbook',
  'walkin',
  'roomrack',
  'transactions',
  'nightaudit',
  'settings'
  ];

  // Housekeeping Lead → full control of the whole housekeeping module
  const housekeepingLeadTabs = [
    'dashboard',
    'housekeeping',       // Room Status control
    'cleaning-tasks',
    'guest-requests',
    'lost-found',
    'maintenance',        // Maintenance Requests
    'housekeeping-logs',
    'settings'
  ];

  // Housekeeping Cleaner → restricted: only their day-to-day work views
  const housekeepingCleanerTabs = [
    'dashboard',
    'cleaning-tasks',     // their assigned tasks
    'guest-requests',     // requests they fulfil
    'lost-found',         // report found items
    'settings'
  ];

  // A "lead" is any housekeeping role whose title includes "lead" (or "supervisor"/"manager")
  const roleTitle = (employeeProfile?.role || '').toLowerCase();
  const isHousekeepingLead =
    roleTitle.includes('lead') ||
    roleTitle.includes('supervisor') ||
    roleTitle.includes('manager') ||
    roleTitle.includes('head');

  const housekeepingTabs = isHousekeepingLead
    ? housekeepingLeadTabs
    : housekeepingCleanerTabs;

  const allowedTabs =
    employeeRole === 'housekeeping'
      ? housekeepingTabs
      : frontDeskTabs;

  const [activeTab, navigateToTab] = usePageNavigation('dashboard');
  const displayedTab = activeTab;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const savedTheme = window.localStorage.getItem('jofiane-employee-theme');
    if (savedTheme) return savedTheme === 'dark';
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 900px)').matches) {
      setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('jofiane-employee-theme', isDarkMode ? 'dark' : 'light');
    // Flag on <body> so portaled modals (rendered outside the shell) inherit
    // dark-mode styling too. Cleared when the employee portal unmounts.
    document.body.classList.toggle('app-dark', isDarkMode);
    return () => document.body.classList.remove('app-dark');
  }, [isDarkMode]);

  const renderContent = () => {

  if (!allowedTabs.includes(displayedTab)) {
    if (employeeRole === 'housekeeping') {
      return (
        <HousekeepingDashboard employee={employeeProfile} setActiveTab={navigateToTab} isLead={isHousekeepingLead}/>
      );
    }

    return (
      <Dashboard activeTab="dashboard" employee={employeeProfile} setActiveTab={navigateToTab}/>
    );
  }

  switch (displayedTab) {
    case 'dashboard':
      if (employeeRole === 'housekeeping') {
        return (
          <HousekeepingDashboard employee={employeeProfile} setActiveTab={navigateToTab} isLead={isHousekeepingLead}/>
        );
      }

      return (
        <Dashboard activeTab={displayedTab} employee={employeeProfile} setActiveTab={navigateToTab}
        />
      );

    case 'bookings':
      return (
        <main className="main-content employee-content">
          <BookingManagement employee={employeeProfile} />
        </main>
      );

    case 'arrivals':
      return (
        <main className="main-content employee-content">
          <Arrivals />
        </main>
      );

    case 'inhouse':
      return (
        <main className="main-content employee-content">
          <InHouseGuests />
        </main>
      );

    case 'departures':
      return (
        <main className="main-content employee-content">
          <Departures />
        </main>
      );

    case 'logbook':
      return (
        <main className="main-content employee-content">
          <FrontDeskLog employee={employeeProfile} />
        </main>
      );

    case 'walkin':
      return (
        <main className="main-content employee-content">
          <WalkIn onViewBooking={() => navigateToTab('bookings')} />
        </main>
      );

    case 'roomrack':
      return (
        <main className="main-content employee-content">
          <RoomRack />
        </main>
      );

    case 'transactions':
      return (
        <main className="main-content employee-content">
          <Transactions />
        </main>
      );

    case 'nightaudit':
      return (
        <main className="main-content employee-content">
          <AuditTrail />
        </main>
      );

    case 'housekeeping':
      return (
        <main className="main-content employee-content">
          <HousekeepingStatus />
        </main>
      );

    case 'cleaning-tasks':
      return (
        <main className="main-content employee-content">
          <CleaningTasks isLead={isHousekeepingLead} employee={employeeProfile} />
        </main>
      );
    
    case 'guest-requests':
      return (
        <main className="main-content employee-content">
          <GuestRequests isLead={isHousekeepingLead} employee={employeeProfile} />
        </main>
      );

    case 'lost-found':
      return (
        <main className="main-content employee-content">
          <LostAndFound />
        </main>
      );


    case 'maintenance':
      return (
        <main className="main-content employee-content">
          <Maintenance />
        </main>
      );

    case 'housekeeping-logs':
      return (
        <main className="main-content employee-content">
          <HousekeepingLogs />
        </main>
      );

    case 'settings':
      return <EmployeeSettings isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} employee={employeeProfile} onUpdateProfile={handleProfileUpdate} />;

    default:
      if (employeeRole === 'housekeeping') {
        return (
          <HousekeepingDashboard employee={employeeProfile} setActiveTab={navigateToTab} isLead={isHousekeepingLead}/>
        );
      }

      return (
        <Dashboard activeTab="dashboard" employee={employeeProfile} setActiveTab={navigateToTab}/>
      );
  }
};

  return (
    <PortalThemeProvider theme={isDarkMode ? 'dark' : 'light'} suspended={suspended}>
    <div className={`portal-shell employee-portal-shell ${isCollapsed ? 'nav-collapsed' : ''} ${isDarkMode ? 'theme-dark' : 'theme-light'}`}>
      <Sidebar onLogout={onLogout}
        employeeRole={employeeRole}
        employee={employeeProfile}
        isHousekeepingLead={isHousekeepingLead}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
      <button
        type="button"
        className="mobile-nav-trigger"
        onClick={() => setIsCollapsed(false)}
        aria-label="Open employee navigation"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>
      {!isCollapsed && (
        <button
          type="button"
          className="mobile-nav-backdrop"
          onClick={() => setIsCollapsed(true)}
          aria-label="Close employee navigation"
        />
      )}
      <React.Fragment key={activeTab}>{renderContent()}</React.Fragment>
    </div>
    </PortalThemeProvider>
  );
}

export default EmployeePortal;
