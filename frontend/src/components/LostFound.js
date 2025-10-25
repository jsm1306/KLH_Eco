import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LostFound = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ tag: '', location: '', description: '', image: null });
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTag, setSelectedTag] = useState('All');

  useEffect(() => {
    fetchItems();
  }, []);

  const getAxiosConfig = () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) return { headers: { Authorization: `Bearer ${storedToken}` } };
    return { withCredentials: true };
  };

  const fetchItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const cfg = getAxiosConfig();
      const res = await axios.get('http://localhost:4000/api/lostfound', cfg);
      setItems(res.data || []);
    } catch (err) {
      console.error('Failed to fetch lostfound items', err);
      setError('Failed to load items');
    } finally {
      setIsLoading(false);
    }
  };

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
      await axios.post('http://localhost:4000/api/lostfound', formData, {
        ...cfg,
        headers: { ...(cfg.headers || {}), 'Content-Type': 'multipart/form-data' },
      });
      setForm({ tag: '', location: '', description: '', image: null });
      setPreview(null);
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

  return (
    <div className="lostfound-container">
      <div className="lf-left">
        <h2>Post an item</h2>
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

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isPosting}>{isPosting ? 'Posting...' : 'Post Item'}</button>
            <button type="button" className="btn-secondary" onClick={() => { setForm({ tag: '', location: '', description: '', image: null }); setPreview(null); }}>Reset</button>
          </div>
          {error && <p className="error">{error}</p>}
        </form>
      </div>

      <div className="lf-right">
        <h2>Posted Items</h2>
        {isLoading ? (
          <p>Loading items...</p>
        ) : items.length === 0 ? (
          <p>No items posted yet.</p>
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
                  {item.image && <img className="lf-image" src={`http://localhost:4000/${item.image}`} alt={item.tag} />}
                  <div className="lf-card-body">
                    <h3 className="lf-tag">{item.tag}</h3>
                    <p className="lf-desc">{item.description}</p>
                    <p className="lf-meta"><strong>Location:</strong> {item.location}</p>
                    <p className="lf-meta"><strong>Posted by:</strong> {item.user?.name} ({item.user?.mail})</p>
                    <p className="lf-meta"><small>{new Date(item.createdAt).toLocaleString()}</small></p>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LostFound;
