import React, { useEffect, useState } from 'react';

export default function AnimatedBackground({ effect }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!effect) {
      setParticles([]);
      return;
    }

    const config = getEffectConfig(effect);
    if (!config) return;

    // Generate initial particles
    const newParticles = Array.from({ length: config.count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage
      y: Math.random() * 100, // percentage
      speed: config.minSpeed + Math.random() * (config.maxSpeed - config.minSpeed),
      size: config.minSize + Math.random() * (config.maxSize - config.minSize),
      opacity: config.minOpacity + Math.random() * (config.maxOpacity - config.minOpacity),
      delay: Math.random() * config.maxDelay,
      char: config.chars[Math.floor(Math.random() * config.chars.length)]
    }));

    setParticles(newParticles);
  }, [effect]);

  if (!effect || particles.length === 0) return null;

  return (
    <div className="animated-background-container" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className={`anim-particle ${effect}`}
          style={{
            position: 'absolute',
            left: `${p.x}vw`,
            top: `${p.y}vh`,
            fontSize: `${p.size}rem`,
            opacity: p.opacity,
            animationDuration: `${p.speed}s`,
            animationDelay: `-${p.delay}s`,
            color: 'var(--accent-light)',
            textShadow: '0 0 10px var(--accent)'
          }}
        >
          {p.char}
        </div>
      ))}
    </div>
  );
}

function getEffectConfig(effect) {
  switch (effect) {
    case 'falling_hearts':
      return { count: 30, chars: ['❤️', '💖', '💕'], minSpeed: 4, maxSpeed: 8, minSize: 0.8, maxSize: 1.5, minOpacity: 0.4, maxOpacity: 0.8, maxDelay: 5 };
    case 'floating_flower_petals':
      return { count: 40, chars: ['🌸', '💮'], minSpeed: 5, maxSpeed: 10, minSize: 0.6, maxSize: 1.2, minOpacity: 0.3, maxOpacity: 0.7, maxDelay: 8 };
    case 'snowfall':
      return { count: 60, chars: ['❄️', '❅', '❆'], minSpeed: 3, maxSpeed: 7, minSize: 0.4, maxSize: 1.0, minOpacity: 0.5, maxOpacity: 0.9, maxDelay: 6 };
    case 'fireflies':
      return { count: 25, chars: ['✨', '⭐'], minSpeed: 2, maxSpeed: 5, minSize: 0.3, maxSize: 0.8, minOpacity: 0.6, maxOpacity: 1.0, maxDelay: 4 };
    case 'shooting_stars':
      return { count: 10, chars: ['🌠'], minSpeed: 1, maxSpeed: 3, minSize: 1.0, maxSize: 1.5, minOpacity: 0.7, maxOpacity: 1.0, maxDelay: 10 };
    case 'floating_balloons':
      return { count: 15, chars: ['🎈'], minSpeed: 6, maxSpeed: 12, minSize: 1.5, maxSize: 2.5, minOpacity: 0.8, maxOpacity: 1.0, maxDelay: 5 };
    default:
      return null;
  }
}
