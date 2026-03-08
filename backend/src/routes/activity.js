const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ── GET /api/activity ─────────────────────────────────────────────────
// Returns latest activity log entries (last 20 by default)
router.get('/', async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const logs = await prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                performedBy: { select: { name: true } }
            }
        });

        res.json(logs.map(l => ({
            id: l.id,
            action: l.action,
            label: l.label,
            entityName: l.entityName,
            by: l.performedBy.name,
            timestamp: l.createdAt.toISOString()
        })));
    } catch (err) {
        next(err);
    }
});

module.exports = router;

// Helper used by other routes to log an activity
async function logActivity(userId, action, label, entityName) {
    try {
        await prisma.activityLog.create({
            data: { action, label, entityName, userId }
        });
    } catch (err) {
        console.error('Error logging activity:', err);
    }
}

module.exports.logActivity = logActivity;
