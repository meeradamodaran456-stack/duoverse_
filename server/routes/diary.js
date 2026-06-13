const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/diary
// Fetch all journal entries for the current user's couple space.
// Personal entries of the partner are excluded.
router.get('/', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) {
    return res.status(400).json({ error: 'You are not linked to a couple space yet' });
  }

  try {
    const entries = await prisma.diaryEntry.findMany({
      where: {
        coupleId: req.user.coupleId,
        OR: [
          { isPrivate: false },
          { isPrivate: true, userId: req.user.id }
        ]
      },
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true }
        }
      }
    });
    res.json(entries);
  } catch (err) {
    console.error('Fetch diary error:', err);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

// POST /api/diary
// Create a new journal entry
router.post('/', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) {
    return res.status(400).json({ error: 'You are not linked to a couple space yet' });
  }

  const { content, mood, mediaUrl, isPrivate, date } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Journal content is required' });
  }

  try {
    const entry = await prisma.diaryEntry.create({
      data: {
        coupleId: req.user.coupleId,
        userId: req.user.id,
        content,
        mood: mood || null,
        mediaUrl: mediaUrl || null,
        isPrivate: isPrivate === true || isPrivate === 'true',
        date: date ? new Date(date) : new Date()
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true }
        }
      }
    });

    res.json(entry);
  } catch (err) {
    console.error('Create diary error:', err);
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

// DELETE /api/diary/:id
// Delete a journal entry
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const entry = await prisma.diaryEntry.findUnique({
      where: { id: req.params.id }
    });

    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    // Must be the owner to delete
    if (entry.userId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this entry' });
    }

    await prisma.diaryEntry.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true, message: 'Journal entry deleted' });
  } catch (err) {
    console.error('Delete diary error:', err);
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});

module.exports = router;
