require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { Server } = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE'], credentials: true }
});

// Make io accessible in routes via req.app.get('io')
app.set('io', io);

// Socket.io logic
io.on('connection', (socket) => {
    console.log(`📡 WS Conectado: ${socket.id}`);

    // Join a specific project room to listen for its messages
    socket.on('join_project', (projectId) => {
        socket.join(projectId);
        console.log(`👥 WS: Socket ${socket.id} se unió al proyecto ${projectId}`);
    });

    // Leave project room
    socket.on('leave_project', (projectId) => {
        socket.leave(projectId);
        console.log(`👋 WS: Socket ${socket.id} salió del proyecto ${projectId}`);
    });

    socket.on('disconnect', () => {
        console.log(`🔌 WS Desconectado: ${socket.id}`);
    });
});
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
app.use('/api/activity', require('./routes/activity'));

// ── Health check ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        hasDbUrl: !!process.env.DATABASE_URL,
        envKeys: Object.keys(process.env)
    });
});

// ── Error handler ───────────────────────────────────────────────────
app.use(require('./middleware/errorHandler'));

// ── Start ───────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  🚀 Backend corriendo en http://localhost:${PORT}`);
    console.log(`  📊 API:       http://localhost:${PORT}/api/health`);
    console.log(`  🌐 Frontend:  http://localhost:${PORT}`);
    console.log(`  🧩 ENV Keys:  ${Object.keys(process.env).length} variables inyectadas`);
    console.log(`  ❓ DB URL?:   ${!!process.env.DATABASE_URL}\n`);
});

// trigger redeploy
