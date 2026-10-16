import React, { useEffect, useState } from 'react';
import './App.css';
import './WorkspacePolish.css';
import HotelHome from './components/home/HotelHome';
import useIdleSession from './hooks/useIdleSession';
import usePageNavigation from './hooks/usePageNavigation';
import { PortalThemeProvider } from './components/common/ThemePortal';
import Login from './components/login/login';
import Sidebar from './components/admin/Sidebar';
import Overview from './components/admin/Overview';
import Transactions from './components/admin/finance/Transactions';
import AuditTrail from './components/admin/finance/AuditTrail';
import ArchiveDashboard from './components/admin/archive/ArchiveDashboard';
import RoomInventory from './components/admin/rooms/RoomInventory';
import HousekeepingStatus from './components/admin/rooms/HousekeepingStatus';
import Maintenance from './components/admin/rooms/Maintenance';
import StaffList from './components/admin/employee-management/StaffList';
import ShiftSchedules from './components/admin/employee-management/ShiftSchedules';
import AllBookings from './components/admin/reservations/AllBookings';
import Cancellations from './components/admin/reservations/Cancellations';
import OtaChannels from './components/admin/reservations/OtaChannels';
import OccupancyReports from './components/admin/reports/OccupancyReports';
import FinancialReports from './components/admin/reports/FinancialReports';
import GuestReports from './components/admin/reports/GuestReports';
import Settings from './components/admin/Settings';
import Rooms from './components/admin/rooms/Rooms';
import EmployeePortal from './components/employee/EmployeePortal';

