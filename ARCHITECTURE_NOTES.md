# 🏗️ Architecture Notes — Notas para Backend Futuro

> Este documento es una guía de referencia para cuando migremos la app de localStorage a un backend real con base de datos, autenticación y storage de archivos.

---

## 📦 Stack Recomendado

| Capa | Tecnología | Alternativa |
|------|-----------|-------------|
| **Backend** | Node.js + Express (o Nest.js) | Supabase (BaaS) |
| **Base de datos** | PostgreSQL | MySQL |
| **ORM** | Prisma | TypeORM / Drizzle |
| **Auth** | JWT + bcrypt | Supabase Auth |
| **File Storage** | AWS S3 / Cloudinary | Supabase Storage |
| **Real-time (Chat)** | Socket.io | Supabase Realtime |
| **Deploy Backend** | Railway / Render | DigitalOcean |
| **Deploy Frontend** | Vercel / Netlify | Cloudflare Pages |

---

## 🗄️ Modelo de Base de Datos

```
┌──────────┐     ┌──────────────┐     ┌──────────┐
│  users   │────<│ team_members │>────│  teams   │
└──────────┘     └──────────────┘     └──────────┘
     │
     │  ┌───────────┐     ┌──────────┐
     ├──│  projects  │────<│  tasks   │
     │  └───────────┘     └──────────┘
     │        │
     │        ├──── messages (chat)
     │        ├──── files
     │        └──── updates (progress log)
     │
```

### Tablas principales

- **users**: id, email, name, password_hash, role, avatar_url, created_at
- **teams**: id, name, department, created_at
- **team_members**: user_id, team_id, role (líder/miembro)
- **projects**: id, name, description, color, status, due_date, team_id, created_by, created_at
- **tasks**: id, project_id, title, done, assigned_to, created_at
- **messages**: id, project_id, author_id, text, created_at
- **files**: id, project_id, name, type, url, uploaded_by, created_at
- **updates**: id, project_id, title, description, author_id, created_at

---

## 🔐 Autenticación

**Flujo JWT recomendado:**

1. `POST /api/auth/register` → crea user + hash password con bcrypt
2. `POST /api/auth/login` → valida credenciales → devuelve `{ accessToken, refreshToken }`
3. Cada request incluye `Authorization: Bearer <accessToken>`
4. `POST /api/auth/refresh` → renueva el accessToken
5. `POST /api/auth/logout` → invalida el refreshToken

**Middleware**: Validar JWT en cada ruta protegida. Extraer `userId` del token.

---

## 🌐 API REST — Endpoints

```
Auth:
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/logout
  GET    /api/auth/me

Projects:
  GET    /api/projects              → lista de proyectos del usuario
  POST   /api/projects              → crear proyecto (admin)
  GET    /api/projects/:id          → detalle
  PATCH  /api/projects/:id          → actualizar
  DELETE /api/projects/:id          → eliminar (admin)

Tasks:
  POST   /api/projects/:id/tasks    → agregar tarea
  PATCH  /api/tasks/:id             → toggle done / editar
  DELETE /api/tasks/:id             → eliminar

Chat:
  GET    /api/projects/:id/messages → historial
  POST   /api/projects/:id/messages → enviar mensaje
  WS     /ws/projects/:id           → real-time (Socket.io)

Files:
  GET    /api/projects/:id/files    → lista
  POST   /api/projects/:id/files    → upload (multipart)
  DELETE /api/files/:id             → eliminar

Updates:
  GET    /api/projects/:id/updates  → historial
  POST   /api/projects/:id/updates  → agregar

Teams:
  GET    /api/teams
  POST   /api/teams
  GET    /api/teams/:id/members
  POST   /api/teams/:id/members
```

---

## 📁 Archivos Preparados para la Migración

| Archivo actual | Qué cambiar |
|---|---|
| `StorageAdapter.js` | Reemplazar por `ApiAdapter.js` que haga `fetch()` |
| `AuthService.js` | Conectar a `/api/auth/*`, guardar JWT en httpOnly cookie |
| `ProjectService.js` | Ya tiene notas de qué endpoint corresponde a cada método |
| `EventBus.js` | Conectar a Socket.io para recibir eventos del server |

---

## ⚡ Orden de Migración Sugerido

1. **Setup PostgreSQL + Prisma** → definir schema, migrar
2. **Auth endpoints** → register, login, JWT middleware
3. **Projects CRUD** → los endpoints más usados
4. **Tasks** → sub-recurso de projects
5. **Chat con Socket.io** → real-time
6. **File upload** → S3 o Supabase Storage
7. **Deploy** → Railway (backend) + Vercel (frontend)
