import React, { useEffect, useState } from 'react';

export default function RomanceOverlay({ activeRomance, setActiveRomance }) {
  // activeRomance = { type: 'HUG' | 'KISS', id: timestamp }
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (activeRomance) {
      // Generate particles
      const emoji = activeRomance.type === 'HUG' ? '🤗' : '💋';
      const newParticles = Array.from({ length: 30 }).map((_, i) => ({
        id: `${activeRomance.id}-${i}`,
        x: Math.random() * 100, // %
        y: Math.random() * 100, // %
        size: Math.random() * 3 + 2, // rem
        duration: Math.random() * 2 + 3, // seconds
        emoji
      }));
      setParticles(newParticles);

      // Clear after animation finishes
      const timer = setTimeout(() => {
        setParticles([]);
        setActiveRomance(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [activeRomance, setActiveRomance]);

  if (!activeRomance) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      pointerEvents: 'none',
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {/* Background tint */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: activeRomance.type === 'HUG' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(236, 72, 153, 0.15)',
        animation: 'fadeInOut 5s ease-in-out forwards'
      }} />

      {/* Floating particles */}
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}rem`,
            animation: `floatUp ${p.duration}s ease-in-out forwards`,
            opacity: 0
          }}
        >
          {p.emoji}
        </div>
      ))}

      {/* Center massive text */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '4rem',
        fontWeight: 'bold',
        color: activeRomance.type === 'HUG' ? '#f59e0b' : '#ec4899',
        textShadow: '0 4px 20px rgba(0,0,0,0.5)',
        animation: 'zoomInOut 5s ease-in-out forwards',
        textAlign: 'center'
      }}>
        You got a {activeRomance.type === 'HUG' ? 'Hug' : 'Kiss'}! {activeRomance.type === 'HUG' ? '🤗' : '💋'}
      </div>
    </div>
  );
}