function App() {
  const [activeTab, setActiveTab] = usePageNavigation('overview');
  const [screen, setScreen] = useState(() => window.location.hash === '#login' ? 'login' : 'hotel');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [viewMode, setViewMode] = usePageNavigation('admin');
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = window.localStorage.getItem('jofiane-sidebar-collapsed');
    if (saved !== null) return saved === 'true';
    return typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 900px)').matches;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [canViewAdmin, setCanViewAdmin] = useState(false);
  const [employeeRole, setEmployeeRole] = useState(null); // Store the role of the logged-in employee
  const [loggedInEmployee, setLoggedInEmployee] = useState(null); // Store the logged-in employee object

  // Shared admin profile — edited in Settings, reflected in Sidebar + Dashboard.
  // Persisted to localStorage so it survives refresh.
  const [adminProfile, setAdminProfile] = useState(() => {
    if (typeof window === 'undefined') {
      return { fullName: 'Administrator', email: 'admin@jofiane.com', role: 'Super Admin', photo: null };
    }
    const saved = window.localStorage.getItem('jofiane-admin-profile');
    return saved
      ? JSON.parse(saved)
      : { fullName: 'Administrator', email: 'admin@jofiane.com', role: 'Super Admin', photo: null };
  });

  const updateAdminProfile = (next) => {
    setAdminProfile(next);
    window.localStorage.setItem('jofiane-admin-profile', JSON.stringify(next));
  };
  const [isAdminDarkMode, setIsAdminDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const savedTheme = window.localStorage.getItem('jofiane-admin-theme');
    if (savedTheme) return savedTheme === 'dark';
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    window.localStorage.setItem('jofiane-admin-theme', isAdminDarkMode ? 'dark' : 'light');
    // Flag on <body> so portaled modals (rendered outside the app shell) can
    // pick up dark-mode styling too. Only applies while the admin view is shown.
    if (viewMode === 'admin') {
      document.body.classList.toggle('app-dark', isAdminDarkMode);
    }
  }, [isAdminDarkMode, viewMode]);

  useEffect(() => {
    if (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 900px)').matches) {
      const saved = window.localStorage.getItem('jofiane-sidebar-collapsed');
      if (saved === null) setIsCollapsed(true);
    }
  }, []);

  const goToScreen = (next) => {
    window.history.replaceState(null, '', '#' + next);
    setScreen(next);
    window.scrollTo?.(0, 0);
  };

  const handleLogout = (expired = false) => {
    setIsLoggedIn(false);
    setLoggedInEmployee(null);
    setEmployeeRole(null);
    setCanViewAdmin(false);
    setActiveTab('overview', { immediate: true });
    setSessionExpired(expired);
    ['jofiane-token', 'token', 'user'].forEach((key) => {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    });
    goToScreen('hotel');
  };

  const resumeSession = useIdleSession({
    enabled: isLoggedIn,
    onIdle: () => goToScreen('hotel'),
    onExpire: () => handleLogout(true),
  });

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#portal' && isLoggedIn) {
        if (resumeSession()) setScreen('portal');
        return;
      }
      setScreen(hash === '#login' ? 'login' : 'hotel');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [isLoggedIn, resumeSession]);

  useEffect(() => {
    document.title = screen === 'hotel' ? 'Jo Fiane Hotel · A quieter kind of luxury' : screen === 'login' ? 'Employee sign in · Jo Fiane Hotel' : 'Employee workspace · Jo Fiane Hotel';
  }, [screen]);

  const returnToPortal = () => {
    if (isLoggedIn) {
      if (resumeSession()) goToScreen('portal');
    } else goToScreen('login');
  };

  const handleLoginSuccess = (role, employee, module) => {
    setCanViewAdmin(role === 'admin' || module === 'admin');
    if (role === 'admin' || module === 'admin') {
      setViewMode('admin', { immediate: true });
      setEmployeeRole(null);
      // If a DB admin employee logged in, store their info for display purposes
      setLoggedInEmployee(employee || null);
      // Seed the shared admin profile from the DB employee record (if any)
      if (employee) {
        const seeded = {
          fullName: employee.name || 'Administrator',
          email:    employee.email || 'admin@jofiane.com',
          role:     employee.role || 'Admin',
          photo:    employee.photo || null,
          _id:      employee._id || null,   // MongoDB id → lets us persist password/profile changes
        };
        setAdminProfile(seeded);
        window.localStorage.setItem('jofiane-admin-profile', JSON.stringify(seeded));
      }
    } else {
      setEmployeeRole(module || 'frontdesk');
      setLoggedInEmployee(employee);
      setViewMode('employee', { immediate: true });
    }
    setIsLoggedIn(true);
    setSessionExpired(false);
    goToScreen('portal');
  };
  
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview setActiveTab={setActiveTab} adminProfile={adminProfile} />;
      case 'transactions':
      case 'payments':
        return <Transactions allowArchive={canViewAdmin} />;
      case 'audit-trail':
        return <AuditTrail />;
      case 'archive':
        return canViewAdmin ? <ArchiveDashboard /> : null;
      case 'rooms':
        return <Rooms />;
      case 'room-inventory':
        return <RoomInventory />;
      case 'housekeeping':
        return <HousekeepingStatus />;
      case 'maintenance':
        return <Maintenance />;
      case 'staff-list':
        return <StaffList />;
      case 'shifts':
        return <ShiftSchedules />;
      case 'all-bookings':
        return <AllBookings />;
      case 'cancellations':
        return <Cancellations />;
      case 'ota-channels':
        return <OtaChannels />;
      case 'occupancy-reports':
        return <OccupancyReports />;
      case 'financial-reports':
        return <FinancialReports />;
      case 'guest-reports':
        return <GuestReports />;
      case 'settings':
        return <Settings isDarkMode={isAdminDarkMode} setIsDarkMode={setIsAdminDarkMode} sidebarCollapsed={isCollapsed} setSidebarCollapsed={setIsCollapsed} adminProfile={adminProfile} onUpdateProfile={updateAdminProfile} />;
      default:
        return <Overview setActiveTab={setActiveTab} adminProfile={adminProfile} />;
    }
  };

  const renderWorkspace = () => {
    // Keep mounted when AFK so drafts and the selected module survive a break.
    if (viewMode === 'employee') {
      return (
        <div className="employee-view">
          {canViewAdmin && <button
            onClick={() => setViewMode('admin')}
            className="portal-mode-switch"
          >
            ← Switch to Admin View
          </button>}
          <EmployeePortal employeeRole={employeeRole || 'frontdesk'} employee={loggedInEmployee} onLogout={() => handleLogout(false)} suspended={screen !== 'portal'} />
        </div>
      );
    }

    // Render Admin Console view by default
  return (
    <div className={`portal-shell employee-portal-shell admin-portal-shell admin-view ${isCollapsed ? 'nav-collapsed' : ''} ${isAdminDarkMode ? 'theme-dark' : 'theme-light'}`}>
      <button 
        onClick={() => setViewMode('employee')} 
        className="portal-mode-switch"
      >
        Switch to Employee Portal →
      </button>

      <Sidebar
        onLogout={() => handleLogout(false)}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isAdminDarkMode}
        setIsDarkMode={setIsAdminDarkMode}
        adminProfile={adminProfile}
      />
      <button type="button" className="mobile-nav-trigger" onClick={() => setIsCollapsed(false)} aria-label="Open admin navigation">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
      {!isCollapsed && <button type="button" className="mobile-nav-backdrop" onClick={() => setIsCollapsed(true)} aria-label="Close admin navigation" />}
      <main key={activeTab} className="main-content">
        {renderContent()}
      </main>
    </div>
  );
  };

  return (
    <PortalThemeProvider theme={isAdminDarkMode ? 'dark' : 'light'} suspended={screen !== 'portal'}>
      {isLoggedIn && <div className="app-workspace" hidden={screen !== 'portal'}>{renderWorkspace()}</div>}
      {screen === 'hotel' && <HotelHome isLoggedIn={isLoggedIn} expired={sessionExpired} onReturn={returnToPortal} />}
      {screen === 'login' && <Login onLoginSuccess={handleLoginSuccess} />}
    </PortalThemeProvider>
  );
}

export default App;
