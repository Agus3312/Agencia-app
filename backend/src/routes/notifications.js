const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Get user notifications
router.get('/', async (req, res, next) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(notifications);
    } catch (err) {
        next(err);
    }
});

// Mark notification as read
router.patch('/:id/read', async (req, res, next) => {
    try {
        const { id } = req.params;
        const notification = await prisma.notification.update({
            where: { id, userId: req.userId },
            data: { read: true }
        });
        res.json(notification);
    } catch (err) {
        next(err);
    }
});

// Mark all as read
router.post('/read-all', async (req, res, next) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.userId, read: false },
            data: { read: true }
        });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
