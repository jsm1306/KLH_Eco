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
      // Show the exact style of message requested by user
      addToast('You are unauthenticated, please login through college mail', 'warning', 4000);
      hasShownToast.current = true;
    }
  }, [token, addToast, location.pathname]);

  // if no token, redirect to login page
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
