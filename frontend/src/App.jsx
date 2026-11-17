import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Leads from './pages/Leads';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Employees from './pages/Employees';
import Settings from './pages/Settings';

import './index.css';

// main layout w/ sidebar & nav
const AppLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Modern Sidebar Navigation */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        closeMobileSidebar={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Top Navbar */}
        <Navbar onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />

        {/* Dynamic Page Views */}
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <SettingsProvider>
      <Router>
        <Routes>
          {/* Public Route: Login */}
          <Route path="/login" element={<Login />} />

          {/* Protected CRM Routes (Must be logged in) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/reports" element={<Reports />} />

              {/* Super Admin Restricted Routes */}
              <Route element={<ProtectedRoute requiredRole="Super Admin" resourceName="Employees Management" />}>
                <Route path="/employees" element={<Employees />} />
              </Route>

              <Route element={<ProtectedRoute requiredRole="Super Admin" resourceName="System Settings" />}>
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </SettingsProvider>
  );
}

export default App;
