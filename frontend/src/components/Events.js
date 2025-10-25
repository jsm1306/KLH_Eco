import React, { useEffect, useState } from 'react';
import Modal from './Modal';

const Events = () => {
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [clubEvents, setClubEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [eventsByClub, setEventsByClub] = useState({});
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'club'
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  // Create event form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newClubId, setNewClubId] = useState('');
  const [creating, setCreating] = useState(false);
  // Edit / Delete state
  const [editingEvent, setEditingEvent] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editClubId, setEditClubId] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchClubs();
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
      const payload = {
        title: editTitle,
        description: editDescription,
        date: editDate || null,
        location: editLocation,
        club: editClubId,
      };

      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/events/${editingEvent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
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

  const createEvent = async (e) => {
    e.preventDefault();
    if (!newTitle || !newClubId) return alert('Please provide at least a title and select a club');
    setCreating(true);
    try {
      const payload = {
        title: newTitle,
        description: newDescription,
        date: newDate || null,
        location: newLocation,
        clubId: newClubId,
      };

      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
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
      setShowCreateForm(false);
    } catch (err) {
      console.error('Create event failed', err);
      alert(err.message || 'Failed to create event');
    } finally {
      setCreating(false);
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
              <li key={c._id} className={`club-item ${selectedClub && selectedClub._id === c._id ? 'active' : ''}`} onClick={() => selectClub(c)}>
                <div className="club-name">{c.name} <span style={{fontSize:12, color:'#6b7280', marginLeft:8}}>({eventsByClub[c._id]?.length || 0})</span></div>
                {c.description && <div className="club-desc">{c.description}</div>}
              </li>
            ))}
          </ul>
        )}
      </aside>

      <main className="events-main">
        <div className="events-view-toggle">
          <button className={`btn-small ${viewMode === 'all' ? 'active' : ''}`} onClick={() => setViewMode('all')}>All Events</button>
          <button className={`btn-small ${viewMode === 'club' ? 'active' : ''}`} onClick={() => setViewMode('club')}>By Club</button>
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
        </div>

        {showCreateForm && (
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
                {/* Group events by club using clubs array order */}
                {clubs.map((club) => (
                  <section key={club._id} style={{ marginBottom: 18 }}>
                    <h3 style={{ marginBottom: 8 }}>{club.name} <small style={{ color:'#6b7280' }}>({eventsByClub[club._id]?.length || 0})</small></h3>
                    <div className="events-grid">
                      {(eventsByClub[club._id] || []).map((ev) => (
                        <article key={ev._id} className="event-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <div style={{ flex: 1 }}>
                              <h3 className="event-title">{ev.title}</h3>
                              <p className="event-desc">{ev.description}</p>
                              <p className="event-meta"><strong>Date:</strong> {ev.date ? new Date(ev.date).toLocaleString() : 'TBD'}</p>
                              <p className="event-meta"><strong>Location:</strong> {ev.location || 'TBD'}</p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 12 }}>
                              <button className="btn-small btn-edit" onClick={() => startEdit(ev)}>Edit</button>
                              <button className="btn-small btn-delete" onClick={() => deleteEventStart(ev._id)}>Delete</button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}

                {/* Events without a club */}
                {(eventsByClub['__noclub'] || []).length > 0 && (
                  <section>
                    <h3>Other Events</h3>
                    <div className="events-grid">
                      {(eventsByClub['__noclub'] || []).map((ev) => (
                        <article key={ev._id} className="event-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <div style={{ flex: 1 }}>
                              <h3 className="event-title">{ev.title}</h3>
                              <p className="event-desc">{ev.description}</p>
                              <p className="event-meta"><strong>Date:</strong> {ev.date ? new Date(ev.date).toLocaleString() : 'TBD'}</p>
                              <p className="event-meta"><strong>Location:</strong> {ev.location || 'TBD'}</p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 12 }}>
                              <button className="btn-small btn-edit" onClick={() => startEdit(ev)}>Edit</button>
                              <button className="btn-small btn-delete" onClick={() => deleteEventStart(ev._id)}>Delete</button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        ) : (
          !selectedClub ? (
            <div className="events-empty">Select a club to view its events</div>
          ) : (
            <div>
              <div className="club-header">
                <h2>{selectedClub.name}</h2>
                {selectedClub.description && <p className="club-desc-large">{selectedClub.description}</p>}
              </div>

              {loadingEvents ? (
                <p>Loading events...</p>
              ) : clubEvents.length === 0 ? (
                <p>No events scheduled for this club.</p>
              ) : (
                <div className="events-grid">
                  {clubEvents.map((ev) => (
                    <article key={ev._id} className="event-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <h3 className="event-title">{ev.title}</h3>
                          <p className="event-desc">{ev.description}</p>
                          <p className="event-meta"><strong>Date:</strong> {ev.date ? new Date(ev.date).toLocaleString() : 'TBD'}</p>
                          <p className="event-meta"><strong>Location:</strong> {ev.location || 'TBD'}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 12 }}>
                          <button className="btn-small btn-edit" onClick={() => startEdit(ev)}>Edit</button>
                          <button className="btn-small btn-delete" onClick={() => deleteEventStart(ev._id)}>Delete</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default Events;
