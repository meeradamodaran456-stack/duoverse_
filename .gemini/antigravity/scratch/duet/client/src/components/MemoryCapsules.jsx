import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Plus, Clock, Key } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function MemoryCapsules({ user, BACKEND_URL }) {
  const [capsules, setCapsules] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const { announce } = useAccessibility();

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [unlockDate, setUnlockDate] = useState('');

  useEffect(() => {
    fetchCapsules();
  }, []);

  const fetchCapsules = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/capsules`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setCapsules(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCapsule = async (e) => {
    e.preventDefault();
    if (!title || !message || !unlockDate) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/capsules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title, message, unlockDate })
      });
      
      if (res.ok) {
        announce('Memory capsule sealed!');
        fetchCapsules();
        setShowAddModal(false);
        setTitle('');
        setMessage('');
        setUnlockDate('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={20} color="var(--primary)" />
          <span>Time Capsules</span>
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-secondary focus-ring"
          style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> Seal New Capsule
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
        {capsules.map(cap => {
           const locked = cap.isLocked;
           return (
             <div key={cap.id} className="glass-panel" style={{ padding: '20px', borderRadius: '16px', position: 'relative', overflow: 'hidden', border: locked ? '1px dashed var(--border-color)' : '1px solid var(--primary)' }}>
               {locked && (
                 <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
                   <Lock size={120} />
                 </div>
               )}
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                 <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{cap.title}</h4>
                 {locked ? <Lock size={16} color="var(--text-muted)" /> : <Unlock size={16} color="var(--success)" />}
               </div>
               
               {locked ? (
                 <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                   <p style={{ margin: '0 0 8px 0', fontStyle: 'italic' }}>{cap.message}</p>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontWeight: 'bold' }}>
                     <Key size={14} /> Unlocks {new Date(cap.unlockDate).toLocaleDateString()}
                   </div>
                 </div>
               ) : (
                 <div style={{ fontSize: '0.9rem' }}>
                   <p style={{ margin: '0 0 12px 0', lineHeight: 1.5 }}>{cap.message}</p>
                   <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Unlocked on {new Date(cap.unlockDate).toLocaleDateString()}</span>
                 </div>
               )}
             </div>
           );
        })}
        {capsules.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', padding: '20px' }}>
            No time capsules created yet.
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="call-overlay" onClick={() => setShowAddModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="auth-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>Seal a Time Capsule</h3>
            <form onSubmit={handleCreateCapsule} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>Capsule Title</label>
                <input
                  type="text"
                  className="input-field focus-ring"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Letter to our future selves..."
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>Secret Message</label>
                <textarea
                  className="input-field focus-ring"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Write your note. It will be hidden until the date arrives."
                  rows={4}
                  style={{ resize: 'vertical' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>Unlock Date</label>
                <input
                  type="date"
                  className="input-field focus-ring"
                  value={unlockDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setUnlockDate(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary focus-ring" style={{ marginTop: '8px' }}>
                <Lock size={16} /> Seal Capsule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
