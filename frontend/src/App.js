import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  useEffect(() => {
    // Global token capture: read token from query param or hash on app mount
    try {
      const params = new URLSearchParams(window.location.search);
      let urlToken = params.get('token');
      if (!urlToken && window.location.hash) {
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        urlToken = hashParams.get('token');
      }
      if (urlToken) {
        localStorage.setItem('token', urlToken);
        // remove token from URL (both search and hash)
        params.delete('token');
        window.history.replaceState({}, document.title, window.location.pathname + (params.toString() ? `?${params.toString()}` : ''));
      }
    } catch (e) {
      // Error silently handled
    }
  }, []);
  return (
   <ToastProvider>
    <Router>
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
