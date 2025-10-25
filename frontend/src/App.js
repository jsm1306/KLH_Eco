import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LostFound from './components/LostFound';
import Navbar from './components/Navbar';
import Events from './components/Events';
import Feedback from './components/Feedback';
import Chatbot from './components/Chatbot';
import BotpressChat from './components/BotpressChat';
import ProtectedRoute from './components/ProtectedRoute';

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
        console.log('App: captured token from URL/hash, saving to localStorage');
        localStorage.setItem('token', urlToken);
        // remove token from URL (both search and hash)
        params.delete('token');
        window.history.replaceState({}, document.title, window.location.pathname + (params.toString() ? `?${params.toString()}` : ''));
      }
    } catch (e) {
      console.error('App: error parsing token from URL', e);
    }
  }, []);
  return (
   <Router>
      <Navbar />
      <Routes>
        {/* Public Route */}
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

        {/* Default route (for login) */}
        <Route path="/" element={<Dashboard />} />
      </Routes>
      
      {/* Botpress chatbot loaded via index.html */}
    </Router>
  );
}


export default App;
