import React, { useState, useEffect } from 'react';

// ─── Tic-Tac-Toe ─────────────────────────────────────────────────────────────
const WINNING_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function TicTacToe({ user, socket }) {
  const [board, setBoard]     = useState(Array(9).fill(null));
  const [myMark, setMyMark]   = useState('X');
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [winner, setWinner]   = useState(null);

  useEffect(() => {
    if (!socket) return;
    socket.on('ttt-move-update', ({ index, mark }) => {
      setBoard(prev => { const b = [...prev]; b[index] = mark; return b; });
      setIsMyTurn(true);
    });
    socket.on('ttt-reset-update', () => {
      setBoard(Array(9).fill(null)); setWinner(null); setIsMyTurn(true);
    });
    return () => { socket.off('ttt-move-update'); socket.off('ttt-reset-update'); };
  }, [socket]);

  useEffect(() => {
    const w = checkWinner(board);
    if (w) setWinner(w);
  }, [board]);

  const checkWinner = (b) => {
    for (const [a,bI,c] of WINNING_LINES) {
      if (b[a] && b[a] === b[bI] && b[a] === b[c]) return b[a];
    }
    if (b.every(Boolean)) return 'draw';
    return null;
  };

  const handleClick = (i) => {
    if (!isMyTurn || board[i] || winner) return;
    const newBoard = [...board];
    newBoard[i] = myMark;
    setBoard(newBoard);
    setIsMyTurn(false);
    if (socket) socket.emit('ttt-move', { index: i, mark: myMark === 'X' ? 'O' : 'X' });
  };

  const reset = () => {
    setBoard(Array(9).fill(null)); setWinner(null); setIsMyTurn(true);
    if (socket) socket.emit('ttt-reset');
  };

  const status = winner
    ? (winner === 'draw' ? "It's a Draw! 🤝" : `${winner} wins! 🎉`)
    : (isMyTurn ? `Your turn (${myMark})` : "Partner's turn…");

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <p style={{ margin: 0, fontWeight: '600', color: 'var(--primary-light)' }}>{status}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', width: '210px' }}>
        {board.map((cell, i) => (
          <button key={i} onClick={() => handleClick(i)}
            className="focus-ring"
            style={{
              width: '64px', height: '64px', fontSize: '1.8rem', fontWeight: 'bold',
              background: cell ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
              border: '2px solid var(--border-color)', borderRadius: '12px', cursor: cell || winner ? 'default' : 'pointer',
              color: cell === 'X' ? 'var(--primary)' : 'var(--accent)', transition: 'all 0.15s'
            }}>
            {cell}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <select value={myMark} onChange={e => setMyMark(e.target.value)} className="input-field" style={{ padding: '6px 10px', width: 'auto' }}>
          <option value="X">Play as ✖ X</option>
          <option value="O">Play as ⭕ O</option>
        </select>
        <button onClick={reset} className="btn-secondary focus-ring" style={{ padding: '8px 18px' }}>🔄 Reset</button>
      </div>
    </div>
  );
}

// ─── Truth or Dare ───────────────────────────────────────────────────────────
const TRUTHS = [
  "What is the most embarrassing thing that's ever happened to you?",
  "What's the biggest lie you've ever told me?",
  "What was your first impression of me?",
  "What's your biggest insecurity?",
  "What's the most romantic thing you've ever done?",
  "What's a secret you've never told anyone?",
  "What's the most childish thing you still do?",
  "What's your guilty pleasure that you've hidden from me?",
];

const DARES = [
  "Do your best impression of me right now!",
  "Send me the most recent selfie in your camera roll, no filter!",
  "Sing me a love song, even if it's made up!",
  "Write me a 3-line poem about our relationship right now.",
  "Tell me three things you love most about me.",
  "Change your profile photo to something funny for 30 minutes.",
  "Send me a voice note saying something sweet.",
  "Tell me something you've always wanted to tell me but haven't.",
];

function TruthOrDare() {
  const [mode, setMode]   = useState(null); // null | 'TRUTH' | 'DARE'
  const [card, setCard]   = useState('');
  const [flipped, setFlipped] = useState(false);

  const draw = (type) => {
    const list = type === 'TRUTH' ? TRUTHS : DARES;
    setCard(list[Math.floor(Math.random() * list.length)]);
    setMode(type); setFlipped(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '14px' }}>
        <button onClick={() => draw('TRUTH')} className="btn-primary focus-ring" style={{ padding: '12px 28px', fontSize: '1rem' }}>🤔 Truth</button>
        <button onClick={() => draw('DARE')} className="btn-secondary focus-ring" style={{ padding: '12px 28px', fontSize: '1rem' }}>😈 Dare</button>
      </div>
      {flipped && card && (
        <div className="glass-panel" style={{
          padding: '24px', borderRadius: '20px', maxWidth: '380px', textAlign: 'center',
          borderLeft: `4px solid ${mode === 'TRUTH' ? 'var(--primary)' : 'var(--accent)'}`,
          animation: 'fadeIn 0.3s ease'
        }}>
          <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: mode === 'TRUTH' ? 'var(--primary-light)' : 'var(--accent-light)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {mode}
          </span>
          <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.7 }}>{card}</p>
        </div>
      )}
    </div>
  );
}

