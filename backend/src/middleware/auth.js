const jwt = require('jsonwebtoken');

/**
 * JWT Auth Middleware
 * Verifica el token en el header Authorization: Bearer <token>
 * y agrega req.userId y req.userRole
 */
function authMiddleware(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = header.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'la_clave_secreta_app_2026');
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}

/**
 * Admin-only middleware (use after authMiddleware)
 */
function adminOnly(req, res, next) {
    if (req.userRole !== 'Admin') {
        return res.status(403).json({ error: 'Se requieren permisos de administrador' });
    }
    next();
}

module.exports = { authMiddleware, adminOnly };
