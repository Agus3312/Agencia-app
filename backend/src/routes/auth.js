const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');
const { logActivity } = require('./activity');

const router = express.Router();

// ── POST /api/auth/register ─────────────────────────────────────────
router.post('/register', async (req, res, next) => {
    try {
        const { name, email, password, role, team } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
        }

        // Check if user exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'Developer',
                team: team || 'Frontend'
            }
        });

        // Auto-assign new user to active projects that are relevant to their team
        try {
            // Find other users in the same team
            const teamMembers = await prisma.user.findMany({
                where: { team: user.team, id: { not: user.id } },
                select: { id: true }
            });
            const teamMemberIds = teamMembers.map(m => m.id);

            if (teamMemberIds.length > 0) {
                // Find active projects those teammates are on using the join table
                const activeProjects = await prisma.project.findMany({
                    where: {
                        status: { not: 'completed' },
                        members: {
                            some: {
                                userId: { in: teamMemberIds }
                            }
                        }
                    },
                    select: { id: true }
                });

                if (activeProjects.length > 0) {
                    // Prepare array of project-user associations
                    const updatePromises = activeProjects.map(p => 
                        prisma.projectMember.upsert({
                            where: { projectId_userId: { projectId: p.id, userId: user.id } },
                            create: { projectId: p.id, userId: user.id, role: 'member' },
                            update: {}
                        })
                    );
                    await Promise.all(updatePromises);
                    console.log(`Auto-added new user ${user.name} to ${activeProjects.length} active projects.`);
                }
            }
        } catch (syncError) {
            console.error('Error auto-syncing new user to projects:', syncError);
            // Non-fatal, let registration succeed
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'la_clave_secreta_app_2026',
            { expiresIn: '7d' }
        );

        // Log activity
        await logActivity(user.id, 'user_created', 'fue agregado al sistema', user.name);

        res.status(201).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                team: user.team,
                image: user.image
            }
        });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/auth/login ────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Check password
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Update status
        await prisma.user.update({
            where: { id: user.id },
            data: { status: 'online' }
        });

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'la_clave_secreta_app_2026',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                team: user.team,
                image: user.image
            }
        });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/auth/me ────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true, name: true, email: true, role: true,
                team: true, image: true, tags: true, status: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(user);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
