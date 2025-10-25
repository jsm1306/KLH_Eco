import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LostFound from './components/LostFound';
import Navbar from './components/Navbar';
import Events from './components/Events';
import Feedback from './components/Feedback';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function TokenHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle token from OAuth redirect
    try {
      const params = new URLSearchParams(window.location.search);
      let urlToken = params.get('token');
      let fromHash = false;
      
      if (!urlToken && window.location.hash) {
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        urlToken = hashParams.get('token');
        fromHash = true;
      }
      
      if (urlToken) {
        console.log('TokenHandler: captured token, saving to localStorage');
        localStorage.setItem('token', urlToken);
        
        // Clean URL without full page reload
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('token');
        newUrl.hash = '';
        window.history.replaceState({}, document.title, newUrl.pathname);
        
        // Navigate to dashboard using React Router (no reload)
        navigate('/dashboard', { replace: true });
      }
    } catch (e) {
      console.error('TokenHandler: error parsing token', e);
    }
  }, [navigate]);

  return null;
}

function App() {
  return (
    <Router>
      <TokenHandler />
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Protected Routes */}
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lostfound"
          element={
            <ProtectedRoute>
              <LostFound />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <ProtectedRoute>
              <Feedback />
            </ProtectedRoute>
          }
        />

        {/* 404 Catch-all route */}
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;