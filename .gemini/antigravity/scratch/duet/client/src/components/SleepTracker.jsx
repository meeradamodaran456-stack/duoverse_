import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function SleepTracker({ user, partner, BACKEND_URL, socket }) {
  const { announce } = useAccessibility();
  const [activeSleep, setActiveSleep] = useState(null);
  const [partnerSleep, setPartnerSleep] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSleepData();
    // In a real app we'd listen to socket for partner sleep changes too, but polling for now
  }, []);

  const fetchSleepData = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sleep`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setActiveSleep(data.activeSleep);

      // Find partner's latest sleep log
      if (data.logs) {
        const partnerLogs = data.logs.filter(l => l.userId !== user.id);
        if (partnerLogs.length > 0) {
           const latest = partnerLogs[0];
           if (!latest.wakeTime) {
             setPartnerSleep(latest); // they are sleeping
           } else {
             setPartnerSleep(null); // they are awake
           }
        }
      }
      setIsLoading(false);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const handleGoodNight = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sleep/goodnight`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        announce('Good night! Sleep well.');
        fetchSleepData();
        if (socket) socket.emit('send-message', { content: 'Good night! 🌙', type: 'SYSTEM' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGoodMorning = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sleep/goodmorning`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        announce('Good morning! Have a great day.');
        fetchSleepData();
        if (socket) socket.emit('send-message', { content: 'Good morning! ☀️', type: 'SYSTEM' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) return null;

  return (
    <section className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', gridColumn: 'span 1', position: 'relative', overflow: 'hidden' }}>
      {/* Background tint based on state */}
      <div style={{ 
        position: 'absolute', inset: 0, zIndex: 0, opacity: 0.1,
        background: activeSleep ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' : 'linear-gradient(135deg, #fef08a 0%, #fbd38d 100%)'
      }} />

      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
        {activeSleep ? <Moon size={18} color="#a5b4fc" /> : <Sun size={18} color="#f59e0b" />}
        <span>Sleep Tracker</span>
      </h3>

      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', flex: 1, justifyContent: 'center' }}>
        
        {activeSleep ? (
           <div style={{ textAlign: 'center' }}>
             <Moon size={48} color="#a5b4fc" style={{ animation: 'floatUp 4s infinite ease-in-out alternate', margin: '0 auto' }} />
             <p style={{ margin: '12px 0', fontSize: '0.9rem', color: 'var(--text-main)' }}>You are currently sleeping.</p>
             <button onClick={handleGoodMorning} className="btn-primary focus-ring" style={{ background: '#f59e0b', color: '#fff' }}>
               Wake Up
             </button>
           </div>
        ) : (
           <div style={{ textAlign: 'center' }}>
             <Sun size={48} color="#f59e0b" style={{ animation: 'pulse 3s infinite', margin: '0 auto' }} />
             <p style={{ margin: '12px 0', fontSize: '0.9rem', color: 'var(--text-main)' }}>You are currently awake.</p>
             <button onClick={handleGoodNight} className="btn-primary focus-ring" style={{ background: '#312e81', color: '#fff' }}>
               Good Night
             </button>
           </div>
        )}

      </div>

      {/* Partner status */}
      <div style={{ zIndex: 1, marginTop: 'auto', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
         <span style={{ fontSize: '1.2rem' }}>{partnerSleep ? '😴' : '👀'}</span>
         <span>
           {partner ? partner.name : 'Partner'} is {partnerSleep ? 'asleep right now.' : 'awake right now.'}
         </span>
      </div>
    </section>
  );
}
