import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../index.css';
import API_BASE from '../api/base';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [animateBell, setAnimateBell] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
        const res = await fetch(`${API_BASE}/auth/current_user`, opts);
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

    // fetch notifications when user changes
    const fetchNotes = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) return;
          const res = await fetch(`${API_BASE}/api/notifications`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storedToken}` },
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        const unread = data.filter(n => !n.read).length;
        setUnreadCount(unread);
      } catch (err) {
        // ignore
      }
    };
    fetchNotes();

    const onStorage = (e) => {
      if (e.key === 'token') {
        // token changed in another tab — refresh current user
        fetchCurrentUser();
      }
    };
    window.addEventListener('storage', onStorage);

    // listen for notification updates from Notifications page
    const onNotes = (e) => {
      try {
        const val = e.detail && typeof e.detail.unreadCount === 'number' ? e.detail.unreadCount : null;
        if (val !== null) setUnreadCount(val);
      } catch (err) {}
    };
    window.addEventListener('notificationsUpdated', onNotes);

    // Poll for new notifications every 20s to detect new ones and animate bell
    let prev = null;
    const pollNotes = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
          const res = await fetch(`${API_BASE}/api/notifications`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        const unread = data.filter(n => !n.read).length;
        if (prev !== null && unread > prev) {
          // new notifications arrived
          setAnimateBell(true);
          setTimeout(() => setAnimateBell(false), 2000);
        }
        prev = unread;
        setUnreadCount(unread);
      } catch (err) {}
    };
    const pollInterval = setInterval(pollNotes, 20000);
    // run immediately once
    pollNotes();

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('notificationsUpdated', onNotes);
      clearInterval(pollInterval);
    };
  }, []);

  // Re-fetch notifications on login/logout events
  useEffect(() => {
    const onUserChange = () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setUnreadCount(0);
        return;
      }
        fetch(`${API_BASE}/api/notifications`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storedToken}` },
        credentials: 'include',
      })
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          setUnreadCount(data.filter(n => !n.read).length);
        })
        .catch(() => {});
    };
    window.addEventListener('userLogout', onUserChange);
    window.addEventListener('storage', (e) => { if (e.key === 'token') onUserChange(); });
    return () => {
      window.removeEventListener('userLogout', onUserChange);
      window.removeEventListener('storage', (e) => { if (e.key === 'token') onUserChange(); });
    };
  }, []);

  const handleLogout = () => {
    // clear local token first
    localStorage.removeItem('token');
    setUser(null);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('userLogout'));
    
    // call backend logout to clear cookie/session and redirect to frontend root
    // use fetch so we can remain in SPA and then navigate
      fetch(`${API_BASE}/auth/logout`, { credentials: 'include' })
      .then(() => {
        navigate('/');
      })
      .catch(() => navigate('/'));
  };

  const handleLogin = () => {
    // Start OAuth flow by redirecting to backend
    window.location.href = `${API_BASE}/auth/google`;
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="app-navbar">
      <div className="nav-left">
        <Link to="/dashboard" className="nav-brand">
          <span className="brand-klh">KLH</span>
          <span className="brand-eco">Eco</span>
        </Link>
        <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
          Dashboard
        </Link>
        <Link to="/events" className={`nav-link ${isActive('/events') ? 'active' : ''}`}>
          Events
        </Link>
        <Link to="/lostfound" className={`nav-link ${isActive('/lostfound') ? 'active' : ''}`}>
          Lost & Found
        </Link>
        <Link to="/feedback" className={`nav-link ${isActive('/feedback') ? 'active' : ''}`}>
          Feedback
        </Link>
      </div>
      <div className="nav-right">
        <button 
          className={`nav-notification-btn ${animateBell ? 'animate-bell' : ''}`} 
          onClick={() => navigate('/notifications')} 
          aria-label="Notifications"
        >
          <span className="notif-icon">🔔</span>
          {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
        </button>
        
        {user ? (
          <div className="nav-user-section">
            <div className="nav-user-info">
              <span className="user-avatar">{user.name?.charAt(0) || 'U'}</span>
              <span className="user-name">{user.name}</span>
            </div>
            <button className="nav-logout-btn" onClick={handleLogout}>
              <span className="logout-icon">→</span>
              Logout
            </button>
          </div>
        ) : (
          <button className="nav-login-btn" onClick={handleLogin}>
            <span className="login-icon">⚡</span>
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
