import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../index.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [animateBell, setAnimateBell] = useState(false);
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
  const res = await fetch('https://klh-eco.onrender.com/auth/current_user', opts);
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
  const res = await fetch('https://klh-eco.onrender.com/api/notifications', {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storedToken}` },
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        setNotifications(data);
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
  const res = await fetch('https://klh-eco.onrender.com/api/notifications', { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        const unread = data.filter(n => !n.read).length;
        if (prev !== null && unread > prev) {
          // new notifications arrived
          setAnimateBell(true);
          setTimeout(() => setAnimateBell(false), 2000);
        }
        prev = unread;
        setNotifications(data);
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
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
  fetch('https://klh-eco.onrender.com/api/notifications', {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storedToken}` },
        credentials: 'include',
      })
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          setNotifications(data);
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

  // no dropdown; notifications open on a dedicated page

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
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('userLogout'));
    
    // call backend logout to clear cookie/session and redirect to frontend root
    // use fetch so we can remain in SPA and then navigate
  fetch('https://klh-eco.onrender.com/auth/logout', { credentials: 'include' })
      .then(() => {
        navigate('/');
      })
      .catch(() => navigate('/'));
  };

  const handleLogin = () => {
    // Start OAuth flow by redirecting to backend
  window.location.href = 'https://klh-eco.onrender.com/auth/google';
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
        <div className="nav-notes" style={{ position: 'relative', marginRight: 10 }}>
          <button className={`nav-cta ${animateBell ? 'animate-bell' : ''}`} onClick={() => navigate('/notifications')} aria-label="Notifications">
            <span style={{ fontSize: 18 }}>🔔</span>
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
        </div>
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
