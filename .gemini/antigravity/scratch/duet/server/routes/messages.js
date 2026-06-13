const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

// Configure storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
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
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// GET /api/messages
// Fetches the chat log for the active couple
router.get('/', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) {
    return res.status(400).json({ error: 'You are not linked to a couple space yet' });
  }

  try {
    const messages = await prisma.message.findMany({
      where: { coupleId: req.user.coupleId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/messages/upload
// Endpoint for voice recording uploads, image uploads, etc.
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.user.coupleId) {
    return res.status(400).json({ error: 'You are not linked to a couple space yet' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process file upload' });
  }
});

module.exports = router;
