import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  DollarSign,
  BarChart3,
  Briefcase,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
  Building2,
  LogOut
} from 'lucide-react';
import { authService } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import '../styles/Sidebar.css';

const Sidebar = ({ isCollapsed, toggleSidebar, isMobileOpen, closeMobileSidebar }) => {
  const { settings } = useSettings();
  const currentUser = authService.getUser();
  const isSuperAdmin = currentUser?.role === 'Super Admin';

  // Nav links
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/leads', label: 'Leads', icon: UserCheck },
    { path: '/sales', label: 'Sales', icon: DollarSign },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    // super admin only -> emps tab
    ...(isSuperAdmin
      ? [{ path: '/employees', label: 'Employees', icon: Briefcase }]
      : []),
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div className="sidebar-backdrop" onClick={closeMobileSidebar} />
      )}

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <NavLink to="/" className="brand-link" onClick={closeMobileSidebar}>
            <div className="brand-logo-icon">
              <Building2 size={20} />
            </div>
            {!isCollapsed && (
              <div className="brand-title">
                <span className="app-name">{settings?.crmName || 'BASIC CRM'}</span>
              </div>
            )}
          </NavLink>
          <button
            className="sidebar-toggle-btn"
            onClick={toggleSidebar}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          {!isCollapsed && <div className="nav-section-label">Main Menu</div>}
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
                onClick={closeMobileSidebar}
                title={isCollapsed ? item.label : undefined}
              >
                <IconComponent size={20} className="nav-item-icon" />
                {!isCollapsed && <span className="nav-item-text">{item.label}</span>}
              </NavLink>
            );
          })}

          {/* Sign Out link in navigation */}
          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <button
              onClick={handleLogout}
              className="nav-item"
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              title={isCollapsed ? 'Sign Out' : undefined}
            >
              <LogOut size={20} className="nav-item-icon" style={{ color: 'var(--danger)' }} />
              {!isCollapsed && <span className="nav-item-text" style={{ color: 'var(--danger)' }}>Sign Out</span>}
            </button>
          </div>
        </nav>

        {/* Database Status in Footer */}
        <div className="sidebar-footer">
          <div className="db-status-pill" title="Connected to MySQL 8.0">
            <span className="status-dot"></span>
            {!isCollapsed && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={13} /> MySQL 8.0 Active
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
