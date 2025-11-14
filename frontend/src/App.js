import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LostFoundNew from './components/LostFoundNew';
import Login from './components/Login';
import Navbar from './components/Navbar';
import EventsNew from './components/EventsNew';
import NotificationsNew from './components/NotificationsNew';
import LostFoundClaims from './components/LostFoundClaims';
import FeedbackNew from './components/FeedbackNew';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/ToastContext';

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
      // Error silently handled
    }
  }, [navigate]);

  return null;
}

function App() {
  return (
   <ToastProvider>
    <Router>
      <TokenHandler />
      <Navbar />
      <Routes>
        {/* Public Route */}
        <Route path="/dashboard" element={<Dashboard />} />

  {/* Login route */}
  <Route path="/login" element={<Login />} />

        {/* Protected pages: require login to view */}
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <EventsNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lostfound/:id/claims"
          element={
            <ProtectedRoute>
              <LostFoundClaims />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lostfound"
          element={
            <ProtectedRoute>
              <LostFoundNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <ProtectedRoute>
              <FeedbackNew />
            </ProtectedRoute>
          }
        />

        {/* Default route (for login) */}
        <Route path="/" element={<Dashboard />} />
      </Routes>
      
      {/* Botpress chatbot loaded via index.html */}
    </Router>
   </ToastProvider>
  );
}


export default App;