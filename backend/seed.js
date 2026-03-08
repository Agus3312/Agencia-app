/**
 * Seed Script
 * Populates the database with initial data matching what the frontend expects.
 * 
 * Run: node seed.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Seeding database...\n');

    // ── Clean existing data ──────────────────────────────────────────
    await prisma.update.deleteMany();
    await prisma.file.deleteMany();
    await prisma.message.deleteMany();
    await prisma.task.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    // ── Create Users ─────────────────────────────────────────────────
    const password = await bcrypt.hash('123456', 10);

    const admin = await prisma.user.create({
        data: {
            name: 'Agustín Carpinetti',
            email: 'admin@acme.com',
            password,
            role: 'Admin',
            team: 'Management',
            tags: ['Full Stack', 'Project Management'],
            status: 'online'
        }
    });

    const elias = await prisma.user.create({
        data: {
            name: 'Elias Romero',
            email: 'elias@acme.com',
            password,
            role: 'Lead Developer',
            team: 'Frontend',
            tags: ['React', 'TypeScript', 'UI/UX'],
            status: 'online'
        }
    });

    const joaco = await prisma.user.create({
        data: {
            name: 'Joaquín López',
            email: 'joaco@acme.com',
            password,
            role: 'Developer',
            team: 'Backend',
            tags: ['Node.js', 'PostgreSQL', 'Docker'],
            status: 'online'
        }
    });

    const maria = await prisma.user.create({
        data: {
            name: 'María García',
            email: 'maria@acme.com',
            password,
            role: 'Designer',
            team: 'Design',
            tags: ['Figma', 'Branding', 'Motion'],
            status: 'offline'
        }
    });

    const lucas = await prisma.user.create({
        data: {
            name: 'Lucas Fernández',
            email: 'lucas@acme.com',
            password,
            role: 'Developer',
            team: 'Frontend',
            tags: ['Vue.js', 'CSS', 'Animations'],
            status: 'offline'
        }
    });

    console.log('  ✅ 5 users created (password: 123456)');

    // ── Create Projects ──────────────────────────────────────────────
    const project1 = await prisma.project.create({
        data: {
            name: 'Rediseño de Marca Corporativa',
            description: 'Actualización completa de la identidad visual de la empresa.',
            color: 'blue',
            status: 'in-progress',
            dueDate: new Date('2025-10-15'),
            createdById: admin.id,
            members: {
                create: [
                    { userId: admin.id, role: 'leader' },
                    { userId: maria.id, role: 'member' },
                    { userId: elias.id, role: 'member' }
                ]
            },
            tasks: {
                create: [
                    { title: 'Definir paleta de colores', done: true },
                    { title: 'Diseñar logo principal', done: true },
                    { title: 'Crear guía de estilos', done: false },
                    { title: 'Diseñar plantillas de documentos', done: false },
                    { title: 'Aplicar branding a redes sociales', done: false }
                ]
            }
        }
    });

    const project2 = await prisma.project.create({
        data: {
            name: 'App de Gestión Interna',
            description: 'Desarrollo de la plataforma interna para gestión de proyectos.',
            color: 'green',
            status: 'in-progress',
            dueDate: new Date('2025-12-01'),
            createdById: admin.id,
            members: {
                create: [
                    { userId: admin.id, role: 'leader' },
                    { userId: elias.id, role: 'member' },
                    { userId: joaco.id, role: 'member' },
                    { userId: lucas.id, role: 'member' }
                ]
            },
            tasks: {
                create: [
                    { title: 'Setup backend con Express', done: true },
                    { title: 'Definir schema de base de datos', done: true },
                    { title: 'Auth con JWT', done: true },
                    { title: 'API de proyectos', done: false },
                    { title: 'API de tareas', done: false },
                    { title: 'Chat en tiempo real', done: false },
                    { title: 'Deploy a producción', done: false }
                ]
            }
        }
    });

    const project3 = await prisma.project.create({
        data: {
            name: 'Campaña de Marketing Digital',
            description: 'Estrategia completa de marketing para el Q4.',
            color: 'orange',
            status: 'planning',
            dueDate: new Date('2025-11-30'),
            createdById: admin.id,
            members: {
                create: [
                    { userId: maria.id, role: 'leader' },
                    { userId: lucas.id, role: 'member' }
                ]
            },
            tasks: {
                create: [
                    { title: 'Definir público objetivo', done: false },
                    { title: 'Diseñar piezas gráficas', done: false },
                    { title: 'Configurar campañas en Meta Ads', done: false },
                    { title: 'Crear landing page', done: false }
                ]
            }
        }
    });

    console.log('  ✅ 3 projects created with tasks and team members');

    // ── Create some chat messages ────────────────────────────────────
    await prisma.message.createMany({
        data: [
            { text: 'Arranquemos con el diseño del logo', projectId: project1.id, authorId: admin.id },
            { text: 'Dale, ya tengo unas ideas armadas en Figma', projectId: project1.id, authorId: maria.id },
            { text: '¿Quién se encarga del backend??', projectId: project2.id, authorId: elias.id },
            { text: 'Yo me pongo con Express y Prisma', projectId: project2.id, authorId: joaco.id },
        ]
    });

    console.log('  ✅ Chat messages seeded');

    // ── Create updates ───────────────────────────────────────────────
    await prisma.update.createMany({
        data: [
            { title: 'Logo aprobado', description: 'El cliente aprobó la versión final del logo.', projectId: project1.id, authorId: maria.id },
            { title: 'Backend inicializado', description: 'Servidor Express corriendo con Prisma y PostgreSQL.', projectId: project2.id, authorId: joaco.id },
        ]
    });

    console.log('  ✅ Project updates seeded');
    console.log('\n🎉 Seed completado!\n');
    console.log('  Usuarios disponibles:');
    console.log('  ─────────────────────');
    console.log('  admin@acme.com   / 123456  (Admin)');
    console.log('  elias@acme.com   / 123456');
    console.log('  joaco@acme.com   / 123456');
    console.log('  maria@acme.com   / 123456');
    console.log('  lucas@acme.com   / 123456\n');
}

seed()
    .catch(e => { console.error('❌ Seed error:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
