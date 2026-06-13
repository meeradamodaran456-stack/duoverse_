const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/sleep
// Get sleep logs for the couple
router.get('/', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) return res.status(400).json({ error: 'Not in a couple space' });

  try {
    const logs = await prisma.sleepLog.findMany({
      where: { coupleId: req.user.coupleId },
      orderBy: { createdAt: 'desc' },
      take: 14, // last 2 weeks
      include: {
        user: { select: { id: true, name: true } }
      }
    });
    
    // Check if current user is currently sleeping
    const activeSleep = await prisma.sleepLog.findFirst({
      where: { userId: req.user.id, wakeTime: null },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ logs, activeSleep });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sleep logs' });
  }
});

// POST /api/sleep/goodnight
router.post('/goodnight', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) return res.status(400).json({ error: 'Not in a couple space' });

  try {
    // End any existing incomplete sleep logs for this user
    await prisma.sleepLog.updateMany({
      where: { userId: req.user.id, wakeTime: null },
      data: { wakeTime: new Date() }
    });

    const newLog = await prisma.sleepLog.create({
      data: {
        coupleId: req.user.coupleId,
        userId: req.user.id,
        sleepTime: new Date(),
        note: req.body.note || null
      }
    });

    res.json(newLog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log sleep' });
  }
});

// POST /api/sleep/goodmorning
router.post('/goodmorning', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) return res.status(400).json({ error: 'Not in a couple space' });

  try {
    const activeSleep = await prisma.sleepLog.findFirst({
      where: { userId: req.user.id, wakeTime: null },
      orderBy: { createdAt: 'desc' }
    });

    if (!activeSleep) {
      return res.status(400).json({ error: 'No active sleep found' });
    }

    const wakeTime = new Date();
    const duration = Math.floor((wakeTime - new Date(activeSleep.sleepTime)) / (1000 * 60)); // minutes

    const updatedLog = await prisma.sleepLog.update({
      where: { id: activeSleep.id },
      data: { wakeTime, duration }
    });

    res.json(updatedLog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log wake up' });
  }
});

module.exports = router;
