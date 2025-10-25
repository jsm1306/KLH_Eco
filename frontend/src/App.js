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

function App() {
  useEffect(() => {
    // Global token capture: read token from query param or hash on app mount
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
        console.log('App: captured token from URL/hash, saving to localStorage');
        localStorage.setItem('token', urlToken);
        
        // Remove token from URL (search and hash)
        params.delete('token');
        let newUrl = window.location.pathname;
        
        // Clean up hash if token was in hash
        if (fromHash) {
          window.location.hash = '';
        }
        
        if (params.toString()) {
          newUrl += `?${params.toString()}`;
        }
        
        window.history.replaceState({}, document.title, newUrl);
        
        // ✅ ADD THIS: Force navigation to dashboard
        if (window.location.pathname !== '/dashboard') {
          window.location.href = '/dashboard';
        }
      }
    } catch (e) {
      console.error('App: error parsing token from URL', e);
    }
  }, []);

  return (
    <Router>
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