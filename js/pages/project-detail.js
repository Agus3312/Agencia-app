/**
 * ProjectDetailPage Controller
 * Renders 4 tabs: General, Chat, Archivos, Actualizaciones
 */
window.ProjectDetailPage = {
    projectId: null,
    activeTab: 'general',
    socket: null,

    async init(projectId) {
        this.projectId = projectId;
        this.activeTab = 'general';
        await this.render();
        this.initSocket();
    },

    initSocket() {
        if (!window.io) return;
        
        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = io(ApiAdapter.BASE_URL);

        this.socket.on('connect', () => {
            console.log('WS Frontend conectado');
            this.socket.emit('join_project', this.projectId);
        });

        this.socket.on('new_message', (msg) => {
            // If we are currently viewing the chat tab, append it in real time
            if (this.activeTab === 'chat') {
                this.appendMessageToDOM(msg);
                this.scrollChat();
            } else {
                // Optionally: Update unread badge here
                const chatBtn = document.getElementById('pdt-chat');
                if (chatBtn) {
                   // Visual indicator could be added
                }
            }
        });
    },

    appendMessageToDOM(msg) {
        const container = document.getElementById('chat-messages');
        if (!container) return;

        // Remove empty state if present
        const emptyState = container.querySelector('.py-16');
        if (emptyState) emptyState.remove();

        const currentUser = AuthService.getUserName();
        const isMe = msg.author === currentUser;
        const time = new Date(msg.timestamp).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        
        const msgHtml = `
            <div class="flex ${isMe ? 'justify-end' : 'justify-start'}">
                <div class="max-w-[70%]">
                    <div class="${isMe
                        ? 'bg-primary text-white rounded-2xl rounded-br-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-md'} px-4 py-3">
                        ${!isMe ? `<p class="text-xs font-bold mb-1 text-primary">${msg.author}</p>` : ''}
                        <p class="text-sm">${msg.text}</p>
                    </div>
                    <p class="text-[10px] text-slate-400 mt-1 ${isMe ? 'text-right' : ''}">${time}</p>
                </div>
            </div>`;
            
        container.insertAdjacentHTML('beforeend', msgHtml);
    },

    async render() {
        const container = document.getElementById('project-detail-container');
        if (!container || !this.projectId) return;
        const project = await ProjectService.fetchById(this.projectId);
        if (!project) {
            container.innerHTML = `<div class="text-center py-20 text-slate-400"><span class="material-symbols-outlined text-5xl block mb-3">error</span>Proyecto no encontrado.</div>`;
            return;
        }

        const progress = ProjectService.getTaskProgress(project);

        const statusConfig = {
            'planning':    { label: 'Planificación', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400', dot: 'bg-slate-400' },
            'in-progress': { label: 'En Progreso',   color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',    dot: 'bg-blue-500' },
            'review':      { label: 'En Revisión',   color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
            'completed':   { label: 'Completado',    color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' }
        };
        const status = statusConfig[project.status] || statusConfig['in-progress'];

        const tabs = [
            { id: 'general', label: 'General', icon: 'info' },
            { id: 'kanban', label: 'Kanban', icon: 'view_kanban' },
            { id: 'chat', label: 'Chat', icon: 'chat', badge: project.chat?.length || 0 },
            { id: 'files', label: 'Archivos', icon: 'folder', badge: project.files?.length || 0 },
            { id: 'updates', label: 'Actualizaciones', icon: 'update', badge: project.updates?.length || 0 }
        ];

        const colorMap = { blue: '#3b82f6', green: '#22c55e', orange: '#f97316', purple: '#a855f7', yellow: '#eab308', red: '#ef4444' };
        const accentColor = colorMap[project.color] || '#6366f1';

        container.innerHTML = `
            <!-- Back + Title -->
            <div class="flex items-center gap-4 mb-6">
                <button onclick="window.location.hash='projects'"
                    class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <span class="material-symbols-outlined">arrow_back</span>
                </button>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-0.5">
                        ${project.client ? `
                            <span class="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <span class="material-symbols-outlined text-[12px]">corporate_fare</span>
                                ${project.client.name}
                            </span>
                        ` : ''}
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="w-3 h-3 rounded-full flex-shrink-0" style="background:${accentColor}"></div>
                        <h2 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">${project.name}</h2>
                    </div>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5 ml-6 line-clamp-1">${project.description || 'Sin descripción'}</p>
                </div>
                <div class="flex items-center gap-3 flex-shrink-0">
                    <span class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold ${status.color}">
                        <span class="w-1.5 h-1.5 rounded-full ${status.dot}"></span>
                        ${status.label}
                    </span>
                    <span class="text-sm font-bold px-3 py-1.5 rounded-full" data-task-status="header" style="background:${accentColor}20;color:${accentColor}">${progress.done}/${progress.total} tareas</span>
                </div>
            </div>

            <!-- Progress Bar -->
            <div class="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full mb-8 overflow-hidden">
                <div class="h-full rounded-full transition-all" style="width:${progress.percent}%;background:${accentColor}"></div>
            </div>

            <!-- Tab Bar -->
            <div class="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-8 w-fit">
                ${tabs.map(t => `
                    <button id="pdt-${t.id}" onclick="ProjectDetailPage.switchTab('${t.id}')"
                        class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                            ${this.activeTab === t.id ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}">
                        <span class="material-symbols-outlined text-base">${t.icon}</span>
                        ${t.label}
                        ${t.badge ? `<span class="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold flex items-center justify-center">${t.badge}</span>` : ''}
                    </button>
                `).join('')}
            </div>

            <!-- Tab Content -->
            <div id="pdt-content"></div>
        `;
        this.loadTab(this.activeTab);
    },

    switchTab(tabId) {
        this.activeTab = tabId;
        ['general','kanban','chat','files','updates'].forEach(id => {
            const btn = document.getElementById('pdt-' + id);
            if (!btn) return;
            btn.className = id === tabId
                ? 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all bg-white dark:bg-slate-900 text-primary shadow-sm'
                : 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200';
        });
        this.loadTab(tabId);
    },

    async loadTab(tabId) {
        const el = document.getElementById('pdt-content');
        if (!el) return;
        const p = await ProjectService.fetchById(this.projectId);
        if (!p) return;
        switch (tabId) {
            case 'general':  el.innerHTML = this.tabGeneral(p); break;
            case 'kanban':   el.innerHTML = this.tabKanban(p); break;
            case 'chat':     el.innerHTML = this.tabChat(p); this.scrollChat(); break;
            case 'files':    el.innerHTML = this.tabFiles(p); break;
            case 'updates':  el.innerHTML = this.tabUpdates(p); break;
        }
    },

    // ─── TAB: General ───────────────────────────────────────────────────
    tabGeneral(p) {
        const dueDate = new Date(p.dueDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
        const progress = ProjectService.getTaskProgress(p);
        const tasks = p.tasks || [];

        const statusOptions = ['planning', 'in-progress', 'review', 'completed'];
        const statusLabels = { 'planning': 'Planificación', 'in-progress': 'En Progreso', 'review': 'En Revisión', 'completed': 'Completado' };

        return `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Info Card -->
                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <h3 class="font-bold text-lg mb-4">Información del Proyecto</h3>
                    <div class="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                        <div>
                            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Estado</p>
                            <select onchange="ProjectDetailPage.changeStatus(this.value)"
                                class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/40">
                                ${statusOptions.map(s => `<option value="${s}" ${p.status === s ? 'selected' : ''}>${statusLabels[s]}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Fecha de Entrega</p>
                            <div class="flex items-center gap-2 font-semibold text-slate-800 dark:text-white p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <span class="material-symbols-outlined text-sm text-slate-400">calendar_today</span>
                                ${dueDate}
                            </div>
                        </div>
                        ${p.budget ? `
                        <div>
                            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Presupuesto</p>
                            <div class="flex items-center gap-2 font-bold text-emerald-500 p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                <span class="material-symbols-outlined text-sm">payments</span>
                                $${p.budget.toLocaleString()}
                            </div>
                        </div>` : ''}
                        ${p.estimatedHours ? `
                        <div>
                            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Horas Estimadas</p>
                            <div class="flex items-center gap-2 font-bold text-blue-500 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <span class="material-symbols-outlined text-sm">timer</span>
                                ${p.estimatedHours}h
                            </div>
                        </div>` : ''}
                        <div>
                            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Progreso</p>
                            <div class="flex items-center justify-between font-semibold text-slate-800 dark:text-white p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <span>${progress.done}/${progress.total} completadas</span>
                                <span class="text-xs text-primary">${progress.percent}%</span>
                            </div>
                        </div>
                        <div>
                            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Equipo</p>
                            <div class="flex items-center gap-2 font-semibold text-slate-800 dark:text-white p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <span class="material-symbols-outlined text-sm text-slate-400">groups</span>
                                ${p.team.length} personas
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tasks Checklist -->
                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h3 class="font-bold text-lg">Tareas del Proyecto</h3>
                        <span class="text-xs font-bold px-2.5 py-1 rounded-full ${progress.done === progress.total && progress.total > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}" data-task-status="tab-general">${progress.done}/${progress.total}</span>
                    </div>

                    <!-- Add Task Form -->
                    <form onsubmit="ProjectDetailPage.addTask(event)" class="flex gap-3 px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <input type="text" id="new-task-input" required placeholder="Agregar nueva tarea..."
                            class="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"/>
                        <button type="submit" class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-base">add</span> Agregar
                        </button>
                    </form>

                    <!-- Task List -->
                    <div class="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
                        ${tasks.length === 0 ? `
                            <div class="p-8 text-center text-slate-400">
                                <span class="material-symbols-outlined text-3xl block mb-2 opacity-40">checklist</span>
                                <p class="text-sm">No hay tareas aún. Agregá la primera.</p>
                            </div>
                        ` : tasks.map(t => {
                            const taskDue = t.dueDate ? new Date(t.dueDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : null;
                            const priorityClass = {
                                'urgent': 'text-rose-500 bg-rose-500/10 border-rose-500/20',
                                'high': 'text-orange-500 bg-orange-500/10 border-orange-500/20',
                                'medium': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
                                'low': 'text-slate-400 bg-slate-400/10 border-slate-400/20'
                            }[t.priority] || 'text-slate-400';

                            return `
                            <div class="flex items-center gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                <button onclick="ProjectDetailPage.toggleTask('${t.id}')"
                                    class="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
                                    ${t.done
                                        ? 'bg-primary border-primary text-white'
                                        : 'border-slate-300 dark:border-slate-600 hover:border-primary'}">
                                    ${t.done ? '<span class="material-symbols-outlined text-xs">check</span>' : ''}
                                </button>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 mb-0.5">
                                        <span class="text-sm font-medium ${t.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}">${t.title}</span>
                                        ${t.priority ? `<span class="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${priorityClass}">${t.priority}</span>` : ''}
                                    </div>
                                    <div class="flex items-center gap-3">
                                        ${taskDue ? `
                                        <div class="flex items-center gap-1 text-[10px] text-slate-400">
                                            <span class="material-symbols-outlined text-[12px]">calendar_today</span>
                                            ${taskDue}
                                        </div>` : ''}
                                        ${(t.labels || []).map(label => `
                                            <span class="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">${label}</span>
                                        `).join('')}
                                    </div>
                                </div>
                                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onclick="ProjectDetailPage.openTaskModal('${t.id}')" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                        <span class="material-symbols-outlined text-sm">more_vert</span>
                                    </button>
                                    <button onclick="ProjectDetailPage.removeTask('${t.id}')"
                                        class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                        <span class="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>

                <!-- Stats Row -->
                <div class="grid grid-cols-3 gap-4">
                    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
                        <span class="material-symbols-outlined text-2xl text-blue-500 mb-1">chat</span>
                        <p class="text-2xl font-bold">${p.chat?.length || 0}</p>
                        <p class="text-xs text-slate-400">Mensajes</p>
                    </div>
                    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
                        <span class="material-symbols-outlined text-2xl text-amber-500 mb-1">folder</span>
                        <p class="text-2xl font-bold">${p.files?.length || 0}</p>
                        <p class="text-xs text-slate-400">Archivos</p>
                    </div>
                    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
                        <span class="material-symbols-outlined text-2xl text-emerald-500 mb-1">update</span>
                        <p class="text-2xl font-bold">${p.updates?.length || 0}</p>
                        <p class="text-xs text-slate-400">Actualizaciones</p>
                    </div>
                </div>

                <!-- Danger Zone (Admins only) -->
                ${AuthService.isAdmin() ? `
                <div class="mt-8 p-6 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl">
                    <h4 class="text-red-600 dark:text-red-400 font-bold mb-2 flex items-center gap-2">
                        <span class="material-symbols-outlined text-lg">warning</span> Zona de Peligro
                    </h4>
                    <p class="text-sm text-red-500/80 dark:text-red-400/80 mb-4">
                        Eliminar el proyecto borrará todas sus tareas, archivos, mensajes e historial. Esta acción no se puede deshacer.
                    </p>
                    <button onclick="ProjectDetailPage.deleteProject()" 
                        class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
                        Eliminar Proyecto
                    </button>
                </div>` : ''}
            </div>

            <!-- Team Sidebar -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 h-fit">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-lg">Equipo Asignado</h3>
                    ${AuthService.isAdmin() ? `
                    <button onclick="ProjectDetailPage.toggleAddMember()"
                        id="add-member-btn"
                        class="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all">
                        <span class="material-symbols-outlined text-sm">person_add</span> Agregar
                    </button>` : ''}
                </div>

                <!-- Add member panel (hidden by default) -->
                ${AuthService.isAdmin() ? `
                <div id="add-member-panel" class="hidden mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Agregar por equipo o persona</p>
                    <select id="add-member-mode" onchange="ProjectDetailPage.onAddMemberModeChange()" 
                        class="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/40">
                        <option value="">Seleccionar modo...</option>
                        <option value="team">Agregar equipo completo</option>
                        <option value="individual">Agregar persona individual</option>
                    </select>
                    <select id="add-member-value" class="hidden w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/40">
                        <option value="">Cargando...</option>
                    </select>
                    <button onclick="ProjectDetailPage.confirmAddMember()" 
                        class="w-full py-1.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                        Confirmar
                    </button>
                </div>` : ''}

                <div class="space-y-2" id="team-member-list">
                    ${p.team.map((m, i) => `
                        <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                            <div class="w-10 h-10 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700 flex-shrink-0"
                                style="background-image: url('${m.avatar}')" loading="lazy"></div>
                            <div class="flex-1 min-w-0">
                                <p class="font-semibold text-sm truncate">${m.name}</p>
                                <p class="text-xs text-slate-400">${i === 0 ? 'Líder de proyecto' : 'Miembro'}</p>
                            </div>
                            ${AuthService.isAdmin() ? `
                            <button onclick="ProjectDetailPage.removeMember('${m.id}')" title="Quitar del proyecto"
                                class="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0">
                                <span class="material-symbols-outlined text-sm">close</span>
                            </button>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>`;
    },

    // ─── TAB: Kanban ────────────────────────────────────────────────────
    tabKanban(p) {
        const tasks = p.tasks || [];
        const columns = [
            { id: 'todo',        label: 'Por Hacer',   color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
            { id: 'in-progress', label: 'En Progreso', color: 'bg-blue-50 text-blue-600',    dot: 'bg-blue-500' },
            { id: 'review',      label: 'Revisión',    color: 'bg-amber-50 text-amber-600',  dot: 'bg-amber-500' },
            { id: 'done',        label: 'Completado',  color: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' }
        ];

        return `
        <div class="flex gap-4 overflow-x-auto pb-6 h-[650px] items-start scrollbar-thin">
            ${columns.map(col => {
                const colTasks = tasks.filter(t => (t.status || 'todo') === col.id);
                return `
                <div class="flex-shrink-0 w-80 h-full flex flex-col">
                    <div class="flex items-center justify-between mb-4 px-1">
                        <div class="flex items-center gap-2.5">
                            <span class="w-2.5 h-2.5 rounded-full ${col.dot} shadow-[0_0_8px] shadow-current opacity-70"></span>
                            <h3 class="font-bold text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">${col.label}</h3>
                            <span class="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">${colTasks.length}</span>
                        </div>
                        <button onclick="ProjectDetailPage.addTaskPrompt('${col.id}')" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all text-slate-400 hover:text-primary">
                            <span class="material-symbols-outlined text-lg">add</span>
                        </button>
                    </div>
                    
                    <div class="flex-1 bg-slate-100/30 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-3 overflow-y-auto space-y-4 min-h-[100px]"
                         data-status="${col.id}"
                         ondragover="ProjectDetailPage.onKanbanDragOver(event)"
                         ondrop="ProjectDetailPage.onKanbanDrop(event, '${col.id}')">
                        ${colTasks.length === 0 ? `
                            <div class="py-20 text-center">
                                <span class="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-800 mb-2 block">inventory_2</span>
                                <p class="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Sin tareas</p>
                            </div>
                        ` : colTasks.map(t => this._renderKanbanCard(t)).join('')}
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    },

    _renderKanbanCard(t) {
        const priorityClass = {
            'urgent': 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]',
            'high': 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]',
            'medium': 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]',
            'low': 'bg-slate-400 shadow-none'
        }[t.priority] || 'bg-slate-400';

        const date = t.dueDate ? new Date(t.dueDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : null;

        const assigneeAvatar = t.assignedTo
            ? `<div class="w-6 h-6 rounded-full bg-cover bg-center border-2 border-white dark:border-slate-800"
                   style="background-image:url('${t.assignedTo.avatar}')"
                   title="${t.assignedTo.name}"></div>`
            : `<div class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center">
                   <span class="material-symbols-outlined text-xs text-slate-400">person</span>
               </div>`;

        return `
        <div onclick="ProjectDetailPage.openTaskModal('${t.id}')"
             draggable="true"
             ondragstart="ProjectDetailPage.onKanbanDragStart(event, '${t.id}')"
             class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 transition-all cursor-pointer group/card relative overflow-hidden">
            <div class="flex items-start justify-between gap-3 mb-3">
                <span class="w-8 h-1.5 rounded-full ${priorityClass}"></span>
                <div class="flex -space-x-1.5">${assigneeAvatar}</div>
            </div>
            <p class="text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-3 leading-snug group-hover/card:text-primary transition-colors line-clamp-3">${t.title}</p>
            ${t.labels?.length ? `
            <div class="flex flex-wrap gap-1.5 mb-2">
                ${t.labels.map(l => `<span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50 text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-tighter border border-slate-200 dark:border-slate-600/50">${l}</span>`).join('')}
            </div>` : ''}
            <div class="flex items-center justify-between mt-4 pt-3 border-t border-slate-50 dark:border-slate-700/50">
                <div class="flex items-center gap-2">
                        <div class="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                        <span class="material-symbols-outlined text-sm">chat_bubble_outline</span>
                            <span>${t.commentsCount || 0}</span>
                    </div>
                </div>
                ${date ? `
                <div class="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <span class="material-symbols-outlined text-xs">calendar_today</span>
                    <span>${date}</span>
                </div>` : ''}
            </div>
        </div>`;
    },

    addTaskPrompt(status) {
        const title = prompt('Título de la tarea:');
        if (!title) return;
        this.createTaskWithStatus(title, status);
    },

    onKanbanDragStart(e, taskId) {
        try {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', taskId);
        } catch (_) {
            // algunos navegadores pueden limitar dataTransfer; usamos fallback interno
        }
        this.draggingTaskId = taskId;
    },

    onKanbanDragOver(e) {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
    },

    async onKanbanDrop(e, newStatus) {
        e.preventDefault();
        const taskId = this.draggingTaskId || (e.dataTransfer && e.dataTransfer.getData('text/plain'));
        if (!taskId) return;

        this.draggingTaskId = null;

        try {
            await ProjectService.updateTaskStatus(this.projectId, taskId, newStatus);
            const project = await ProjectService.fetchById(this.projectId);
            const outlet = document.getElementById('pdt-content');
            if (outlet) {
                outlet.innerHTML = this.tabKanban(project);
            }
            Toast.success('Tarea movida a ' + newStatus);
        } catch (err) {
            console.error('Error moviendo tarea en Kanban:', err);
            Toast.error('No se pudo mover la tarea');
        }
    },

    async createTaskWithStatus(title, status) {
        try {
            await ProjectService.addTask(this.projectId, { title, status });
            await this.loadTab('kanban');
            Toast.success('Tarea agregada a ' + status);
        } catch(e) {
            Toast.error('Error al agregar tarea');
        }
    },

    async openTaskModal(taskId) {
        try {
            const project = ProjectService.getById(this.projectId) || await ProjectService.fetchById(this.projectId);
            const task = project.tasks.find(t => t.id === taskId);
            if (!task) return;

            const comments = await ProjectService.fetchTaskComments(taskId);
            
            let modal = document.getElementById('task-detail-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'task-detail-modal';
                modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in';
                document.body.appendChild(modal);
            }
            
            modal.innerHTML = this._renderTaskModalContent(task, comments, project.team || []);
            modal.style.display = 'flex';

            // Load and display total time
            this.refreshTaskTime(taskId);
            
            // Scroll to bottom of comments
            const container = document.getElementById('task-comments-container');
            if (container) container.scrollTop = container.scrollHeight;
        } catch (e) {
            console.error('Error opening task modal:', e);
            Toast.error('No se pudo cargar el detalle de la tarea');
        }
    },

    closeTaskModal() {
        const modal = document.getElementById('task-detail-modal');
        if (modal) modal.style.display = 'none';
    },

    _renderTaskModalContent(t, comments = [], team = []) {
        const date = t.dueDate ? new Date(t.dueDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Sin fecha';
        const priorities = [
            { id: 'low', label: 'Baja', color: 'bg-slate-400' },
            { id: 'medium', label: 'Media', color: 'bg-blue-500' },
            { id: 'high', label: 'Alta', color: 'bg-orange-500' },
            { id: 'urgent', label: 'Urgente', color: 'bg-rose-500' }
        ];

        return `
        <div class="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
            <!-- Modal Header -->
            <div class="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div class="flex items-center gap-3">
                    <span class="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full">Tarea #${t.id.slice(-4)}</span>
                    <h2 class="text-xl font-bold text-slate-800 dark:text-white truncate max-w-md">${t.title}</h2>
                </div>
                <button onclick="ProjectDetailPage.closeTaskModal()" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="flex-1 overflow-y-auto flex">
                <!-- Left Panel: Details -->
                <div class="flex-1 p-8 border-r border-slate-100 dark:border-slate-800 space-y-8">
                    <section>
                        <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Descripción</h4>
                        <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 min-h-[100px]">
                            <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">${t.description || '<span class="italic text-slate-400">Sin descripción...</span>'}</p>
                        </div>
                    </section>

                    <div class="grid grid-cols-2 gap-8">
                        <section>
                            <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Prioridad</h4>
                            <div class="flex flex-wrap gap-2">
                                ${priorities.map(p => `
                                    <button onclick="ProjectDetailPage.updateTaskField('${t.id}', { priority: '${p.id}' })"
                                        class="px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-2
                                        ${t.priority === p.id 
                                            ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'}">
                                        <span class="w-2 h-2 rounded-full ${p.color}"></span>
                                        ${p.label}
                                    </button>
                                `).join('')}
                            </div>
                        </section>

                        <section>
                            <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Fecha de Entrega</h4>
                            <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span class="material-symbols-outlined text-slate-400">calendar_today</span>
                                <span class="text-sm font-bold text-slate-700 dark:text-slate-200">${date}</span>
                            </div>
                        </section>
                    </div>

                    <section>
                        <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Responsable</h4>
                        <div class="flex flex-wrap gap-2">
                            ${team.map(member => `
                                <button onclick="ProjectDetailPage.updateTaskField('${t.id}', { assignedId: '${member.id}' })"
                                    class="px-3 py-1.5 rounded-full border text-[11px] font-semibold flex items-center gap-2 transition-all
                                        ${t.assignedId === member.id
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'}">
                                    <span class="w-5 h-5 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700"
                                          style="background-image:url('${member.avatar}')"></span>
                                    ${member.name.split(' ')[0]}
                                </button>
                            `).join('')}
                            <button onclick="ProjectDetailPage.updateTaskField('${t.id}', { assignedId: null })"
                                class="px-3 py-1.5 rounded-full border text-[11px] font-semibold text-slate-400 bg-white dark:bg-slate-800 border-dashed border-slate-300 dark:border-slate-600 hover:border-slate-400">
                                Sin asignar
                            </button>
                        </div>
                    </section>

                    <section>
                        <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between">
                            Registro de Tiempo
                            <span id="task-total-time" class="text-primary normal-case font-bold">...</span>
                        </h4>
                        <div class="flex gap-2">
                            <input type="number" id="time-duration" placeholder="Min" 
                                class="w-20 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/40 transition-all outline-none">
                            <input type="text" id="time-note" placeholder="¿En qué trabajaste?" 
                                class="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/40 transition-all outline-none">
                            <button onclick="ProjectDetailPage.handleLogTime('${t.id}')"
                                class="px-4 bg-primary text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-primary/10">
                                Registrar
                            </button>
                        </div>
                    </section>

                    <section>
                        <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Etiquetas</h4>
                        <div class="flex flex-wrap gap-2">
                            ${(t.labels || []).map(l => `
                                <span class="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700">${l}</span>
                            `).join('')}
                            <button class="w-8 h-8 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
                                <span class="material-symbols-outlined text-sm">add</span>
                            </button>
                        </div>
                    </section>
                </div>

                <!-- Right Panel: Activity & Comments -->
                <div class="w-80 flex flex-col bg-slate-50/30 dark:bg-slate-900/40">
                    <div class="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h4 class="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span class="material-symbols-outlined text-lg">message</span> Comentarios
                        </h4>
                    </div>
                    
                    <div id="task-comments-container" class="flex-1 overflow-y-auto p-6 space-y-4">
                        ${comments.length === 0 ? `
                            <div class="text-center py-10">
                                <span class="material-symbols-outlined text-3xl text-slate-200 dark:text-slate-800 mb-2 block">chat_bubble</span>
                                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sin comentarios</p>
                            </div>
                        ` : comments.map(c => `
                            <div class="flex gap-3">
                                <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 bg-cover bg-center border border-white dark:border-slate-800"
                                     style="background-image: url('${c.author.image || 'https://ui-avatars.com/api/?name='+c.author.name}')"></div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center justify-between mb-0.5">
                                        <span class="text-[11px] font-bold text-slate-700 dark:text-slate-300">${c.author.name}</span>
                                        <span class="text-[9px] text-slate-400">${new Date(c.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span>
                                    </div>
                                    <p class="text-[12px] text-slate-600 dark:text-slate-400 leading-snug">${c.text}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                        <div class="relative">
                            <input onkeydown="if(event.key === 'Enter') ProjectDetailPage.submitTaskComment('${t.id}', this)"
                                type="text" placeholder="Escribí un comentario..."
                                class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-[12px] outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"/>
                            <button class="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-blue-700 transition-colors">
                                <span class="material-symbols-outlined text-lg">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    async updateTaskField(taskId, data) {
        try {
            await ProjectService.updateTask(this.projectId, taskId, data);
            const project = await ProjectService.fetchById(this.projectId);
            const task = project.tasks.find(t => t.id === taskId);
            const comments = await ProjectService.fetchTaskComments(taskId);
            
            // Re-render modal content
            const modal = document.getElementById('task-detail-modal');
            if (modal) modal.innerHTML = this._renderTaskModalContent(task, comments, project.team || []);
            
            // Refresh main view
            await this.render();
            Toast.success('Tarea actualizada');
        } catch (e) {
            Toast.error('Error al actualizar tarea');
        }
    },

    async submitTaskComment(taskId, input) {
        const text = input.value.trim();
        if (!text) return;

        try {
            await ProjectService.addTaskComment(this.projectId, taskId, text);
            input.value = '';
            
            // Refresh comments in modal
            const comments = await ProjectService.fetchTaskComments(taskId);
            const project = ProjectService.getById(this.projectId);
            const task = project.tasks.find(t => t.id === taskId);
            
            const modal = document.getElementById('task-detail-modal');
            if (modal) {
                modal.innerHTML = this._renderTaskModalContent(task, comments, project.team || []);
                // Scroll to bottom
                const container = document.getElementById('task-comments-container');
                if (container) container.scrollTop = container.scrollHeight;
            }
            
            Toast.success('Comentario enviado');
        } catch (e) {
            Toast.error('Error al enviar comentario');
        }
    },

    async handleLogTime(taskId) {
        const durationInput = document.getElementById('time-duration');
        const noteInput = document.getElementById('time-note');
        
        const duration = parseInt(durationInput.value);
        const note = noteInput.value.trim();

        if (isNaN(duration) || duration <= 0) {
            Toast.error('Ingresá una duración válida en minutos');
            return;
        }

        try {
            await ProjectService.logTime(taskId, duration, note);
            durationInput.value = '';
            noteInput.value = '';
            
            Toast.success('Tiempo registrado correctamente');
            await this.refreshTaskTime(taskId);
            // Refresh project view to show updated stats if needed
            await this.render();
        } catch (e) {
            console.error('Time log error:', e);
            Toast.error('Error al registrar tiempo');
        }
    },

    async refreshTaskTime(taskId) {
        const totalSpan = document.getElementById('task-total-time');
        if (!totalSpan) return;

        try {
            const entries = await ProjectService.fetchTaskTime(taskId);
            const totalMinutes = entries.reduce((acc, curr) => acc + curr.duration, 0);
            
            if (totalMinutes === 0) {
                totalSpan.textContent = 'Sin registros';
            } else {
                const h = Math.floor(totalMinutes / 60);
                const m = totalMinutes % 60;
                totalSpan.textContent = `${h}h ${m}m totales`;
            }
        } catch (e) {
            console.error('Error refreshing time:', e);
            totalSpan.textContent = 'Error al cargar';
        }
    },

    toggleAddMember() {
        const panel = document.getElementById('add-member-panel');
        const btn   = document.getElementById('add-member-btn');
        if (!panel) return;
        const isHidden = panel.classList.toggle('hidden');
        if (btn) btn.textContent = isHidden ? 'Agregar' : 'Cancelar';
        if (!isHidden) {
            // Reset
            document.getElementById('add-member-mode').value = '';
            document.getElementById('add-member-value').classList.add('hidden');
        }
    },

    async onAddMemberModeChange() {
        const mode = document.getElementById('add-member-mode').value;
        const valSelect = document.getElementById('add-member-value');
        if (!mode) { valSelect.classList.add('hidden'); return; }

        valSelect.classList.remove('hidden');
        const allUsers = await TeamService.fetchAll();
        const project  = ProjectService.getById(this.projectId) || await ProjectService.fetchById(this.projectId);
        const memberIds = new Set((project.team || []).map(m => m.id));

        if (mode === 'team') {
            const teams = [...new Set(allUsers.map(u => u.team))].sort();
            valSelect.innerHTML = `<option value="">Seleccionar equipo...</option>` + 
                teams.map(t => `<option value="team:${t}">${t}</option>`).join('');
        } else {
            const available = allUsers.filter(u => !memberIds.has(u.id));
            valSelect.innerHTML = `<option value="">Seleccionar persona...</option>` + 
                available.map(u => `<option value="user:${u.id}">${u.name} (${u.team})</option>`).join('');
        }
    },

    async confirmAddMember() {
        const val = document.getElementById('add-member-value').value;
        if (!val) { Toast.error('Seleccioná un equipo o persona'); return; }

        const allUsers = await TeamService.fetchAll();
        let userIds = [];

        if (val.startsWith('team:')) {
            const teamName = val.replace('team:', '');
            userIds = allUsers.filter(u => u.team === teamName).map(u => u.id);
        } else {
            userIds = [val.replace('user:', '')];
        }

        try {
            // Add members sequentially to avoid overloading the socket/DB and for better error tracking
            for (const uid of userIds) {
                await ApiAdapter.post(`/api/projects/${this.projectId}/members`, { userId: uid });
            }
            Toast.success('Miembros agregados al proyecto');
            await this.loadTab('general');
        } catch(e) {
            console.error('Error adding members:', e);
            Toast.error(e.message || 'Error al agregar miembro');
        }
    },



    async removeMember(userId) {
        if (!confirm('\u00bfQuitar a este miembro del proyecto?')) return;
        try {
            await ApiAdapter.delete(`/api/projects/${this.projectId}/members/${userId}`);
            Toast.success('Miembro quitado');
            this.loadTab('general');
        } catch(e) {
            Toast.error(e.message || 'Error al quitar miembro');
        }
    },

    async changeStatus(newStatus) {
        await ProjectService.update(this.projectId, { status: newStatus });
        await this.render();
    },

    async addTask(e) {
        e.preventDefault();
        const input = document.getElementById('new-task-input');
        const title = input?.value.trim();
        if (!title) return;
        
        const originalValue = input.value;
        input.value = '';

        try {
            await ProjectService.addTask(this.projectId, title);
            await this.loadTab('general');
        } catch (err) {
            console.error('Error adding task:', err);
            input.value = originalValue;
            Toast.error(err.message || 'Error al agregar tarea');
        }
    },

    async deleteProject() {
        if (!confirm('¿Estás SEGURO de que deseas eliminar este proyecto? Esta acción es irreversible.')) return;
        
        try {
            await ApiAdapter.delete(`/api/projects/${this.projectId}`);
            Toast.success('Proyecto eliminado correctamente');
            window.location.hash = 'projects';
        } catch (err) {
            Toast.error(err.message || 'Error al eliminar el proyecto');
        }
    },

    async toggleTask(taskId) {
        // Optimistic UI Update
        const taskElement = document.querySelector(`[onclick="ProjectDetailPage.toggleTask('${taskId}')"]`);
        const textElement = taskElement?.nextElementSibling;
        
        if (taskElement && textElement) {
            const isDone = taskElement.classList.contains('bg-primary');
            taskElement.classList.toggle('bg-primary', !isDone);
            taskElement.classList.toggle('border-primary', !isDone);
            taskElement.innerHTML = !isDone ? '<span class="material-symbols-outlined text-xs">check</span>' : '';
            textElement.classList.toggle('line-through', !isDone);
            textElement.classList.toggle('text-slate-400', !isDone);
        }

        try {
            await ProjectService.toggleTask(this.projectId, taskId);
            // Refresh progress bar and totals without re-rendering the whole tab
            const p = await ProjectService.fetchById(this.projectId);
            this.updateDisplayProgress(p);
        } catch (err) {
            // Re-render to rollback UI if service failed
            await this.loadTab('general');
            Toast.error(err.message || 'Error al actualizar tarea');
        }
    },

    async removeTask(taskId) {
        if (!confirm('¿Eliminar esta tarea?')) return;
        
        // Optimistic UI: Hide the row
        const row = document.querySelector(`[onclick="ProjectDetailPage.removeTask('${taskId}')"]`)?.closest('.flex');
        if (row) row.style.display = 'none';

        try {
            await ProjectService.removeTask(this.projectId, taskId);
            const p = await ProjectService.fetchById(this.projectId);
            this.updateDisplayProgress(p);
        } catch (err) {
            if (row) row.style.display = 'flex';
            Toast.error(err.message || 'Error al eliminar tarea');
        }
    },

    updateDisplayProgress(p) {
        const progress = ProjectService.getTaskProgress(p);
        // Update header badges
        const badges = document.querySelectorAll('[data-task-status]');
        badges.forEach(b => {
             if (b.getAttribute('data-task-status') === 'header') {
                 b.textContent = `${progress.done}/${progress.total} tareas`;
             } else {
                 b.textContent = `${progress.done}/${progress.total}`;
             }
        });
        // Update progress bars
        const bars = document.querySelectorAll('.h-full.rounded-full.transition-all');
        bars.forEach(bar => {
            if (bar.style.width) bar.style.width = `${progress.percent}%`;
        });
        // Update tab header badge (the one in the tab buttons)
        const tabBadge = document.querySelector('#pdt-general span.text-xs.font-bold');
        if (tabBadge) tabBadge.textContent = `${progress.done}/${progress.total}`;
    },

    // ─── TAB: Chat ──────────────────────────────────────────────────────
    tabChat(p) {
        const messages = p.chat || [];
        const currentUser = AuthService.getUserName();

        return `
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col" style="height: 520px">
            <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 class="font-bold">Chat del Proyecto</h3>
                <span class="text-xs text-slate-400">${messages.length} mensajes</span>
            </div>
            <div id="chat-messages" class="flex-1 overflow-y-auto p-6 space-y-4">
                ${messages.length === 0 ? `
                    <div class="text-center text-slate-400 py-16">
                        <span class="material-symbols-outlined text-4xl block mb-2 opacity-40">forum</span>
                        <p class="text-sm">No hay mensajes aún. ¡Iniciá la conversación!</p>
                    </div>
                ` : messages.map(msg => {
                    const isMe = msg.author === currentUser;
                    const time = new Date(msg.timestamp).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                    return `
                    <div class="flex ${isMe ? 'justify-end' : 'justify-start'}">
                        <div class="max-w-[70%]">
                            <div class="${isMe
                                ? 'bg-primary text-white rounded-2xl rounded-br-md'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-md'} px-4 py-3">
                                ${!isMe ? `<p class="text-xs font-bold mb-1 text-primary">${msg.author}</p>` : ''}
                                <p class="text-sm">${msg.text}</p>
                            </div>
                            <p class="text-[10px] text-slate-400 mt-1 ${isMe ? 'text-right' : ''}">${time}</p>
                        </div>
                    </div>`;
                }).join('')}
            </div>
            <div class="border-t border-slate-100 dark:border-slate-800 p-4">
                <form onsubmit="ProjectDetailPage.sendMessage(event)" class="flex gap-3">
                    <input type="text" id="chat-input" placeholder="Escribí un mensaje..."
                        class="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        autocomplete="off"/>
                    <button type="submit"
                        class="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20">
                        <span class="material-symbols-outlined text-base">send</span> Enviar
                    </button>
                </form>
            </div>
        </div>`;
    },

    async sendMessage(e) {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        const text = input?.value.trim();
        if (!text) return;
        
        input.value = '';
        input.disabled = true;
        
        try {
            await ProjectService.addMessage(this.projectId, text);
            // The WS event 'new_message' will append the new message to the screen for all users, including the sender!
        } catch (err) {
            console.error('Error sending message', err);
            Toast.error('No se pudo enviar el mensaje');
        } finally {
            input.disabled = false;
            input.focus();
        }
    },

    scrollChat() {
        const el = document.getElementById('chat-messages');
        if (el) el.scrollTop = el.scrollHeight;
    },

    // ─── TAB: Archivos ──────────────────────────────────────────────────
    tabFiles(p) {
        const files = p.files || [];
        const typeIcons = { pdf: 'picture_as_pdf', image: 'image', figma: 'draw', doc: 'description', spreadsheet: 'table_chart', zip: 'folder_zip' };

        return `
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 class="font-bold">Archivos del Proyecto</h3>
                <button onclick="document.getElementById('upload-form').classList.toggle('hidden')"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                    <span class="material-symbols-outlined text-sm">upload_file</span> Subir Archivo
                </button>
            </div>

            <div id="upload-form" class="hidden border-b border-slate-100 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/50">
                <form onsubmit="ProjectDetailPage.uploadFile(event)" class="flex gap-3 items-end">
                    <div class="flex-1">
                        <label class="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Nombre del archivo</label>
                        <input type="text" id="file-name-input" required placeholder="documento.pdf"
                            class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"/>
                    </div>
                    <div class="w-40">
                        <label class="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Tipo</label>
                        <select id="file-type-input"
                            class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40">
                            <option value="pdf">PDF</option>
                            <option value="image">Imagen</option>
                            <option value="figma">Figma</option>
                            <option value="doc">Documento</option>
                            <option value="spreadsheet">Planilla</option>
                            <option value="zip">ZIP</option>
                        </select>
                    </div>
                    <button type="submit" class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">Agregar</button>
                </form>
            </div>

            ${files.length === 0 ? `
                <div class="p-12 text-center text-slate-400">
                    <span class="material-symbols-outlined text-4xl block mb-2 opacity-40">folder_open</span>
                    <p class="text-sm">No hay archivos subidos aún.</p>
                </div>
            ` : `
                <div class="divide-y divide-slate-100 dark:divide-slate-800">
                    ${files.map(f => {
                        const icon = typeIcons[f.type] || 'description';
                        const date = new Date(f.uploadedAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                        return `
                        <div class="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                            <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                <span class="material-symbols-outlined text-xl text-slate-500">${icon}</span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-semibold text-slate-800 dark:text-white truncate">${f.name}</p>
                                <p class="text-xs text-slate-400">Subido por ${f.uploadedBy} · ${date}</p>
                            </div>
                            <button onclick="ProjectDetailPage.removeFile('${f.id}')"
                                class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <span class="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>`;
                    }).join('')}
                </div>
            `}
        </div>`;
    },

    async uploadFile(e) {
        e.preventDefault();
        const name = document.getElementById('file-name-input')?.value.trim();
        const type = document.getElementById('file-type-input')?.value;
        if (!name) return;
        await ProjectService.addFile(this.projectId, name, type);
        await this.loadTab('files');
    },

    async removeFile(fileId) {
        await ProjectService.removeFile(this.projectId, fileId);
        await this.loadTab('files');
    },

    // ─── TAB: Actualizaciones ───────────────────────────────────────────
    tabUpdates(p) {
        const updates = p.updates || [];
        return `
        <div class="space-y-6">
            <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <h3 class="font-bold mb-4">Agregar Actualización</h3>
                <form onsubmit="ProjectDetailPage.addUpdate(event)" class="space-y-3">
                    <input type="text" id="update-title" required placeholder="Título de la actualización"
                        class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"/>
                    <textarea id="update-desc" required placeholder="Descripción de lo que se hizo..." rows="3"
                        class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"></textarea>
                    <button type="submit" class="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20">
                        <span class="material-symbols-outlined text-base">add</span> Publicar Actualización
                    </button>
                </form>
            </div>

            ${updates.length === 0 ? `
                <div class="text-center text-slate-400 py-10">
                    <span class="material-symbols-outlined text-4xl block mb-2 opacity-40">timeline</span>
                    <p class="text-sm">No hay actualizaciones registradas.</p>
                </div>
            ` : `
                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                        <h3 class="font-bold">Historial de Actualizaciones</h3>
                    </div>
                    <div class="divide-y divide-slate-100 dark:divide-slate-800">
                        ${[...updates].reverse().map(u => {
                            const date = new Date(u.timestamp).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                            return `
                            <div class="px-6 py-5">
                                <div class="flex items-start gap-4">
                                    <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span class="material-symbols-outlined text-sm text-primary">flag</span>
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex items-center justify-between mb-1">
                                            <h4 class="font-bold text-sm">${u.title}</h4>
                                            <span class="text-[10px] text-slate-400">${date}</span>
                                        </div>
                                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">${u.description}</p>
                                        <p class="text-xs text-slate-400">Por <span class="font-semibold text-slate-600 dark:text-slate-300">${u.author}</span></p>
                                    </div>
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            `}
        </div>`;
    },

    async addUpdate(e) {
        e.preventDefault();
        const title = document.getElementById('update-title')?.value.trim();
        const desc = document.getElementById('update-desc')?.value.trim();
        if (!title || !desc) return;
        await ProjectService.addUpdate(this.projectId, title, desc);
        await this.loadTab('updates');
    }
};
