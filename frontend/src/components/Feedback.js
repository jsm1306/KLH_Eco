import React, { useEffect, useState } from 'react';
import '../index.css';

const Feedback = () => {
  const [type, setType] = useState('feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [recent, setRecent] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchRecent();
  }, []);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:4000/auth/current_user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        setIsAdmin(user.role === 'admin');
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const getFetchConfig = () => {
    const token = localStorage.getItem('token');
    if (token) return { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };
    return { headers: { 'Content-Type': 'application/json' } };
  };

  const fetchRecent = async () => {
    try {
      const cfg = getFetchConfig();
      const res = await fetch('http://localhost:4000/api/feedback', cfg);
      const data = await res.json();
      setRecent(data.slice(0, 10));
    } catch (err) {
      console.error('Failed to fetch feedback', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const cfg = getFetchConfig();
      const res = await fetch('http://localhost:4000/api/feedback', {
        method: 'POST',
        ...cfg,
        body: JSON.stringify({ name, email, type, subject, message }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setStatus('sent');
      setSubject('');
      setMessage('');
      // Optionally clear name/email
      fetchRecent();
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="feedback-page">
      <div className="fb-form">
        <h2>Feedback & Grievance</h2>
        <p>Your feedback helps us improve. For urgent grievances, choose 'grievance' and include contact details.</p>
        <form onSubmit={handleSubmit}>
          <label>Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="feedback">Feedback</option>
              <option value="grievance">Grievance</option>
            </select>
          </label>
          <label>Subject
            <input required value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>
          <label>Message
            <textarea required value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>
          <label>Name (optional)
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>Email (optional)
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <div className="form-actions">
            <button className="btn-primary" type="submit">Submit</button>
            {status === 'sending' && <span>Sending...</span>}
            {status === 'sent' && <span style={{ color: 'green' }}>Submitted — thank you!</span>}
            {status === 'error' && <span style={{ color: 'red' }}>Submission failed</span>}
          </div>
        </form>
      </div>

      <aside className="fb-recent">
        <h3>{isAdmin ? 'All Feedback Submissions' : 'My Submissions'}</h3>
        {recent.length === 0 ? <p>{isAdmin ? 'No submissions yet.' : 'You haven\'t submitted any feedback yet.'}</p> : (
          <ul className="fb-list">
            {recent.map((r) => (
              <li key={r._id} className="fb-item">
                <div className="fb-meta">
                  <span className={`fb-type ${r.type}`}>{r.type.toUpperCase()}</span>
                  {/* <span className={`fb-status ${r.status}`}>{r.status}</span> */}
                  <span className="fb-date">{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <div className="fb-subject">{r.subject}</div>
                <div className="fb-message">{r.message}</div>
                {isAdmin && r.user && (
                  <div className="fb-user">Submitted by: {r.user.name || r.name || 'Anonymous'}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
};

export default Feedback;
