import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../api/base';
import ImageWithFallback from './ImageWithFallback';
import Modal from './Modal';
import { useToast } from './ToastContext';
import '../styles/LostFoundNew.css';

const LostFoundNew = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState('All');
  
  // Post item modal state
  const [showPostModal, setShowPostModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [posting, setPosting] = useState(false);

  // Claim item modal state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimingItemId, setClaimingItemId] = useState(null);
  const [claimMessage, setClaimMessage] = useState('');
  const [claiming, setClaiming] = useState(false);

  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
    fetchItems();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...items];

    if (filterTag !== 'All') {
      filtered = filtered.filter(item => 
        item.tag?.toLowerCase() === filterTag.toLowerCase()
      );
    }

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setFilteredItems(filtered);
  }, [items, filterTag]);

  useEffect(() => {
    applyFilters();
  }, [items, filterTag, applyFilters]);

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

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/lostfound`);
      const data = await res.json();
      setItems(data || []);
    } catch (err) {
      // Error silently handled
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterTag('All');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostItem = async (e) => {
    e.preventDefault();
    if (!newTag || !newLocation || !newDescription) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    setPosting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('tag', newTag);
      formData.append('location', newLocation);
      formData.append('description', newDescription);
      if (newImageFile) {
        formData.append('image', newImageFile);
      }

      const res = await fetch(`${API_BASE}/api/lostfound`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        setShowPostModal(false);
        resetForm();
        fetchItems();
        addToast('Item posted successfully!', 'success');
      } else {
        addToast('Failed to post item', 'error');
      }
    } catch (err) {
      addToast('Failed to post item', 'error');
    } finally {
      setPosting(false);
    }
  };

  const resetForm = () => {
    setNewTag('');
    setNewLocation('');
    setNewDescription('');
    setNewImageFile(null);
    setNewImagePreview(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewClaims = (itemId) => {
    navigate(`/lostfound/${itemId}/claims`);
  };

  const openClaimModal = (itemId) => {
    setClaimingItemId(itemId);
    setShowClaimModal(true);
  };

  const handleClaimItem = async (e) => {
    e.preventDefault();
    if (!claimMessage.trim()) {
      addToast('Please provide a message explaining why this item is yours', 'error');
      return;
    }

    setClaiming(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/lostfound/${claimingItemId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: claimMessage })
      });

      if (res.ok) {
        setShowClaimModal(false);
        setClaimMessage('');
        setClaimingItemId(null);
        addToast('Claim submitted successfully! The poster will review your claim.', 'success');
        fetchItems(); // Refresh to show updated claim count
      } else {
        const error = await res.json();
        addToast(error.error || 'Failed to submit claim', 'error');
      }
    } catch (err) {
      addToast('Failed to submit claim', 'error');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="lostfound-page-container">
      {/* Header Section */}
      <div className="lostfound-page-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="lostfound-page-title">Lost & Found Items</h1>
            <p className="lostfound-page-subtitle">
              Help reunite lost items with their owners. Browse found items or report something you've found on campus.
            </p>
          </div>
          {currentUser && (
            <button 
              className="post-item-btn"
              onClick={() => setShowPostModal(true)}
            >
              + Post an Item
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">Filter by Category:</label>
          <select 
            className="filter-select"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="id card">ID Cards</option>
            <option value="electronics">Electronics</option>
            <option value="books">Books</option>
            <option value="others">Others</option>
          </select>
        </div>

        {filterTag !== 'All' && (
          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        )}

        <div className="results-count">
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="lostfound-loading">Loading items...</div>
      ) : filteredItems.length === 0 ? (
        <div className="lostfound-empty">
          <p>No items found matching your criteria</p>
        </div>
      ) : (
        <div className="lostfound-grid-new">
          {filteredItems.map((item) => (
            <article key={item._id} className="lostfound-card-new">
              {item.image && (
                <div className="lostfound-image-wrapper">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.tag}
                    className="lostfound-image-new"
                  />
                </div>
              )}

              <div className="lostfound-card-body">
                <div className="item-category-badge">
                  {item.tag || 'Uncategorized'}
                </div>

                <p className="item-description">{item.description}</p>

                <div className="item-details">
                  <div className="detail-row">
                    <span className="detail-icon">📍</span>
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{item.location}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">👤</span>
                    <span className="detail-label">Posted by:</span>
                    <span className="detail-value">
                      {item.user?.name || 'Anonymous'}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">📅</span>
                    <span className="detail-label">Posted:</span>
                    <span className="detail-value">{formatDate(item.createdAt)}</span>
                  </div>

                  {item.claims && item.claims.length > 0 && (
                    <div className="detail-row">
                      <span className="detail-icon">📋</span>
                      <span className="detail-label">Claims:</span>
                      <span className="detail-value claims-count">
                        {item.claims.length} pending
                      </span>
                    </div>
                  )}
                </div>

                {currentUser && currentUser._id === item.user?._id ? (
                  <button
                    className="view-claims-btn"
                    onClick={() => handleViewClaims(item._id)}
                  >
                    View Claims ({item.claims?.length || 0})
                  </button>
                ) : currentUser && (
                  <button
                    className="view-claims-btn claim-item-btn"
                    onClick={() => openClaimModal(item._id)}
                  >
                    🔔 Claim This Item
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Claim Item Modal */}
      {showClaimModal && (
        <Modal onClose={() => {
          setShowClaimModal(false);
          setClaimMessage('');
          setClaimingItemId(null);
        }}>
          <div className="post-item-modal">
            <h2>Claim This Item</h2>
            <p style={{ color: 'var(--neon-light-gray)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Please explain why you believe this item belongs to you. The poster will review your claim and contact you if approved.
            </p>
            <form onSubmit={handleClaimItem}>
              <div className="form-group">
                <label>Your Message *</label>
                <textarea
                  placeholder="Describe the item or provide proof of ownership (e.g., 'This is my blue notebook with my name on page 1', 'My ID card number is 12345', etc.)"
                  value={claimMessage}
                  onChange={(e) => setClaimMessage(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowClaimModal(false);
                    setClaimMessage('');
                    setClaimingItemId(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={claiming}
                >
                  {claiming ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Post Item Modal */}
      {showPostModal && (
        <Modal onClose={() => {
          setShowPostModal(false);
          resetForm();
        }}>
          <div className="post-item-modal">
            <h2>Post a Found Item</h2>
            <form onSubmit={handlePostItem}>
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  required
                >
                  <option value="">Select category</option>
                  <option value="id card">ID Card</option>
                  <option value="electronics">Electronics</option>
                  <option value="books">Books</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div className="form-group">
                <label>Location Found *</label>
                <input
                  type="text"
                  placeholder="e.g., Library 3rd Floor"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  placeholder="Describe the item in detail..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="form-group">
                <label>Upload Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {newImagePreview && (
                  <div className="image-preview">
                    <img src={newImagePreview} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowPostModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={posting}
                >
                  {posting ? 'Posting...' : 'Post Item'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LostFoundNew;
