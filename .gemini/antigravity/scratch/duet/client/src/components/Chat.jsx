import React, { useState, useEffect, useRef } from 'react';
import { Send, Image, Mic, Square, CornerUpLeft, Trash2, Smile, X } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

const REACTION_EMOJIS = ['❤️', '😂', '😍', '😢', '👍', '🔥', '😮', '🥰'];

export default function Chat({ socket, user, partner, BACKEND_URL }) {
  const [messages, setMessages]           = useState([]);
  const [inputText, setInputText]         = useState('');
  const [isTyping, setIsTyping]           = useState(false);
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const typingTimeoutRef                  = useRef(null);

  // Reply state
  const [replyTo, setReplyTo]             = useState(null); // { id, content, senderName }

  // Special message states
  const [isDisappearingMode, setIsDisappearingMode] = useState(false);
  const [scheduleDate, setScheduleDate]             = useState('');
  const [showMediaPicker, setShowMediaPicker]       = useState(false); // For stickers/gifs

  // Context menu (reaction picker / delete)
  const [contextMenu, setContextMenu]     = useState(null); // { msgId, isMine, x, y }

  // Audio Recording
  const [isRecording, setIsRecording]     = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef   = useRef(null);
  const inputRef       = useRef(null);
  const { announce, speakText, subtitlesEnabled } = useAccessibility();

  // ─── 1. Load initial messages ───────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/messages`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) { setMessages(data); scrollToBottom(); }
      })
      .catch(console.error);
  }, [BACKEND_URL]);

  // ─── 2. Socket listeners ────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onNewMsg = (msg) => {
      setMessages(prev => [...prev, msg]);
      scrollToBottom();
      if (msg.senderId !== user.id)
        announce(`New message from ${partner?.name || 'partner'}: ${msg.content || 'media file'}`);
    };

    const onPartnerTyping    = ({ userId }) => { if (userId !== user.id) setPartnerIsTyping(true);  };
    const onPartnerStopTyping = ({ userId }) => { if (userId !== user.id) setPartnerIsTyping(false); };

    const onReactionUpdated = ({ messageId, reactions }) => {
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, reactions: JSON.stringify(reactions) } : m)
      );
    };

    const onMessageDeleted = ({ messageId, isDisappearing }) => {
      setMessages(prev =>
        prev.map(m => m.id === messageId
          ? { ...m, isDeletedForEveryone: true, content: isDisappearing ? 'This secret note disappeared.' : 'This message was deleted.', fileUrl: null }
          : m
        )
      );
    };

    const onMessageRead = ({ messageId, readAt }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, readAt } : m));
    };

    socket.on('new-message',              onNewMsg);
    socket.on('partner-typing',           onPartnerTyping);
    socket.on('partner-stop-typing',      onPartnerStopTyping);
    socket.on('message-reaction-updated', onReactionUpdated);
    socket.on('message-deleted',          onMessageDeleted);
    socket.on('message-read-updated',     onMessageRead);

    return () => {
      socket.off('new-message',              onNewMsg);
      socket.off('partner-typing',           onPartnerTyping);
      socket.off('partner-stop-typing',      onPartnerStopTyping);
      socket.off('message-reaction-updated', onReactionUpdated);
      socket.off('message-deleted',          onMessageDeleted);
      socket.off('message-read-updated',     onMessageRead);
    };
  }, [socket, user, partner]);

  // ─── Close context menu on outside click ────────────────────────────────────
  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const scrollToBottom = () =>
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

  // ─── Typing indicator ───────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket) return;
    if (!isTyping) { setIsTyping(true); socket.emit('typing'); }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stop-typing');
    }, 2000);
  };

  // ─── Send text message ──────────────────────────────────────────────────────
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    socket.emit('send-message', {
      content: inputText,
      type: 'TEXT',
      replyToId: replyTo?.id || null,
      isDisappearing: isDisappearingMode,
      scheduledFor: scheduleDate || null
    });

    setInputText('');
    setReplyTo(null);
    setIsDisappearingMode(false);
    setScheduleDate('');
    setIsTyping(false);
    socket.emit('stop-typing');
  };

  // ─── Upload image ───────────────────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/messages/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await res.json();
      if (socket && data.fileUrl)
        socket.emit('send-message', { content: 'Shared a photo', type: 'IMAGE', fileUrl: data.fileUrl });
    } catch (err) { console.error('Image upload failed:', err); }
  };

  const sendStickerOrGif = (url, isGif = false) => {
    if (!socket) return;
    socket.emit('send-message', { content: isGif ? 'Sent a GIF' : 'Sent a sticker', type: 'IMAGE', fileUrl: url });
    setShowMediaPicker(false);
  };

  // ─── Voice recording ─────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks   = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        const blob     = new Blob(chunks, { type: 'audio/webm' });
        const file     = new File([blob], 'voice-note.webm', { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', file);
        try {
          announce('Sending voice message...');
          const res  = await fetch(`${BACKEND_URL}/api/messages/upload`, {
            method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            body: formData
          });
          const data = await res.json();
          if (socket && data.fileUrl)
            socket.emit('send-message', { content: 'Sent a voice message', type: 'AUDIO', fileUrl: data.fileUrl });
        } catch (err) { console.error('Audio upload failed:', err); }
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      announce('Recording started. Press stop to send.');
    } catch (err) { console.error('Recording error:', err); }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      announce('Recording stopped.');
    }
  };

  // ─── Reaction ────────────────────────────────────────────────────────────────
  const sendReaction = (msgId, emoji) => {
    if (!socket) return;
    socket.emit('message-reaction', { messageId: msgId, emoji });
    setContextMenu(null);
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const deleteMessage = (msgId) => {
    if (!socket) return;
    socket.emit('message-delete', { messageId: msgId });
    setContextMenu(null);
  };

  // ─── Unlock Disappearing ──────────────────────────────────────────────────────
  const unlockSecretMessage = (msgId) => {
    if (!socket) return;
    socket.emit('mark-message-read', { messageId: msgId });
  };

  // ─── Context menu open ────────────────────────────────────────────────────────
  const openContextMenu = (e, msg) => {
    e.preventDefault();
    e.stopPropagation();
    const isMine = msg.senderId === user.id;
    setContextMenu({ msgId: msg.id, isMine, x: e.clientX, y: e.clientY });
  };

  // ─── Parse reactions ─────────────────────────────────────────────────────────
  const parseReactions = (reactionsStr) => {
    try { return JSON.parse(reactionsStr || '[]'); } catch { return []; }
  };

  const groupReactions = (reactionsArr) => {
    const map = {};
    reactionsArr.forEach(r => {
      map[r.emoji] = (map[r.emoji] || 0) + 1;
    });
    return Object.entries(map);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>

      {/* ── Messages Feed ── */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {messages.length === 0 ? (
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💬</span>
            <span style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '6px' }}>Your Private Chat Room</span>
            <span style={{ fontSize: '0.85rem' }}>Say hello to start the conversation!</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine     = msg.senderId === user.id;
            const reactions  = parseReactions(msg.reactions);
            const grouped    = groupReactions(reactions);
            const isDeleted  = msg.isDeletedForEveryone;

            return (
              <div
                key={msg.id}
                style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}
              >
                {/* Reply context bar */}
                {msg.replyToMessage && !isDeleted && (
                  <div style={{
                    maxWidth: '75%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px 10px 0 0',
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    borderLeft: '3px solid var(--accent)',
                    marginBottom: '-6px'
                  }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-light)', display: 'block' }}>
                      ↩ {msg.replyToMessage.sender?.name}
                    </span>
                    <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', display: 'block', maxWidth: '250px' }}>
                      {msg.replyToMessage.content}
                    </span>
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`message-bubble ${isMine ? 'mine' : 'partner'}`}
                  tabIndex={0}
                  onContextMenu={e => !isDeleted && openContextMenu(e, msg)}
                  onFocus={() => {
                    if (!isDeleted) {
                      const who  = isMine ? 'You' : (partner?.name || 'Partner');
                      const desc = msg.type === 'TEXT' ? msg.content : `sent a ${msg.type?.toLowerCase()} file`;
                      speakText(`${who}: ${desc}`);
                    }
                  }}
                  style={{
                    opacity: isDeleted ? 0.5 : 1,
                    fontStyle: isDeleted ? 'italic' : 'normal',
                    position: 'relative',
                    cursor: isDeleted ? 'default' : 'context-menu'
                  }}
                >
                  {/* Sender */}
                  <div style={{ fontSize: '0.72rem', opacity: 0.65, marginBottom: '4px', fontWeight: 'bold' }}>
                    {isMine ? 'You' : (partner?.name || 'Partner')}
                  </div>

                  {/* Scheduled Message Lock */}
                  {msg.scheduledFor && new Date(msg.scheduledFor) > new Date() && !isMine && !isDeleted ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 0', color: 'var(--accent)' }}>
                       <span>🔒</span>
                       <span>Unlocks at {new Date(msg.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ) : msg.isDisappearing && !isMine && !msg.readAt && !isDeleted ? (
                    /* Disappearing Message Lock */
                    <button 
                      onClick={() => unlockSecretMessage(msg.id)}
                      className="focus-ring"
                      style={{ background: 'none', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                       Tap to view secret note
                    </button>
                  ) : (
                    <>
                      {/* Text */}
                      {msg.type === 'TEXT' && <div style={{ lineHeight: 1.5 }}>{msg.content}</div>}

                      {/* Image */}
                  {msg.type === 'IMAGE' && !isDeleted && (
                    <div style={{ borderRadius: '10px', overflow: 'hidden', marginTop: '4px' }}>
                      <img
                        src={`${BACKEND_URL}${msg.fileUrl}`}
                        alt="Shared attachment"
                        style={{ maxWidth: '260px', maxHeight: '300px', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  )}

                  {/* Audio */}
                  {msg.type === 'AUDIO' && !isDeleted && (
                    <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <audio src={`${BACKEND_URL}${msg.fileUrl}`} controls style={{ maxWidth: '240px' }} />
                      {subtitlesEnabled && (
                        <span style={{ fontSize: '0.75rem', fontStyle: 'italic', opacity: 0.8 }}>
                          [Voice message]
                        </span>
                      )}
                    </div>
                  )}

                  {/* Timestamp & Status */}
                  <div style={{ fontSize: '0.62rem', textAlign: 'right', marginTop: '6px', opacity: 0.5, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px' }}>
                    {msg.isDisappearing && <span title="Disappearing Note">🔥</span>}
                    {msg.scheduledFor && <span title="Scheduled Message">⏳</span>}
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.readAt && isMine && <span>✓✓</span>}
                  </div>
                </>
              )}
            </div>

                {/* Reaction pills */}
                {grouped.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                    {grouped.map(([emoji, count]) => (
                      <span
                        key={emoji}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '999px',
                          padding: '2px 8px',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => sendReaction(msg.id, emoji)}
                      >
                        {emoji} {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {partnerIsTyping && (
          <div className="message-bubble partner" style={{ alignSelf: 'flex-start', padding: '10px 16px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {partner?.name || 'Partner'} is typing…
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Floating Context Menu ── */}
      {contextMenu && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000,
            background: 'var(--bg-card)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '12px',
            boxShadow: 'var(--shadow-premium)',
            minWidth: '240px'
          }}
        >
          {/* Reaction row */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-around', marginBottom: '10px' }}>
            {REACTION_EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => sendReaction(contextMenu.msgId, e)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', transition: 'transform 0.15s', borderRadius: '8px', padding: '4px' }}
                onMouseEnter={el => el.currentTarget.style.transform = 'scale(1.3)'}
                onMouseLeave={el => el.currentTarget.style.transform = 'scale(1)'}
              >
                {e}
              </button>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Reply */}
            <button
              onClick={() => {
                const msg = messages.find(m => m.id === contextMenu.msgId);
                if (msg) {
                  setReplyTo({ id: msg.id, content: msg.content, senderName: msg.senderId === user.id ? 'You' : (partner?.name || 'Partner') });
                  inputRef.current?.focus();
                }
                setContextMenu(null);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              <CornerUpLeft size={14} /> Reply
            </button>

            {/* Delete (own messages only) */}
            {contextMenu.isMine && (
              <button
                onClick={() => deleteMessage(contextMenu.msgId)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <Trash2 size={14} /> Delete for everyone
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Reply Preview Bar ── */}
      {replyTo && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderTop: '1px solid var(--border-color)',
          borderLeft: '3px solid var(--accent)',
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--accent-light)', fontWeight: 'bold' }}>
              Replying to {replyTo.senderName}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px', display: 'block' }}>
              {replyTo.content}
            </span>
          </div>
          <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Input Bar Area ── */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        
        {/* Settings Bar for Secret / Scheduled */}
        <div style={{ display: 'flex', gap: '8px', padding: '0 20px', marginBottom: '-8px', zIndex: 1 }}>
           <button 
             onClick={() => setIsDisappearingMode(!isDisappearingMode)}
             style={{ 
               background: isDisappearingMode ? 'var(--accent)' : 'rgba(255,255,255,0.05)', 
               color: isDisappearingMode ? '#fff' : 'var(--text-muted)',
               border: '1px solid var(--border-color)', borderRadius: '12px 12px 0 0', padding: '4px 12px', fontSize: '0.75rem', cursor: 'pointer',
               borderBottom: 'none'
             }}
           >
             🔥 Secret Note
           </button>
           <div style={{ 
               background: scheduleDate ? 'var(--primary)' : 'rgba(255,255,255,0.05)', 
               color: scheduleDate ? '#fff' : 'var(--text-muted)',
               border: '1px solid var(--border-color)', borderRadius: '12px 12px 0 0', padding: '4px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px',
               borderBottom: 'none'
             }}>
             ⏳ 
             <input 
               type="time" 
               value={scheduleDate ? new Date(scheduleDate).toTimeString().substring(0,5) : ''}
               onChange={(e) => {
                 if (!e.target.value) { setScheduleDate(''); return; }
                 const [h, m] = e.target.value.split(':');
                 const d = new Date(); d.setHours(h); d.setMinutes(m); d.setSeconds(0);
                 if (d < new Date()) d.setDate(d.getDate() + 1); // next day if past
                 setScheduleDate(d.toISOString());
               }}
               style={{ background: 'transparent', border: 'none', color: 'inherit', outline: 'none', fontSize: '0.75rem' }}
             />
           </div>
        </div>

        <div className="glass-panel chat-input-bar" style={{ borderLeft: 'none', borderRight: 'none', borderBottom: 'none', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 2, position: 'relative' }}>
          
          {showMediaPicker && (
            <div className="glass-panel" style={{ position: 'absolute', bottom: '70px', left: '20px', padding: '16px', borderRadius: '16px', width: '280px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Stickers & GIFs</span>
                <button onClick={() => setShowMediaPicker(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✖</button>
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {/* Mock Stickers */}
                <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjM4bXk2aTZnNGY2M3A5cjN2NWVlMWtzaG1wa2o2ZDV6b2V5Z3Q0NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/13CoXy66jPqXnO/giphy.gif" alt="sticker" style={{ width: '60px', height: '60px', cursor: 'pointer', borderRadius: '8px' }} onClick={() => sendStickerOrGif('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjM4bXk2aTZnNGY2M3A5cjN2NWVlMWtzaG1wa2o2ZDV6b2V5Z3Q0NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/13CoXy66jPqXnO/giphy.gif')} />
                <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZHh3aTNteWd5aTN6aTNteWd5aTN6aTNteWd5aTN6aTNteWd5aTN6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/MDJ9IbxxvDUQM/giphy.gif" alt="sticker" style={{ width: '60px', height: '60px', cursor: 'pointer', borderRadius: '8px' }} onClick={() => sendStickerOrGif('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZHh3aTNteWd5aTN6aTNteWd5aTN6aTNteWd5aTN6aTNteWd5aTN6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/MDJ9IbxxvDUQM/giphy.gif')} />
                {/* Mock GIFs */}
                <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeGJhNndxeGFqYzdwOGhqcW4waWxqMWcydWcydWcydWcydWcydWcydSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/kFIfiwvzJjbUsNbIg5/giphy.gif" alt="gif" style={{ width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer', borderRadius: '8px' }} onClick={() => sendStickerOrGif('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeGJhNndxeGFqYzdwOGhqcW4waWxqMWcydWcydWcydWcydWcydWcydSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/kFIfiwvzJjbUsNbIg5/giphy.gif', true)} />
              </div>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleImageUpload} />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-secondary focus-ring"
          aria-label="Upload photo"
          style={{ padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Image size={18} />
        </button>

        <button
          onClick={() => setShowMediaPicker(!showMediaPicker)}
          className="btn-secondary focus-ring"
          aria-label="Send sticker or gif"
          style={{ padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: showMediaPicker ? 'var(--primary)' : undefined }}
        >
          <span style={{ fontSize: '1.2rem', lineHeight: '18px' }}>😀</span>
        </button>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`btn-secondary focus-ring ${isRecording ? 'pulse' : ''}`}
          aria-label={isRecording ? 'Stop recording' : 'Record voice message'}
          style={{
            padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: isRecording ? 'var(--primary)' : undefined, color: isRecording ? 'white' : undefined
          }}
        >
          {isRecording ? <Square size={18} /> : <Mic size={18} />}
        </button>

        <form onSubmit={handleSendMessage} style={{ flex: 1, display: 'flex', gap: '10px' }}>
          <input
            ref={inputRef}
            type="text"
            className="input-field focus-ring"
            value={inputText}
            onChange={handleInputChange}
            placeholder={isRecording ? 'Recording audio…' : 'Type a message…'}
            disabled={isRecording}
            aria-label="Chat message input"
          />
          <button
            type="submit"
            className="btn-primary focus-ring"
            aria-label="Send message"
            disabled={!inputText.trim()}
            style={{ padding: '10px 16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
