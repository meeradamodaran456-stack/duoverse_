const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

// Sample list of couple questions to lazy-populate
const COUPLE_QUESTIONS = [
  "What was your first impression of me when we first met?",
  "Where is your favorite place that we have traveled to together?",
  "What is a small, everyday thing I do that makes you feel loved?",
  "What is your dream vacation destination for us as a couple?",
  "If we could only watch one movie together forever, what would it be?",
  "What is a new hobby or activity you'd love for us to try together?",
  "What song always reminds you of our relationship?",
  "What is your favorite memory of us from this past year?",
  "How do you think we balance each other out the most?",
  "What is one dream or goal you want us to accomplish together in the next 5 years?",
  "What is the best meal we have ever shared together?",
  "What nickname of mine is your absolute favorite?"
];

// ==================== MOOD TRACKER ====================

// GET /api/couple/mood
router.get('/mood', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) return res.status(400).json({ error: 'Not linked' });

  try {
    const couple = await prisma.couple.findUnique({
      where: { id: req.user.coupleId },
      include: { users: { select: { id: true, name: true } } }
    });

    const partnerId = couple.users.find(u => u.id !== req.user.id)?.id;

    // Fetch last mood update for each user in the last 24 hours
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const myMood = await prisma.moodUpdate.findFirst({
      where: { userId: req.user.id, createdAt: { gte: since24h } },
      orderBy: { createdAt: 'desc' }
    });

    let partnerMood = null;
    if (partnerId) {
      partnerMood = await prisma.moodUpdate.findFirst({
        where: { userId: partnerId, createdAt: { gte: since24h } },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json({ myMood, partnerMood });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch moods' });
  }
});

// POST /api/couple/mood
router.post('/mood', authMiddleware, async (req, res) => {
  const { mood, note } = req.body;
  if (!mood) return res.status(400).json({ error: 'Mood is required' });

  try {
    const moodUpdate = await prisma.moodUpdate.create({
      data: {
        userId: req.user.id,
        mood,
        note: note || null
      }
    });
    res.json(moodUpdate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update mood' });
  }
});

// ==================== LOVE NOTES (HUGS / KISSES / NOTES) ====================

// GET /api/couple/love-notes
router.get('/love-notes', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) return res.status(400).json({ error: 'Not linked' });

  try {
    const hugsCount = await prisma.loveNote.count({
      where: { coupleId: req.user.coupleId, type: 'HUG' }
    });

    const kissesCount = await prisma.loveNote.count({
      where: { coupleId: req.user.coupleId, type: 'KISS' }
    });

    const recentNotes = await prisma.loveNote.findMany({
      where: { coupleId: req.user.coupleId, type: 'NOTE' },
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: { sender: { select: { id: true, name: true } } }
    });

    res.json({ hugsCount, kissesCount, recentNotes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch love note activity' });
  }
});

// POST /api/couple/love-notes
router.post('/love-notes', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) return res.status(400).json({ error: 'Not linked' });
  const { type, content } = req.body; // type = HUG, KISS, NOTE

  if (!['HUG', 'KISS', 'NOTE'].includes(type)) {
    return res.status(400).json({ error: 'Invalid love-note type' });
  }

  try {
    const loveNote = await prisma.loveNote.create({
      data: {
        coupleId: req.user.coupleId,
        senderId: req.user.id,
        type,
        content: content || null
      },
      include: { sender: { select: { id: true, name: true } } }
    });
    res.json(loveNote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log love note' });
  }
});

// ==================== DAILY QUESTION ====================

// GET /api/couple/daily-question
router.get('/daily-question', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) return res.status(400).json({ error: 'Not linked' });

  try {
    // Determine today's date boundary
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Look for today's question
    let dailyQ = await prisma.dailyQuestion.findFirst({
      where: { date: today }
    });

    // If none exists, lazy initialize one
    if (!dailyQ) {
      const qIndex = Math.abs(today.getTime()) % COUPLE_QUESTIONS.length;
      const questionText = COUPLE_QUESTIONS[qIndex];
      
      try {
        dailyQ = await prisma.dailyQuestion.create({
          data: {
            question: questionText,
            date: today
          }
        });
      } catch (e) {
        // Handle race conditions where another call created it
        dailyQ = await prisma.dailyQuestion.findFirst({
          where: { date: today }
        });
      }
    }

    const couple = await prisma.couple.findUnique({
      where: { id: req.user.coupleId },
      include: { users: { select: { id: true, name: true } } }
    });
    const partnerId = couple.users.find(u => u.id !== req.user.id)?.id;

    // Get answers for this question
    const myAnswer = await prisma.dailyAnswer.findFirst({
      where: { questionId: dailyQ.id, userId: req.user.id }
    });

    let partnerAnswer = null;
    if (partnerId) {
      partnerAnswer = await prisma.dailyAnswer.findFirst({
        where: { questionId: dailyQ.id, userId: partnerId }
      });
    }

    // Hide partner answer until BOTH users have answered
    const bothAnswered = !!myAnswer && !!partnerAnswer;
    const responsePayload = {
      id: dailyQ.id,
      question: dailyQ.question,
      myAnswer: myAnswer ? { id: myAnswer.id, answer: myAnswer.answer, createdAt: myAnswer.createdAt } : null,
      partnerAnswer: bothAnswered ? { id: partnerAnswer.id, answer: partnerAnswer.answer, createdAt: partnerAnswer.createdAt } : null,
      bothAnswered,
      partnerHasAnswered: !!partnerAnswer
    };

    res.json(responsePayload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch daily question' });
  }
});

// POST /api/couple/daily-answer
router.post('/daily-answer', authMiddleware, async (req, res) => {
  const { questionId, answer } = req.body;
  if (!questionId || !answer) return res.status(400).json({ error: 'Missing answer details' });

  try {
    const existing = await prisma.dailyAnswer.findFirst({
      where: { questionId, userId: req.user.id }
    });

    if (existing) {
      return res.status(400).json({ error: 'You have already answered today\'s question' });
    }

    const newAnswer = await prisma.dailyAnswer.create({
      data: {
        questionId,
        userId: req.user.id,
        answer
      }
    });

    res.json(newAnswer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit daily answer' });
  }
});

module.exports = router;
