import React from 'react';
import { Navigate } from 'react-router-dom';
import '../index.css';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  // if no token, redirect to login page
  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
