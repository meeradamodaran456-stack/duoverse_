import React, { useState, useEffect, useRef } from 'react';
import { Heart, Smile, Sparkles, Send, Coffee } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import RelationshipGarden from './RelationshipGarden';
import SleepTracker from './SleepTracker';

export default function Dashboard({ user, partner, socket, BACKEND_URL }) {
  const { speakText, announce } = useAccessibility();
  const [timeTogether, setTimeTogether] = useState({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Mood State
  const [moods, setMoods] = useState({ myMood: null, partnerMood: null });
  const [selectedMood, setSelectedMood] = useState('😊');
  const [moodNote, setMoodNote] = useState('');
  
  // Love notes State
  const [hugs, setHugs] = useState(0);
  const [kisses, setKisses] = useState(0);
  const [recentNotes, setRecentNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  // Daily Question State
  const [dailyQuestion, setDailyQuestion] = useState(null);
  const [myAnswer, setMyAnswer] = useState('');

  // Floating animations state
  const [floatingHearts, setFloatingHearts] = useState([]); // { id, x, char }

  // 1. Ticking Anniversary Timer
  useEffect(() => {
    const anniversary = user.couple?.anniversary;
    if (!anniversary) return;

    const timer = setInterval(() => {
      const start = new Date(anniversary);
      const now = new Date();
      const diff = now - start;

      if (diff <= 0) return;

      const seconds = Math.floor((diff / 1000) % 60);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      
      // Approximate date math
      const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
      const years = Math.floor(totalDays / 365);
      const months = Math.floor((totalDays % 365) / 30);
      const days = Math.floor((totalDays % 365) % 30);

      setTimeTogether({ years, months, days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [user.couple?.anniversary]);

  // 2. Load Moods & Love Notes & Daily Question
  useEffect(() => {
    fetchMoods();
    fetchLoveNotes();
    fetchDailyQuestion();
  }, [socket]);

  const fetchMoods = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/couple/mood`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setMoods(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLoveNotes = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/couple/love-notes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setHugs(data.hugsCount);
      setKisses(data.kissesCount);
      setRecentNotes(data.recentNotes);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDailyQuestion = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/couple/daily-question`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setDailyQuestion(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Mood
  const handleMoodSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/couple/mood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ mood: selectedMood, note: moodNote })
      });
      if (res.ok) {
        setMoodNote('');
        announce('Mood status updated!');
        fetchMoods();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Daily Question Answer
  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!myAnswer.trim()) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/couple/daily-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ questionId: dailyQuestion.id, answer: myAnswer })
      });
      if (res.ok) {
        setMyAnswer('');
        announce('Answer submitted! Waiting for partner to unlock.');
        fetchDailyQuestion();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Send Love note / Hug / Kiss
  const sendLoveAction = async (type) => {
    try {
      // 1. Log to DB
      const res = await fetch(`${BACKEND_URL}/api/couple/love-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type })
      });
      
      if (res.ok) {
        // 2. Emit socket event
        if (socket) {
          socket.emit('send-love-note', { type });
        }
        triggerFloatingHearts(type === 'HUG' ? '🤗' : '💋');
        announce(`Sent a virtual ${type.toLowerCase()}!`);
        fetchLoveNotes();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendTextLoveNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/couple/love-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type: 'NOTE', content: newNote })
      });
      if (res.ok) {
        setNewNote('');
        announce('Love note sent to mailbox!');
        fetchLoveNotes();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const triggerFloatingHearts = (char) => {
    const newHearts = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + '-' + i + Math.random(),
      x: Math.random() * 80 + 10, // Percent width
      char
    }));
    setFloatingHearts(prev => [...prev, ...newHearts]);

    // Cleanup
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => !newHearts.find(nh => nh.id === h.id)));
    }, 4000);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', overflowY: 'auto', position: 'relative' }}>
      
      {/* Floating animations overlay */}
      {floatingHearts.map((heart) => (
        <div
          key={heart.id}
          className="floating-heart"
          style={{
            left: `${heart.x}%`,
            '--random-x': `${(Math.random() - 0.5) * 150}px`
          }}
        >
          {heart.char}
        </div>
      ))}

      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Heart size={28} color="var(--accent)" fill="var(--accent)" className="pulse" />
          <span>Our Love Journey</span>
        </h2>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Exclusively for {user.name} & {partner ? partner.name : 'partner'}</span>
      </div>

      {/* Relationship Timer */}
      {user.couple?.anniversary ? (
        <section className="glass-panel" style={{ padding: '24px', borderRadius: '24px', textAlign: 'center', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(236,72,153,0.05) 0%, rgba(244,63,94,0.05) 100%)', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: '12px' }}>
            Time Together
          </span>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '16px' }}>
            {[
              { label: 'Years', val: timeTogether.years },
              { label: 'Months', val: timeTogether.months },
              { label: 'Days', val: timeTogether.days },
              { label: 'Hours', val: timeTogether.hours },
              { label: 'Mins', val: timeTogether.minutes },
              { label: 'Secs', val: timeTogether.seconds }
            ].map((t) => (
              <div key={t.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '16px', minWidth: '80px', padding: '12px 8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                <span style={{ display: 'block', fontSize: '2rem', fontWeight: '800', color: 'var(--primary-light)' }}>
                  {t.val}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.label}</span>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', textAlign: 'center', marginBottom: '24px' }}>
          <span>Enter your anniversary date in settings to start the love timer!</span>
        </div>
      )}

      <div className="dashboard-grid">
        
        {/* Card 1: Daily Mood Board */}
        <section className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smile size={18} color="var(--primary)" />
            <span>Daily Mood Tracker</span>
          </h3>

          {/* Show moods */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Your Mood</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '1.8rem' }}>{moods.myMood?.mood || '😶'}</span>
                <span style={{ fontSize: '0.9rem', fontStyle: moods.myMood?.note ? 'normal' : 'italic', color: moods.myMood?.note ? 'var(--text-main)' : 'var(--text-muted)' }}>
                  {moods.myMood?.note || 'No note logged'}
                </span>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{partner ? partner.name : 'Partner'}'s Mood</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '1.8rem' }}>{moods.partnerMood?.mood || '😶'}</span>
                <span style={{ fontSize: '0.9rem', fontStyle: moods.partnerMood?.note ? 'normal' : 'italic', color: moods.partnerMood?.note ? 'var(--text-main)' : 'var(--text-muted)' }}>
                  {moods.partnerMood?.note || 'No update yet'}
                </span>
              </div>
            </div>
          </div>

          {/* Update my mood */}
          <form onSubmit={handleMoodSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>How are you feeling today?</span>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
              {['😊', '😍', '😴', '😢', '😡', '🩺'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMood(m)}
                  className="focus-ring"
                  style={{
                    fontSize: '1.6rem',
                    background: selectedMood === m ? 'rgba(255,255,255,0.1)' : 'none',
                    border: selectedMood === m ? '1px solid var(--primary)' : 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="input-field focus-ring"
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                placeholder="Add a brief note..."
                style={{ padding: '8px 12px' }}
              />
              <button type="submit" className="btn-primary focus-ring" style={{ padding: '8px 16px' }}>
                Set
              </button>
            </div>
          </form>
        </section>

        {/* Card 2: Interactive Love Box */}
        <section className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart size={18} color="var(--accent)" />
            <span>Virtual Interaction Box</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              onClick={() => sendLoveAction('HUG')}
              className="btn-secondary focus-ring"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '16px' }}
            >
              <span style={{ fontSize: '2rem' }}>🤗</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Send Hug ({hugs})</span>
            </button>

            <button
              onClick={() => sendLoveAction('KISS')}
              className="btn-secondary focus-ring"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '16px' }}
            >
              <span style={{ fontSize: '2rem' }}>💋</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Send Kiss ({kisses})</span>
            </button>
          </div>

          <form onSubmit={sendTextLoveNote} style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
            <input
              type="text"
              className="input-field focus-ring"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write a sweet love note..."
              style={{ padding: '8px 12px' }}
            />
            <button type="submit" className="btn-primary focus-ring" style={{ padding: '8px 12px' }}>
              <Send size={16} />
            </button>
          </form>
        </section>

        {/* Card 3: Daily Question Prompt */}
        <section className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', gridColumn: 'span 1' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="gold" />
            <span>Daily Couple Quiz</span>
          </h3>

          {dailyQuestion ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              <blockquote style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', fontStyle: 'italic', borderLeft: '3px solid var(--accent)', paddingLeft: '12px', color: 'var(--text-main)' }}>
                "{dailyQuestion.question}"
              </blockquote>

              {dailyQuestion.bothAnswered ? (
                // Both answered: show answers
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 'bold' }}>Your Answer</span>
                    <span style={{ fontSize: '0.85rem' }}>{dailyQuestion.myAnswer?.answer}</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-light)', fontWeight: 'bold' }}>{partner ? partner.name : 'Partner'}'s Answer</span>
                    <span style={{ fontSize: '0.85rem' }}>{dailyQuestion.partnerAnswer?.answer}</span>
                  </div>
                </div>
              ) : dailyQuestion.myAnswer ? (
                // Only I answered
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px dashed var(--border-color)', margin: 'auto 0' }}>
                  <span style={{ fontSize: '1.4rem', display: 'block', marginBottom: '6px' }}>🔒</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {dailyQuestion.partnerHasAnswered
                      ? "Partner has answered! Unlocking in progress..."
                      : "You've answered! Waiting for partner to reply."}
                  </span>
                </div>
              ) : (
                // Neither/I haven't answered
                <form onSubmit={handleAnswerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                  <textarea
                    className="input-field focus-ring"
                    value={myAnswer}
                    onChange={(e) => setMyAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={2}
                    style={{ resize: 'none', fontSize: '0.85rem' }}
                    required
                  />
                  <button type="submit" className="btn-primary focus-ring" style={{ width: '100%', padding: '8px' }}>
                    Reveal Answers
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <span>Loading today's question...</span>
            </div>
          )}
        </section>

        {/* Card 4: Sleep Tracker */}
        <SleepTracker user={user} partner={partner} BACKEND_URL={BACKEND_URL} socket={socket} />

        {/* Card 5: Relationship Garden */}
        <RelationshipGarden user={user} socket={socket} />

      </div>

      {/* Love Mailbox Notes Section */}
      <section className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginTop: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Coffee size={18} color="var(--primary-light)" />
          <span>Our Love Letter Mailbox</span>
        </h3>

        {recentNotes.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
            <span>Mailbox is currently empty. Drop a sweet message above!</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
            {recentNotes.map((note) => {
              const isMine = note.senderId === user.id;
              return (
                <div
                  key={note.id}
                  style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-color)',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                  }}
                >
                  <span style={{ display: 'block', fontSize: '0.7rem', color: isMine ? 'var(--primary-light)' : 'var(--accent-light)', fontWeight: 'bold', marginBottom: '2px' }}>
                    {isMine ? 'You' : note.sender?.name}
                  </span>
                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.4' }}>{note.content}</p>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
