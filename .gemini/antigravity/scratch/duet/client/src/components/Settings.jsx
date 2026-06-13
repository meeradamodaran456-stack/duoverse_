import React, { useState, useEffect } from 'react';
import { Palette, Lock, Unlink, RefreshCw, Save } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTheme } from '../context/ThemeContext';

const THEMES = [
  { key: 'ROMANTIC', label: '🌹 Romantic Rose',    preview: 'linear-gradient(135deg,#F43F5E,#EC4899)' },
  { key: 'MIDNIGHT', label: '🌌 Midnight Neon',    preview: 'linear-gradient(135deg,#8B5CF6,#D946EF)' },
  { key: 'SUNSET',   label: '🌅 Sunset Glow',      preview: 'linear-gradient(135deg,#F97316,#EF4444)' },
  { key: 'LIGHT',    label: '🌸 Soft Blossom',     preview: 'linear-gradient(135deg,#E11D48,#DB2777)' },
];

const A11Y_SETTINGS = [
  { key: 'highContrast',          label: 'High Contrast Mode',       desc: 'Increases text and UI contrast' },
  { key: 'largeText',             label: 'Large Text Mode',           desc: 'Increases base font size' },
  { key: 'screenReaderOptimized', label: 'Screen Reader Optimized',   desc: 'Enables hover TTS feedback' },
  { key: 'subtitlesEnabled',      label: 'Voice Message Captions',    desc: 'Show captions on audio messages' },
];

