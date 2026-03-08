const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

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
                                some: { id: { in: teamMemberIds } }
                            }
                        },
                        select: { id: true }
                    });

                    if (activeProjects.length > 0) {
                        const updatePromises = activeProjects.map(p => 
                            prisma.project.update({
                                where: { id: p.id },
                                data: {
                                    members: { connect: { id: user.id } }
                                }
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
        await prisma.user.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
