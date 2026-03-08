const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');

// Require authentication for all myspace routes
router.use(authMiddleware);

// ── TASKS ──────────────────────────────────────────────────

// Get all personal tasks for the current user
router.get('/tasks', async (req, res, next) => {
    try {
        const tasks = await prisma.personalTask.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tasks);
    } catch (err) {
        next(err);
    }
});

// Create a new personal task
router.post('/tasks', async (req, res, next) => {
    try {
        const { title } = req.body;
        if (!title) return res.status(400).json({ error: 'El título de la tarea es obligatorio' });

        const task = await prisma.personalTask.create({
            data: {
                title,
                userId: req.userId
            }
        });
        res.status(201).json(task);
    } catch (err) {
        next(err);
    }
});

// Toggle task status
router.patch('/tasks/:taskId', async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const task = await prisma.personalTask.findUnique({ where: { id: taskId } });
        
        if (!task || task.userId !== req.userId) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        const updatedTask = await prisma.personalTask.update({
            where: { id: taskId },
            data: { done: !task.done }
        });
        
        res.json(updatedTask);
    } catch (err) {
        next(err);
    }
});

// Delete a personal task
router.delete('/tasks/:taskId', async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const task = await prisma.personalTask.findUnique({ where: { id: taskId } });
        
        if (!task || task.userId !== req.userId) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        await prisma.personalTask.delete({ where: { id: taskId } });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

// ── NOTES ──────────────────────────────────────────────────

// Get personal notes for the current user
router.get('/notes', async (req, res, next) => {
    try {
        let note = await prisma.personalNote.findUnique({
            where: { userId: req.userId }
        });

        if (!note) {
            // Create empty note if it doesn't exist
            note = await prisma.personalNote.create({
                data: {
                    content: '',
                    userId: req.userId
                }
            });
        }

        res.json(note);
    } catch (err) {
        next(err);
    }
});

// Update personal notes
router.put('/notes', async (req, res, next) => {
    try {
        const { content } = req.body;
        
        const note = await prisma.personalNote.upsert({
            where: { userId: req.userId },
            update: { content: content || '' },
            create: { content: content || '', userId: req.userId }
        });

        res.json(note);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
