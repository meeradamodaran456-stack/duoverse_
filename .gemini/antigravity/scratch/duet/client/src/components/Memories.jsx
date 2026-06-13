import React, { useState, useEffect } from 'react';
import { Plus, X, Image, Trash2, Calendar, Film, Clock, LayoutList } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import MemoryCapsules from './MemoryCapsules';
import ScrapbookTimeline from './ScrapbookTimeline';

export default function Memories({ user, BACKEND_URL, socket }) {
  const [memories, setMemories] = useState([]);
  const [onThisDayMemories, setOnThisDayMemories] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('gallery'); // 'gallery', 'timeline', 'capsules'
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { speakText, announce } = useAccessibility();

  // Load memories on mount
  useEffect(() => {
    fetchMemories();
    fetchOnThisDayMemories();
  }, []);

  const fetchOnThisDayMemories = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/memories/on-this-day`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setOnThisDayMemories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMemories = () => {
    fetch(`${BACKEND_URL}/api/memories`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMemories(data);
        }
      })
      .catch((err) => console.error(err));
  };

  const handleFileChange = (e) => {
    setMediaFile(e.target.files[0]);
  };

  const handleCreateMemorySubmit = async (e) => {
    e.preventDefault();
    if (!title || !mediaFile) {
      setError('Title and image/video file are required.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('date', date);
    formData.append('media', mediaFile);

    try {
      const res = await fetch(`${BACKEND_URL}/api/memories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload memory');

      announce(`Created new memory: ${title}`);
      fetchMemories();
      
      // Reset Form & Close Modal
      setTitle('');
      setDescription('');
      setDate('');
      setMediaFile(null);
      setShowAddModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMemory = async (id, e) => {
    e.stopPropagation(); // Avoid opening the memory details modal
    if (!window.confirm('Are you sure you want to delete this memory?')) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/memories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.ok) {
        announce('Memory deleted');
        fetchMemories();
        if (selectedMemory?.id === id) {
          setSelectedMemory(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', overflowY: 'auto' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Shared Memories</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Capturing the milestones of our relationship</span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary focus-ring"
          aria-label="Add new memory"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          <span>Add Photo/Video</span>
        </button>
      </div>

      {/* Sub Navigation */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveSubTab('gallery')}
          className="focus-ring"
          style={{ 
            background: 'none', border: 'none', color: activeSubTab === 'gallery' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeSubTab === 'gallery' ? 'bold' : 'normal', padding: '4px 12px', cursor: 'pointer',
            borderBottom: activeSubTab === 'gallery' ? '2px solid var(--primary)' : '2px solid transparent',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <Image size={16} /> Gallery
        </button>
        <button
          onClick={() => setActiveSubTab('timeline')}
          className="focus-ring"
          style={{ 
            background: 'none', border: 'none', color: activeSubTab === 'timeline' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeSubTab === 'timeline' ? 'bold' : 'normal', padding: '4px 12px', cursor: 'pointer',
            borderBottom: activeSubTab === 'timeline' ? '2px solid var(--primary)' : '2px solid transparent',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <LayoutList size={16} /> Timeline
        </button>
        <button
          onClick={() => setActiveSubTab('capsules')}
          className="focus-ring"
          style={{ 
            background: 'none', border: 'none', color: activeSubTab === 'capsules' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeSubTab === 'capsules' ? 'bold' : 'normal', padding: '4px 12px', cursor: 'pointer',
            borderBottom: activeSubTab === 'capsules' ? '2px solid var(--primary)' : '2px solid transparent',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <Clock size={16} /> Time Capsules
        </button>
      </div>

      {activeSubTab === 'gallery' && (
        <>
          {/* On This Day Highlight */}
          {onThisDayMemories.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)' }}>
                <Calendar size={20} />
                <span>On This Day</span>
              </h3>
              <div className="memories-grid">
                {onThisDayMemories.map(memory => (
                  <div
                    key={memory.id}
                    className="memory-card glass-panel focus-ring"
                    tabIndex={0}
                    onClick={() => setSelectedMemory(memory)}
                    style={{ border: '1px solid var(--accent)' }}
                  >
                     <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--accent)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', zIndex: 2 }}>
                       {new Date().getFullYear() - new Date(memory.date).getFullYear()} Years Ago
                     </div>
                     {memory.mediaType === 'VIDEO' ? (
                      <div style={{ height: '280px', position: 'relative', background: '#000' }}>
                        <video src={`${BACKEND_URL}${memory.mediaUrl}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', p: '6px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Film size={14} color="white" />
                        </div>
                      </div>
                    ) : (
                      <img src={`${BACKEND_URL}${memory.mediaUrl}`} alt={memory.title} className="memory-image" />
                    )}
                    <div className="memory-info">
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '600' }}>{memory.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid of All Memories */}
      {memories.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', minHeight: '300px' }}>
          <Image size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <span>No memories saved yet. Click add photo to start your gallery.</span>
        </div>
      ) : (
        <div className="memories-grid">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="memory-card glass-panel focus-ring"
              tabIndex={0}
              onClick={() => {
                setSelectedMemory(memory);
                speakText(`Showing Memory: ${memory.title}. ${memory.description || ''}`);
              }}
              onFocus={() => speakText(`Memory Card: ${memory.title}`)}
            >
              {/* Media element */}
              {memory.mediaType === 'VIDEO' ? (
                <div style={{ height: '280px', position: 'relative', background: '#000' }}>
                  <video src={`${BACKEND_URL}${memory.mediaUrl}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', p: '6px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Film size={14} color="white" />
                  </div>
                </div>
              ) : (
                <img
                  src={`${BACKEND_URL}${memory.mediaUrl}`}
                  alt={memory.title}
                  className="memory-image"
                />
              )}

              {/* Title & Info Banner */}
              <div className="memory-info">
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '600' }}>{memory.title}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', opacity: 0.8 }}>
                  <span>{new Date(memory.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  <button
                    onClick={(e) => handleDeleteMemory(memory.id, e)}
                    className="focus-ring"
                    aria-label={`Delete memory ${memory.title}`}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}

      {activeSubTab === 'timeline' && <ScrapbookTimeline memories={memories} BACKEND_URL={BACKEND_URL} setSelectedMemory={setSelectedMemory} speakText={speakText} />}
      
      {activeSubTab === 'capsules' && <MemoryCapsules user={user} BACKEND_URL={BACKEND_URL} socket={socket} />}

      {/* 1. Add Memory Modal */}
      {showAddModal && (
        <div className="call-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="auth-card" style={{ maxWidth: '480px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>Add Shared Memory</h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateMemorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label htmlFor="mem-title" style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>Title</label>
                <input
                  id="mem-title"
                  type="text"
                  className="input-field focus-ring"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Anniversary Dinner, Vacation Trip..."
                  required
                />
              </div>

              <div>
                <label htmlFor="mem-desc" style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>Description</label>
                <textarea
                  id="mem-desc"
                  className="input-field focus-ring"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write a cute note..."
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div>
                <label htmlFor="mem-date" style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>Date</label>
                <input
                  id="mem-date"
                  type="date"
                  className="input-field focus-ring"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="mem-file" style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>Photo or Video</label>
                <input
                  id="mem-file"
                  type="file"
                  accept="image/*,video/*"
                  className="input-field focus-ring"
                  onChange={handleFileChange}
                  required
                />
              </div>

              {error && <div style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</div>}

              <button type="submit" className="btn-primary focus-ring" disabled={loading} style={{ marginTop: '8px' }}>
                {loading ? 'Uploading...' : 'Save Memory'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Memory Detail View Modal */}
      {selectedMemory && (
        <div className="call-overlay" onClick={() => setSelectedMemory(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            className="auth-card"
            style={{ maxWidth: '640px', padding: '24px', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()} // Stop propagation from closing the modal
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>{selectedMemory.title}</h3>
              <button
                onClick={() => setSelectedMemory(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Media detail */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#000', maxHeight: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
              {selectedMemory.mediaType === 'VIDEO' ? (
                <video src={`${BACKEND_URL}${selectedMemory.mediaUrl}`} controls autoPlay style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
              ) : (
                <img src={`${BACKEND_URL}${selectedMemory.mediaUrl}`} alt={selectedMemory.title} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
              )}
            </div>

            <p style={{ fontSize: '1rem', lineHeight: '1.5', margin: '0 0 12px 0' }}>{selectedMemory.description}</p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <Calendar size={14} />
              <span>{new Date(selectedMemory.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
