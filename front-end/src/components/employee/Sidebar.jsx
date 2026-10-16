import React, { useEffect, useRef, useState } from 'react';
import logoFull from '../../assets/Jofiane-logo.png'; 
import logoMini from '../../assets/Jofiane-logo 2.png'; 
import employee1 from '../../assets/employee1.jpeg';

function Sidebar({ employeeRole, employee, isHousekeepingLead = false, isCollapsed, setIsCollapsed, activeTab, setActiveTab, isDarkMode, setIsDarkMode, onLogout }) {
  const navMenuRef = useRef(null);
  const navScrollPositionRef = useRef(0);
  const transitionTimerRef = useRef(null);
  const profileMenuRef = useRef(null);

  const [transitionPhase, setTransitionPhase] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // States para sa Admin Approval Modal
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [expandedSections, setExpandedSections] = useState(() => {
    const defaults = {
      frontdesk: true,
      reservations: false,
      rooms: false,
      finance: false
    };

    try {
      const saved = window.localStorage.getItem('employee-sidebar-accordions');
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  });

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Isara ang popover kapag nag-click sa labas
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('employee-sidebar-accordions', JSON.stringify(expandedSections));
    } catch {
      // Storage fallback
    }
  }, [expandedSections]);

  useEffect(() => {
    if (navMenuRef.current) {
      navMenuRef.current.scrollTop = navScrollPositionRef.current;
    }
  }, [isCollapsed]);

  useEffect(() => () => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }
  }, []);

  const handleSidebarToggle = () => {
    if (transitionPhase) return;
    if (navMenuRef.current) {
      navScrollPositionRef.current = navMenuRef.current.scrollTop;
    }
    setTransitionPhase(isCollapsed ? 'is-expanding' : 'is-collapsing');
    setIsCollapsed((current) => !current);
    transitionTimerRef.current = window.setTimeout(() => {
      setTransitionPhase('');
      transitionTimerRef.current = null;
    }, 320);
  };

  // Action Handlers
  const handleSettingsClick = () => {
    setActiveTab('settings');
    setShowProfileMenu(false);
  };

  const handleLogoutClick = () => {
    setShowProfileMenu(false);
    setAdminPin('');
    setErrorMessage('');
    setShowAdminAuthModal(true); // Buksan ang Admin Verification Modal
  };

  // Pag-verify ng Admin PIN bago i-logout ang employee
  const handleVerifyAndLogout = (e) => {
    e.preventDefault();

    // DITO KA MAGLALAGAY NG CHECKING (e.g. sample hardcoded PIN "1234" or API Call sa backend)
    // TODO: Replace this hardcoded PIN with a backend API call (e.g. POST /api/auth/verify-pin)
    const CORRECT_ADMIN_PIN = "1234"; 

    if (adminPin === CORRECT_ADMIN_PIN) {
      setShowAdminAuthModal(false);
      
      // Clear Storage at Logout
      try {
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('jofiane-token'); // JWT auth token
        window.localStorage.removeItem('user');
        window.sessionStorage.clear();
      } catch (error) {
        console.error('Error clearing storage:', error);
      }

      if (typeof onLogout === 'function') {
        onLogout();
      } else {
        window.location.href = '/login';
      }
    } else {
      setErrorMessage('Invalid Admin PIN. Approval required.');
    }
  };


  const menuItems = [
    { 
      id: 'dashboard', 
      group: 'Workspace',
      label: 'Overview', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      )
    },
    {
      id: 'frontdesk',
      label: 'Front Desk',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
      subItems: [
        { id: 'arrivals', label: 'Arrivals' },
        { id: 'inhouse', label: 'In-House Guests' },
        { id: 'departures', label: 'Departures' },
        { id: 'logbook', label: 'Front Desk Log' }
      ]
    },
    {
      id: 'reservations',
      group: 'Hotel operations',
      label: 'Reservations',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      subItems: [
        { id: 'bookings', label: 'Booking Management' },
        { id: 'walkin', label: 'Walk-In' }
      ]
    },
    {
      id: 'rooms',
      label: 'Rooms',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 22h16" />
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
          <path d="M14 12v.01" strokeWidth="3" />
        </svg>
      ),
      subItems: [
          { id: 'roomrack', label: 'Room Rack / Plan' }
        ]
      },
        {
      id: 'housekeeping',
      label: 'Housekeeping',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 22h16" />
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
          <path d="M14 12v.01" strokeWidth="3" />
        </svg>
      ),
      subItems: [
        { id: 'housekeeping', label: 'Room Status' },
        { id: 'cleaning-tasks', label: 'Cleaning Tasks' },
        { id: 'guest-requests', label: 'Guest Requests' },
        { id: 'lost-found', label: 'Lost & Found' },
        { id: 'maintenance', label: 'Maintenance Requests' },
        { id: 'housekeeping-logs', label: 'Housekeeping Log' }
      ]
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M9 7h6" />
          <path d="M9 11h6" />
        </svg>
      ),
      subItems: [
        { id: 'transactions', label: 'Transactions' },
        { id: 'nightaudit', label: 'Audit' }
      ]
    }
  ];

  const visibleMenuItems = menuItems.filter((item) => {
    if (employeeRole === 'housekeeping') {
      return ['dashboard', 'housekeeping'].includes(item.id);
    }
    // frontdesk, null (admin preview), or any other role → show frontdesk items
    return [
      'dashboard',
      'frontdesk',
      'reservations',
      'rooms',
      'finance'
    ].includes(item.id);
  })
  // Restrict housekeeping sub-items for non-lead (Cleaner) staff
  .map((item) => {
    if (item.id === 'housekeeping' && employeeRole === 'housekeeping' && !isHousekeepingLead) {
      // Cleaners only see the tasks/requests/lost-found they work on —
      // no Room Status control, no Maintenance Requests, no Housekeeping Log
      const cleanerAllowed = ['cleaning-tasks', 'guest-requests', 'lost-found'];
      return {
        ...item,
        subItems: item.subItems.filter((sub) => cleanerAllowed.includes(sub.id)),
      };
    }
    return item;
  });

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .nav-parent-btn {
          width: 100%;
        }
        
        .nav-submenu-container {
          display: flex;
          flex-direction: column;
          margin-left: 24px;
          padding-left: 12px;
          border-left: 1px solid rgba(255, 255, 255, 0.15); 
          margin-top: 4px;
          margin-bottom: 8px;
          gap: 4px;
        }


        .sidebar-utilities {
          padding: 8px 12px;
          margin-bottom: 8px;
        }

        .theme-toggle-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.85) !important;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 8px;
          transition: background-color 0.2s ease, color 0.2s ease;
        }

        .theme-toggle-btn:hover {
          background-color: rgba(255, 255, 255, 0.08);
          color: #ffffff !important;
        }

        .theme-toggle-content {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .sidebar-footer {
          position: relative;
          padding: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .profile-popover {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 12px;
          right: 12px;
          background: #231d19;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          z-index: 999;
        }

        .popover-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.88rem;
          color: #e2e8f0;
          text-align: left;
          transition: background-color 0.2s ease;
        }

        .popover-item:hover {
          background-color: rgba(255, 255, 255, 0.08);
        }

        .popover-item.logout-btn {
          color: #f87171;
        }

        .popover-item.logout-btn:hover {
          background-color: rgba(248, 113, 113, 0.15);
        }

        .user-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border-radius: 8px;
          transition: background 0.2s ease;
        }

        .user-badge:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }

        /* Admin Approval Modal Styling */
        .admin-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .admin-modal-card {
          background-color: #1e1815;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 14px;
          padding: 24px;
          width: 90%;
          max-width: 380px;
          box-shadow: 0 20px 30px rgba(0, 0, 0, 0.6);
          color: #ffffff;
        }

        .admin-modal-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .admin-modal-icon {
          color: #c5a059;
        }

        .admin-modal-title {
          font-size: 1.15rem;
          font-weight: 600;
        }

        .admin-modal-text {
          font-size: 0.88rem;
          color: #94a3b8;
          margin-bottom: 16px;
          line-height: 1.4;
        }

        .admin-pin-input {
          width: 100%;
          padding: 10px 12px;
          background-color: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #ffffff;
          font-size: 1rem;
          margin-bottom: 8px;
          outline: none;
          box-sizing: border-box;
          letter-spacing: 2px;
        }

        .admin-pin-input:focus {
          border-color: #c5a059;
        }

        .admin-error-text {
          color: #f87171;
          font-size: 0.8rem;
          margin-bottom: 16px;
        }

        .admin-modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 12px;
        }

        .modal-btn {
          padding: 9px 16px;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        .modal-btn-cancel {
          background-color: rgba(255, 255, 255, 0.08);
          color: #e2e8f0;
        }

        .modal-btn-cancel:hover {
          background-color: rgba(255, 255, 255, 0.15);
        }

        .modal-btn-confirm {
          background-color: #c5a059;
          color: #1a1512;
          font-weight: 600;
        }

        .modal-btn-confirm:hover {
          background-color: #d4af66;
        }
      `}</style>

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${transitionPhase}`}>
        {/* MENU TOGGLE */}
        <div className="menu-toggle-container">
          <button 
            className={`menu-toggle-btn sidebar-menu-button ${!isCollapsed ? 'opened' : ''}`}
            onClick={handleSidebarToggle}
            title={isCollapsed ? 'Expand Menu' : 'Minimize Menu'}
            aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-expanded={!isCollapsed}
          >
            <span className="sidebar-toggle-glyph" aria-hidden="true">
              <span className="sidebar-toggle-line sidebar-toggle-line-top" />
              <span className="sidebar-toggle-line sidebar-toggle-line-middle" />
              <span className="sidebar-toggle-line sidebar-toggle-line-bottom" />
            </span>
          </button>
        </div>

        {/* BRANDING */}
        <div className="sidebar-brand">
          <img src={logoFull} alt="Jofiane Logo" className="sidebar-logo sidebar-logo-full" />
          <img src={logoMini} alt="" aria-hidden="true" className="sidebar-logo sidebar-logo-mini" />
          <div className="brand-sub">Employee Portal</div>
        </div>

        {/* NAVIGATION MENU */}
        <nav
          ref={navMenuRef}
          className="nav-menu no-scrollbar"
          onScroll={(event) => { navScrollPositionRef.current = event.currentTarget.scrollTop; }}
        >
          {visibleMenuItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedSections[item.id];
            
            const isChildActive = hasSubItems && item.subItems.some((sub) => sub.id === activeTab);
            const isParentActive = !hasSubItems && activeTab === item.id;
            const isActive = isChildActive || isParentActive;

            return (
              <div className="nav-item-group" key={item.id}>
                {item.group && <div className="nav-section-label">{item.group}</div>}
                
                <button
                  className={`nav-link nav-parent-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (hasSubItems) {
                      if (isCollapsed) {
                        setIsCollapsed(false);
                        setExpandedSections((prev) => ({ ...prev, [item.id]: true }));
                      } else {
                        toggleSection(item.id);
                      }
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  title={isCollapsed ? item.label : ''}
                  aria-expanded={hasSubItems ? isExpanded : undefined}
                >
                  <div className="nav-link-main">
                    <div className="nav-icon-wrapper">{item.icon}</div>
                    <span className="nav-label">{item.label}</span>
                  </div>
                  {hasSubItems && (
                    <svg className={`nav-chevron ${isExpanded ? 'expanded' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </button>

                {hasSubItems && (
                  <div className={`nav-submenu-container ${isExpanded && !isCollapsed ? 'expanded' : ''}`} aria-hidden={!isCollapsed && !isExpanded}>
                    {item.subItems.map((sub) => {
                      const isSubActive = activeTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          className={`nav-link ${isSubActive ? 'active' : ''}`}
                          onClick={() => setActiveTab(sub.id)}
                          tabIndex={isCollapsed || isExpanded ? 0 : -1}
                          style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '6px 12px',
                            minHeight: 'auto',
                            fontSize: '0.9em',
                            background: 'transparent',
                            boxShadow: 'none'
                          }}
                        >
                          {isSubActive && <div className="active-dot" />}
                          <span style={{ fontWeight: isSubActive ? '600' : 'normal' }}>
                            {sub.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* USER PROFILE FOOTER WITH POPOVER */}
        <div className="sidebar-footer" ref={profileMenuRef}>
          {showProfileMenu && (
            <div className="profile-popover">
              <button 
                type="button" 
                className="popover-item"
                onClick={handleSettingsClick}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Settings</span>
              </button>
              
              <button 
                type="button" 
                className="popover-item logout-btn"
                onClick={handleLogoutClick}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Log Out</span>
              </button>
            </div>
          )}

          <div 
            className="user-badge"
            role="button"
            tabIndex={0}
            aria-label="Account menu"
            aria-expanded={showProfileMenu}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setShowProfileMenu((prev) => !prev); } }}
            onClick={() => setShowProfileMenu((prev) => !prev)}
            style={{ cursor: 'pointer' }}
          >
            <img src={employee?.photo || employee1} alt={employee?.name || 'Employee'} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
            <div className="user-info">
              <div className="name" style={{ color: '#ffffff', fontWeight: 'bold' }}>{employee?.name || 'Employee'}</div>
              <div className="role" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{employee?.role || 'Staff'}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ADMIN AUTHORIZATION MODAL */}
      {showAdminAuthModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <svg className="admin-modal-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <div className="admin-modal-title">Admin Approval Required</div>
            </div>

            <div className="admin-modal-text">
              Admin or Manager must enter their PIN to authorize logout.
            </div>

            <form onSubmit={handleVerifyAndLogout}>
              <input
                type="password"
                className="admin-pin-input"
                placeholder="Enter Admin PIN"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                autoFocus
              />

              {errorMessage && <div className="admin-error-text">{errorMessage}</div>}

              <div className="admin-modal-actions">
                <button 
                  type="button" 
                  className="modal-btn modal-btn-cancel"
                  onClick={() => setShowAdminAuthModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-btn modal-btn-confirm"
                >
                  Authorize Logout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
