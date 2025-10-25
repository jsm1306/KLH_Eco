import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if token exists in URL query parameters
    const token = searchParams.get('token');
    
    if (token) {
      console.log('Token received from OAuth:', token);
      
      // Store token in localStorage
      localStorage.setItem('authToken', token);
      
      // Clean up URL by removing token parameter
      // This prevents the token from being visible in the URL
      navigate('/dashboard', { replace: true });
    } else {
      // Check if user is already logged in
      const existingToken = localStorage.getItem('authToken');
      if (!existingToken) {
        console.log('No token found, user might need to login');
        // Optionally redirect to login page
        // navigate('/');
      }
    }
  }, [searchParams, navigate]);

  return (
    <div className="dashboard-hero">
      <div className="dashboard-card">
        <h1>Welcome to KLH Campus Page</h1>
        <p className="dashboard-sub">
          A simple portal for the KLH community — find lost items, post notices, and stay connected.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;