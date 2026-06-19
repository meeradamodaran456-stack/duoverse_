const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const memoryRoutes = require('./routes/memories');
const accessibilityRoutes = require('./routes/accessibility');
const diaryRoutes = require('./routes/diary');
const toolRoutes = require('./routes/tools');
const customizationRoutes = require('./routes/customization');
const coupleRoutes = require('./routes/couple');
const capsuleRoutes = require('./routes/capsules');
const sleepRoutes = require('./routes/sleep');

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins for dev simplicity
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-duet-app';

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// REST Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/accessibility', accessibilityRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/customization', customizationRoutes);
app.use('/api/couple', coupleRoutes);
app.use('/api/capsules', capsuleRoutes);
app.use('/api/sleep', sleepRoutes);

// Simple status endpoint
app.get('/status', (req, res) => {
  res.json({ status: 'running', timestamp: new Date() });
});

// Serve frontend in production (build target placeholder)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Socket.IO JWT Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded; // Contains id, email, coupleId
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.IO Handler
io.on('connection', async (socket) => {
  const userId = socket.user.id;
  
  // Re-fetch user in case coupleId was recently updated via REST API
  let user;
  try {
    user = await prisma.user.findUnique({ where: { id: userId } });
  } catch (err) {
    console.error('Socket connection DB error:', err);
  }

  const coupleId = user ? user.coupleId : socket.user.coupleId;

  if (coupleId) {
    socket.join(coupleId);
    console.log(`User ${userId} joined couple room ${coupleId}`);
  }

  // Helper to update last interaction
  const updateInteraction = async () => {
    if (!coupleId) return;
    try {
      await prisma.couple.update({
        where: { id: coupleId },
        data: { lastInteraction: new Date() }
      });
      io.to(coupleId).emit('interaction-updated', { date: new Date() });
    } catch (e) {
      console.error('Failed to update interaction:', e);
    }
  };

  // Real-time Chat
  socket.on('send-message', async (data) => {
    if (!coupleId) return;

    const { content, type, fileUrl, replyToId, scheduledFor, isDisappearing } = data;
    try {
      const newMessage = await prisma.message.create({
        data: {
          coupleId,
          senderId: userId,
          content: content || '',
          type: type || 'TEXT',
          fileUrl: fileUrl || null,
          replyToId: replyToId || null,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          isDisappearing: isDisappearing || false
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          },
          replyToMessage: {
            include: {
              sender: {
                select: { id: true, name: true }
              }
            }
          }
        }
      });

      io.to(coupleId).emit('new-message', newMessage);
      updateInteraction();
    } catch (err) {
      console.error('Failed to save message:', err);
    }
  });

  // Mark message as read
  socket.on('mark-message-read', async (data) => {
    if (!coupleId) return;
    try {
      const message = await prisma.message.findUnique({ where: { id: data.messageId } });
      if (!message || message.coupleId !== coupleId) return;

      const updated = await prisma.message.update({
        where: { id: data.messageId },
        data: { readAt: new Date() }
      });

      // If it's a disappearing message, notify clients to remove content after a short delay
      if (updated.isDisappearing) {
        setTimeout(async () => {
           await prisma.message.update({
             where: { id: data.messageId },
             data: { isDeletedForEveryone: true, content: "This secret note disappeared." }
           });
           io.to(coupleId).emit('message-deleted', { messageId: data.messageId, isDisappearing: true });
        }, 10000); // 10 seconds to read it
      }

      io.to(coupleId).emit('message-read-updated', { messageId: data.messageId, readAt: updated.readAt });
    } catch (e) {
      console.error(e);
    }
  });

  // Typing indicators
  socket.on('typing', () => {
    if (coupleId) {
      socket.to(coupleId).emit('partner-typing', { userId });
    }
  });

  socket.on('stop-typing', () => {
    if (coupleId) {
      socket.to(coupleId).emit('partner-stop-typing', { userId });
    }
  });

  // Message Reaction socket events
  socket.on('message-reaction', async (data) => {
    if (!coupleId) return;
    try {
      const message = await prisma.message.findUnique({
        where: { id: data.messageId }
      });
      if (!message || message.coupleId !== coupleId) return;
      
      let reactions = [];
      try {
        reactions = JSON.parse(message.reactions || '[]');
      } catch (e) {
        reactions = [];
      }
      
      reactions = reactions.filter(r => r.userId !== userId);
      reactions.push({ userId, emoji: data.emoji });
      
      await prisma.message.update({
        where: { id: data.messageId },
        data: { reactions: JSON.stringify(reactions) }
      });
      
      io.to(coupleId).emit('message-reaction-updated', { messageId: data.messageId, reactions });
      updateInteraction();
    } catch (e) {
      console.error(e);
    }
  });

  // Message Delete socket events
  socket.on('message-delete', async (data) => {
    if (!coupleId) return;
    try {
      const message = await prisma.message.findUnique({
        where: { id: data.messageId }
      });
      if (!message || message.senderId !== userId) return;
      
      await prisma.message.update({
        where: { id: data.messageId },
        data: {
          isDeletedForEveryone: true,
          content: "This message was deleted.",
          fileUrl: null
        }
      });
      
      io.to(coupleId).emit('message-deleted', { messageId: data.messageId });
    } catch (e) {
      console.error(e);
    }
  });

  // Send virtual love note socket event
  socket.on('send-love-note', (data) => {
    if (coupleId) {
      socket.to(coupleId).emit('incoming-love-note', { senderId: userId, type: data.type });
      updateInteraction();
    }
  });

  // Tic-Tac-Toe socket events
  socket.on('ttt-move', (data) => {
    if (coupleId) {
      socket.to(coupleId).emit('ttt-move-update', data);
      updateInteraction();
    }
  });

  socket.on('ttt-reset', () => {
    if (coupleId) {
      socket.to(coupleId).emit('ttt-reset-update');
    }
  });

  // WebRTC Calling System (Signaling)
  socket.on('call-user', (data) => {
    // data should contain { offer, type } (type = 'AUDIO' or 'VIDEO')
    if (coupleId) {
      socket.to(coupleId).emit('incoming-call', {
        offer: data.offer,
        callerId: userId,
        type: data.type
      });
    }
  });

  socket.on('accept-call', (data) => {
    // data should contain { answer }
    if (coupleId) {
      socket.to(coupleId).emit('call-accepted', {
        answer: data.answer
      });
    }
  });

  socket.on('ice-candidate', (data) => {
    // data should contain { candidate }
    if (coupleId) {
      socket.to(coupleId).emit('partner-ice-candidate', {
        candidate: data.candidate
      });
    }
  });

  socket.on('end-call', async (data) => {
    // data contains { duration, status, type }
    if (coupleId) {
      socket.to(coupleId).emit('call-ended');

      // Log the call in DB
      try {
        await prisma.call.create({
          data: {
            coupleId,
            callerId: userId,
            type: data.type || 'AUDIO',
            status: data.status || 'COMPLETED',
            duration: data.duration || 0
          }
        });

        // Broadcast to update call log on both clients
        io.to(coupleId).emit('call-log-updated');
        updateInteraction();
      } catch (err) {
        console.error('Failed to log call:', err);
      }
    }
  });

  // --- Watch Party & Music Sync ---
  socket.on('video-state-change', (data) => {
    // data: { state: 'PLAY'|'PAUSE'|'SEEK', time: number, videoId: string }
    if (coupleId) {
      socket.to(coupleId).emit('video-state-change', { ...data, senderId: userId });
    }
  });

  socket.on('music-play', (data) => {
    // data: { songUrl: string, title: string, artist: string, dedication: string }
    if (coupleId) {
      socket.to(coupleId).emit('music-play', { ...data, senderId: userId });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected`);
  });
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
