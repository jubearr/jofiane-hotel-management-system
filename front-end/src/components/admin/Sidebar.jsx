import React, { useEffect, useRef, useState } from 'react';
import logoFull from '../../assets/Jofiane-logo.png';
import logoMini from '../../assets/Jofiane-logo 2.png';

const defaultAccordions = {
  finance: false,
  rooms: false,
  employees: false,
  reservations: false,
  reports: false
};

function Sidebar({ isCollapsed, setIsCollapsed, activeTab, setActiveTab, isDarkMode, setIsDarkMode, onLogout, adminProfile }) {
  const navMenuRef = useRef(null);
  const navScrollPositionRef = useRef(0);
  const transitionTimerRef = useRef(null);
  const profileMenuRef = useRef(null);

  const [transitionPhase, setTransitionPhase] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [expandedSections, setExpandedSections] = useState(() => {
    try {
      const saved = window.localStorage.getItem('admin-sidebar-accordions');
      return saved ? { ...defaultAccordions, ...JSON.parse(saved) } : defaultAccordions;
    } catch {
      return defaultAccordions;
    }
  });

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
      window.localStorage.setItem('admin-sidebar-accordions', JSON.stringify(expandedSections));
    } catch {
      // Navigation remains functional if browser storage is unavailable.
    }
  }, [expandedSections]);

  useEffect(() => {
    if (navMenuRef.current) navMenuRef.current.scrollTop = navScrollPositionRef.current;
  }, [isCollapsed]);

  useEffect(() => () => {
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
  }, []);

  const handleSidebarToggle = () => {
    if (transitionPhase) return;
    if (navMenuRef.current) navScrollPositionRef.current = navMenuRef.current.scrollTop;
    setTransitionPhase(isCollapsed ? 'is-expanding' : 'is-collapsing');
    setIsCollapsed((current) => !current);
    transitionTimerRef.current = window.setTimeout(() => {
      setTransitionPhase('');
      transitionTimerRef.current = null;
    }, 220);
  };

  const toggleSection = (sectionId) => {
    setExpandedSections((current) => ({ ...current, [sectionId]: !current[sectionId] }));
  };

  const handleSettingsClick = () => {
    setActiveTab('settings');
    setShowProfileMenu(false);
  };

  const handleLogoutClick = () => {
    setShowProfileMenu(false);
    setShowLogoutConfirm(true); // Buksan ang confirmation modal
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
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
  };

  const menuItems = [
    {
      id: 'overview', group: 'Workspace', label: 'Overview',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    },
    {
      id: 'finance', group: 'Hotel management', label: 'Revenue & Finance',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h6M9 11h6"/></svg>,
      subItems: [{ id: 'transactions', label: 'Transactions' }, { id: 'audit-trail', label: 'Audit Trail' }]
    },
    {
      id: 'rooms', label: 'Rooms Operation',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16"/><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M14 12v.01" strokeWidth="3"/></svg>,
      subItems: [{ id: 'room-inventory', label: 'Room Inventory' }, { id: 'housekeeping', label: 'Housekeeping Status' }, { id: 'maintenance', label: 'Maintenance' }]
    },
    {
      id: 'employees', label: 'Employee Management',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      subItems: [{ id: 'staff-list', label: 'Staff List' }, { id: 'shifts', label: 'Shift Schedules' }]
    },
    {
      id: 'reservations', label: 'Reservations',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
      subItems: [{ id: 'all-bookings', label: 'All Bookings' }, { id: 'cancellations', label: 'Cancellations' }, { id: 'ota-channels', label: 'OTA Channels' }]
    },
    {
      id: 'reports', group: 'Business intelligence', label: 'Reports',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></svg>,
      subItems: [{ id: 'occupancy-reports', label: 'Occupancy Reports' }, { id: 'financial-reports', label: 'Financial Reports' }, { id: 'guest-reports', label: 'Guest Reports' }]
    },
    {
      id: 'archive', group: 'Administration', label: 'Archive',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="5" rx="1"/><path d="M5 8v13h14V8M9 12h6"/></svg>
    }
  ];

  return (
    <>
      <style>{`
        /* Clean Utilities Container */
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

        /* Profile & Popover Layout */
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

        /* Confirmation Modal Overlay & Box */
        .logout-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .logout-modal-card {
          background-color: #1e1815;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 14px;
          padding: 24px;
          width: 90%;
          max-width: 380px;
          box-shadow: 0 20px 30px rgba(0, 0, 0, 0.6);
          color: #ffffff;
          text-align: center;
        }

        .logout-modal-title {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .logout-modal-text {
          font-size: 0.9rem;
          color: #94a3b8;
          margin-bottom: 20px;
        }

        .logout-modal-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .modal-btn {
          flex: 1;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
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
          background-color: #ef4444;
          color: #ffffff;
        }

        .modal-btn-confirm:hover {
          background-color: #dc2626;
        }
      `}</style>

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${transitionPhase}`}>
        <div className="menu-toggle-container">
          <button className={`menu-toggle-btn sidebar-menu-button ${!isCollapsed ? 'opened' : ''}`} onClick={handleSidebarToggle} title={isCollapsed ? 'Expand Menu' : 'Minimize Menu'} aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'} aria-expanded={!isCollapsed}>
            <span className="sidebar-toggle-glyph" aria-hidden="true">
              <span className="sidebar-toggle-line sidebar-toggle-line-top" />
              <span className="sidebar-toggle-line sidebar-toggle-line-middle" />
              <span className="sidebar-toggle-line sidebar-toggle-line-bottom" />
            </span>
          </button>
        </div>

        <div className="sidebar-brand">
          <img src={logoFull} alt="Jofiane Logo" className="sidebar-logo sidebar-logo-full" />
          <img src={logoMini} alt="" aria-hidden="true" className="sidebar-logo sidebar-logo-mini" />
          <div className="brand-sub">Admin Console</div>
        </div>

        <nav ref={navMenuRef} className="nav-menu no-scrollbar" onScroll={(event) => { navScrollPositionRef.current = event.currentTarget.scrollTop; }}>
          {menuItems.map((item) => {
            const hasSubItems = Boolean(item.subItems?.length);
            const isExpanded = expandedSections[item.id];
            const isActive = hasSubItems ? item.subItems.some((sub) => sub.id === activeTab) : activeTab === item.id;
            return (
              <div className="nav-item-group" key={item.id}>
                {item.group && <div className="nav-section-label">{item.group}</div>}
                <button className={`nav-link nav-parent-btn ${isActive ? 'active' : ''}`} onClick={() => {
                  if (!hasSubItems) return setActiveTab(item.id);
                  if (isCollapsed) {
                    setIsCollapsed(false);
                    setExpandedSections((current) => ({ ...current, [item.id]: true }));
                  } else toggleSection(item.id);
                }} title={isCollapsed ? item.label : ''} aria-expanded={hasSubItems ? isExpanded : undefined}>
                  <div className="nav-link-main">
                    <div className="nav-icon-wrapper">{item.icon}</div>
                    <span className="nav-label">{item.label}</span>
                  </div>
                  {hasSubItems && <svg className={`nav-chevron ${isExpanded ? 'expanded' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25"><polyline points="9 18 15 12 9 6"/></svg>}
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
                          {isSubActive && <span className="active-dot" />}
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
            <div className="avatar admin-avatar" style={adminProfile?.photo ? { padding: 0, overflow: 'hidden' } : undefined}>
              {adminProfile?.photo
                ? <img src={adminProfile.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : (adminProfile?.fullName || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <div className="name">{adminProfile?.fullName || 'Admin'}</div>
              <div className="role">{adminProfile?.role || 'General Manager'}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="logout-modal-overlay">
          <div className="logout-modal-card">
            <div className="logout-modal-title">Confirm Log Out</div>
            <div className="logout-modal-text">Are you sure you want to log out?</div>
            <div className="logout-modal-actions">
              <button 
                type="button" 
                className="modal-btn modal-btn-cancel"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="modal-btn modal-btn-confirm"
                onClick={confirmLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
