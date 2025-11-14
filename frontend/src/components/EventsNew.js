import React, { useEffect, useState } from 'react';
import API_BASE from '../api/base';
import ImageWithFallback from './ImageWithFallback';
import '../styles/EventsNew.css';

const EventsNew = () => {
  const [clubs, setClubs] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [selectedClub, setSelectedClub] = useState('all');
  const [viewMode, setViewMode] = useState('upcoming'); // 'upcoming' | 'past'
  const [currentUser, setCurrentUser] = useState(null);
  const [subscribing, setSubscribing] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser();
    fetchClubs();
    fetchAllEvents();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/auth/current_user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch (err) {
      // Error silently handled
    }
  };

  const fetchClubs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/clubs`);
      const data = await res.json();
      setClubs(data || []);
    } catch (err) {
      // Error silently handled
    }
  };

  const fetchAllEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/events`);
      const data = await res.json();
      setAllEvents(data || []);
    } catch (err) {
      // Error silently handled
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (eventId) => {
    if (!currentUser) {
      alert('Please log in to subscribe to events');
      return;
    }
    
    setSubscribing({ ...subscribing, [eventId]: true });
    try {
      const token = localStorage.getItem('token');
      const event = allEvents.find(e => e._id === eventId);
      const isSubscribed = event?.registeredUsers?.some(s => s._id === currentUser._id || s === currentUser._id);
      
      const endpoint = isSubscribed ? 'unsubscribe' : 'subscribe';
      const res = await fetch(`${API_BASE}/api/events/${eventId}/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        fetchAllEvents(); // Refresh events
      }
    } catch (err) {
      // Error silently handled
    } finally {
      setSubscribing({ ...subscribing, [eventId]: false });
    }
  };

  // Filter events based on selected club and view mode
  const getFilteredEvents = () => {
    const now = new Date();
    let filtered = allEvents;

    // Filter by club
    if (selectedClub !== 'all') {
      filtered = filtered.filter(event => {
        const clubId = event.club?._id || event.club;
        return clubId === selectedClub;
      });
    }

    // Filter by time (upcoming/past)
    if (viewMode === 'upcoming') {
      filtered = filtered.filter(event => new Date(event.date) >= now);
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else {
      filtered = filtered.filter(event => new Date(event.date) < now);
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return filtered;
  };

  // Get event count per club
  const getClubEventCount = (clubId) => {
    return allEvents.filter(event => {
      const eventClubId = event.club?._id || event.club;
      return eventClubId === clubId;
    }).length;
  };

  const filteredEvents = getFilteredEvents();

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUserSubscribed = (event) => {
    if (!currentUser) return false;
    return event.registeredUsers?.some(s => s._id === currentUser._id || s === currentUser._id);
  };

  return (
    <div className="events-page-container">
      <div className="events-page-header">
        <h1 className="events-page-title">Campus Events</h1>
        <p className="events-page-subtitle">Discover and participate in university activities</p>
      </div>

      <div className="events-layout">
        {/* Left Sidebar - Clubs List */}
        <aside className="events-sidebar">
          <div className="sidebar-header">
            <h2>Clubs & Organizations</h2>
          </div>
          
          <div className="clubs-list">
            <button
              className={`club-item ${selectedClub === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedClub('all')}
            >
              <span className="club-name">All Events</span>
              <span className="club-count">{allEvents.length}</span>
            </button>

            {clubs.map(club => (
              <button
                key={club._id}
                className={`club-item ${selectedClub === club._id ? 'active' : ''}`}
                onClick={() => setSelectedClub(club._id)}
              >
                <span className="club-name">{club.name}</span>
                <span className="club-count">{getClubEventCount(club._id)}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Right Content Area - Events */}
        <main className="events-main">
          {/* Toggle: All Events | Past Events */}
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'upcoming' ? 'active' : ''}`}
              onClick={() => setViewMode('upcoming')}
            >
              Upcoming Events
            </button>
            <button
              className={`toggle-btn ${viewMode === 'past' ? 'active' : ''}`}
              onClick={() => setViewMode('past')}
            >
              Past Events
            </button>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="events-loading">Loading events...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="events-empty">
              <p>No {viewMode} events found</p>
            </div>
          ) : (
            <div className="events-grid-new">
              {filteredEvents.map(event => (
                <article key={event._id} className="event-card-new">
                  {event.image && (
                    <div className="event-image-wrapper">
                      <ImageWithFallback
                        src={event.image}
                        alt={event.title}
                        className="event-image-new"
                      />
                    </div>
                  )}
                  
                  <div className="event-card-body">
                    <h3 className="event-card-title">{event.title}</h3>
                    
                    <div className="event-meta-row">
                      <div className="meta-item">
                        <span className="meta-icon">🏛️</span>
                        <span className="meta-text">
                          {event.club?.name || 'General Event'}
                        </span>
                      </div>
                    </div>

                    <div className="event-meta-row">
                      <div className="meta-item">
                        <span className="meta-icon">📅</span>
                        <span className="meta-text">{formatDate(event.date)}</span>
                      </div>
                    </div>

                    <div className="event-meta-row">
                      <div className="meta-item">
                        <span className="meta-icon">📍</span>
                        <span className="meta-text">{event.location || 'TBD'}</span>
                      </div>
                    </div>

                    <div className="event-meta-row">
                      <div className="meta-item">
                        <span className="meta-icon">👥</span>
                        <span className="meta-text">
                          {event.registeredUsers?.length || 0} registered
                        </span>
                      </div>
                    </div>

                    <p className="event-description">{event.description}</p>

                    {currentUser && (
                      <button
                        className={`subscribe-btn ${isUserSubscribed(event) ? 'subscribed' : ''}`}
                        onClick={() => handleSubscribe(event._id)}
                        disabled={subscribing[event._id]}
                      >
                        {subscribing[event._id] ? 'Processing...' : 
                         isUserSubscribed(event) ? 'Unsubscribe' : 'Subscribe'}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EventsNew;
