const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.use(authMiddleware);

// Get all clients
router.get('/', async (req, res, next) => {
    try {
        const clients = await prisma.client.findMany({
            include: {
                _count: {
                    select: { projects: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.json(clients);
    } catch (err) {
        next(err);
    }
});

// Create client (Admin only)
router.post('/', adminOnly, async (req, res, next) => {
    try {
        const { name, email, company, image } = req.body;
        if (!name) return res.status(400).json({ error: 'El nombre del cliente es obligatorio' });

        const client = await prisma.client.create({
            data: { name, email, company, image }
        });
        res.status(201).json(client);
    } catch (err) {
        next(err);
    }
});

// Update client
router.put('/:id', adminOnly, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, company, image } = req.body;
        
        const client = await prisma.client.update({
            where: { id },
            data: { name, email, company, image }
        });
        res.json(client);
    } catch (err) {
        next(err);
    }
});

// Delete client
router.delete('/:id', adminOnly, async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.client.delete({ where: { id } });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
