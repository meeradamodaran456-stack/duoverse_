import React, { useState } from 'react';
import { Palette, Image as ImageIcon, Sparkles, Type, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { PREBUILT_THEMES, THEME_CATEGORIES } from '../config/themesConfig';

export default function Themes({ BACKEND_URL }) {
  const { theme, setTheme, accentColor, setAccentColor, secondaryColor, setSecondaryColor,
          wallpaperUrl, setWallpaperUrl, bubbleColor, setBubbleColor, 
          fontName, setFontName, animatedEffect, setAnimatedEffect } = useTheme();
  const { announce } = useAccessibility();

  const [activeTab, setActiveTab] = useState('PREBUILT'); // PREBUILT | CUSTOM
  const [selectedCategory, setSelectedCategory] = useState(THEME_CATEGORIES[0]);
  const [isSaving, setIsSaving] = useState(false);

  const applyTheme = (t) => {
    setTheme(t.id);
    setAccentColor(t.accentColor || '#EC4899');
    setSecondaryColor(t.secondaryColor || t.accentColor || '#EC4899');
    setBubbleColor(t.bubbleColor || '');
    setFontName(t.fontName || 'Outfit');
    setAnimatedEffect(t.animatedEffect || '');
    // Note: wallpaperUrl is kept intact unless explicitly overridden
    announce(`Applied theme: ${t.name}`);
  };

  const saveCustomization = async () => {
    setIsSaving(true);
    try {
      await fetch(`${BACKEND_URL}/api/customization`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          themeName: theme, accentColor, secondaryColor, wallpaperUrl,
          bubbleColor, fontName, animatedEffect
        })
      });
      announce('Theme synced with your partner successfully!');
      setTimeout(() => setIsSaving(false), 2000);
    } catch (e) {
      console.error(e);
      setIsSaving(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', overflowY: 'auto', position: 'relative', zIndex: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Palette size={24} color="var(--accent)" /> Themes
        </h2>
        <button onClick={saveCustomization} className="btn-primary focus-ring" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          {isSaving ? <><CheckCircle size={16}/> Saved!</> : 'Save & Sync'}
        </button>
      </div>

      <div className="tools-nav" style={{ marginBottom: '20px' }}>
        <button className={`tools-nav-btn focus-ring ${activeTab === 'PREBUILT' ? 'active' : ''}`} onClick={() => setActiveTab('PREBUILT')}>Prebuilt Themes</button>
        <button className={`tools-nav-btn focus-ring ${activeTab === 'CUSTOM' ? 'active' : ''}`} onClick={() => setActiveTab('CUSTOM')}>Custom Creator</button>
      </div>

      {activeTab === 'PREBUILT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
            {THEME_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className="focus-ring"
                style={{
                  padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap', border: '1px solid var(--border-color)',
                  background: selectedCategory === cat ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  color: selectedCategory === cat ? '#fff' : 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s'
                }}>
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
            {PREBUILT_THEMES.filter(t => t.category === selectedCategory).map(t => (
              <button key={t.id} onClick={() => applyTheme(t)} className="focus-ring"
                style={{
                  background: `linear-gradient(135deg, ${t.accentColor}, ${t.secondaryColor || t.accentColor})`,
                  border: `3px solid ${theme === t.id ? '#fff' : 'transparent'}`,
                  borderRadius: '16px', padding: '24px 16px', color: '#fff', fontWeight: 'bold', fontSize: '1rem',
                  cursor: 'pointer', boxShadow: theme === t.id ? '0 0 0 3px var(--primary)' : '0 4px 12px rgba(0,0,0,0.2)',
                  transition: 'transform 0.2s, box-shadow 0.2s', position: 'relative', overflow: 'hidden', textAlign: 'center', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                {t.animatedEffect && <Sparkles size={16} style={{ position: 'absolute', top: '8px', right: '8px', opacity: 0.8 }} />}
                <span style={{ zIndex: 2, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'CUSTOM' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <section className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Palette size={18}/> Colors</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Primary Accent</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: '44px', height: '44px', border: 'none', background: 'none', cursor: 'pointer' }} />
                  <span style={{ fontSize: '0.9rem', textTransform: 'uppercase' }}>{accentColor}</span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Secondary Gradient</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="color" value={secondaryColor || accentColor} onChange={e => setSecondaryColor(e.target.value)} style={{ width: '44px', height: '44px', border: 'none', background: 'none', cursor: 'pointer' }} />
                  <span style={{ fontSize: '0.9rem', textTransform: 'uppercase' }}>{secondaryColor || accentColor}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><ImageIcon size={18}/> Backgrounds & Effects</h3>
            
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Custom Wallpaper URL</label>
            <input className="input-field focus-ring" value={wallpaperUrl} onChange={e => setWallpaperUrl(e.target.value)} placeholder="Paste image URL here..." style={{ width: '100%', marginBottom: '20px' }} />

            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Animated Overlay Effect</label>
            <select className="input-field focus-ring" value={animatedEffect || ''} onChange={e => setAnimatedEffect(e.target.value)} style={{ width: '100%' }}>
              <option value="">None (Static Background)</option>
              <option value="falling_hearts">Falling Hearts</option>
              <option value="floating_flower_petals">Floating Petals</option>
              <option value="snowfall">Snowfall</option>
              <option value="fireflies">Fireflies</option>
              <option value="shooting_stars">Shooting Stars</option>
              <option value="floating_balloons">Floating Balloons</option>
            </select>
          </section>

          <section className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Type size={18}/> Typography & Chat</h3>
            
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>App Font</label>
            <select className="input-field focus-ring" value={fontName} onChange={e => setFontName(e.target.value)} style={{ width: '100%', marginBottom: '20px', fontFamily: fontName }}>
              <option value="Outfit">Outfit (Modern)</option>
              <option value="Inter">Inter (Clean)</option>
              <option value="Courier New">Courier (Retro)</option>
              <option value="Georgia">Georgia (Elegant)</option>
              <option value="Times New Roman">Times (Classic)</option>
              <option value="Comic Sans MS">Comic Sans (Playful)</option>
            </select>

            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Chat Bubble Color (RGBA)</label>
            <input className="input-field focus-ring" value={bubbleColor || ''} onChange={e => setBubbleColor(e.target.value)} placeholder="e.g. rgba(236, 72, 153, 0.7)" style={{ width: '100%' }} />
          </section>

        </div>
      )}
    </div>
  );
}
