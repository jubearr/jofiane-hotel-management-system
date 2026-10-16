import React, { useState } from 'react';
import logoFull from '../../assets/Jofiane-logo.png'; 
import logoMini from '../../assets/Jofiane-logo 2.png'; 
import employee1 from '../../assets/employee1.jpeg';

function Sidebar({ isCollapsed, setIsCollapsed, activeTab, setActiveTab }) {
  
  
  const [expandedSections, setExpandedSections] = useState({
    'frontdesk': true, 
    'reservations': false,
    'rooms': false,
    'finance': false
  });

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Hierarchical menu structure 
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Overview', 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
    },
    {
      id: 'frontdesk',
      label: 'Front Desk',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
      subItems: [
        { id: 'arrivals', label: 'Arrivals' },
        { id: 'inhouse', label: 'In-House Guests' },
        { id: 'departures', label: 'Departures' },
        { id: 'logbook', label: 'Front Desk Log' }
      ]
    },
    {
      id: 'reservations',
      label: 'Reservations',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
      subItems: [
        { id: 'bookings', label: 'Booking Management' },
        { id: 'walkin', label: 'Walk-In' }
      ]
    },
    {
      id: 'rooms',
      label: 'Rooms',
      /* UPDATED: Door Icon */
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16"></path><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"></path><path d="M14 12v.01" strokeWidth="3"></path></svg>,
      subItems: [
        { id: 'roomrack', label: 'Room Rack / Plan' },
        { id: 'housekeeping', label: 'Housekeeping' }
      ]
    },
    {
      id: 'finance',
      label: 'Finance',
      /* UPDATED: Ledger/Journal Icon */
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><path d="M9 7h6"></path><path d="M9 11h6"></path></svg>,
      subItems: [
        { id: 'transactions', label: 'Transactions' },
        { id: 'nightaudit', label: 'Audit' }
      ]
    }
  ];

  return (
    <>
      <style>{`
        /* Hide scrollbar structurally */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .nav-parent-btn {
          width: 100%;
          /* CSS styling removed here so inline React logic can center it dynamically */
        }
        
        /* The structural vertical line container */
        .nav-submenu-container {
          display: flex;
          flex-direction: column;
          margin-left: 24px; /* Aligns with center of parent icon */
          padding-left: 12px;
          border-left: 1px solid var(--border-light, #ccc); 
          margin-top: 4px;
          margin-bottom: 8px;
          gap: 4px;
        }

        /* Active dot on the vertical line */
        .active-dot {
          position: absolute;
          left: -14.5px; 
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background-color: var(--gold, #c5a059); 
          border-radius: 50%;
        }
      `}</style>

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
        
        {/* MENU TOGGLE */}
        <div className="menu-toggle-container" style={{ display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
          <button 
            className="menu-toggle-btn" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand Menu" : "Minimize Menu"}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="9" x2="20" y2="9"></line>
              <line x1="4" y1="15" x2="20" y2="15"></line>
            </svg>
          </button>
        </div>

        {}
        <div className="sidebar-brand" style={{ 
  display: 'flex', 
  justifyContent: isCollapsed ? 'center' : 'flex-start',
  paddingLeft: isCollapsed ? '0' : '24px',  
  paddingTop: isCollapsed ? '0' : '5px'   
}}>
  <img src={isCollapsed ? logoMini : logoFull} alt="Jofiane Logo" className="sidebar-logo" />
</div>

        {}
        <nav className="nav-menu no-scrollbar" style={{ overflowY: 'auto', flexGrow: 1 }}>
          {menuItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedSections[item.id];
            
            
            const isChildActive = hasSubItems && item.subItems.some(sub => sub.id === activeTab);
            const isParentActive = !hasSubItems && activeTab === item.id;
            const isActive = isChildActive || isParentActive;

            return (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column' }}>
                
                {}
                <button
                  className={`nav-link nav-parent-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (hasSubItems) {
                      if (!isCollapsed) toggleSection(item.id);
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  title={isCollapsed ? item.label : ""}
                  style={{ display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-start', paddingLeft: isCollapsed ? '0' : '16px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: '12px' }}>
                    <div className="nav-icon-wrapper">{item.icon}</div>
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                </button>

                {}
                {hasSubItems && isExpanded && !isCollapsed && (
                  <div className="nav-submenu-container">
                    {item.subItems.map((sub) => {
                      const isSubActive = activeTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          className={`nav-link ${isSubActive ? 'active' : ''}`}
                          onClick={() => setActiveTab(sub.id)}
                          style={{
                            position: 'relative',
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

        {}
        <div style={{ padding: '0 12px', marginTop: 'auto', marginBottom: '8px' }}>
          <button
            className={`nav-link nav-parent-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            title={isCollapsed ? "Settings" : ""}
            style={{ display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-start', paddingLeft: isCollapsed ? '0' : '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: '12px' }}>
              <div className="nav-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </div>
              {!isCollapsed && <span>Settings</span>}
            </div>
          </button>
        </div>

        {/* USER PROFILE FOOTER */}
        <div className="sidebar-footer">
          <div className="user-badge" style={{ 
            marginBottom: 0, 
            padding: isCollapsed ? '10px 0' : '10px 12px',
            display: 'flex',
            justifyContent: isCollapsed ? 'center' : 'flex-start'
          }}>
            <img src={employee1} alt="Ana Buenaflor" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
            {!isCollapsed && (
              <div className="user-info">
                <div className="name">Ana Buenaflor</div>
                <div className="role">Front Desk Officer</div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
