import React, { useState, useEffect } from 'react';
import { CheckSquare, Calendar, Bookmark, Plus, Trash2, Check } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function Tools({ user, BACKEND_URL }) {
  const { announce } = useAccessibility();
  const [tab, setTab]               = useState('tasks');
  const [tasks, setTasks]           = useState([]);
  const [events, setEvents]         = useState([]);
  const [bookmarks, setBookmarks]   = useState([]);
  const [newTitle, setNewTitle]      = useState('');
  const [newCategory, setNewCategory] = useState('TASK');
  const [newDate, setNewDate]        = useState('');
  const [newUrl, setNewUrl]          = useState('');
  const [newContent, setNewContent]  = useState('');

  useEffect(() => {
    fetchTasks(); fetchEvents(); fetchBookmarks();
  }, []);

  const api = (path, opts = {}) =>
    fetch(`${BACKEND_URL}/api/tools${path}`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      ...opts
    }).then(r => r.json());

  const fetchTasks     = () => api('/tasks').then(d => Array.isArray(d) && setTasks(d)).catch(console.error);
  const fetchEvents    = () => api('/calendar').then(d => Array.isArray(d) && setEvents(d)).catch(console.error);
  const fetchBookmarks = () => api('/bookmarks').then(d => Array.isArray(d) && setBookmarks(d)).catch(console.error);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await api('/tasks', { method: 'POST', body: JSON.stringify({ title: newTitle, category: newCategory }) });
    setNewTitle(''); announce('Task added!'); fetchTasks();
  };

  const toggleTask = async (task) => {
    await api(`/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify({ completed: !task.completed }) });
    fetchTasks();
  };

  const deleteTask = async (id) => {
    await api(`/tasks/${id}`, { method: 'DELETE' });
    fetchTasks();
  };

  const addEvent = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;
    await api('/calendar', { method: 'POST', body: JSON.stringify({ title: newTitle, date: newDate, category: newCategory }) });
    setNewTitle(''); setNewDate(''); announce('Event added!'); fetchEvents();
  };

  const deleteEvent = async (id) => {
    await api(`/calendar/${id}`, { method: 'DELETE' });
    fetchEvents();
  };

  const addBookmark = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await api('/bookmarks', { method: 'POST', body: JSON.stringify({ title: newTitle, url: newUrl, content: newContent }) });
    setNewTitle(''); setNewUrl(''); setNewContent(''); announce('Bookmark saved!'); fetchBookmarks();
  };

  const deleteBookmark = async (id) => {
    await api(`/bookmarks/${id}`, { method: 'DELETE' });
    fetchBookmarks();
  };

  const TABS = [
    { key: 'tasks',     label: '✅ Tasks & Shopping', icon: <CheckSquare size={14} /> },
    { key: 'calendar',  label: '📅 Calendar',          icon: <Calendar size={14} /> },
    { key: 'bookmarks', label: '🔖 Notes & Links',     icon: <Bookmark size={14} /> }
  ];

  const TASK_CATS = ['TASK', 'SHOPPING'];
  const EVENT_CATS = ['EVENT', 'BIRTHDAY', 'ANNIVERSARY'];
  const CAT_ICONS  = { TASK: '✅', SHOPPING: '🛒', EVENT: '📅', BIRTHDAY: '🎂', ANNIVERSARY: '💍' };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', overflowY: 'auto' }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>🛠️ Shared Tools</h2>

      <div className="tools-nav">
        {TABS.map(t => (
          <button key={t.key} className={`tools-nav-btn focus-ring ${tab===t.key?'active':''}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* ── TASKS ── */}
      {tab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <form onSubmit={addTask} className="glass-panel" style={{ padding: '16px', borderRadius: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="input-field focus-ring" style={{ padding: '10px', width: 'auto' }}>
              {TASK_CATS.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
            </select>
            <input className="input-field focus-ring" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Add a task or item…" style={{ flex: 1 }} />
            <button type="submit" className="btn-primary focus-ring" style={{ padding: '10px 18px' }}><Plus size={16} /></button>
          </form>

          {['TASK', 'SHOPPING'].map(cat => {
            const catTasks = tasks.filter(t => t.category === cat);
            if (!catTasks.length) return null;
            return (
              <div key={cat}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {CAT_ICONS[cat]} {cat === 'SHOPPING' ? 'Shopping List' : 'To-Do List'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {catTasks.map(task => (
                    <div key={task.id} className="glass-panel" style={{ padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', opacity: task.completed ? 0.6 : 1 }}>
                      <button onClick={() => toggleTask(task)} className="focus-ring"
                        style={{ width: '22px', height: '22px', borderRadius: '6px', border: `2px solid ${task.completed ? 'var(--primary)' : 'var(--border-color)'}`,
                          background: task.completed ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                        {task.completed && <Check size={13} color="white" />}
                      </button>
                      <span style={{ flex: 1, textDecoration: task.completed ? 'line-through' : 'none', fontSize: '0.92rem' }}>{task.title}</span>
                      <button onClick={() => deleteTask(task.id)} className="focus-ring"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {tasks.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>No tasks yet. Add one above!</div>
          )}
        </div>
      )}

      {/* ── CALENDAR ── */}
      {tab === 'calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <form onSubmit={addEvent} className="glass-panel" style={{ padding: '16px', borderRadius: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="input-field focus-ring" style={{ padding: '10px', width: 'auto' }}>
              {EVENT_CATS.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
            </select>
            <input className="input-field focus-ring" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Event name…" style={{ flex: 1 }} />
            <input type="date" className="input-field focus-ring" value={newDate} onChange={e => setNewDate(e.target.value)} style={{ padding: '10px', width: 'auto' }} />
            <button type="submit" className="btn-primary focus-ring" style={{ padding: '10px 18px' }}><Plus size={16} /></button>
          </form>

          {events.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>No events. Add one above!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {events.map(ev => (
                <div key={ev.id} className="glass-panel" style={{ padding: '14px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{CAT_ICONS[ev.category] || '📅'}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontWeight: '600', fontSize: '0.92rem' }}>{ev.title}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(ev.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <button onClick={() => deleteEvent(ev.id)} className="focus-ring"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BOOKMARKS ── */}
      {tab === 'bookmarks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <form onSubmit={addBookmark} className="glass-panel" style={{ padding: '16px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input className="input-field focus-ring" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title / Note title…" />
            <input className="input-field focus-ring" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="URL (optional)…" />
            <div style={{ display: 'flex', gap: '10px' }}>
              <textarea className="input-field focus-ring" value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Note content (optional)…" rows={2} style={{ flex: 1, resize: 'none' }} />
              <button type="submit" className="btn-primary focus-ring" style={{ padding: '10px 18px', alignSelf: 'flex-end' }}><Plus size={16} /></button>
            </div>
          </form>

          {bookmarks.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>No bookmarks yet. Save one above!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {bookmarks.map(bm => (
                <div key={bm.id} className="glass-panel" style={{ padding: '14px 18px', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.4rem' }}>{bm.url ? '🔗' : '📝'}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem' }}>{bm.title}</span>
                    {bm.url && <a href={bm.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: 'var(--accent-light)', wordBreak: 'break-all' }}>{bm.url}</a>}
                    {bm.content && <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{bm.content}</p>}
                  </div>
                  <button onClick={() => deleteBookmark(bm.id)} className="focus-ring"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
