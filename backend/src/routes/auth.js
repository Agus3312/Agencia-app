const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');
const { logActivity } = require('./activity');
const router = express.Router();

// Helper para configurar la cookie segura
const setTokenCookie = (res, token) => {
    // [CAMBIO] Problema 3: Seteo de JWT como HttpOnly cookie seguro
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });
};

router.post('/register', async (req, res, next) => {
    try {
        const { name, email, password, role, team } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(409).json({ error: 'Ya existe un usuario con ese email' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword, role: role || 'Developer', team: team || 'Frontend' }
        });

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'la_clave_secreta_app_2026',
            { expiresIn: '7d' }
        );
        
        // [CAMBIO] Problema 3: Uso del helper para setear la cookie
        setTokenCookie(res, token);

        if (team) await prisma.team.upsert({ where: { name: team }, create: { name: team }, update: {} });
        await logActivity(user.id, 'user_created', 'fue agregado al sistema', user.name);

        res.status(201).json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, team: user.team, image: user.image }
        });
    } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son requeridos' });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

        await prisma.user.update({ where: { id: user.id }, data: { status: 'online' } });

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'la_clave_secreta_app_2026',
            { expiresIn: '7d' }
        );
        
        // [CAMBIO] Problema 3: Uso del helper para setear la cookie
        setTokenCookie(res, token);


        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, team: user.team, image: user.image }
        });
    } catch (err) { next(err); }
});

// [CAMBIO] Problema 3: Agregado el endpoint /logout para limpiar la cookie del lado del servidor
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    res.json({ message: 'Sesión cerrada correctamente' });
});

router.get('/me', authMiddleware, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true, name: true, email: true, role: true, team: true, image: true, tags: true, status: true }
        });
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(user);
    } catch (err) { next(err); }
});

router.post('/change-password', authMiddleware, async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ error: 'La contraseña actual y la nueva son requeridas' });

        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) return res.status(401).json({ error: 'La contraseña actual es incorrecta' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });
        await logActivity(user.id, 'password_changed', 'cambió su contraseña', '');

        res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (err) { next(err); }
});

module.exports = router;
