const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

// Configure storage for memories upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/memories');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit for memories (higher resolution images/videos)
});

// GET /api/memories
router.get('/', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) {
    return res.status(400).json({ error: 'You are not linked to a couple space yet' });
  }

  try {
    const memories = await prisma.memory.findMany({
      where: { coupleId: req.user.coupleId },
      orderBy: { date: 'desc' }
    });

    res.json(memories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
});

// GET /api/memories/on-this-day
router.get('/on-this-day', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) return res.status(400).json({ error: 'Not linked' });

  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentDay = today.getDate();
    const currentYear = today.getFullYear();

    // Since SQLite doesn't have robust date extraction functions out of the box in Prisma,
    // we fetch all memories and filter in memory (fine for small couples app).
    // Or we could use raw query. Let's do in memory for cross-db compatibility.
    const allMemories = await prisma.memory.findMany({
      where: { coupleId: req.user.coupleId },
      orderBy: { date: 'desc' }
    });

    const onThisDayMemories = allMemories.filter(mem => {
      const memDate = new Date(mem.date);
      return memDate.getMonth() + 1 === currentMonth &&
             memDate.getDate() === currentDay &&
             memDate.getFullYear() < currentYear;
    });

    res.json(onThisDayMemories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch on-this-day memories' });
  }
});

// POST /api/memories
router.post('/', authMiddleware, upload.single('media'), async (req, res) => {
  if (!req.user.coupleId) {
    return res.status(400).json({ error: 'You are not linked to a couple space yet' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Please upload media (image or video)' });
  }

  const { title, description, date } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const mediaUrl = `/uploads/memories/${req.file.filename}`;
    const mediaType = req.file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE';

    const memory = await prisma.memory.create({
      data: {
        coupleId: req.user.coupleId,
        title,
        description,
        mediaUrl,
        mediaType,
        date: date ? new Date(date) : new Date()
      }
    });

    res.status(201).json(memory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create memory' });
  }
});

// DELETE /api/memories/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) {
    return res.status(400).json({ error: 'You are not linked to a couple space yet' });
  }

  try {
    const memory = await prisma.memory.findUnique({
      where: { id: req.params.id }
    });

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    if (memory.coupleId !== req.user.coupleId) {
      return res.status(403).json({ error: 'Unauthorized operation' });
    }

    // Attempt to delete physical file
    const filePath = path.join(__dirname, '..', memory.mediaUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.memory.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Memory deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

module.exports = router;
