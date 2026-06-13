const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-duet-app';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name, coupleKey } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  try {
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check if coupleKey is already used by a paired couple
    if (coupleKey) {
      const usersWithKey = await prisma.user.findMany({ where: { coupleKey } });
      if (usersWithKey.length >= 2) {
        return res.status(400).json({ error: 'This Couple Key is already locked by another couple' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        coupleKey: coupleKey || null, // Optional on registration if they pair later
        accessibilitySettings: {
          create: {} // Default settings
        }
      },
      include: {
        accessibilitySettings: true
      }
    });

    let coupleId = newUser.coupleId;

    // If coupleKey was provided, check if we can pair right now
    if (coupleKey) {
      const partner = await prisma.user.findFirst({
        where: { 
          coupleKey, 
          id: { not: newUser.id },
          coupleId: null 
        }
      });

      if (partner) {
        const couple = await prisma.couple.create({
          data: {
            user1Id: partner.id,
            user2Id: newUser.id,
          }
        });
        
        await prisma.user.update({
          where: { id: partner.id },
          data: { coupleId: couple.id }
        });
        
        const updatedUser = await prisma.user.update({
          where: { id: newUser.id },
          data: { coupleId: couple.id }
        });
        
        coupleId = updatedUser.coupleId;
      }
    }

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, coupleId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        coupleKey: newUser.coupleKey,
        coupleId: coupleId,
        accessibilitySettings: newUser.accessibilitySettings
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { accessibilitySettings: true }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, coupleId: user.coupleId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        coupleKey: user.coupleKey,
        coupleId: user.coupleId,
        accessibilitySettings: user.accessibilitySettings
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// POST /api/auth/link (Link current user with another user using couple key)
router.post('/link', authMiddleware, async (req, res) => {
  const { coupleKey } = req.body;
  if (!coupleKey) {
    return res.status(400).json({ error: 'Please enter a Couple Key' });
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (currentUser.coupleId) {
      return res.status(400).json({ error: 'You are already linked to a partner' });
    }

    // Check if the key is already locked by 2 users
    const usersWithKey = await prisma.user.findMany({ where: { coupleKey } });
    
    if (usersWithKey.length >= 2) {
      return res.status(400).json({ error: 'This Couple Key is already locked by another couple' });
    }

    // If no one else has it, we just set it as our pending key
    if (usersWithKey.length === 0 || (usersWithKey.length === 1 && usersWithKey[0].id === currentUser.id)) {
      await prisma.user.update({
        where: { id: currentUser.id },
        data: { coupleKey }
      });
      return res.json({ success: true, message: 'Couple Key set. Waiting for partner to join.', coupleKey });
    }

    const partner = usersWithKey.find(u => u.id !== currentUser.id);

    if (partner.coupleId) {
       return res.status(400).json({ error: 'That user is already linked with someone else' });
    }

    // Create Couple
    const couple = await prisma.couple.create({
      data: {
        user1Id: currentUser.id,
        user2Id: partner.id,
      }
    });

    // Update both users
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { coupleId: couple.id, coupleKey: null } // clear to avoid unique constraint
    });

    await prisma.user.update({
      where: { id: partner.id },
      data: { coupleId: couple.id, coupleKey: null } // clear to avoid unique constraint
    });

    // Regenerate token for currentUser to include coupleId
    const token = jwt.sign(
      { id: currentUser.id, email: currentUser.email, coupleId: couple.id },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const updatedUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { accessibilitySettings: true }
    });

    res.json({
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        coupleKey: updatedUser.coupleKey,
        coupleId: updatedUser.coupleId,
        accessibilitySettings: updatedUser.accessibilitySettings
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error linking partner' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        accessibilitySettings: true,
        couple: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        coupleKey: user.coupleKey,
        coupleId: user.coupleId,
        accessibilitySettings: user.accessibilitySettings,
        couple: user.couple
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving details' });
  }
});

// PUT /api/auth/me
router.put('/me', authMiddleware, async (req, res) => {
  const { anniversary } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.coupleId) return res.status(400).json({ error: 'Not linked to a couple' });
    
    if (anniversary !== undefined) {
      const updatedCouple = await prisma.couple.update({
        where: { id: user.coupleId },
        data: { anniversary: anniversary ? new Date(anniversary) : null }
      });
      return res.json({ success: true, couple: updatedCouple });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update details' });
  }
});

// POST /api/auth/unlink
router.post('/unlink', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    if (!user.coupleId) {
      return res.status(400).json({ error: 'You are not in a couple space' });
    }
    
    const coupleId = user.coupleId;
    
    // Update both users to set coupleId to null
    await prisma.user.updateMany({
      where: { coupleId },
      data: { coupleId: null }
    });
    
    // Delete customization and couple
    await prisma.customization.deleteMany({ where: { coupleId } });
    await prisma.couple.delete({ where: { id: coupleId } });
    
    res.json({ success: true, message: 'Unlinked couple space successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unlink space' });
  }
});

// PUT /api/auth/nicknames
router.put('/nicknames', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) {
    return res.status(400).json({ error: 'Not linked to a couple space' });
  }
  const { nicknameUser1, nicknameUser2 } = req.body;
  try {
    const updatedCouple = await prisma.couple.update({
      where: { id: req.user.coupleId },
      data: {
        nicknameUser1: nicknameUser1 !== undefined ? nicknameUser1 : undefined,
        nicknameUser2: nicknameUser2 !== undefined ? nicknameUser2 : undefined
      }
    });
    res.json(updatedCouple);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update nicknames' });
  }
});

module.exports = router;
