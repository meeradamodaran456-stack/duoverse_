const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

// ==================== TASKS & SHOPPING ====================

// GET /api/tools/tasks
router.get('/tasks', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) return res.status(400).json({ error: 'Not linked' });

  try {
    const tasks = await prisma.task.findMany({
      where: { coupleId: req.user.coupleId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tools/tasks
router.post('/tasks', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) return res.status(400).json({ error: 'Not linked' });

  const { title, category, dueDate } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const task = await prisma.task.create({
      data: {
        coupleId: req.user.coupleId,
        title,
        category: category || 'TASK', // TASK or SHOPPING
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: req.user.id
      }
    });
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tools/tasks/:id
router.put('/tasks/:id', authMiddleware, async (req, res) => {
  const { completed, title, dueDate } = req.body;

  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task || task.coupleId !== req.user.coupleId) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        completed: completed !== undefined ? completed : task.completed,
        title: title || task.title,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate
      }
    });
    res.json(updatedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tools/tasks/:id
router.delete('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task || task.coupleId !== req.user.coupleId) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// ==================== CALENDAR ====================

// GET /api/tools/calendar
router.get('/calendar', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) return res.status(400).json({ error: 'Not linked' });

  try {
    const events = await prisma.calendarEvent.findMany({
      where: { coupleId: req.user.coupleId },
      orderBy: { date: 'asc' }
    });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// POST /api/tools/calendar
router.post('/calendar', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) return res.status(400).json({ error: 'Not linked' });

  const { title, date, category } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Title and Date are required' });

  try {
    const event = await prisma.calendarEvent.create({
      data: {
        coupleId: req.user.coupleId,
        title,
        date: new Date(date),
        category: category || 'EVENT', // EVENT, BIRTHDAY, ANNIVERSARY
        createdBy: req.user.id
      }
    });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

// DELETE /api/tools/calendar/:id
router.delete('/calendar/:id', authMiddleware, async (req, res) => {
  try {
    const event = await prisma.calendarEvent.findUnique({ where: { id: req.params.id } });
    if (!event || event.coupleId !== req.user.coupleId) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await prisma.calendarEvent.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// ==================== BOOKMARKS ====================

// GET /api/tools/bookmarks
router.get('/bookmarks', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) return res.status(400).json({ error: 'Not linked' });

  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { coupleId: req.user.coupleId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookmarks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

// POST /api/tools/bookmarks
router.post('/bookmarks', authMiddleware, async (req, res) => {
  if (!req.user.coupleId) return res.status(400).json({ error: 'Not linked' });

  const { title, url, content } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const bookmark = await prisma.bookmark.create({
      data: {
        coupleId: req.user.coupleId,
        title,
        url: url || null,
        content: content || null,
        createdBy: req.user.id
      }
    });
    res.json(bookmark);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create bookmark' });
  }
});

// DELETE /api/tools/bookmarks/:id
router.delete('/bookmarks/:id', authMiddleware, async (req, res) => {
  try {
    const bookmark = await prisma.bookmark.findUnique({ where: { id: req.params.id } });
    if (!bookmark || bookmark.coupleId !== req.user.coupleId) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    await prisma.bookmark.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete bookmark' });
  }
});

module.exports = router;
