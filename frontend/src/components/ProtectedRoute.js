// ProtectedRoute.js - Make sure it uses 'token' not 'authToken'
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token'); // ← Must match 'token'
  
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default ProtectedRoute;