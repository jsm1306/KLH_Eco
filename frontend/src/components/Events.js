import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import '../index.css';

const Events = () => {
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [clubEvents, setClubEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [eventsByClub, setEventsByClub] = useState({});
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'past' | 'club'
  // per-club mode: 'current' | 'past'
  const [showClubMode, setShowClubMode] = useState({});
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  // User state for role-based access
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscribing, setSubscribing] = useState({}); // map eventId -> boolean
  // Create event form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newClubId, setNewClubId] = useState('');
  const [creating, setCreating] = useState(false);
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);
  // Edit / Delete state
  const [editingEvent, setEditingEvent] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editClubId, setEditClubId] = useState('');
  const [updating, setUpdating] = useState(false);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);

  // Fetch current user to check role
  const fetchCurrentUser = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      const opts = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
        },
        credentials: 'include',
      };
      const res = await fetch('http://localhost:4000/auth/current_user', opts);
      if (!res.ok) {
        setCurrentUser(null);
        setIsAdmin(false);
        return;
      }
      const data = await res.json();
      setCurrentUser(data);
      setIsAdmin(data.role === 'admin');
    } catch (err) {
      setCurrentUser(null);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    fetchClubs();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    // when clubs load, set default clubId for new event if not set
    if (clubs && clubs.length && !newClubId) {
      setNewClubId(clubs[0]._id);
    }
  }, [clubs]);

  useEffect(() => {
    // fetch all events across clubs
    const fetchAll = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/events');
        const data = await res.json();
        setAllEvents(data || []);
        // build map clubId -> events
        const map = {};
        (data || []).forEach((ev) => {
          const cid = ev.club?._id || (ev.club && ev.club.toString && ev.club.toString()) || null;
          if (cid) {
            if (!map[cid]) map[cid] = [];
            map[cid].push(ev);
          } else {
            if (!map['__noclub']) map['__noclub'] = [];
            map['__noclub'].push(ev);
          }
        });
        setEventsByClub(map);
      } catch (err) {
        console.error('Failed to fetch all events', err);
      }
    };
    fetchAll();
  }, []);

  const fetchClubs = async () => {
    setLoadingClubs(true);
    try {
      const res = await fetch('http://localhost:4000/api/clubs');
      const data = await res.json();
      setClubs(data || []);
    } catch (err) {
      console.error('Failed to fetch clubs', err);
    } finally {
      setLoadingClubs(false);
    }

  };

  const startEdit = (ev) => {
    setEditingEvent(ev);
    setEditTitle(ev.title || '');
    setEditDescription(ev.description || '');
    // normalize date for datetime-local if possible
    let dt = '';
    if (ev.date) {
      try {
        const d = new Date(ev.date);
        // format: YYYY-MM-DDTHH:MM
        const tzOffset = d.getTimezoneOffset() * 60000;
        const localISO = new Date(d - tzOffset).toISOString().slice(0, 16);
        dt = localISO;
      } catch (e) {
        dt = ev.date;
      }
    }
    setEditDate(dt);
    setEditLocation(ev.location || '');
    const cid = ev.club?._id || ev.club || '';
    setEditClubId(cid);
  // prefill image preview if event has image
  setEditImagePreview(ev.image ? `http://localhost:4000/${ev.image}` : null);
  setEditImageFile(null);
    // ensure create form is closed
    setShowCreateForm(false);
    // if viewing a club, scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingEvent(null);
    setEditTitle('');
    setEditDescription('');
    setEditDate('');
    setEditLocation('');
    setEditClubId('');
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editingEvent) return;
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      // Use FormData to support optional image upload
      const form = new FormData();
      form.append('title', editTitle);
      form.append('description', editDescription);
      form.append('date', editDate || '');
      form.append('location', editLocation);
      form.append('club', editClubId);
      // If a new file was selected, append it
      if (editImageFile) form.append('image', editImageFile);

      const res = await fetch(`http://localhost:4000/api/events/${editingEvent._id}`, {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update event');
      }

      const updated = await res.json();

      // update local lists (allEvents, eventsByClub, clubEvents)
      setAllEvents((prev) => prev.map((it) => (it._id === updated._id ? updated : it)));
      setEventsByClub((prev) => {
        const copy = {};
        Object.keys(prev).forEach((k) => {
          copy[k] = prev[k].map((it) => (it._id === updated._id ? updated : it));
          // if club changed, also remove/add will be handled below
        });
        // if club changed (updated.club may be object), ensure presence
        const newCid = updated.club?._id || updated.club || null;
        if (newCid) {
          if (!copy[newCid]) copy[newCid] = [];
          if (!copy[newCid].find((it) => it._id === updated._id)) copy[newCid].unshift(updated);
        }
        // remove from previous clubs if necessary
        Object.keys(copy).forEach((k) => {
          copy[k] = copy[k].filter((it) => it._id !== updated._id || k === (updated.club?._id || updated.club || ''));
        });
        return copy;
      });

      if (selectedClub && selectedClub._id) {
        // if editing within a selected club view
        if (String(selectedClub._id) === String(updated.club?._id || updated.club)) {
          setClubEvents((prev) => prev.map((it) => (it._id === updated._id ? updated : it)));
        } else {
          // event moved to another club - remove from current view
          setClubEvents((prev) => prev.filter((it) => it._id !== updated._id));
        }
      }

      cancelEdit();
    } catch (err) {
      console.error('Update failed', err);
      alert(err.message || 'Failed to update event');
    } finally {
      setUpdating(false);
    }
  };

  const deleteEvent = async (id) => {
    // replaced by confirm modal flow
    // kept empty to avoid accidental calls
  };

  // Confirm modal state
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('Are you sure?');

  const deleteEventStart = (id) => {
    setConfirmTargetId(id);
    setConfirmMessage('Delete this event? This cannot be undone.');
    setShowConfirm(true);
  };

  const performDelete = async (id) => {
    setShowConfirm(false);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete');
      }

      // remove from local lists
      setAllEvents((prev) => prev.filter((it) => it._id !== id));
      setEventsByClub((prev) => {
        const copy = {};
        Object.keys(prev).forEach((k) => {
          copy[k] = prev[k].filter((it) => it._id !== id);
        });
        return copy;
      });
      setClubEvents((prev) => prev.filter((it) => it._id !== id));
      if (editingEvent && editingEvent._id === id) cancelEdit();
    } catch (err) {
      console.error('Delete failed', err);
      alert(err.message || 'Failed to delete event');
    }
  };

  const selectClub = async (club) => {
    setSelectedClub(club);
    setClubEvents([]);
    setLoadingEvents(true);
    try {
      // prefer using client-side map if available
      if (eventsByClub && eventsByClub[club._id]) {
        setClubEvents(eventsByClub[club._id]);
      } else {
        // fetch club details (includes events) from server
        const res = await fetch(`http://localhost:4000/api/clubs/${club._id}`);
        const data = await res.json();
        setClubEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch club events', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  // when selecting a club from sidebar, switch to club view
  const selectClubAndView = async (club) => {
    await selectClub(club);
    setViewMode('club');
    // ensure club mode defaults to 'current'
    setShowClubMode((prev) => ({ ...prev, [club._id]: prev[club._id] || 'current' }));
  };

  const setClubMode = (clubId, mode) => {
    setShowClubMode((prev) => ({ ...prev, [clubId]: mode }));
  };

  const createEvent = async (e) => {
    e.preventDefault();
    if (!newTitle || !newClubId) return alert('Please provide at least a title and select a club');
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const form = new FormData();
      form.append('title', newTitle);
      form.append('description', newDescription);
      form.append('date', newDate || '');
      form.append('location', newLocation);
      form.append('clubId', newClubId);
      if (newImageFile) form.append('image', newImageFile);

      const res = await fetch('http://localhost:4000/api/events', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create event');
      }

      const created = await res.json();

      // update local lists
      setAllEvents((prev) => [created, ...prev]);
      setEventsByClub((prev) => {
        const copy = { ...prev };
        const cid = created.club?._id || created.club || newClubId;
        if (!copy[cid]) copy[cid] = [];
        copy[cid] = [created, ...copy[cid]];
        return copy;
      });

      // if currently viewing the club, add to clubEvents
      if (selectedClub && selectedClub._id === newClubId) {
        setClubEvents((prev) => [created, ...prev]);
      }

      // reset form
      setNewTitle('');
      setNewDescription('');
      setNewDate('');
      setNewLocation('');
      setNewImageFile(null);
      setNewImagePreview(null);
      setShowCreateForm(false);
    } catch (err) {
      console.error('Create event failed', err);
      alert(err.message || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const isUserSubscribed = (ev) => {
    if (!currentUser) return false;
    if (!ev) return false;
    const list = ev.registeredUsers || [];
    return list.some(u => (u && (u._id || u)).toString() === (currentUser._id || currentUser).toString());
  };

  const subscribeToEvent = async (ev) => {
    if (!currentUser) return alert('Please login to subscribe');
    setSubscribing(prev => ({ ...prev, [ev._id]: true }));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/events/${ev._id}/subscribe`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to subscribe');
      }
      const data = await res.json();
      // update local event with new registered count and push currentUser into its list
      const updatedEv = { ...ev };
      updatedEv.registeredUsers = updatedEv.registeredUsers || [];
      updatedEv.registeredUsers.push({ _id: currentUser._id, name: currentUser.name });
      // update lists
      setAllEvents(prev => prev.map(it => it._id === ev._id ? updatedEv : it));
      setEventsByClub(prev => {
        const copy = { ...prev };
        Object.keys(copy).forEach(k => { copy[k] = copy[k].map(it => it._id === ev._id ? updatedEv : it); });
        return copy;
      });
    } catch (err) {
      console.error('Subscribe failed', err);
      alert(err.message || 'Failed to subscribe');
    } finally {
      setSubscribing(prev => ({ ...prev, [ev._id]: false }));
    }
  };

  const unsubscribeFromEvent = async (ev) => {
    if (!currentUser) return alert('Please login to unsubscribe');
    setSubscribing(prev => ({ ...prev, [ev._id]: true }));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/events/${ev._id}/unsubscribe`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to unsubscribe');
      }
      const data = await res.json();
      const updatedEv = { ...ev };
      updatedEv.registeredUsers = (updatedEv.registeredUsers || []).filter(u => (u._id || u).toString() !== (currentUser._id || currentUser).toString());
      setAllEvents(prev => prev.map(it => it._id === ev._id ? updatedEv : it));
      setEventsByClub(prev => {
        const copy = { ...prev };
        Object.keys(copy).forEach(k => { copy[k] = copy[k].map(it => it._id === ev._id ? updatedEv : it); });
        return copy;
      });
    } catch (err) {
      console.error('Unsubscribe failed', err);
      alert(err.message || 'Failed to unsubscribe');
    } finally {
      setSubscribing(prev => ({ ...prev, [ev._id]: false }));
    }
  };

  return (
    <div className="events-container">
          <aside className="events-sidebar">
        <h3>Clubs</h3>
        {loadingClubs ? (
          <p>Loading clubs...</p>
        ) : (
          <ul className="clubs-list">
            {clubs.map((c) => (
              <li key={c._id} className={`club-item ${selectedClub && selectedClub._id === c._id ? 'active' : ''}`} onClick={() => selectClubAndView(c)}>
                <div className="club-name">{c.name} <span style={{fontSize:12, color:'#6b7280', marginLeft:8}}>({eventsByClub[c._id]?.length || 0})</span></div>
                {c.description && <div className="club-desc">{c.description}</div>}
              </li>
            ))}
          </ul>
        )}
      </aside>

      <main className="events-main">
        <div className="events-view-toggle">
          <button className={`btn-small ${viewMode === 'all' ? 'active' : ''}`} onClick={() => { setSelectedClub(null); setViewMode('all'); }}>All Events</button>
          <button className={`btn-small ${viewMode === 'past' ? 'active' : ''}`} onClick={() => { setSelectedClub(null); setViewMode('past'); }}>Past Events</button>
          {isAdmin && (
            <div style={{ marginLeft: 'auto' }}>
              <button
                className="btn"
                onClick={() => {
                  // if opening the form and a club is selected, default the club selector to that club
                  setShowCreateForm((s) => {
                    const opening = !s;
                    if (opening && selectedClub) setNewClubId(selectedClub._id);
                    return opening;
                  });
                }}
              >
                {showCreateForm ? 'Cancel' : 'Create Event'}
              </button>
            </div>
          )}
        </div>

        {showCreateForm && isAdmin && (
          <div className="create-event-form" style={{ marginBottom: 16, background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 2px 8px rgba(16,24,40,0.04)' }}>
            <h3 style={{ marginTop: 0 }}>Create Event</h3>
            <form onSubmit={createEvent}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 10 }}>
                <div>
                  <label>Title</label>
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="input" placeholder="Event title" required />
                </div>
                <div>
                  <label>Club</label>
                  <select value={newClubId} onChange={(e) => setNewClubId(e.target.value)} className="input">
                    {clubs.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Description</label>
                  <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="input" placeholder="Short description" />
                </div>
                <div>
                  <label>Date & time</label>
                  <input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="input" />
                </div>
                <div>
                  <label>Location</label>
                  <input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} className="input" placeholder="Location (TBD or room)" />
                </div>
                <div>
                  <label>Poster (optional)</label>
                  <input type="file" accept="image/*" onChange={(ev) => {
                    const f = ev.target.files && ev.target.files[0];
                    setNewImageFile(f || null);
                    setNewImagePreview(f ? URL.createObjectURL(f) : null);
                  }} className="input" />
                  {newImagePreview && (
                    <div style={{ marginTop: 8 }}>
                      <img src={newImagePreview} alt="preview" style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8 }} />
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <button className="btn" type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create Event'}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {editingEvent && (
          <Modal title="Edit Event" onClose={cancelEdit}>
            <form onSubmit={submitEdit} style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 10 }}>
                <div>
                  <label>Title</label>
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="input" placeholder="Event title" required />
                </div>
                <div>
                  <label>Club</label>
                  <select value={editClubId} onChange={(e) => setEditClubId(e.target.value)} className="input">
                    {clubs.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Description</label>
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="input" placeholder="Short description" />
                </div>
                <div>
                  <label>Date & time</label>
                  <input type="datetime-local" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="input" />
                </div>
                <div>
                  <label>Location</label>
                  <input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="input" placeholder="Location (TBD or room)" />
                </div>
                <div>
                  <label>Poster (optional)</label>
                  <input type="file" accept="image/*" onChange={(ev) => {
                    const f = ev.target.files && ev.target.files[0];
                    setEditImageFile(f || null);
                    setEditImagePreview(f ? URL.createObjectURL(f) : null);
                  }} className="input" />
                  {editImagePreview && (
                    <div style={{ marginTop: 8 }}>
                      <img src={editImagePreview} alt="preview" style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8 }} />
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn" type="submit" disabled={updating}>{updating ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" className="btn btn-ghost" onClick={cancelEdit}>Cancel</button>
              </div>
            </form>
          </Modal>
        )}

        {showConfirm && (
          <Modal title="Confirm" onClose={() => setShowConfirm(false)}>
            <div style={{ paddingBottom: 8 }}>{confirmMessage}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn btn-ghost" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn" onClick={() => performDelete(confirmTargetId)}>Delete</button>
            </div>
          </Modal>
        )}

        {viewMode === 'all' ? (
          <div>
            <h2>All Events</h2>
            {allEvents.length === 0 ? (
              <p>No events available.</p>
            ) : (
              <div>
                {/* Show upcoming events grouped by club */}
                {(() => {
                  const now = Date.now();
                  return clubs.map((club) => {
                    const clubEvents = (eventsByClub[club._id] || []);
                    const upcoming = clubEvents.filter(ev => !ev.date || Date.parse(ev.date) >= now);
                    if (!upcoming.length) return null;
                    return (
                      <section key={club._id} style={{ marginBottom: 18 }}>
                        <h3 style={{ marginBottom: 8 }}>{club.name} <small style={{ color:'#6b7280' }}>({upcoming.length})</small></h3>
                        <div className="events-grid">
                          {upcoming.map((ev) => (
                            <article key={ev._id} className="event-card">
                              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                {ev.image && (
                                  <img src={`http://localhost:4000/${ev.image}`} alt={ev.title} className="event-media" />
                                )}
                                <div style={{ flex: 1 }} className="event-body">
                                  <h3 className="event-title">{ev.title}</h3>
                                  <p className="event-desc">{ev.description}</p>
                                  <p className="event-meta"><strong>Date:</strong> {ev.date ? new Date(ev.date).toLocaleString() : 'TBD'}</p>
                                  <p className="event-meta"><strong>Location:</strong> {ev.location || 'TBD'}</p>
                                  <p className="event-meta"><strong>Registered:</strong> {ev.registeredUsers ? ev.registeredUsers.length : 0}</p>
                                  {currentUser ? (
                                    isUserSubscribed(ev) ? (
                                      <button className="btn-small" onClick={(e) => { e.stopPropagation(); unsubscribeFromEvent(ev); }} disabled={!!subscribing[ev._id]}>Unsubscribe</button>
                                    ) : (
                                      <button className="btn-small" onClick={(e) => { e.stopPropagation(); subscribeToEvent(ev); }} disabled={!!subscribing[ev._id]}>Subscribe</button>
                                    )
                                  ) : (
                                    <button className="btn-small" onClick={(e) => { e.stopPropagation(); alert('Please login to subscribe'); }}>Subscribe</button>
                                  )}
                                </div>
                                {isAdmin && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 12 }}>
                                    <button className="btn-small btn-edit" onClick={() => startEdit(ev)}>Edit</button>
                                    <button className="btn-small btn-delete" onClick={() => deleteEventStart(ev._id)}>Delete</button>
                                  </div>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>
                    );
                  });
                })()}

                {/* Upcoming events without a club */}
                {(() => {
                  const now = Date.now();
                  const noclubUpcoming = (eventsByClub['__noclub'] || []).filter(ev => !ev.date || Date.parse(ev.date) >= now);
                  if (!noclubUpcoming.length) return null;
                  return (
                    <section>
                      <h3>Other Events</h3>
                      <div className="events-grid">
                        {noclubUpcoming.map((ev) => (
                          <article key={ev._id} className="event-card">
                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                              {ev.image && (
                                <img src={`http://localhost:4000/${ev.image}`} alt={ev.title} className="event-media" />
                              )}
                              <div style={{ flex: 1 }} className="event-body">
                                <h3 className="event-title">{ev.title}</h3>
                                <p className="event-desc">{ev.description}</p>
                                <p className="event-meta"><strong>Date:</strong> {ev.date ? new Date(ev.date).toLocaleString() : 'TBD'}</p>
                                <p className="event-meta"><strong>Location:</strong> {ev.location || 'TBD'}</p>
                                <p className="event-meta"><strong>Registered:</strong> {ev.registeredUsers ? ev.registeredUsers.length : 0}</p>
                                {currentUser ? (
                                  isUserSubscribed(ev) ? (
                                    <button className="btn-small" onClick={(e) => { e.stopPropagation(); unsubscribeFromEvent(ev); }} disabled={!!subscribing[ev._id]}>Unsubscribe</button>
                                  ) : (
                                    <button className="btn-small" onClick={(e) => { e.stopPropagation(); subscribeToEvent(ev); }} disabled={!!subscribing[ev._id]}>Subscribe</button>
                                  )
                                ) : (
                                  <button className="btn-small" onClick={(e) => { e.stopPropagation(); alert('Please login to subscribe'); }}>Subscribe</button>
                                )}
                              </div>
                              {isAdmin && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 12 }}>
                                  <button className="btn-small btn-edit" onClick={() => startEdit(ev)}>Edit</button>
                                  <button className="btn-small btn-delete" onClick={() => deleteEventStart(ev._id)}>Delete</button>
                                </div>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  );
                })()}

              </div>
            )}
          </div>
        ) : viewMode === 'past' ? (
          <div>
            <h2>Past Events</h2>
            {(() => {
              const now = Date.now();
              // collect past events grouped by club
              const clubPastSections = clubs.map((club) => {
                const clubEvents = (eventsByClub[club._id] || []);
                const past = clubEvents.filter(ev => ev.date && Date.parse(ev.date) < now);
                if (!past.length) return null;
                return (
                  <section key={`past-${club._id}`} style={{ marginBottom: 18 }}>
                    <h3 style={{ marginBottom: 8 }}>{club.name} <small style={{ color:'#6b7280' }}>({past.length})</small></h3>
                    <div className="events-grid">
                      {past.map((ev) => (
                        <article key={ev._id} className="event-card">
                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            {ev.image && (
                              <img src={`http://localhost:4000/${ev.image}`} alt={ev.title} className="event-media" />
                            )}
                            <div style={{ flex: 1 }} className="event-body">
                              <h3 className="event-title">{ev.title}</h3>
                              <p className="event-desc">{ev.description}</p>
                              <p className="event-meta"><strong>Date:</strong> {ev.date ? new Date(ev.date).toLocaleString() : 'TBD'}</p>
                              <p className="event-meta"><strong>Location:</strong> {ev.location || 'TBD'}</p>
                              <p className="event-meta"><strong>Registered:</strong> {ev.registeredUsers ? ev.registeredUsers.length : 0}</p>
                              {currentUser ? (
                                isUserSubscribed(ev) ? (
                                  <button className="btn-small" onClick={(e) => { e.stopPropagation(); unsubscribeFromEvent(ev); }} disabled={!!subscribing[ev._id]}>Unsubscribe</button>
                                ) : (
                                  <button className="btn-small" onClick={(e) => { e.stopPropagation(); subscribeToEvent(ev); }} disabled={!!subscribing[ev._id]}>Subscribe</button>
                                )
                              ) : (
                                <button className="btn-small" onClick={(e) => { e.stopPropagation(); alert('Please login to subscribe'); }}>Subscribe</button>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              });

              // past events without club
              const noclubPast = (eventsByClub['__noclub'] || []).filter(ev => ev.date && Date.parse(ev.date) < now);

              const hasAnyPast = clubPastSections.some(Boolean) || noclubPast.length > 0;
              if (!hasAnyPast) return <p>No past events.</p>;

              return (
                <div>
                  {clubPastSections}
                  {noclubPast.length > 0 && (
                    <section>
                      <h3>Other Past Events</h3>
                      <div className="events-grid">
                        {noclubPast.map((ev) => (
                          <article key={ev._id} className="event-card">
                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                              {ev.image && (
                                <img src={`http://localhost:4000/${ev.image}`} alt={ev.title} className="event-media" />
                              )}
                              <div style={{ flex: 1 }} className="event-body">
                                <h3 className="event-title">{ev.title}</h3>
                                <p className="event-desc">{ev.description}</p>
                                <p className="event-meta"><strong>Date:</strong> {ev.date ? new Date(ev.date).toLocaleString() : 'TBD'}</p>
                                <p className="event-meta"><strong>Location:</strong> {ev.location || 'TBD'}</p>
                                <p className="event-meta"><strong>Registered:</strong> {ev.registeredUsers ? ev.registeredUsers.length : 0}</p>
                                {currentUser ? (
                                  isUserSubscribed(ev) ? (
                                    <button className="btn-small" onClick={(e) => { e.stopPropagation(); unsubscribeFromEvent(ev); }} disabled={!!subscribing[ev._id]}>Unsubscribe</button>
                                  ) : (
                                    <button className="btn-small" onClick={(e) => { e.stopPropagation(); subscribeToEvent(ev); }} disabled={!!subscribing[ev._id]}>Subscribe</button>
                                  )
                                ) : (
                                  <button className="btn-small" onClick={(e) => { e.stopPropagation(); alert('Please login to subscribe'); }}>Subscribe</button>
                                )}
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          !selectedClub ? (
            <div className="events-empty">Select a club to view its events</div>
          ) : (
            <div>
              <div className="club-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <h2>{selectedClub.name}</h2>
                  {selectedClub.description && <p className="club-desc-large">{selectedClub.description}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className={`btn-small ${ (showClubMode[selectedClub._id] || 'current') === 'current' ? 'active' : '' }`}
                      onClick={() => setClubMode(selectedClub._id, 'current')}
                    >
                      Current
                    </button>
                    <button
                      className={`btn-small ${ (showClubMode[selectedClub._id] || 'current') === 'past' ? 'active' : '' }`}
                      onClick={() => setClubMode(selectedClub._id, 'past')}
                    >
                      Past
                    </button>
                  </div>
                </div>
              </div>

              {loadingEvents ? (
                <p>Loading events...</p>
              ) : clubEvents.length === 0 ? (
                <p>No events scheduled for this club.</p>
              ) : (
                (() => {
                  const now = Date.now();
                  const upcoming = clubEvents.filter(ev => !ev.date || Date.parse(ev.date) >= now);
                  const past = clubEvents.filter(ev => ev.date && Date.parse(ev.date) < now);
                  const mode = (showClubMode[selectedClub._id] || 'current');

                  // Render only the section matching the selected club mode
                  if (mode === 'current') {
                    if (!upcoming.length) return <p>No upcoming events for this club.</p>;
                    return (
                      <div className="events-grid">
                        {upcoming.map((ev) => (
                          <article key={ev._id} className="event-card">
                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                              {ev.image && (
                                <img src={`http://localhost:4000/${ev.image}`} alt={ev.title} className="event-media" />
                              )}
                              <div style={{ flex: 1 }} className="event-body">
                                <h3 className="event-title">{ev.title}</h3>
                                <p className="event-desc">{ev.description}</p>
                                <p className="event-meta"><strong>Date:</strong> {ev.date ? new Date(ev.date).toLocaleString() : 'TBD'}</p>
                                <p className="event-meta"><strong>Location:</strong> {ev.location || 'TBD'}</p>
                                <p className="event-meta"><strong>Registered:</strong> {ev.registeredUsers ? ev.registeredUsers.length : 0}</p>
                                {currentUser ? (
                                  isUserSubscribed(ev) ? (
                                    <button className="btn-small" onClick={(e) => { e.stopPropagation(); unsubscribeFromEvent(ev); }} disabled={!!subscribing[ev._id]}>Unsubscribe</button>
                                  ) : (
                                    <button className="btn-small" onClick={(e) => { e.stopPropagation(); subscribeToEvent(ev); }} disabled={!!subscribing[ev._id]}>Subscribe</button>
                                  )
                                ) : (
                                  <button className="btn-small" onClick={(e) => { e.stopPropagation(); alert('Please login to subscribe'); }}>Subscribe</button>
                                )}
                              </div>
                              {isAdmin && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 12 }}>
                                  <button className="btn-small btn-edit" onClick={() => startEdit(ev)}>Edit</button>
                                  <button className="btn-small btn-delete" onClick={() => deleteEventStart(ev._id)}>Delete</button>
                                </div>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    );
                  }

                  // past mode
                  if (!past.length) return <p>No past events for this club.</p>;
                  return (
                    <div>
                      <h4 style={{ marginTop: 0, marginBottom: 12 }}>Past events</h4>
                      <div className="events-grid">
                        {past.map((ev) => (
                          <article key={ev._id} className="event-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                              <div style={{ flex: 1 }}>
                                <h3 className="event-title">{ev.title}</h3>
                                <p className="event-desc">{ev.description}</p>
                                <p className="event-meta"><strong>Date:</strong> {ev.date ? new Date(ev.date).toLocaleString() : 'TBD'}</p>
                                <p className="event-meta"><strong>Location:</strong> {ev.location || 'TBD'}</p>
                                <p className="event-meta"><strong>Registered:</strong> {ev.registeredUsers ? ev.registeredUsers.length : 0}</p>
                                {currentUser ? (
                                  isUserSubscribed(ev) ? (
                                    <button className="btn-small" onClick={(e) => { e.stopPropagation(); unsubscribeFromEvent(ev); }} disabled={!!subscribing[ev._id]}>Unsubscribe</button>
                                  ) : (
                                    <button className="btn-small" onClick={(e) => { e.stopPropagation(); subscribeToEvent(ev); }} disabled={!!subscribing[ev._id]}>Subscribe</button>
                                  )
                                ) : (
                                  <button className="btn-small" onClick={(e) => { e.stopPropagation(); alert('Please login to subscribe'); }}>Subscribe</button>
                                )}
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default Events;