export default function Settings({ user, BACKEND_URL, onLogout }) {
  const { announce, highContrast, setHighContrast, largeText, setLargeText,
          screenReaderOptimized, setScreenReaderOptimized, subtitlesEnabled, setSubtitlesEnabled } = useAccessibility();
  const { theme, setTheme, accentColor, setAccentColor, wallpaperUrl, setWallpaperUrl } = useTheme();

  // Anniversary
  const [anniversary, setAnniversary]     = useState(
    user.couple?.anniversary ? new Date(user.couple.anniversary).toISOString().split('T')[0] : ''
  );
  const [anniversarySaved, setAnniversarySaved] = useState(false);

  // Nicknames
  const [nicknames, setNicknames]         = useState({ n1: user.couple?.nicknameUser1 || '', n2: user.couple?.nicknameUser2 || '' });

  // Unlink space
  const [unlinkPhase, setUnlinkPhase]     = useState(0); // 0=idle 1=confirm 2=done



  const saveAnniversary = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ anniversary })
      });
      setAnniversarySaved(true);
      announce('Anniversary date saved!');
      setTimeout(() => setAnniversarySaved(false), 2500);
    } catch (e) { console.error(e); }
  };

  const saveTheme = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/customization`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ themeName: theme, accentColor, wallpaperUrl })
      });
      announce('Theme saved for both partners!');
    } catch (e) { console.error(e); }
  };

  const saveNicknames = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/nicknames`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ nicknameUser1: nicknames.n1, nicknameUser2: nicknames.n2 })
      });
      announce('Nicknames updated!');
    } catch (e) { console.error(e); }
  };



  const handleUnlink = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/unlink`, {
        method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) { setUnlinkPhase(2); setTimeout(() => onLogout(), 2000); }
    } catch (e) { console.error(e); }
  };

  const a11yValues = { highContrast, largeText, screenReaderOptimized, subtitlesEnabled };
  const a11ySetters = { highContrast: setHighContrast, largeText: setLargeText, screenReaderOptimized: setScreenReaderOptimized, subtitlesEnabled: setSubtitlesEnabled };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', overflowY: 'auto' }}>
      <h2 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>⚙️ Settings</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── Anniversary ── */}
        <section className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💍 Anniversary Date
          </h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="date" className="input-field focus-ring" value={anniversary} onChange={e => setAnniversary(e.target.value)} style={{ padding: '10px', width: 'auto' }} />
            <button onClick={saveAnniversary} className="btn-primary focus-ring" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Save size={14} /> {anniversarySaved ? '✓ Saved!' : 'Save Date'}
            </button>
          </div>
        </section>

        {/* ── Nicknames ── */}
        <section className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: '700' }}>🏷️ Pet Names</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="input-field focus-ring" value={nicknames.n1} onChange={e => setNicknames(p => ({...p, n1: e.target.value}))} placeholder="Your nickname…" style={{ flex: 1, minWidth: '140px' }} />
            <span style={{ color: 'var(--text-muted)' }}>💗</span>
            <input className="input-field focus-ring" value={nicknames.n2} onChange={e => setNicknames(p => ({...p, n2: e.target.value}))} placeholder="Partner's nickname…" style={{ flex: 1, minWidth: '140px' }} />
            <button onClick={saveNicknames} className="btn-primary focus-ring" style={{ padding: '10px 20px' }}>Save</button>
          </div>
        </section>

        {/* ── Theme ── */}
        <section className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={16} color="var(--accent)" /> Couple Space Theme
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            {THEMES.map(t => (
              <button key={t.key} onClick={() => setTheme(t.key)} className="focus-ring"
                style={{ background: t.preview, border: `3px solid ${theme === t.key ? 'white' : 'transparent'}`, borderRadius: '14px', padding: '16px 12px', color: 'white', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: theme === t.key ? '0 0 0 3px var(--primary)' : 'none', transition: 'all 0.2s' }}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Accent Color</label>
              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: '40px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'transparent' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flexShrink: 0 }}>Wallpaper URL</label>
              <input className="input-field focus-ring" value={wallpaperUrl} onChange={e => setWallpaperUrl(e.target.value)} placeholder="Paste image URL…" />
            </div>
            <button onClick={saveTheme} className="btn-primary focus-ring" style={{ padding: '10px 20px', flexShrink: 0 }}>Apply to Both</button>
          </div>
        </section>

        {/* ── Accessibility ── */}
        <section className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: '700' }}>♿ Accessibility</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {A11Y_SETTINGS.map(s => (
              <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div>
                  <span style={{ fontWeight: '600', display: 'block', fontSize: '0.9rem' }}>{s.label}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.desc}</span>
                </div>
                <button
                  onClick={() => a11ySetters[s.key](!a11yValues[s.key])}
                  className="focus-ring"
                  role="switch"
                  aria-checked={a11yValues[s.key]}
                  style={{
                    width: '48px', height: '26px', borderRadius: '999px', cursor: 'pointer', border: 'none', flexShrink: 0,
                    background: a11yValues[s.key] ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                    position: 'relative', transition: 'background 0.2s'
                  }}
                >
                  <span style={{
                    position: 'absolute', top: '3px', left: a11yValues[s.key] ? '25px' : '3px',
                    width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'left 0.2s'
                  }} />
                </button>
              </div>
            ))}
          </div>
        </section>



        {/* ── Unlink / Danger Zone ── */}
        <section className="glass-panel" style={{ padding: '20px', borderRadius: '16px', borderColor: 'rgba(239,68,68,0.2)' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: '700', color: '#f87171' }}>
            ⚠️ Danger Zone
          </h3>
          {unlinkPhase === 0 && (
            <button onClick={() => setUnlinkPhase(1)} className="focus-ring"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '12px', padding: '10px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
              <Unlink size={16} /> Unlink Couple Space
            </button>
          )}
          {unlinkPhase === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#f87171' }}>
                This will permanently sever the couple link for both users. All shared data will remain but the space will be disconnected. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleUnlink} className="focus-ring"
                  style={{ background: 'rgba(239,68,68,0.8)', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontWeight: '700' }}>
                  Yes, Unlink Space
                </button>
                <button onClick={() => setUnlinkPhase(0)} className="btn-secondary focus-ring" style={{ padding: '10px 20px' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          {unlinkPhase === 2 && (
            <p style={{ margin: 0, color: '#f87171', fontWeight: '600' }}>Couple space unlinked. Logging out…</p>
          )}
        </section>

        {/* ── Logout ── */}
        <button onClick={onLogout} className="btn-secondary focus-ring" style={{ alignSelf: 'flex-start', padding: '12px 24px' }}>
          🚪 Sign Out
        </button>

      </div>
    </div>
  );
}
