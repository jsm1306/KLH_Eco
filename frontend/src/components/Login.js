import React from 'react';

const Login = () => {
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
