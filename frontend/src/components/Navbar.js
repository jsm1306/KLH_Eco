import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [user, setUser] = useState(null);
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
      const res = await fetch('http://localhost:4000/auth/current_user', opts);
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

  const handleLogout = () => {
    // clear local token first
    localStorage.removeItem('token');
    setUser(null);
    // call backend logout to clear cookie/session and redirect to frontend root
    // use fetch so we can remain in SPA and then navigate
    fetch('http://localhost:4000/auth/logout', { credentials: 'include' })
      .then(() => {
        navigate('/');
      })
      .catch(() => navigate('/'));
  };

  return (
    <nav className="app-navbar">
      <div className="nav-left">
        <Link to="/dashboard" className="nav-brand">KLH Eco</Link>
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/lostfound" className="nav-link">Lost & Found</Link>
      </div>
      <div className="nav-right">
        {user ? (
          <>
            <span className="nav-user">{user.name}</span>
            <button className="nav-cta" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/" className="nav-cta">Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
