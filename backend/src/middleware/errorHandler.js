/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
    console.error('[Error]', err.message);

    // Prisma known errors
    if (err.code === 'P2002') {
        return res.status(409).json({ error: 'Ese registro ya existe (campo único duplicado)' });
    }
    if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Registro no encontrado' });
    }

    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor'
    });
}

module.exports = errorHandler;
