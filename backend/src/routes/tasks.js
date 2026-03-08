const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// ── POST /api/tasks (via project) ───────────────────────────────────
router.post('/', async (req, res, next) => {
    try {
        const { projectId, title, assignedId } = req.body;
        if (!projectId || !title) {
            return res.status(400).json({ error: 'projectId y title son requeridos' });
        }

        const task = await prisma.task.create({
            data: { title, projectId, assignedId: assignedId || null }
        });

        res.status(201).json({
            id: task.id, title: task.title, done: task.done,
            createdAt: task.createdAt.toISOString()
        });
    } catch (err) {
        next(err);
    }
});

// ── PATCH /api/tasks/:id ────────────────────────────────────────────
router.patch('/:id', async (req, res, next) => {
    try {
        const { done, title, assignedId } = req.body;
        const data = {};
        if (done !== undefined) data.done = done;
        if (title !== undefined) data.title = title;
        if (assignedId !== undefined) data.assignedId = assignedId;

        const task = await prisma.task.update({
            where: { id: req.params.id },
            data
        });

        res.json({ id: task.id, title: task.title, done: task.done });
    } catch (err) {
        next(err);
    }
});

// ── DELETE /api/tasks/:id ───────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
    try {
        await prisma.task.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
