import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../api/base';
import '../styles/NotificationsNew.css';

const NotificationsNew = () => {
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    // Auto-select first notification if none selected
    if (notifications.length > 0 && !selectedNotification) {
      setSelectedNotification(notifications[0]);
    }
  }, [notifications, selectedNotification]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
      }
    } catch (err) {
      // Error silently handled
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      // Error silently handled
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update local state
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      // Error silently handled
    }
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    if (!notification.read) {
      markAsRead(notification._id);
    }
  };

  const handleActionClick = () => {
    if (selectedNotification?.link) {
      navigate(selectedNotification.link);
    }
  };

  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatFullTimestamp = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text, maxLength = 80) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notifications-page-container">
      {/* Page Header */}
      <div className="notifications-page-header">
        <div className="header-left">
          <h1 className="notifications-page-title">Notifications</h1>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} unread</span>
          )}
        </div>
        <button
          className="mark-all-read-btn"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
        >
          Mark All Read
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="notifications-layout">
        {/* Left Column - Notifications List */}
        <aside className="notifications-sidebar">
          <div className="sidebar-header">
            <h2>Recent Notifications</h2>
          </div>

          {loading ? (
            <div className="notifications-loading">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="notifications-empty">
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${
                    selectedNotification?._id === notification._id ? 'active' : ''
                  } ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-item-header">
                    <h3 className="notification-item-title">
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span className="unread-indicator"></span>
                    )}
                  </div>
                  <p className="notification-item-description">
                    {truncateText(notification.message)}
                  </p>
                  <span className="notification-item-time">
                    {formatTimestamp(notification.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Right Column - Notification Details */}
        <main className="notifications-detail">
          {!selectedNotification ? (
            <div className="detail-empty">
              <p>Select a notification to view details</p>
            </div>
          ) : (
            <div className="detail-content">
              <div className="detail-header">
                <h1 className="detail-title">{selectedNotification.title}</h1>
                <span className="detail-timestamp">
                  {formatFullTimestamp(selectedNotification.createdAt)}
                </span>
              </div>

              <div className="detail-body">
                <p className="detail-message">{selectedNotification.message}</p>
              </div>

              {selectedNotification.link && (
                <div className="detail-actions">
                  <button
                    className="action-btn"
                    onClick={handleActionClick}
                  >
                    View Related Item
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default NotificationsNew;
