require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────────────
app.use(cors({
    origin: function(origin, callback) {
        // Permitir cualquier origen (para desarrollo/pruebas)
        callback(null, true);
    },
    credentials: true
}));
app.use(express.json());

// ── Serve frontend static files ─────────────────────────────────────
// Sirve el frontend desde AppWeb/ (dos niveles arriba desde src/)
const frontendPath = path.join(__dirname, '..', '..');
app.use(express.static(frontendPath));

// ── API Routes ──────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/teams', require('./routes/teams'));

// ── Health check ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error handler ───────────────────────────────────────────────────
app.use(require('./middleware/errorHandler'));

// ── Start ───────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  🚀 Backend corriendo en http://localhost:${PORT}`);
    console.log(`  📊 API:       http://localhost:${PORT}/api/health`);
    console.log(`  🌐 Frontend:  http://localhost:${PORT}\n`);
});

// trigger redeploy
