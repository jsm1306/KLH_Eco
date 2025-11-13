import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    recentLostFound: 0,
    totalClubs: 0,
    pendingFeedback: 0
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentLostFound, setRecentLostFound] = useState([]);
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch functions defined before useEffect
  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
  const res = await fetch('https://klh-eco.onrender.com/auth/current_user', {
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
  }, []);

  const fetchUpcomingEvents = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
  const res = await fetch('https://klh-eco.onrender.com/api/events', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const events = await res.json();
        console.log('Fetched events:', events);
        
        const upcoming = events
          .filter(e => new Date(e.date) >= new Date())
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 5);
        setUpcomingEvents(upcoming);
        
        const upcomingCount = events.filter(e => new Date(e.date) >= new Date()).length;
        console.log('Upcoming events count:', upcomingCount);
        setStats(prev => ({ ...prev, upcomingEvents: upcomingCount }));
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }, []);

  const fetchRecentLostFound = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
  const res = await fetch('https://klh-eco.onrender.com/api/lostfound', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const items = await res.json();
        console.log('Fetched lost & found items:', items);
        
        const recent = items.slice(0, 6);
        setRecentLostFound(recent);
        
        console.log('Total lost & found count:', items.length);
        setStats(prev => ({ ...prev, recentLostFound: items.length }));
      }
    } catch (error) {
      console.error('Error fetching lost & found:', error);
    }
  }, []);

  const fetchRecentFeedback = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
  const res = await fetch('https://klh-eco.onrender.com/api/feedback', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const feedback = await res.json();
        console.log('Fetched feedback:', feedback);
        
        const recent = feedback.slice(0, 5);
        setRecentFeedback(recent);
        
        console.log('Total feedback count:', feedback.length);
        setStats(prev => ({ ...prev, pendingFeedback: feedback.length }));
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  }, []);

  const fetchClubs = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
  const res = await fetch('https://klh-eco.onrender.com/api/clubs', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const clubs = await res.json();
        console.log('Fetched clubs:', clubs);
        console.log('Total clubs count:', clubs.length);
        setStats(prev => ({ ...prev, totalClubs: clubs.length }));
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      await fetchCurrentUser();
      
      await Promise.all([
        fetchUpcomingEvents(),
        fetchRecentLostFound(),
        fetchRecentFeedback(),
        fetchClubs()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentUser, fetchUpcomingEvents, fetchRecentLostFound, fetchRecentFeedback, fetchClubs]);

  useEffect(() => {
    fetchDashboardData();
    
    // Listen for storage changes (logout from different tab)
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (!e.newValue) {
          // Token was removed (logout)
          setCurrentUser(null);
          setIsAdmin(false);
        } else {
          // Token was added/changed (login)
          fetchDashboardData();
        }
      }
    };
    
    // Listen for custom logout event (logout from same tab)
    const handleUserLogout = () => {
      setCurrentUser(null);
      setIsAdmin(false);
      // Don't clear stats and data - they should remain visible
      // Only re-fetch feedback since it's user-specific
      fetchRecentFeedback();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLogout', handleUserLogout);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLogout', handleUserLogout);
    };
  }, [fetchDashboardData, fetchRecentFeedback]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // choose banner event: prefer an event happening today, otherwise the next upcoming
  const chooseBannerEvent = () => {
    if (!upcomingEvents || upcomingEvents.length === 0) return null;
    const now = new Date();
    const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

    const todayEvent = upcomingEvents.find(e => e.date && isSameDay(new Date(e.date), now));
    if (todayEvent) return todayEvent;

    // otherwise earliest upcoming (already sorted in fetchUpcomingEvents)
    return upcomingEvents[0];
  };

  const bannerEvent = chooseBannerEvent();

  if (loading) {
    return (
      <div className="dashboard-hero">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-hero">
        <h1>Welcome to KLH Campus Page</h1>
        {currentUser && <p className="user-greeting">Hello, {currentUser.name}! 👋</p>}
      </div>

      {/* Banner: show today's or next upcoming event */}
      {bannerEvent && (
        <div className="dashboard-banner" onClick={() => navigate(`/events`)}>
          {bannerEvent.image ? (
            <img className="banner-image" src={`https://klh-eco.onrender.com/${bannerEvent.image}`} alt={bannerEvent.title} />
          ) : (
            <div className="banner-fallback" />
          )}
          <div className="banner-content">
            <div className="banner-meta">{bannerEvent.date ? formatDate(bannerEvent.date) : 'TBD'}</div>
            <h2 className="banner-title">{bannerEvent.title}</h2>
            <div className="banner-registered">Registered: {bannerEvent.registeredUsers ? bannerEvent.registeredUsers.length : 0}</div>
            {bannerEvent.club && <div className="banner-club">🎯 {bannerEvent.club.name}</div>}
            {bannerEvent.location && <div className="banner-location">📍 {bannerEvent.location}</div>}
            <button className="banner-cta" onClick={(e) => { e.stopPropagation(); navigate('/events'); }}>See all events →</button>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="dashboard-stats">
        <div className="stat-card" onClick={() => navigate('/events')}>
          <div className="stat-icon">📅</div>
          <div className="stat-value">{stats.upcomingEvents}</div>
          <div className="stat-label">Upcoming Events</div>
        </div>
        
        <div className="stat-card" onClick={() => navigate('/lostfound')}>
          <div className="stat-icon">🔍</div>
          <div className="stat-value">{stats.recentLostFound}</div>
          <div className="stat-label">Lost & Found Items</div>
        </div>
        
        <div className="stat-card" onClick={() => navigate('/events')}>
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{stats.totalClubs}</div>
          <div className="stat-label">Clubs</div>
        </div>
        
        {currentUser && (
          <div className="stat-card" onClick={() => navigate('/feedback')}>
            <div className="stat-icon">📝</div>
            <div className="stat-value">{stats.pendingFeedback}</div>
            <div className="stat-label">{isAdmin ? 'Total Feedback' : 'My Feedback'}</div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <button className="action-btn" onClick={() => navigate('/lostfound')}>
            <span className="action-icon">📢</span>
            Report Lost Item
          </button>
          {isAdmin && (
            <button className="action-btn" onClick={() => navigate('/events')}>
              <span className="action-icon">➕</span>
              Create Event
            </button>
          )}
          <button className="action-btn" onClick={() => navigate('/feedback')}>
            <span className="action-icon">💬</span>
            Submit Feedback
          </button>
          <button className="action-btn" onClick={() => navigate('/events')}>
            <span className="action-icon">🏛️</span>
            Browse Clubs
          </button>
        </div>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="dashboard-section">
          <h2>Upcoming Events</h2>
          <div className="dashboard-events">
            {upcomingEvents.map(event => (
              <div key={event._id} className="dashboard-event-card">
                <div className="event-date-badge">{formatDate(event.date)}</div>
                <h3>{event.title}</h3>
                {event.club && <p className="event-club">🎯 {event.club.name}</p>}
                    <p className="event-location">📍 {event.location}</p>
                    <p className="event-meta"><strong>Registered:</strong> {event.registeredUsers ? event.registeredUsers.length : 0}</p>
              </div>
            ))}
          </div>
          <button className="see-all-btn" onClick={() => navigate('/events')}>
            See All Events →
          </button>
        </div>
      )}

      {/* Recent Lost & Found */}
      {recentLostFound.length > 0 && (
        <div className="dashboard-section">
          <h2>Recent Lost & Found</h2>
          <div className="dashboard-lostfound">
            {recentLostFound.map(item => (
              <div key={item._id} className="dashboard-lf-card">
                {item.image && (
                  <img 
                    src={`https://klh-eco.onrender.com/${item.image}`} 
                    alt={item.itemName}
                    className="lf-thumbnail"
                  />
                )}
                <div className="lf-info">
                  <span className={`lf-type ${item.type}`}>{item.type}</span>
                  <h4>{item.itemName}</h4>
                  <p className="lf-location">📍 {item.location}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="see-all-btn" onClick={() => navigate('/lostfound')}>
            See All Items →
          </button>
        </div>
      )}

      {/* Recent Feedback */}
      {currentUser && recentFeedback.length > 0 && (
        <div className="dashboard-section">
          <h2>{isAdmin ? 'Recent Feedback & Grievances (All Users)' : 'My Recent Feedback & Grievances'}</h2>
          <div className="dashboard-feedback">
            {recentFeedback.map(fb => (
              <div key={fb._id} className="dashboard-feedback-card">
                <div className="feedback-header">
                  <span className={`feedback-category ${fb.type}`}>{fb.type}</span>
                  <span className={`feedback-status ${fb.status}`}>{fb.status}</span>
                </div>
                <h4 className="feedback-subject">{fb.subject}</h4>
                <p className="feedback-message">{fb.message.substring(0, 100)}...</p>
                <p className="feedback-date">{formatDate(fb.createdAt)}</p>
              </div>
            ))}
          </div>
          <button className="see-all-btn" onClick={() => navigate('/feedback')}>
            {isAdmin ? 'See All Feedback →' : 'See My Feedback →'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
