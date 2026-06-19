const jwt = require('jsonwebtoken');

/**
 * JWT Auth Middleware
 * Verifica el token en el header Authorization: Bearer <token>
 * y agrega req.userId y req.userRole
 */
function authMiddleware(req, res, next) {
    let token = req.cookies?.token;

    // Fallback if frontend still sends Bearer token
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'la_clave_secreta_app_2026');
        console.log('[AuthMiddleware] Decoded JWT:', decoded);
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
    if (!req.userRole || req.userRole.toLowerCase() !== 'admin') {
        return res.status(403).json({ error: 'Se requieren permisos de administrador' });
    }
    next();
}

module.exports = { authMiddleware, adminOnly };
