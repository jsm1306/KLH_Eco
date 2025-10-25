import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const navigate = useNavigate();

  const fetchCurrentUser = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      const opts = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
        },
        credentials: 'include',
      };
      const res = await fetch('https://klh-eco-backend.onrender.com/auth/current_user', opts);
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data);
    } catch (err) {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const onStorage = (e) => {
      if (e.key === 'token') {
        // token changed in another tab — refresh current user
        fetchCurrentUser();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Theme toggle
  useEffect(() => {
    const t = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
    setTheme(t);
  }, []);

  const toggleTheme = () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  const handleLogout = () => {
    // clear local token first
    localStorage.removeItem('token');
    setUser(null);
    // call backend logout to clear cookie/session and redirect to frontend root
    // use fetch so we can remain in SPA and then navigate
    fetch('https://klh-eco-backend.onrender.com/auth/logout', { credentials: 'include' })
      .then(() => {
        navigate('/');
      })
      .catch(() => navigate('/'));
  };

  const handleLogin = () => {
    // Start OAuth flow by redirecting to backend
    window.location.href = 'https://klh-eco-backend.onrender.com/auth/google';
  };

  return (
    <nav className="app-navbar">
      <div className="nav-left">
        <Link to="/dashboard" className="nav-brand">KLH Eco</Link>
  <Link to="/dashboard" className="nav-link">Dashboard</Link>
  <Link to="/events" className="nav-link">Events</Link>
  <Link to="/lostfound" className="nav-link">Lost & Found</Link>
  <Link to="/feedback" className="nav-link">Feedback</Link>
      </div>
      <div className="nav-right">
        <button style={{ marginRight: 10 }} className="nav-cta" onClick={toggleTheme}>{theme === 'dark' ? 'Light' : 'Dark'}</button>
        {user ? (
          <>
            <span className="nav-user">{user.name}</span>
            <button className="nav-cta" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <button className="nav-cta" onClick={handleLogin}>Login</button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
