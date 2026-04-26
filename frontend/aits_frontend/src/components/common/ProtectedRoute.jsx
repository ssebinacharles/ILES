import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // check role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;