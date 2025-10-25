import React from 'react';

const Login = () => {
  return (
    <div className="home-hero">
      <div className="home-card">
        <h1>Welcome to KLH Eco</h1>
        <p className="home-sub">We're glad you're here. Use the navigation above to explore events, post or find lost items, and connect with clubs on campus.</p>
        <ul className="home-features">
          <li>Discover upcoming events by clubs</li>
          <li>Post and search lost & found items</li>
          <li>Sign in with your KLH account to participate</li>
        </ul>
        <p className="home-cta">Tip: Use the Login button in the top-right to sign in.</p>
      </div>
    </div>
  );
};

export default Login;
