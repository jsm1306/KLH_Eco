import React, { useEffect, useState } from 'react';

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('http://localhost:4000/auth/current_user', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((err) => console.log(err));
  }, []);

  const handleLogout = () => {
    window.location.href = 'http://localhost:4000/auth/logout';
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user.name}!</p>
      <p>Email: {user.mail}</p>
      <p>Role: {user.role}</p>
      <button onClick={handleLogout} style={{ padding: '10px 20px', fontSize: '16px' }}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
