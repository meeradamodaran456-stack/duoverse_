const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/customization
// Fetch custom styling preferences (theme, wallpaper, accent colors) for the couple space.
router.get('/', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) {
    return res.status(400).json({ error: 'You are not linked to a couple space yet' });
  }

  try {
    let customization = await prisma.customization.findUnique({
      where: { coupleId: req.user.coupleId }
    });

    // Lazy initialization of defaults if not existing
    if (!customization) {
      customization = await prisma.customization.create({
        data: {
          coupleId: req.user.coupleId,
          themeName: 'ROMANTIC',
          accentColor: '#EC4899'
        }
      });
    }

    res.json(customization);
  } catch (err) {
    console.error('Customization GET error:', err);
    res.status(500).json({ error: 'Failed to fetch customization details' });
  }
});

// PUT /api/customization
// Update theme, wallpaper, or accent colors for both members of the couple space.
router.put('/', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) {
    return res.status(400).json({ error: 'You are not linked to a couple space yet' });
  }

  const { themeName, wallpaperUrl, accentColor, fontName, secondaryColor, bubbleColor, animatedEffect } = req.body;

  try {
    const customization = await prisma.customization.upsert({
      where: { coupleId: req.user.coupleId },
      update: {
        themeName: themeName || undefined,
        wallpaperUrl: wallpaperUrl !== undefined ? wallpaperUrl : undefined,
        accentColor: accentColor || undefined,
        fontName: fontName || undefined,
        secondaryColor: secondaryColor !== undefined ? secondaryColor : undefined,
        bubbleColor: bubbleColor !== undefined ? bubbleColor : undefined,
        animatedEffect: animatedEffect !== undefined ? animatedEffect : undefined
      },
      create: {
        coupleId: req.user.coupleId,
        themeName: themeName || 'ROMANTIC',
        wallpaperUrl: wallpaperUrl || null,
        accentColor: accentColor || '#EC4899',
        fontName: fontName || 'Outfit',
        secondaryColor: secondaryColor || null,
        bubbleColor: bubbleColor || null,
        animatedEffect: animatedEffect || null
      }
    });

    res.json(customization);
  } catch (err) {
    console.error('Customization PUT error:', err);
    res.status(500).json({ error: 'Failed to update customization details' });
  }
});

module.exports = router;
