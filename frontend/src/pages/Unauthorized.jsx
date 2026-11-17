import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut, Lock } from 'lucide-react';
import { authService } from '../services/api';
import '../styles/Unauthorized.css';

const Unauthorized = ({
  statusCode = 403,
  title = '403 - Unauthorized Access',
  message = 'Setting is accessible only for Super Admin. Other users are not authorized to view or configure system settings.',
  requiredRole = 'Super Admin',
  resourceName = 'System Settings'
}) => {
  const navigate = useNavigate();
  const currentUser = authService.getUser();

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="unauthorized-wrapper">
      <div className="unauthorized-card">
        {/* Visual Icon */}
        <div className="unauthorized-icon-wrapper">
          <ShieldAlert size={38} />
        </div>

        {/* Status Code Badge */}
        <div>
          <span className="unauthorized-status-pill">
            <Lock size={13} />
            Status Code: {statusCode} {statusCode === 403 ? 'Forbidden' : 'Unauthorized'}
          </span>
        </div>

        {/* Title & Message */}
        <h1 className="unauthorized-title">{title}</h1>
        <p className="unauthorized-message">{message}</p>

        {/* Account Details Box */}
        <div className="unauthorized-details-box">
          <div className="unauthorized-detail-row">
            <span className="unauthorized-detail-label">Attempted Resource:</span>
            <span className="unauthorized-detail-value">{resourceName}</span>
          </div>

          <div className="unauthorized-detail-row">
            <span className="unauthorized-detail-label">Required Access Level:</span>
            <span className="badge badge-active" style={{ fontSize: '12px' }}>
              {requiredRole}
            </span>
          </div>

          <div className="unauthorized-detail-row">
            <span className="unauthorized-detail-label">Current Account:</span>
            <span className="unauthorized-detail-value">
              {currentUser?.name || 'User'} ({currentUser?.email || 'N/A'})
            </span>
          </div>

          <div className="unauthorized-detail-row">
            <span className="unauthorized-detail-label">Your Current Role:</span>
            <span className="badge badge-lost" style={{ fontSize: '12px' }}>
              {currentUser?.role || 'Employee'}
            </span>
          </div>

          <div className="unauthorized-detail-row">
            <span className="unauthorized-detail-label">HTTP Status Code:</span>
            <span style={{ fontWeight: 700, color: 'var(--danger)' }}>
              {statusCode} {statusCode === 403 ? 'FORBIDDEN (UNAUTHORIZED)' : 'UNAUTHORIZED'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="unauthorized-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} />
            Return to Dashboard
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <LogOut size={16} />
            Sign In with Super Admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
