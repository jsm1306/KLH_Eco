import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Modal from './Modal.js';
import '../index.css';
import { useToast } from './ToastContext';
import { useNavigate, useLocation } from 'react-router-dom';
import API_BASE from '../api/base';
import { getImageUrl } from '../utils/imageHelper';

const LostFound = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ tag: '', location: '', description: '', image: null });
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTag, setSelectedTag] = useState('All');
  const [currentUser, setCurrentUser] = useState(null);
  const [claimModal, setClaimModal] = useState({ open: false, item: null });
  const [claimMessage, setClaimMessage] = useState('');
  const [claims, setClaims] = useState({});
  const [claimsModal, setClaimsModal] = useState({ open: false, item: null });
  const [claimedItems, setClaimedItems] = useState(new Set());
  const [showPostForm, setShowPostForm] = useState(false);

  const getAxiosConfig = () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) return { headers: { Authorization: `Bearer ${storedToken}` } };
    return { withCredentials: true };
  };

  const fetchCurrentUser = useCallback(async () => {
    try {
    const cfg = getAxiosConfig();
  const res = await axios.get(`${API_BASE}/auth/current_user`, cfg);
      setCurrentUser(res.data);
    } catch (err) {
      console.error('Failed to fetch current user', err);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
    const cfg = getAxiosConfig();
  const res = await axios.get(`${API_BASE}/api/lostfound`, cfg);
      setItems(res.data || []);
    } catch (err) {
      console.error('Failed to fetch lost & found items', err);
      setError('Failed to load items');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchCurrentUser();
  }, [fetchItems, fetchCurrentUser]);

  // unique tags for filter dropdown (case-insensitive)
  const tagOptions = React.useMemo(() => {
    const setTags = new Set();
    items.forEach((it) => {
      if (it.tag) setTags.add(String(it.tag).trim());
    });
    return ['All', ...Array.from(setTags).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filteredItems = React.useMemo(() => {
    if (!selectedTag || selectedTag === 'All') return items;
    const s = selectedTag.toLowerCase();
    return items.filter((it) => String(it.tag || '').toLowerCase() === s);
  }, [items, selectedTag]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsPosting(true);
    setError(null);
    const formData = new FormData();
    formData.append('tag', form.tag);
    formData.append('location', form.location);
    formData.append('description', form.description);
    if (form.image) formData.append('image', form.image);

    try {
      const cfg = getAxiosConfig();
      // ensure multipart handled correctly
  await axios.post(`${API_BASE}/api/lostfound`, formData, {
        ...cfg,
        headers: { ...(cfg.headers || {}), 'Content-Type': 'multipart/form-data' },
      });
      setForm({ tag: '', location: '', description: '', image: null });
      setPreview(null);
      setShowPostForm(false);
      await fetchItems();
    } catch (err) {
      console.error('Post failed', err);
      setError('Failed to post item');
    } finally {
      setIsPosting(false);
    }
  };

  const handleChange = (e) => {
    if (e.target.name === 'image') {
      const file = e.target.files[0];
      setForm({ ...form, image: file });
      if (file) {
        const url = URL.createObjectURL(file);
        setPreview(url);
      } else {
        setPreview(null);
      }
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimModal.item || !claimMessage.trim()) return;
    try {
      const cfg = getAxiosConfig();
  await axios.post(`${API_BASE}/api/lostfound/${claimModal.item._id}/claim`, { message: claimMessage }, cfg);
      setClaimedItems(prev => new Set([...prev, claimModal.item._id]));
      setClaimModal({ open: false, item: null });
      setClaimMessage('');
      toast.addToast('Claim submitted successfully!', 'success', 4000);
    } catch (err) {
      console.error('Claim failed', err);
      toast.addToast('Failed to submit claim', 'error', 5000);
    }
  };

  const handleVerifyClaim = async (claimId, status) => {
    if (!claimsModal.item) return;
    try {
      const cfg = getAxiosConfig();
  await axios.put(`${API_BASE}/api/lostfound/${claimsModal.item._id}/claim/${claimId}/verify`, { status }, cfg);
      setClaimsModal({ open: false, item: null });
      await fetchItems(); // Refresh items to remove approved item
      toast.addToast(`Claim ${status} successfully!`, 'success', 4000);
    } catch (err) {
      console.error('Verify claim failed', err);
      toast.addToast('Failed to verify claim', 'error', 5000);
    }
  };

  const fetchClaims = async (itemId) => {
    try {
      const cfg = getAxiosConfig();
  const res = await axios.get(`${API_BASE}/api/lostfound/${itemId}/claims`, cfg);
      setClaims(prev => ({ ...prev, [itemId]: res.data }));
    } catch (err) {
      console.error('Failed to fetch claims', err);
    }
  };

  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleOpenPost = () => {
    if (currentUser) {
      setShowPostForm(true);
    } else {
      // ask user to login first
      toast.addToast('Please login to post an item', 'warning', 4000);
      navigate('/login', { state: { from: location.pathname } });
    }
  };

  return (
    <div className="lostfound-container">
      {/* Main content - Posted Items */}
      <div className="lf-main-content">
        <div className="lf-header">
          <h2>Lost & Found Items</h2>
          <button className="btn-primary btn-post-item" onClick={handleOpenPost}>
            + Post an Item
          </button>
        </div>

        {isLoading ? (
          <p>Loading items...</p>
        ) : items.length === 0 ? (
          <div className="lf-empty-state">
            <p>No items posted yet.</p>
            <button className="btn-primary" onClick={handleOpenPost}>Post the first item</button>
          </div>
        ) : (
          <>
            <div className="lf-filter-bar">
              <label>
                Filter by tag:
                <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)}>
                  {tagOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <button className="btn-secondary" onClick={() => setSelectedTag('All')}>Clear</button>
            </div>

            <div className="lf-grid">
              {filteredItems.map((item) => (
                <article key={item._id} className="lf-card">
                  {item.image && <img className="lf-image" src={getImageUrl(item.image)} alt={item.tag} />}
                  <div className="lf-card-body">
                    <h3 className="lf-tag">{item.tag}</h3>
                    <p className="lf-desc">{item.description}</p>
                    <p className="lf-meta"><strong>Location:</strong> {item.location}</p>
                    <p className="lf-meta"><strong>Posted by:</strong> {item.user?.name} ({item.user?.mail})</p>
                    <p className="lf-meta"><small>{new Date(item.createdAt).toLocaleString()}</small></p>
                    <div className="lf-actions">
                      {currentUser && item.user._id !== currentUser._id && !claimedItems.has(item._id) && (
                        <button className="btn-secondary" onClick={() => setClaimModal({ open: true, item })}>Claim Item</button>
                      )}
                      {currentUser && item.user._id !== currentUser._id && claimedItems.has(item._id) && (
                        <button className="btn-secondary" disabled>Claim Submitted</button>
                      )}
                      {currentUser && item.user._id === currentUser._id && (
                        <button className="btn-secondary" onClick={() => { setClaimsModal({ open: true, item }); fetchClaims(item._id); }}>View Claims</button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Post Item Modal */}
      {showPostForm && (
        <Modal title="Post an Item" onClose={() => setShowPostForm(false)}>
          <form className="lf-form" onSubmit={handleSubmit}>
            <label>
              Tag
              <select name="tag" value={form.tag} onChange={handleChange} required>
                <option value="">Select Tag</option>
                <option value="Watch">Watch</option>
                <option value="Ear Pods">Ear Pods</option>
                <option value="Ear Phones">Ear Phones</option>
                <option value="id card">ID Card</option>
                <option value="laptop">Laptop</option>
                <option value="charger">Charger</option>
                <option value="others">Others</option>
              </select>
            </label>

            <label>
              Location
              <input type="text" name="location" placeholder="Location found" value={form.location} onChange={handleChange} required />
            </label>

            <label>
              Description
              <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} required />
            </label>

            <label className="file-input">
              Photo (optional)
              <input type="file" name="image" accept="image/*" onChange={handleChange} />
            </label>

            {preview && (
              <div className="preview">
                <img src={preview} alt="preview" />
              </div>
            )}

            <div className="modal-footer">
              <button type="submit" className="btn-primary" disabled={isPosting}>{isPosting ? 'Posting...' : 'Post Item'}</button>
              <button type="button" className="btn-secondary" onClick={() => { setForm({ tag: '', location: '', description: '', image: null }); setPreview(null); setShowPostForm(false); }}>Cancel</button>
            </div>
            {error && <p className="error">{error}</p>}
          </form>
        </Modal>
      )}

      {/* Claim Modal */}
      {claimModal.open && (
        <Modal title="Claim Item" onClose={() => setClaimModal({ open: false, item: null })}>
          <form onSubmit={handleClaimSubmit}>
            <label>
              Claim Message
              <textarea
                value={claimMessage}
                onChange={(e) => setClaimMessage(e.target.value)}
                placeholder="Describe why this item belongs to you..."
                required
              />
            </label>
            <div className="modal-footer">
              <button type="submit" className="btn-primary">Submit Claim</button>
              <button type="button" className="btn-secondary" onClick={() => setClaimModal({ open: false, item: null })}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Claims Modal */}
      {claimsModal.open && (
        <Modal title="Claims for Item" onClose={() => setClaimsModal({ open: false, item: null })}>
          {claims[claimsModal.item._id]?.length > 0 ? (
            claims[claimsModal.item._id].map((claim) => (
              <div key={claim._id} className="claim-item">
                <p><strong>Claimant:</strong> {claim.claimant.name} ({claim.claimant.mail})</p>
                <p><strong>Message:</strong> {claim.message}</p>
                <p><strong>Status:</strong> {claim.status}</p>
                <p><small>{new Date(claim.createdAt).toLocaleString()}</small></p>
                {claim.status === 'pending' && (
                  <div>
                    <button className="btn-primary" onClick={() => handleVerifyClaim(claim._id, 'approved')}>Approve</button>
                    <button className="btn-secondary" onClick={() => handleVerifyClaim(claim._id, 'rejected')}>Reject</button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>No claims yet.</p>
          )}
        </Modal>
      )}
    </div>
  );
};

export default LostFound;
