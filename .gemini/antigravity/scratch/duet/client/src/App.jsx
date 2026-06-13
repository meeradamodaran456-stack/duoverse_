import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Heart, MessageSquare, Image, Settings, Phone, Video, LayoutDashboard, BookOpen, Wrench, Gamepad2, LogOut, MessageCircle, CalendarDays, Book, Sparkles, Settings as SettingsIcon, Palette, ShieldAlert, CheckCircle } from 'lucide-react';
import { useAccessibility } from './context/AccessibilityContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Chat from './components/Chat';
import Dashboard from './components/Dashboard';
import Memories from './components/Memories';
import Diary from './components/Diary';
import Tools from './components/Tools';
import FunZone from './components/FunZone';
import SettingsView from './components/Settings';
import Themes from './components/Themes';
import CallOverlay from './components/CallOverlay';
import RomanceOverlay from './components/RomanceOverlay';
import AnimatedBackground from './components/AnimatedBackground';

// Define base URL for backend connection
// Note: Using the PC's local IP address so the mobile phone/emulator can reach it over WiFi
const BACKEND_URL = 'http://10.248.59.236:5000';

function AppInner() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [socket, setSocket] = useState(null);
  const { loadCustomizations, animatedEffect } = useTheme();
  
  // Auth Form State
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Pairing State
  const [coupleKeyInput, setCoupleKeyInput] = useState('');
  const [pairSuccess, setPairSuccess] = useState('');

  // Call States
  const [activeCall, setActiveCall] = useState(null); // { status: 'ringing'|'connected', offer, callerId, type: 'AUDIO'|'VIDEO' }
  const [outgoingCall, setOutgoingCall] = useState(null); // { type: 'AUDIO'|'VIDEO' }
  const [incomingCall, setIncomingCall] = useState(null); // { offer, callerId, type: 'AUDIO'|'VIDEO' }

  // Romance Overlay
  const [activeRomance, setActiveRomance] = useState(null); // { type, id }

  const { speakText, handleHoverSpeak, loadSettings, announce } = useAccessibility();

  // 1. Fetch user profile when token is updated
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Auth failed');
        return res.json();
      })
      .then(async (data) => {
        setUser(data.user);
        loadSettings(data.user.accessibilitySettings);
        announce(`Signed in as ${data.user.name}`);
        // Load couple space customization (themes, etc.)
        if (data.user.coupleId) {
          try {
            const custRes = await fetch(`${BACKEND_URL}/api/customization`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (custRes.ok) {
              const custData = await custRes.json();
              loadCustomizations(custData);
            }
          } catch (e) { /* no-op */ }
        }
      })
      .catch(() => {
        setToken('');
        localStorage.removeItem('token');
      });
  }, [token]);

  // 2. Establish Socket Connection
  useEffect(() => {
    if (!token || !user || !user.coupleId) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(BACKEND_URL, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Socket.io connected');
    });

    newSocket.on('incoming-call', (data) => {
      // Incoming call signal received
      setIncomingCall(data);
      speakText(`Incoming ${data.type.toLowerCase()} call from partner.`);
    });

    newSocket.on('call-ended', () => {
      setActiveCall(null);
      setOutgoingCall(null);
      setIncomingCall(null);
      announce('Call ended');
    });

    newSocket.on('incoming-love-note', ({ type }) => {
      setActiveRomance({ type, id: Date.now() });
      announce(`Incoming virtual ${type.toLowerCase()}!`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user]);

  // Handle Register
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      localStorage.setItem('token', data.token);
      setToken(data.token);
    } catch (err) {
      setError(err.message);
      speakText(`Registration error: ${err.message}`);
    }
  };

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token);
      setToken(data.token);
    } catch (err) {
      setError(err.message);
      speakText(`Login error: ${err.message}`);
    }
  };

  // Handle Linking Couple Partner
  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ coupleKey: coupleKeyInput })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to link partner');
      
      if (data.coupleKey && !data.user) {
         setPairSuccess(data.message);
         setUser((prev) => ({ ...prev, coupleKey: data.coupleKey }));
      } else {
        setPairSuccess('Successfully linked! Setting up your space...');
        announce('Successfully linked with your partner! Setting up space.');
        setTimeout(() => {
          localStorage.setItem('token', data.token);
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
      speakText(`Linking error: ${err.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    announce('Logged out');
  };

  // Initiate call
  const startCall = (callType) => {
    if (!socket) return;
    setOutgoingCall({ type: callType });
    announce(`Starting ${callType.toLowerCase()} call to partner`);
  };

  // Render Auth View
  if (!token || !user) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="auth-card">
          <h2 style={{ textAlign: 'center', marginBottom: '24px', fontSize: '1.8rem', fontWeight: 'bold' }}
              onMouseEnter={() => handleHoverSpeak(isRegister ? 'Register' : 'Login')}>
            {isRegister ? 'Create Account' : 'Welcome to Duet'}
          </h2>

          <form onSubmit={isRegister ? handleRegisterSubmit : handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isRegister && (
              <div>
                <label htmlFor="reg-name" style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>Name</label>
                <input
                  id="reg-name"
                  type="text"
                  className="input-field focus-ring"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required
                />
              </div>
            )}
            <div>
              <label htmlFor="auth-email" style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>Email Address</label>
              <input
                id="auth-email"
                type="email"
                className="input-field focus-ring"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="auth-password" style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>Password</label>
              <input
                id="auth-password"
                type="password"
                className="input-field focus-ring"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div style={{ color: 'var(--danger)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn-primary focus-ring" style={{ marginTop: '8px' }}>
              {isRegister ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
              className="focus-ring"
            >
              {isRegister ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Render Pairing / Code Screen
  if (!user.coupleId) {
    if (user.coupleKey) {
       return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="auth-card" style={{ maxWidth: '500px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '16px', fontWeight: 'bold' }}>Waiting for Partner</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Share your Couple Key with your partner. Once they register and enter it, your space will be unlocked!
            </p>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>YOUR COUPLE KEY</span>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '1px', color: 'var(--accent)' }}>
                {user.coupleKey}
              </span>
            </div>
            {pairSuccess && (
              <div style={{ color: 'var(--success)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                <CheckCircle size={16} />
                <span>{pairSuccess}</span>
              </div>
            )}
            <button onClick={() => window.location.reload()} className="btn-primary focus-ring" style={{ width: '100%', marginBottom: '12px' }}>Refresh Status</button>
            <button onClick={handleLogout} className="btn-secondary focus-ring" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
       );
    }

    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="auth-card" style={{ maxWidth: '500px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '16px', fontWeight: 'bold' }}>Pair with Your Partner</h2>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '24px' }}>
            Duet is a private room for exactly two people. Create a unique Couple Key (e.g. "OurFirstDate2024") or enter the one your partner created.
          </p>

          <form onSubmit={handleLinkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="partner-code" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>Enter or Create a Couple Key</label>
              <input
                id="partner-code"
                type="text"
                className="input-field focus-ring"
                value={coupleKeyInput}
                onChange={(e) => setCoupleKeyInput(e.target.value)}
                placeholder="OurFirstDate2024"
                style={{ textAlign: 'center', letterSpacing: '1px' }}
                required
              />
            </div>

            {error && (
              <div style={{ color: 'var(--danger)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn-primary focus-ring">Create / Join Space</button>
          </form>

          <button onClick={handleLogout} className="btn-secondary focus-ring" style={{ width: '100%', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  // Find partner detail
  const partner = user.couple?.users.find((u) => u.id !== user.id);

  const TABS = [
    { id: 'dashboard', icon: <Heart size={22} />, label: 'Home' },
    { id: 'chat',      icon: <MessageCircle size={22} />, label: 'Chat' },
    { id: 'memories',  icon: <CalendarDays size={22} />, label: 'Memories' },
    { id: 'diary',     icon: <Book size={22} />, label: 'Journal' },
    { id: 'funzone',   icon: <Sparkles size={22} />, label: 'Fun' },
    { id: 'themes',    icon: <Palette size={22} />, label: 'Themes' },
    { id: 'settings',  icon: <SettingsIcon size={22} />, label: 'Settings' }
  ];

  // Render Dashboard
  return (
    <div className="app-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <AnimatedBackground effect={animatedEffect} />
      
      {/* 1. Header */}
      <header className="glass-panel" style={{ margin: '16px', padding: '16px 24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {partner ? partner.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '600' }} onMouseEnter={() => handleHoverSpeak(`Connected with ${partner ? partner.name : 'Partner'}`)}>
              {partner ? partner.name : 'Connecting partner...'}
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Our Private Space</span>
          </div>
        </div>

        {/* Call Buttons & Settings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => startCall('AUDIO')}
            className="btn-secondary focus-ring"
            aria-label="Start audio call"
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onMouseEnter={() => handleHoverSpeak('Start audio call')}
          >
            <Phone size={18} />
          </button>
          <button
            onClick={() => startCall('VIDEO')}
            className="btn-secondary focus-ring"
            aria-label="Start video call"
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onMouseEnter={() => handleHoverSpeak('Start video call')}
          >
            <Video size={18} />
          </button>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }} />
          <button
            onClick={handleLogout}
            className="btn-secondary focus-ring"
            aria-label="Sign out"
            style={{ padding: '8px 12px' }}
            onMouseEnter={() => handleHoverSpeak('Sign out')}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* 2. Main Space Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 16px 0 16px', overflow: 'hidden' }}>
        <div className="glass-panel" style={{ flex: 1, borderRadius: '24px', display: 'flex', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          {activeTab === 'dashboard' && <Dashboard user={user} partner={partner} socket={socket} BACKEND_URL={BACKEND_URL} />}
          {activeTab === 'chat'      && <Chat socket={socket} user={user} partner={partner} BACKEND_URL={BACKEND_URL} />}
          {activeTab === 'memories'  && <Memories user={user} BACKEND_URL={BACKEND_URL} />}
          {activeTab === 'diary'     && <Diary user={user} partner={partner} BACKEND_URL={BACKEND_URL} />}
          {activeTab === 'funzone'   && <FunZone user={user} socket={socket} />}
          {activeTab === 'themes'    && <Themes />}
          {activeTab === 'settings'  && <SettingsView user={user} BACKEND_URL={BACKEND_URL} onLogout={handleLogout} />}
        </div>
      </main>

      {/* 3. Navigation Footer */}
      <nav className="glass-panel bottom-nav" style={{ margin: '8px 16px 16px 16px', padding: '6px', borderRadius: '16px', display: 'flex', justifyContent: 'space-around', zIndex: 10, flexShrink: 0 }}>
        {TABS.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="focus-ring"
            aria-label={`${label} tab`}
            onMouseEnter={() => handleHoverSpeak(`Open ${label} tab`)}
            style={{
              background: activeTab === id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              color: activeTab === id ? 'var(--primary)' : 'var(--text-muted)',
              border: 'none', borderRadius: '12px', padding: '12px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              cursor: 'pointer', flex: 1, transition: 'all 0.2s'
            }}
          >
            {icon}
            <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>{label}</span>
          </button>
        ))}
      </nav>

      {/* 4. Active WebRTC Call Overlays */}
      {(outgoingCall || incomingCall || activeCall) && (
        <CallOverlay
          socket={socket}
          user={user}
          partner={partner}
          outgoingCall={outgoingCall}
          incomingCall={incomingCall}
          activeCall={activeCall}
          setOutgoingCall={setOutgoingCall}
          setIncomingCall={setIncomingCall}
          setActiveCall={setActiveCall}
        />
      )}

      {/* 5. Global Romance Overlay */}
      <RomanceOverlay activeRomance={activeRomance} setActiveRomance={setActiveRomance} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
