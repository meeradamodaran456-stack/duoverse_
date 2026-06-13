const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/accessibility
router.get('/', authMiddleware, async (req, res) => {
  try {
    const settings = await prisma.accessibilitySettings.findUnique({
      where: { userId: req.user.id }
    });

    if (!settings) {
      // Create default settings if not exists
      const newSettings = await prisma.accessibilitySettings.create({
        data: { userId: req.user.id }
      });
      return res.json(newSettings);
    }

    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch accessibility settings' });
  }
});

// PUT /api/accessibility
router.put('/', authMiddleware, async (req, res) => {
  const { highContrast, largeText, screenReaderOptimized, voiceCommandsEnabled, subtitlesEnabled } = req.body;

  try {
    const updatedSettings = await prisma.accessibilitySettings.update({
      where: { userId: req.user.id },
      data: {
        highContrast: highContrast !== undefined ? highContrast : undefined,
        largeText: largeText !== undefined ? largeText : undefined,
        screenReaderOptimized: screenReaderOptimized !== undefined ? screenReaderOptimized : undefined,
        voiceCommandsEnabled: voiceCommandsEnabled !== undefined ? voiceCommandsEnabled : undefined,
        subtitlesEnabled: subtitlesEnabled !== undefined ? subtitlesEnabled : undefined
      }
    });

    res.json(updatedSettings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update accessibility settings' });
  }
});

module.exports = router;
