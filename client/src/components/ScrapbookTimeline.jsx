import React from 'react';
import { Film } from 'lucide-react';

export default function ScrapbookTimeline({ memories, BACKEND_URL, setSelectedMemory, speakText }) {
  if (!memories || memories.length === 0) return null;

  // Sort memories chronologically (oldest first for a timeline, or newest first?)
  // Usually timelines are newest at the top, or oldest at top. Let's do newest at top.
  const sortedMemories = [...memories].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ marginTop: '24px', position: 'relative', paddingLeft: '20px' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 24px -20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>📖 Our Scrapbook Timeline</span>
      </h3>

      {/* Vertical line */}
      <div style={{ position: 'absolute', top: '50px', bottom: '0', left: '26px', width: '2px', background: 'var(--border-color)', zIndex: 0 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {sortedMemories.map((memory, index) => (
          <div key={memory.id} style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '20px' }}>
            
            {/* Timeline dot */}
            <div style={{ 
              width: '14px', height: '14px', borderRadius: '50%', background: 'var(--primary)', 
              boxShadow: '0 0 0 4px var(--bg-main)', flexShrink: 0, marginTop: '10px', marginLeft: '-1px'
            }} />

            {/* Content card */}
            <div 
              className="glass-panel focus-ring" 
              tabIndex={0}
              onClick={() => {
                setSelectedMemory(memory);
                speakText(`Showing Memory: ${memory.title}. ${memory.description || ''}`);
              }}
              style={{ flex: 1, padding: '16px', borderRadius: '16px', cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(8px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-light)', fontWeight: 'bold', marginBottom: '8px' }}>
                {new Date(memory.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: '600' }}>{memory.title}</h4>
              
              {/* Media Preview */}
              <div style={{ borderRadius: '8px', overflow: 'hidden', maxHeight: '180px', background: '#000', display: 'inline-block', position: 'relative' }}>
                {memory.mediaType === 'VIDEO' ? (
                  <>
                    <video src={`${BACKEND_URL}${memory.mediaUrl}`} style={{ height: '180px', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '4px' }}>
                      <Film size={12} color="white" />
                    </div>
                  </>
                ) : (
                  <img src={`${BACKEND_URL}${memory.mediaUrl}`} alt={memory.title} style={{ height: '180px', objectFit: 'cover' }} />
                )}
              </div>

              {memory.description && (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '12px', marginBottom: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {memory.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
