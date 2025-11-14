import React, { useEffect, useState, useCallback } from 'react';
import API_BASE from '../api/base';
import { useToast } from './ToastContext';
import '../styles/FeedbackNew.css';

const FeedbackNew = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [myFeedback, setMyFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [type, setType] = useState('feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchMyFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/feedback`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter to show only current user's feedback
        const userFeedback = data.filter(f => 
          f.user?._id === currentUser._id || f.user === currentUser._id
        );
        setMyFeedback(userFeedback);
      }
    } catch (err) {
      // Error silently handled
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchMyFeedback();
    }
  }, [currentUser, fetchMyFeedback]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/auth/current_user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        // Pre-fill name if available
        setName(data.name || '');
      }
    } catch (err) {
      // Error silently handled
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      addToast('Please fill in Subject and Message fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          subject,
          message,
          name: name || 'Anonymous'
        })
      });

      if (res.ok) {
        addToast('Feedback submitted successfully!', 'success');
        // Reset form
        setSubject('');
        setMessage('');
        setType('feedback');
        // Keep name
        // Refresh submissions
        fetchMyFeedback();
      } else {
        const error = await res.json();
        addToast(error.message || 'Failed to submit feedback', 'error');
      }
    } catch (err) {
      addToast('Failed to submit feedback', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateMessage = (text, maxLength = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="feedback-page-container">
      {/* Page Header */}
      <div className="feedback-page-header">
        <h1 className="feedback-page-title">Feedback & Grievances</h1>
        <p className="feedback-page-subtitle">
          Share your feedback or report grievances to help us improve campus services and address concerns.
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="feedback-layout">
        {/* Left Column - Submission Form */}
        <div className="feedback-form-section">
          <div className="form-card">
            <h2 className="form-title">Submit Feedback or Grievance</h2>
            
            <form onSubmit={handleSubmit} className="feedback-form">
              <div className="form-field">
                <label htmlFor="type">Type *</label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                >
                  <option value="feedback">Feedback</option>
                  <option value="grievance">Grievance</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="subject">Subject *</label>
                <input
                  id="subject"
                  type="text"
                  placeholder="Brief summary of your feedback or grievance"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  placeholder="Provide detailed information..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="name">Name (Optional)</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="submit-feedback-btn"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - My Submissions */}
        <div className="submissions-section">
          <div className="submissions-card">
            <h2 className="submissions-title">My Submissions</h2>
            
            {loading ? (
              <div className="submissions-loading">Loading...</div>
            ) : myFeedback.length === 0 ? (
              <div className="submissions-empty">
                <p>No submissions yet</p>
                <p className="empty-hint">Your feedback and grievances will appear here</p>
              </div>
            ) : (
              <div className="submissions-list">
                {myFeedback.map((item) => (
                  <div key={item._id} className="submission-item">
                    <div className="submission-header">
                      <span className={`type-badge ${item.type}`}>
                        {item.type === 'feedback' ? 'Feedback' : 'Grievance'}
                      </span>
                      <span className="submission-date">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    
                    <h3 className="submission-subject">{item.subject}</h3>
                    
                    <p className="submission-preview">
                      {truncateMessage(item.message)}
                    </p>
                    
                    {item.status && (
                      <div className="submission-status">
                        Status: <span className={`status-${item.status}`}>{item.status}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackNew;
