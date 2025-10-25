import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    // Try token from localStorage first (set by redirect), otherwise rely on cookie
    // Also check hash in case redirect used fragment (#token=)
    // Parse token from URL hash and persist it
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const tokenFromHash = hashParams.get('token');
    if (tokenFromHash) {
      localStorage.setItem('token', tokenFromHash);
      // remove token from URL so it isn't leaked in history
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    // Then use stored token when calling current_user
    const storedToken = localStorage.getItem('token');
    console.log('Login: storedToken present:', !!storedToken);

    const fetchOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {})
      },
      // optional: include credentials if you later rely on cookies
      credentials: 'include'
    };

    fetch('http://localhost:4000/auth/current_user', fetchOptions)
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(user => {
        console.log('User authenticated:', user);
        // ...existing code to set user state...
      })
      .catch(err => {
        console.log('User not authenticated:', err.message);
      });
  }, [navigate]);

  const handleLogin = () => {
    window.location.href = 'http://localhost:4000/auth/google'; // backend URL
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Login</h1>
      <button onClick={handleLogin} style={{ padding: '10px 20px', fontSize: '16px' }}>
        Login with Google
      </button>
    </div>
  );
};

export default Login;
