const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// ── POST /api/tasks (via project) ───────────────────────────────────
router.post('/', async (req, res, next) => {
    try {
        const { projectId, title, assignedId, priority, dueDate, labels, description, status } = req.body;
        if (!projectId || !title) {
            return res.status(400).json({ error: 'projectId y title son requeridos' });
        }

        const task = await prisma.task.create({
            data: { 
                title, 
                projectId, 
                assignedId: assignedId || null,
                description: description || '',
                priority: priority || 'medium',
                status: status || 'todo',
                dueDate: dueDate ? new Date(dueDate) : null,
                labels: labels || []
            }
        });

        res.status(201).json({
            id: task.id, 
            title: task.title, 
            done: task.done,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? task.dueDate.toISOString() : null,
            labels: task.labels,
            description: task.description,
            createdAt: task.createdAt.toISOString()
        });
    } catch (err) {
        next(err);
    }
});

// ── PATCH /api/tasks/:id ────────────────────────────────────────────
router.patch('/:id', async (req, res, next) => {
    try {
        const { done, title, assignedId, priority, dueDate, labels, description, status } = req.body;
        const data = {};
        if (done !== undefined) data.done = done;
        if (status !== undefined) data.status = status;
        if (title !== undefined) data.title = title;
        if (assignedId !== undefined) data.assignedId = assignedId;
        if (priority !== undefined) data.priority = priority;
        if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
        if (labels !== undefined) data.labels = labels;
        if (description !== undefined) data.description = description;

        const task = await prisma.task.update({
            where: { id: req.params.id },
            data
        });

        res.json({ 
            id: task.id, 
            title: task.title, 
            done: task.done,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? task.dueDate.toISOString() : null,
            labels: task.labels,
            description: task.description
        });
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

// ── GET /api/tasks/:id/comments ─────────────────────────────────────
router.get('/:id/comments', async (req, res, next) => {
    try {
        const comments = await prisma.comment.findMany({
            where: { taskId: req.params.id },
            include: { 
                author: { 
                    select: { id: true, name: true, image: true } 
                } 
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(comments);
    } catch (err) {
        next(err);
    }
});

// ── POST /api/tasks/:id/comments ────────────────────────────────────
router.post('/:id/comments', async (req, res, next) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'El texto es requerido' });

        const comment = await prisma.comment.create({
            data: {
                text,
                taskId: req.params.id,
                authorId: req.userId
            },
            include: {
                author: {
                    select: { id: true, name: true, image: true }
                }
            }
        });

        // Notify via socket & DB
        const io = req.app.get('io');
        const task = await prisma.task.findUnique({ 
            where: { id: req.params.id }, 
            include: { project: { include: { members: true } } } 
        });
        
        if (task) {
            io.to(task.projectId).emit('new_task_comment', { taskId: req.params.id, comment });
            
            // Create notifications for all project members except the author
            const membersToNotify = task.project.members.filter(m => m.userId !== req.userId);
            
            for (const member of membersToNotify) {
                await prisma.notification.create({
                    data: {
                        userId: member.userId,
                        type: 'comment',
                        title: 'Nuevos comentarios',
                        message: `${comment.author.name} comentó en la tarea: ${task.title}`,
                        link: `project-detail:${task.projectId}` // Simple link
                    }
                });
                // Emit direct notification to user if connected
                io.emit(`notification:${member.userId}`, { title: 'Nuevo comentario' });
            }
        }

        res.status(201).json(comment);
    } catch (err) {
        next(err);
    }
});

// ── GET /api/tasks/:id/time ─────────────────────────────────────────
router.get('/:id/time', async (req, res, next) => {
    try {
        const entries = await prisma.timeEntry.findMany({
            where: { taskId: req.params.id },
            include: {
                user: { select: { id: true, name: true } }
            },
            orderBy: { date: 'desc' }
        });
        res.json(entries);
    } catch (err) {
        next(err);
    }
});

// ── POST /api/tasks/:id/time ────────────────────────────────────────
router.post('/:id/time', async (req, res, next) => {
    try {
        const { duration, note } = req.body;
        if (!duration) return res.status(400).json({ error: 'La duración es requerida' });

        const entry = await prisma.timeEntry.create({
            data: {
                duration: parseInt(duration),
                note: note || '',
                taskId: req.params.id,
                userId: req.userId
            }
        });
        res.status(201).json(entry);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
