import React, { useState, useEffect } from 'react';
import { Leaf, Droplets } from 'lucide-react';

export default function RelationshipGarden({ user, socket }) {
  const [health, setHealth] = useState(100);
  const [stage, setStage] = useState('🌱');
  const [level, setLevel] = useState(1);
  const [lastInteraction, setLastInteraction] = useState(user.couple?.lastInteraction || new Date());

  useEffect(() => {
    // Listen for interaction updates via socket
    if (socket) {
      socket.on('interaction-updated', (data) => {
        setLastInteraction(data.date);
        calculateGardenState(data.date, user.couple?.createdAt);
      });
    }

    // Initial calculation
    calculateGardenState(user.couple?.lastInteraction || new Date(), user.couple?.createdAt || new Date());

    return () => {
      if (socket) socket.off('interaction-updated');
    };
  }, [socket, user.couple]);

  const calculateGardenState = (lastInt, created) => {
    const now = new Date();
    const last = new Date(lastInt);
    const start = new Date(created);

    // Health drops by 20% every day of inactivity
    const hoursInactive = (now - last) / (1000 * 60 * 60);
    const calculatedHealth = Math.max(0, 100 - (hoursInactive / 24) * 20);
    setHealth(Math.min(100, Math.floor(calculatedHealth)));

    // Level grows by 1 every 7 days together
    const daysTogether = (now - start) / (1000 * 60 * 60 * 24);
    const calculatedLevel = Math.max(1, Math.floor(daysTogether / 7) + 1);
    setLevel(calculatedLevel);

    // Determine visual stage based on level and health
    if (calculatedHealth < 30) {
      setStage('🥀'); // Wilted
    } else if (calculatedLevel >= 10) {
      setStage('🌳'); // Big Tree
    } else if (calculatedLevel >= 5) {
      setStage('🌺'); // Blooming
    } else if (calculatedLevel >= 2) {
      setStage('🌿'); // Growing
    } else {
      setStage('🌱'); // Sprout
    }
  };

  // Water the plant (manual interaction)
  const handleWaterPlant = () => {
    if (socket) {
      socket.emit('send-message', { content: 'I watered our garden! 💧', type: 'SYSTEM' });
    }
  };

  return (
    <section className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Background decoration */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to top, rgba(34, 197, 94, 0.1), transparent)', zIndex: 0 }} />
      
      <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
        <Leaf size={20} color="var(--success)" />
        <span>Our Relationship Garden</span>
      </h3>

      <div style={{ position: 'relative', zIndex: 1, padding: '30px 0' }}>
        <span style={{ 
            fontSize: '5rem', 
            display: 'block', 
            filter: health < 50 ? 'grayscale(0.8)' : 'none',
            transform: `scale(${1 + (level * 0.05)})`,
            transition: 'all 1s ease-in-out',
            animation: health > 50 ? 'float 3s ease-in-out infinite' : 'none'
        }}>
          {stage}
        </span>
      </div>

      <div style={{ width: '100%', maxWidth: '250px', zIndex: 1, marginTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>Level {level}</span>
          <span>Health {health}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${health}%`, 
            height: '100%', 
            background: health > 50 ? 'var(--success)' : 'var(--danger)',
            transition: 'width 0.5s'
          }} />
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '16px 0', zIndex: 1, maxWidth: '280px' }}>
        Your plant grows as you interact! Chat, call, or send love notes to keep it healthy.
      </p>

      <button 
        onClick={handleWaterPlant} 
        className="btn-secondary focus-ring"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}
      >
        <Droplets size={16} color="#3b82f6" />
        <span>Water Plant</span>
      </button>
    </section>
  );
}
