import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useToast } from './ToastContext';
import '../index.css';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const { addToast } = useToast();
  const location = useLocation();
  const hasShownToast = useRef(false);

  useEffect(() => {
    // if no token, show toast notification (only once)
    if (!token && !hasShownToast.current) {
      const pageName = location.pathname.replace('/', '').replace(/^\w/, c => c.toUpperCase()) || 'page';
      addToast(`Please login to access ${pageName}`, 'warning', 4000);
      hasShownToast.current = true;
    }
  }, [token, addToast, location.pathname]);

  // if no token, redirect to dashboard
  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
