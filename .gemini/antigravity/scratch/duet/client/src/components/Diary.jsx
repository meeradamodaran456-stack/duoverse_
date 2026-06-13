import React, { useState, useEffect } from 'react';
import { BookOpen, Lock, Globe, Plus, Trash2 } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

const MOODS = ['😊','😍','😴','😢','😡','🥰','🤩','😤'];

export default function Diary({ user, partner, BACKEND_URL }) {
  const { announce } = useAccessibility();
  const [entries, setEntries]   = useState([]);
  const [tab, setTab]           = useState('shared');
  const [showForm, setShowForm] = useState(false);
  const [content, setContent]   = useState('');
  const [mood, setMood]         = useState('😊');
  const [date, setDate]         = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => { fetchEntries(); }, []);

  const fetchEntries = async () => {
    try {
      const res  = await fetch(`${BACKEND_URL}/api/diary`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setEntries(data);
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/diary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ content, mood, isPrivate: tab === 'private', date })
      });
      if (res.ok) {
        setContent(''); setMood('😊'); setShowForm(false);
        announce('Diary entry saved!');
        fetchEntries();
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this diary entry?')) return;
    await fetch(`${BACKEND_URL}/api/diary/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    fetchEntries();
  };

  const filtered = entries.filter(e =>
    tab === 'private' ? (e.isPrivate && e.userId === user.id) : !e.isPrivate
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen size={24} color="var(--primary)" /> Our Journal
        </h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary focus-ring" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px' }}>
          <Plus size={16} /> New Entry
        </button>
      </div>

      <div className="tools-nav">
        {[{key:'shared',label:'💑 Shared Diary'},{key:'private',label:'🔒 My Journal'}].map(t => (
          <button key={t.key} className={`tools-nav-btn focus-ring ${tab===t.key?'active':''}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {showForm && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '600' }}>{tab === 'private' ? '🔒 Private Entry' : '💑 Shared Entry'}</span>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field focus-ring" style={{ padding: '6px 10px', width: 'auto' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {MOODS.map(m => (
                <button key={m} type="button" onClick={() => setMood(m)}
                  style={{ fontSize: '1.4rem', background: 'none', cursor: 'pointer', border: mood===m ? '2px solid var(--primary)' : '2px solid transparent', borderRadius: '10px', padding: '3px' }}>
                  {m}
                </button>
              ))}
            </div>
            <textarea className="input-field focus-ring" value={content} onChange={e => setContent(e.target.value)}
              placeholder="Write what's on your heart today…" rows={5} style={{ resize: 'vertical', lineHeight: 1.6 }} required />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary focus-ring" style={{ padding: '10px 20px' }}>Cancel</button>
              <button type="submit" className="btn-primary focus-ring" disabled={loading} style={{ padding: '10px 24px' }}>{loading ? 'Saving…' : 'Save Entry'}</button>
            </div>
          </form>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '10px' }}>
          <span style={{ fontSize: '3rem' }}>{tab === 'private' ? '🔒' : '📖'}</span>
          <span>{tab === 'private' ? 'Your private journal is empty.' : 'No shared entries yet. Start writing!'}</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map(entry => {
            const isMine = entry.userId === user.id;
            return (
              <article key={entry.id} className="glass-panel" style={{ padding: '20px', borderRadius: '16px', borderLeft: `3px solid ${isMine ? 'var(--primary)' : 'var(--accent)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.6rem' }}>{entry.mood || '📝'}</span>
                    <div>
                      <span style={{ fontWeight: '600', display: 'block', fontSize: '0.85rem', color: isMine ? 'var(--primary-light)' : 'var(--accent-light)' }}>
                        {isMine ? 'You' : (partner?.name || 'Partner')}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  {isMine && (
                    <button onClick={() => handleDelete(entry.id)} className="focus-ring"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <p style={{ margin: 0, lineHeight: 1.7, fontSize: '0.92rem', whiteSpace: 'pre-wrap' }}>{entry.content}</p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
