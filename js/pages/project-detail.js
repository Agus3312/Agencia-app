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
                    <div class="flex items-center gap-3">
                        <div class="w-3 h-3 rounded-full flex-shrink-0" style="background:${accentColor}"></div>
                        <h2 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">${project.name}</h2>
                    </div>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5 ml-6">${project.description || ''}</p>
                </div>
                <div class="flex items-center gap-3 flex-shrink-0">
                    <span class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold ${status.color}">
                        <span class="w-1.5 h-1.5 rounded-full ${status.dot}"></span>
                        ${status.label}
                    </span>
                    <span class="text-sm font-bold px-3 py-1.5 rounded-full" style="background:${accentColor}20;color:${accentColor}">${progress.done}/${progress.total} tareas</span>
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
        ['general','chat','files','updates'].forEach(id => {
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
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="text-slate-400 mb-1">Estado</p>
                            <select onchange="ProjectDetailPage.changeStatus(this.value)"
                                class="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/40">
                                ${statusOptions.map(s => `<option value="${s}" ${p.status === s ? 'selected' : ''}>${statusLabels[s]}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <p class="text-slate-400 mb-1">Fecha de Entrega</p>
                            <p class="font-semibold text-slate-800 dark:text-white">${dueDate}</p>
                        </div>
                        <div>
                            <p class="text-slate-400 mb-1">Progreso de Tareas</p>
                            <p class="font-semibold text-slate-800 dark:text-white">${progress.done}/${progress.total} completadas (${progress.percent}%)</p>
                        </div>
                        <div>
                            <p class="text-slate-400 mb-1">Miembros</p>
                            <p class="font-semibold text-slate-800 dark:text-white">${p.team.length} personas</p>
                        </div>
                    </div>
                    <div class="mt-5">
                        <p class="text-slate-400 text-sm mb-1">Descripción</p>
                        <p class="text-sm text-slate-700 dark:text-slate-300">${p.description}</p>
                    </div>
                </div>

                <!-- Tasks Checklist -->
                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h3 class="font-bold text-lg">Tareas del Proyecto</h3>
                        <span class="text-xs font-bold px-2.5 py-1 rounded-full ${progress.done === progress.total && progress.total > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}">${progress.done}/${progress.total}</span>
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
                        ` : tasks.map(t => `
                            <div class="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                <button onclick="ProjectDetailPage.toggleTask('${t.id}')"
                                    class="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
                                    ${t.done
                                        ? 'bg-primary border-primary text-white'
                                        : 'border-slate-300 dark:border-slate-600 hover:border-primary'}">
                                    ${t.done ? '<span class="material-symbols-outlined text-xs">check</span>' : ''}
                                </button>
                                <span class="flex-1 text-sm ${t.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}">${t.title}</span>
                                <button onclick="ProjectDetailPage.removeTask('${t.id}')"
                                    class="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100">
                                    <span class="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                        `).join('')}
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
            </div>

            <!-- Team Sidebar -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 h-fit">
                <h3 class="font-bold text-lg mb-4">Equipo Asignado</h3>
                <div class="space-y-3">
                    ${p.team.map((m, i) => `
                        <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div class="w-10 h-10 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700 flex-shrink-0"
                                style="background-image: url('${m.avatar}')"></div>
                            <div>
                                <p class="font-semibold text-sm">${m.name}</p>
                                <p class="text-xs text-slate-400">${i === 0 ? 'Líder de proyecto' : 'Miembro'}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>`;
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
        await ProjectService.addTask(this.projectId, title);
        await this.loadTab('general');
    },

    async toggleTask(taskId) {
        await ProjectService.toggleTask(this.projectId, taskId);
        await this.loadTab('general');
    },

    async removeTask(taskId) {
        await ProjectService.removeTask(this.projectId, taskId);
        await this.loadTab('general');
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
        await ProjectService.addMessage(this.projectId, text);
        input.value = '';
        await this.loadTab('chat');
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
