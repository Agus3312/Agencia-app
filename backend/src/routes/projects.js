const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { logActivity } = require('./activity');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ── GET /api/projects ───────────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const projects = await prisma.project.findMany({
            include: {
                tasks: true,
                members: {
                    include: { user: { select: { id: true, name: true, image: true } } }
                },
                _count: { select: { messages: true, files: true, updates: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Format response to match frontend expectations
        const formatted = projects.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            color: p.color,
            status: p.status,
            dueDate: p.dueDate.toISOString(),
            createdAt: p.createdAt.toISOString(),
            tasks: p.tasks.map(t => ({
                id: t.id, title: t.title, done: t.done, createdAt: t.createdAt.toISOString()
            })),
            team: p.members.map(m => ({
                id: m.user.id,
                name: m.user.name,
                avatar: m.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user.name)}&background=random`
            })),
            chat: [],   // Loaded separately on detail
            files: [],  // Loaded separately on detail
            updates: [], // Loaded separately on detail
            chatCount: p._count.messages,
            filesCount: p._count.files,
            updatesCount: p._count.updates
        }));

        res.json(formatted);
    } catch (err) {
        next(err);
    }
});

// ── GET /api/projects/:id ───────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const project = await prisma.project.findUnique({
            where: { id: req.params.id },
            include: {
                tasks: { orderBy: { createdAt: 'asc' } },
                members: {
                    include: { user: { select: { id: true, name: true, image: true, role: true } } }
                },
                messages: {
                    include: { author: { select: { id: true, name: true, image: true } } },
                    orderBy: { createdAt: 'asc' }
                },
                files: {
                    include: { uploadedBy: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' }
                },
                updates: {
                    include: { author: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        // Format to match frontend
        const formatted = {
            id: project.id,
            name: project.name,
            description: project.description,
            color: project.color,
            status: project.status,
            dueDate: project.dueDate.toISOString(),
            createdAt: project.createdAt.toISOString(),
            tasks: project.tasks.map(t => ({
                id: t.id, title: t.title, done: t.done, createdAt: t.createdAt.toISOString()
            })),
            team: project.members.map(m => ({
                id: m.user.id,
                name: m.user.name,
                avatar: m.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user.name)}&background=random`,
                role: m.user.role
            })),
            chat: project.messages.map(m => ({
                id: m.id,
                author: m.author.name,
                text: m.text,
                timestamp: m.createdAt.toISOString()
            })),
            files: project.files.map(f => ({
                id: f.id,
                name: f.name,
                type: f.type,
                uploadedBy: f.uploadedBy.name,
                uploadedAt: f.createdAt.toISOString()
            })),
            updates: project.updates.map(u => ({
                id: u.id,
                title: u.title,
                description: u.description,
                author: u.author.name,
                timestamp: u.createdAt.toISOString()
            }))
        };

        res.json(formatted);
    } catch (err) {
        next(err);
    }
});

// ── POST /api/projects ──────────────────────────────────────────────
router.post('/', adminOnly, async (req, res, next) => {
    try {
        const { name, description, color, status, dueDate, memberIds } = req.body;

        if (!name || !dueDate) {
            return res.status(400).json({ error: 'Nombre y fecha de vencimiento son requeridos' });
        }

        const project = await prisma.project.create({
            data: {
                name,
                description: description || '',
                color: color || 'blue',
                status: status || 'planning',
                dueDate: new Date(dueDate),
                createdById: req.userId,
                members: {
                    create: [
                        { userId: req.userId, role: 'leader' },
                        ...(memberIds || []).map(id => ({ userId: id, role: 'member' }))
                    ]
                }
            }
        });

        await logActivity(req.userId, 'project_created', 'creó el proyecto', project.name);
        res.status(201).json(project);
    } catch (err) {
        next(err);
    }
});

// ── PATCH /api/projects/:id ─────────────────────────────────────────
router.patch('/:id', async (req, res, next) => {
    try {
        const { name, description, color, status, dueDate } = req.body;
        const data = {};
        if (name !== undefined) data.name = name;
        if (description !== undefined) data.description = description;
        if (color !== undefined) data.color = color;
        if (status !== undefined) data.status = status;
        if (dueDate !== undefined) data.dueDate = new Date(dueDate);

        const project = await prisma.project.update({
            where: { id: req.params.id },
            data
        });

        res.json(project);
    } catch (err) {
        next(err);
    }
});

// ── POST /api/projects/:id/members ─────────────────────────────────
// Add a user to a project
router.post('/:id/members', adminOnly, async (req, res, next) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId requerido' });

        await prisma.projectMember.upsert({
            where: { projectId_userId: { projectId: req.params.id, userId } },
            create: { projectId: req.params.id, userId, role: 'member' },
            update: {}
        });

        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

// ── DELETE /api/projects/:id/members/:userId ────────────────────────
// Remove a user from a project
router.delete('/:id/members/:userId', adminOnly, async (req, res, next) => {
    try {
        await prisma.projectMember.deleteMany({
            where: { projectId: req.params.id, userId: req.params.userId }
        });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

// ── DELETE /api/projects/:id ────────────────────────────────────────
router.delete('/:id', adminOnly, async (req, res, next) => {
    try {
        await prisma.project.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/projects/:id/messages ─────────────────────────────────
router.post('/:id/messages', async (req, res, next) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Texto requerido' });

        const message = await prisma.message.create({
            data: {
                text,
                projectId: req.params.id,
                authorId: req.userId
            },
            include: { author: { select: { name: true } } }
        });

        const formattedMessage = {
            id: message.id,
            author: message.author.name,
            text: message.text,
            timestamp: message.createdAt.toISOString()
        };

        // Emit realtime event to anyone in the project room
        const io = req.app.get('io');
        if (io) {
            io.to(req.params.id).emit('new_message', formattedMessage);
        }

        res.status(201).json(formattedMessage);
    } catch (err) {
        next(err);
    }
});

// ── POST /api/projects/:id/files ────────────────────────────────────
router.post('/:id/files', async (req, res, next) => {
    try {
        const { name, type } = req.body;
        if (!name) return res.status(400).json({ error: 'Nombre de archivo requerido' });

        const file = await prisma.file.create({
            data: {
                name,
                type: type || 'document',
                projectId: req.params.id,
                userId: req.userId
            }
        });

        res.status(201).json(file);
    } catch (err) {
        next(err);
    }
});

// ── POST /api/projects/:id/updates ──────────────────────────────────
router.post('/:id/updates', async (req, res, next) => {
    try {
        const { title, description } = req.body;
        if (!title) return res.status(400).json({ error: 'Título requerido' });

        const update = await prisma.update.create({
            data: {
                title,
                description: description || '',
                projectId: req.params.id,
                authorId: req.userId
            }
        });

        res.status(201).json(update);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
