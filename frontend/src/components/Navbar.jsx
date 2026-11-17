import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, ShieldCheck, Shield, User, LogOut, ChevronDown, Sun, Moon, LayoutDashboard, Settings as SettingsIcon, Clock } from 'lucide-react';
import { authService } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import '../styles/Navbar.css';

const pageTitles = {
  '/': 'Dashboard Overview',
  '/customers': 'Customer Management',
  '/leads': 'Lead Management',
  '/sales': 'Sales & Transactions',
  '/reports': 'Analytics & Reports',
  '/employees': 'Employee Management',
  '/settings': 'System Settings'
};

const Navbar = ({ onOpenMobileSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [navSearch, setNavSearch] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [liveTime, setLiveTime] = useState('');

  //live clock using sys timezone
  useEffect(() => {
    const updateClock = () => {
      try {
        const formatted = new Intl.DateTimeFormat('en-US', {
          timeZone: settings?.timezone || 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).format(new Date());
        setLiveTime(formatted);
      } catch (e) {
        setLiveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [settings?.timezone]);

  // refs to detect outside click/touch on dropdowns
  const profileDropdownRef = useRef(null);
  const notificationRef = useRef(null);

  // dark/light mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('crm_theme') === 'dark';
  });

  // Close dropdowns if clicked outside
  useEffect(() => {
    const handleOutsideInteraction = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotification(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideInteraction);
    document.addEventListener('touchstart', handleOutsideInteraction);

    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction);
      document.removeEventListener('touchstart', handleOutsideInteraction);
    };
  }, []);

  //set data-theme on html root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('crm_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('crm_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const currentTitle = pageTitles[location.pathname] || 'CRM Dashboard';
  const currentUser = authService.getUser() || {
    name: 'Midhunraj',
    role: 'Super Admin',
    email: 'midhun123@gmail.com'
  };

  // get 2 letter initials from name
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!navSearch.trim()) return;
    navigate(`/customers?search=${encodeURIComponent(navSearch.trim())}`);
  };

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          className="mobile-menu-trigger"
          onClick={onOpenMobileSidebar}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <h2 className="navbar-page-title">{currentTitle}</h2>

        {/* Sun and Moon Button right next to 'Dashboard Overview' */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? (
            <Sun size={18} className="theme-icon sun" />
          ) : (
            <Moon size={18} className="theme-icon moon" />
          )}
        </button>
      </div>

      <div className="navbar-right">
        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="navbar-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search customers, leads..."
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
          />
        </form>

        {/* Live System Time in Configured Timezone */}
        <div
          className="navbar-clock-pill"
          title={`Active System Timezone: ${settings?.timezone || 'Asia/Kolkata'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-main)',
            background: 'var(--bg-hover)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'default',
            whiteSpace: 'nowrap'
          }}
        >
          <Clock size={13} color="var(--primary)" />
          <span>{liveTime}</span>
          <span
            style={{
              fontSize: '10px',
              color: 'var(--primary)',
              textTransform: 'uppercase',
              fontWeight: 700,
              letterSpacing: '0.04em'
            }}
          >
            {settings?.timezone?.includes('Kolkata') ? 'IST' : settings?.timezone?.split('/')[1] || 'UTC'}
          </span>
        </div>

        {/* Notification Bell */}
        <div ref={notificationRef} style={{ position: 'relative' }}>
          <button
            className="nav-action-btn"
            onClick={() => {
              setShowNotification((prev) => !prev);
              setShowProfileDropdown(false);
            }}
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell size={18} />
            <span className="notification-badge" />
          </button>

          {showNotification && (
            <div
              style={{
                position: 'absolute',
                top: '48px',
                right: 0,
                width: '280px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderRadius: '4px',
                boxShadow: 'var(--shadow-md)',
                padding: '12px 16px',
                zIndex: 100
              }}
              onClick={() => setShowNotification(false)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>
                  System Notifications
                </span>
                <span style={{ fontSize: '11px', color: 'var(--primary)', cursor: 'pointer' }}>Close</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Authenticated as {currentUser.role}. All system services are operational.
              </p>
            </div>
          )}
        </div>

        {/* User Profile Section with Dropdown */}
        <div ref={profileDropdownRef} style={{ position: 'relative' }}>
          <div
            className="user-profile"
            onClick={() => {
              setShowProfileDropdown((prev) => !prev);
              setShowNotification(false);
            }}
            title={`${currentUser.name} (${currentUser.role})`}
          >
            <div className="user-avatar">
              {getInitials(currentUser.name)}
            </div>
            <div className="user-info">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                {currentUser.role === 'Super Admin' ? (
                  <ShieldCheck size={12} color="#7c3aed" />
                ) : currentUser.role === 'Admin' ? (
                  <Shield size={12} color="#2563eb" />
                ) : (
                  <User size={12} color="#64748b" />
                )}
                {currentUser.role}
              </span>
            </div>
            <ChevronDown size={14} color="var(--text-light)" />
          </div>

          {/* Profile & Logout Dropdown */}
          {showProfileDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '52px',
                right: 0,
                width: '220px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderRadius: '4px',
                boxShadow: 'var(--shadow-md)',
                padding: '8px',
                zIndex: 100
              }}
            >
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.email}
                </div>
                <span
                  className="role-badge"
                  style={{
                    marginTop: '6px',
                    fontSize: '11px',
                    padding: '2px 8px',
                    display: 'inline-block',
                    borderRadius: '3px',
                    background: currentUser.role === 'Super Admin' ? 'rgba(124, 58, 237, 0.15)' : 'rgba(37, 99, 235, 0.15)',
                    color: currentUser.role === 'Super Admin' ? '#8b5cf6' : '#3b82f6',
                    border: 'none'
                  }}
                >
                  {currentUser.role}
                </span>
              </div>

              {/* Navigation Options that close the dropdown upon selection */}
              <div style={{ padding: '4px 0' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    navigate('/');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    borderRadius: '3px',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LayoutDashboard size={15} /> Dashboard
                </button>

                {currentUser.role === 'Super Admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileDropdown(false);
                      navigate('/settings');
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-main)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      borderRadius: '3px',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <SettingsIcon size={15} /> Settings
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    handleLogout();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--danger)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    borderRadius: '3px',
                    marginTop: '4px',
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: '8px',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--danger-bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
