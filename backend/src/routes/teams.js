const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { logActivity } = require('./activity');

const router = express.Router();

router.use(authMiddleware);

// ── GET /api/teams/metadata ──────────────────────────────────────────
// Returns a list of all standalone teams
router.get('/metadata', async (req, res, next) => {
    try {
        const teams = await prisma.team.findMany({ orderBy: { name: 'asc' } });
        res.json(teams);
    } catch (err) {
        next(err);
    }
});

// ── POST /api/teams/metadata ─────────────────────────────────────────
// Creates a new standalone team (Admin only)
router.post('/metadata', adminOnly, async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Nombre del equipo querido' });
        
        const team = await prisma.team.create({ data: { name } });
        await logActivity(req.userId, 'user_updated', 'creó el equipo', name);
        res.status(201).json(team);
    } catch (err) {
        // If unique constraint violation, return existing
        if (err.code === 'P2002') return res.status(409).json({ error: 'El equipo ya existe' });
        next(err);
    }
});

// ── GET /api/teams ──────────────────────────────────────────────────
// Returns users grouped by team
router.get('/', async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true, name: true, email: true, role: true,
                team: true, image: true, tags: true, status: true
            },
            orderBy: { name: 'asc' }
        });

        res.json(users);
    } catch (err) {
        next(err);
    }
});

// ── PATCH /api/teams/:id ────────────────────────────────────────────
// Update user role/team (admin only)
router.patch('/:id', adminOnly, async (req, res, next) => {
    try {
        const { role, team, name, tags } = req.body;
        const data = {};
        if (role !== undefined) data.role = role;
        if (team !== undefined) data.team = team;
        if (name !== undefined) data.name = name;
        if (tags !== undefined) data.tags = tags;

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data,
            select: {
                id: true, name: true, email: true, role: true,
                team: true, image: true, tags: true, status: true
            }
        });

        // If the team changed, we should auto-assign them to active projects for the new team
        if (team !== undefined) {
            try {
                const teamMembers = await prisma.user.findMany({
                    where: { team: user.team, id: { not: user.id } },
                    select: { id: true }
                });
                const teamMemberIds = teamMembers.map(m => m.id);

                if (teamMemberIds.length > 0) {
                    const activeProjects = await prisma.project.findMany({
                        where: {
                            status: { not: 'completed' },
                            members: {
                                some: { userId: { in: teamMemberIds } }
                            }
                        },
                        select: { id: true }
                    });

                    if (activeProjects.length > 0) {
                        const updatePromises = activeProjects.map(p => 
                            prisma.projectMember.upsert({
                                where: { projectId_userId: { projectId: p.id, userId: user.id } },
                                create: { projectId: p.id, userId: user.id, role: 'member' },
                                update: {}
                            })
                        );
                        await Promise.all(updatePromises);
                    }
                }
            } catch (err) {
                console.error('Error auto-syncing updated user to projects:', err);
            }
        }

        res.json(user);
    } catch (err) {
        next(err);
    }
});

// ── DELETE /api/teams/:id ───────────────────────────────────────────
router.delete('/:id', adminOnly, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { name: true } });
        await prisma.user.delete({ where: { id: req.params.id } });
        if (user) {
            await logActivity(req.userId, 'user_deleted', 'eliminó al usuario', user.name);
        }
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
