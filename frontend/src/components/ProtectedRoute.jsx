import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/api';
import Unauthorized from '../pages/Unauthorized';

const ProtectedRoute = ({ requiredRole, resourceName }) => {
  const isAuth = authService.isAuthenticated();
  const user = authService.getUser();

  // not logged in -> send to login
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // block if role reqd (eg Super Admin) doesnt match
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <Unauthorized
        statusCode={403}
        title="403 - Unauthorized Access"
        message={`${resourceName || 'This section'} is accessible only for ${requiredRole}. Other users cannot access this module.`}
        requiredRole={requiredRole}
        resourceName={resourceName || 'Restricted Module'}
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
