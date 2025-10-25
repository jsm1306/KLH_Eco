import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LostFound from './components/LostFound';
import Navbar from './components/Navbar';
import Events from './components/Events';
import Feedback from './components/Feedback';
import './App.css';

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
      <div className="App">
        <Navbar />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events" element={<Events />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/lostfound" element={<LostFound />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