// ─── Would You Rather ────────────────────────────────────────────────────────
const WYR_PROMPTS = [
  ["Travel the world together for a year with no WiFi", "Stay home but have unlimited budget for comfort"],
  ["Have breakfast in bed every day made by me", "Have a surprise date planned every weekend by me"],
  ["Know every thought I'm having", "Have me know every thought you're having"],
  ["Spend every weekend together for a month", "Have one perfect weekend trip together per year"],
  ["Only communicate by handwritten letters for a week", "No talking — only through music and playlists"],
  ["Watch all our favorite movies together in one weekend", "Re-live our first date exactly as it happened"],
  ["Have a pet together right now", "Travel to a dream destination next month"],
];

function WouldYouRather() {
  const [idx, setIdx]     = useState(0);
  const [chosen, setChosen] = useState(null);
  const prompt = WYR_PROMPTS[idx % WYR_PROMPTS.length];

  const next = () => { setIdx(i => i + 1); setChosen(null); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
      <p style={{ textAlign: 'center', fontWeight: '700', fontSize: '1.1rem', margin: 0, color: 'var(--text-muted)' }}>
        Would You Rather…
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', width: '100%' }}>
        {prompt.map((opt, i) => (
          <button key={i} onClick={() => setChosen(i)} className="focus-ring"
            style={{
              padding: '20px', borderRadius: '16px', fontSize: '0.88rem', lineHeight: 1.6,
              background: chosen === i ? 'linear-gradient(135deg, var(--primary), var(--accent))' : 'rgba(255,255,255,0.03)',
              border: `2px solid ${chosen === i ? 'transparent' : 'var(--border-color)'}`,
              color: chosen === i ? 'white' : 'var(--text-main)',
              cursor: 'pointer', transition: 'all 0.2s', fontWeight: chosen === i ? '700' : '400'
            }}>
            {i === 0 ? 'A) ' : 'B) '}{opt}
          </button>
        ))}
      </div>
      {chosen !== null && (
        <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--primary-light)' }}>
          You chose: <strong>{chosen === 0 ? 'A' : 'B'}!</strong> Share with your partner! 💬
        </div>
      )}
      <button onClick={next} className="btn-secondary focus-ring" style={{ padding: '10px 28px' }}>Next Prompt →</button>
    </div>
  );
}

// ─── Watch Party ─────────────────────────────────────────────────────────────
function WatchParty({ user, socket }) {
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ'); // Default to Rick Astley for fun
  const [inputUrl, setInputUrl] = useState('');

  useEffect(() => {
    if (!socket) return;
    socket.on('video-state-change', (data) => {
      if (data.senderId !== user.id && data.videoId) {
        setVideoId(data.videoId);
      }
    });
    return () => socket.off('video-state-change');
  }, [socket, user.id]);

  const handleSync = () => {
    // Extract video ID from youtube URL
    let vid = inputUrl;
    if (inputUrl.includes('v=')) vid = inputUrl.split('v=')[1].split('&')[0];
    else if (inputUrl.includes('youtu.be/')) vid = inputUrl.split('youtu.be/')[1].split('?')[0];

    if (vid) {
      setVideoId(vid);
      if (socket) socket.emit('video-state-change', { state: 'LOAD', videoId: vid });
      setInputUrl('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
      <p style={{ textAlign: 'center', fontWeight: '700', fontSize: '1.1rem', margin: 0, color: 'var(--primary-light)' }}>
        🎬 Watch Party Mode
      </p>
      
      <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '500px' }}>
        <input 
          type="text" 
          value={inputUrl} 
          onChange={(e) => setInputUrl(e.target.value)} 
          placeholder="Paste YouTube URL to sync..." 
          className="input-field focus-ring" 
        />
        <button onClick={handleSync} className="btn-primary focus-ring">Sync</button>
      </div>

      <div style={{ width: '100%', maxWidth: '720px', aspectRatio: '16/9', background: '#000', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <iframe 
          width="100%" 
          height="100%" 
          src={`https://www.youtube.com/embed/${videoId}?autoplay=0`} 
          title="YouTube video player" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        ></iframe>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>*Note: Full playback sync requires YouTube API, currently syncing video URL.</p>
    </div>
  );
}


// ─── Main FunZone ─────────────────────────────────────────────────────────────
export default function FunZone({ user, socket }) {
  const [tab, setTab] = useState('ttt');

  const TABS = [
    { key: 'ttt',  label: '✖⭕ Tic-Tac-Toe' },
    { key: 'tod',  label: '🎴 Truth or Dare' },
    { key: 'wyr',  label: '🤔 Would You Rather' },
    { key: 'watch', label: '🍿 Watch Party' }
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', overflowY: 'auto' }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>🎮 Fun Zone</h2>
      <div className="tools-nav">
        {TABS.map(t => (
          <button key={t.key} className={`tools-nav-btn focus-ring ${tab===t.key?'active':''}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>
      <div className="glass-panel" style={{ padding: '30px', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
        {tab === 'ttt' && <TicTacToe user={user} socket={socket} />}
        {tab === 'tod' && <TruthOrDare />}
        {tab === 'wyr' && <WouldYouRather />}
        {tab === 'watch' && <WatchParty user={user} socket={socket} />}
      </div>
    </div>
  );
}
