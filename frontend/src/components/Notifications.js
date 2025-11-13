import React, { useEffect, useState } from 'react';
import '../index.css';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const token = localStorage.getItem('token');
  const res = await fetch('https://klh-eco.onrender.com/api/notifications', {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotes(data);
      if (data.length) setSelected(data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (note) => {
    try {
      const token = localStorage.getItem('token');
      if (!note.read) {
  await fetch(`https://klh-eco.onrender.com/api/notifications/${note._id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
        setNotes(prev => prev.map(n => n._id === note._id ? { ...n, read: true } : n));
        const unread = notes.filter(n => !n.read && n._id !== note._id).length;
        // notify other components (navbar) about change
        window.dispatchEvent(new CustomEvent('notificationsUpdated', { detail: { unreadCount: unread } }));
      }
      setSelected(note);
    } catch (err) {
      console.error(err);
    }
  };

  const markAll = async () => {
    try {
      const token = localStorage.getItem('token');
  await fetch('https://klh-eco.onrender.com/api/notifications/read-all', { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
      setNotes(prev => prev.map(n => ({ ...n, read: true })));
      // notify navbar that unread count is now zero
      window.dispatchEvent(new CustomEvent('notificationsUpdated', { detail: { unreadCount: 0 } }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-content page-bg notifications-page">
      <div className="notifications-container">
        <div className="notes-list-pane">
          <div className="notes-list-header">
            <h3>Notifications</h3>
            <div>
              <button className="btn-small" onClick={markAll}>Mark all read</button>
            </div>
          </div>
          <div className="notes-list-scroll">
            {notes.length === 0 && <div className="note-empty">No notifications</div>}
            {notes.map(n => (
              <div key={n._id} className={`note-list-item ${n.read ? 'read' : 'unread'}`} onClick={() => markRead(n)}>
                <div className="note-left">
                  <div className="note-title-small">{n.title}</div>
                  <div className="note-snippet">{n.message}</div>
                </div>
                <div className="note-meta">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="notes-panel">
          {!selected && <div className="note-empty">Select a notification to read</div>}
          {selected && (
            <div className="note-full">
              <h2 className="note-full-title">{selected.title}</h2>
              <div className="note-full-meta">{new Date(selected.createdAt).toLocaleString()}</div>
              <div className="note-full-body">{selected.message}</div>
              {selected.link && (
                <div style={{ marginTop: 20 }}>
                  <button className="btn" onClick={() => navigate(selected.link)}>Open</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
