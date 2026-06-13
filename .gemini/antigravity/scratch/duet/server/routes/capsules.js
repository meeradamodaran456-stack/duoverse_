const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/capsules
// Fetch all capsules. Redacts mediaUrl and description for locked capsules.
router.get('/', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) return res.status(400).json({ error: 'Not linked' });

  try {
    const capsules = await prisma.memoryCapsule.findMany({
      where: { coupleId: req.user.coupleId },
      orderBy: { unlockDate: 'asc' }
    });

    const now = new Date();
    
    // Enforce lock security: censor locked files/description from response payload
    const processedCapsules = capsules.map(cap => {
      const isLocked = new Date(cap.unlockDate) > now;
      if (isLocked) {
        return {
          id: cap.id,
          title: cap.title,
          unlockDate: cap.unlockDate,
          creatorId: cap.creatorId,
          createdAt: cap.createdAt,
          isLocked: true,
          message: "This capsule is locked.",
          fileUrls: "[]"
        };
      }
      return {
        ...cap,
        isLocked: false
      };
    });

    res.json(processedCapsules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch capsules' });
  }
});

// POST /api/capsules
// Create a new locked capsule
router.post('/', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) return res.status(400).json({ error: 'Not linked' });

  const { title, message, fileUrls, unlockDate } = req.body;

  if (!title || !unlockDate || !message) {
    return res.status(400).json({ error: 'Title, message, and Unlock Date are required' });
  }

  try {
    const capsule = await prisma.memoryCapsule.create({
      data: {
        coupleId: req.user.coupleId,
        title,
        message,
        fileUrls: JSON.stringify(fileUrls || []),
        unlockDate: new Date(unlockDate),
        creatorId: req.user.id
      }
    });

    res.json(capsule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create memory capsule' });
  }
});

module.exports = router;
