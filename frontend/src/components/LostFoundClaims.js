import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext';
import '../index.css';

const LostFoundClaims = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/lostfound/${id}/claims`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
      });
      if (res.status === 403) {
        setError('Not authorized to view claims for this item');
        setClaims([]);
      } else if (!res.ok) {
        setError('Failed to load claims');
      } else {
        const data = await res.json();
        setClaims(data);
      }
    } catch (err) {
      setError('Server error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleVerify = async (claimId, status) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/lostfound/${id}/claim/${claimId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const txt = await res.text();
        toast.addToast('Failed: ' + txt, 'error', 5000);
        return;
      }
      const json = await res.json();
      toast.addToast(json.message || 'Updated', 'success', 4000);
      // if approved the item might be deleted; go back to lostfound listing
      if (status === 'approved') {
        navigate('/lostfound');
        return;
      }
      // otherwise refresh claims
      load();
    } catch (err) {
      console.error(err);
      toast.addToast('Failed to update claim', 'error', 5000);
    }
  };

  const toast = useToast();

  return (
    <div className="app-content page-bg">
      <div style={{ maxWidth: 1000, margin: '20px auto' }}>
        <h2 style={{ color: 'var(--c4)' }}>Claims for item</h2>
        {loading && <div>Loading...</div>}
        {error && <div style={{ color: 'var(--c4)' }}>{error}</div>}
        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {claims.length === 0 && <div className="note-empty">No claims yet.</div>}
            {claims.map((claim) => (
              <div key={claim._id} className="claim-item" style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                <p><strong>Claimant:</strong> {claim.claimant?.name} ({claim.claimant?.mail})</p>
                <p><strong>Message:</strong> {claim.message}</p>
                <p><strong>Status:</strong> {claim.status}</p>
                <p><small>{new Date(claim.createdAt).toLocaleString()}</small></p>
                {claim.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="btn-primary" onClick={() => handleVerify(claim._id, 'approved')}>Approve</button>
                    <button className="btn-secondary" onClick={() => handleVerify(claim._id, 'rejected')}>Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LostFoundClaims;
