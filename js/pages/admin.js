/**
 * Admin Page Controller
 * Full user management, activity log, create user, and permissions view
 */
window.AdminPage = {
    activeTab: 'users',

    init() {
        this.render();
    },

    render() {
        const container = document.getElementById('admin-container');
        if (!container) return;
        this.renderTabs(container);
    },

    renderTabs(container) {
        const tabs = [
            { id: 'users', label: 'Gestión de Usuarios', icon: 'manage_accounts' },
            { id: 'create', label: 'Crear Usuario', icon: 'person_add' },
            { id: 'activity', label: 'Log de Actividad', icon: 'history' },
            { id: 'permissions', label: 'Permisos por Rol', icon: 'lock' }
        ];

        container.innerHTML = `
            <!-- Tab Bar -->
            <div class="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-8 w-fit">
                ${tabs.map(tab => `
                    <button
                        id="tab-btn-${tab.id}"
                        onclick="AdminPage.switchTab('${tab.id}')"
                        class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                               ${this.activeTab === tab.id
                ? 'bg-white dark:bg-slate-900 text-primary shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}">
                        <span class="material-symbols-outlined text-base">${tab.icon}</span>
                        ${tab.label}
                    </button>
                `).join('')}
            </div>
            <!-- Tab Content -->
            <div id="tab-content"></div>
        `;

        this.loadTab(this.activeTab);
    },

    switchTab(tabId) {
        this.activeTab = tabId;
        // Update active button styles
        ['users', 'create', 'activity', 'permissions'].forEach(id => {
            const btn = document.getElementById('tab-btn-' + id);
            if (!btn) return;
            if (id === tabId) {
                btn.className = 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all bg-white dark:bg-slate-900 text-primary shadow-sm';
            } else {
                btn.className = 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200';
            }
        });
        this.loadTab(tabId);
    },

    async loadTab(tabId) {
        const content = document.getElementById('tab-content');
        if (!content) return;
        switch (tabId) {
            case 'users': content.innerHTML = await this.renderUsers(); break;
            case 'create': content.innerHTML = await this.renderCreateUser(); break;
            case 'activity': content.innerHTML = await this.renderActivity(); break;
            case 'permissions': content.innerHTML = await this.renderPermissions(); break;
        }
    },

    // ─── TAB: Gestión de Usuarios ───────────────────────────────────────────
    renderUsers() {
        const members = TeamService.getAll();
        const rows = members.map(m => {
            const isAdmin = m.team === 'Management' || m.role === 'Admin';
            return `
                <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-9 h-9 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700 flex-shrink-0"
                                style="background-image: url('${m.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(m.name) + '&background=random'}')"></div>
                            <div>
                                <p class="font-semibold text-sm text-slate-900 dark:text-white">${m.name}</p>
                                <p class="text-xs text-slate-400">${m.email || '—'}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <input type="text" value="${m.role}" onchange="AdminPage.updateField('${m.id}', 'role', this.value)"
                            class="bg-transparent text-sm text-slate-700 dark:text-slate-300 border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary outline-none px-1 py-0.5 w-full transition-colors"/>
                    </td>
                    <td class="px-6 py-4">
                        <select onchange="AdminPage.updateField('${m.id}', 'team', this.value)"
                            class="bg-transparent text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:border-primary outline-none transition-colors">
                            ${['Frontend', 'Backend', 'Design', 'Management'].map(t =>
                `<option value="${t}" ${m.team === t ? 'selected' : ''}>${t}</option>`
            ).join('')}
                        </select>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold
                            ${isAdmin ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}">
                            <span class="material-symbols-outlined text-xs">${isAdmin ? 'shield' : 'person'}</span>
                            ${isAdmin ? 'Admin' : 'Developer'}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="AdminPage.toggleAdmin('${m.id}', ${isAdmin})"
                                class="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors
                                ${isAdmin
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600'
                    : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}">
                                ${isAdmin ? 'Quitar Admin' : 'Hacer Admin'}
                            </button>
                            <button onclick="AdminPage.deleteUser('${m.id}', '${m.name}')"
                                class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors">
                                <span class="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 class="font-bold text-lg">Usuarios del Sistema</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400">Editá rol y equipo directamente en la tabla. Los cambios se guardan al salir del campo.</p>
                    </div>
                    <span class="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300">${members.length} usuarios</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="bg-slate-50 dark:bg-slate-800/50">
                                <th class="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Usuario</th>
                                <th class="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Rol / Cargo</th>
                                <th class="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Equipo</th>
                                <th class="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Nivel</th>
                                <th class="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        `;
    },

    updateField(id, field, value) {
        TeamService.update(id, { [field]: value });
        // Refresh tab if on users
        if (this.activeTab === 'users') this.loadTab('users');
    },

    toggleAdmin(id, isCurrentlyAdmin) {
        const updates = isCurrentlyAdmin
            ? { team: 'Frontend', role: 'Developer' }
            : { team: 'Management', role: 'Admin' };
        TeamService.update(id, updates);
        const member = TeamService.getById(id);
        TeamService.logActivity(isCurrentlyAdmin ? 'update' : 'update', member?.name || '');
        this.loadTab('users');
    },

    deleteUser(id, name) {
        if (!confirm(`¿Eliminar a ${name} del sistema?`)) return;
        TeamService.delete(id);
        this.loadTab('users');
    },

    // ─── TAB: Crear Usuario ─────────────────────────────────────────────────
    async renderCreateUser() {
        const teams = await TeamService.fetchTeams() || [];

        return `
            <div class="max-w-lg">
                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
                    <h3 class="font-bold text-lg mb-1">Nuevo Usuario</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">El usuario creado aquí aparecerá en la página de Equipos.</p>
                    <form id="admin-create-form" class="space-y-4" onsubmit="AdminPage.submitCreateUser(event)">
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Nombre Completo *</label>
                            <input type="text" id="new-name" required placeholder="Ej. Juan García"
                                class="w-full bg-slate-50 dark:bg-black/20 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"/>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Email *</label>
                            <input type="email" id="new-email" required placeholder="juan@acme.com"
                                class="w-full bg-slate-50 dark:bg-black/20 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"/>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Rol / Cargo *</label>
                            <input type="text" id="new-role" required placeholder="Ej. Frontend Developer"
                                class="w-full bg-slate-50 dark:bg-black/20 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"/>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Equipo *</label>
                            <select id="new-team" required
                                class="w-full bg-slate-50 dark:bg-black/20 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all">
                                <option value="">Seleccione un equipo...</option>
                                ${teams.map(t => `<option value="${t.name}">${t.name}</option>`).join('')}
                            </select>
                            <p class="text-xs text-slate-400 mt-1">Para crear un equipo nuevo, hágalo desde la pestaña "Equipos".</p>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Tags <span class="text-xs font-normal text-slate-400">(separados por comas)</span></label>
                            <input type="text" id="new-tags" placeholder="React, Node.js, Figma"
                                class="w-full bg-slate-50 dark:bg-black/20 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"/>
                        </div>
                        <div id="admin-create-msg" class="hidden"></div>
                        <div class="flex gap-3 pt-2">
                            <button type="button" onclick="document.getElementById('admin-create-form').reset();document.getElementById('admin-create-msg').className='hidden';"
                                class="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                Limpiar
                            </button>
                            <button type="submit"
                                class="flex-1 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                                <span class="material-symbols-outlined text-base">person_add</span>
                                Crear Usuario
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    async submitCreateUser(e) {
        e.preventDefault();
        const name = document.getElementById('new-name').value.trim();
        const email = document.getElementById('new-email').value.trim();
        const role = document.getElementById('new-role').value.trim();
        const team = document.getElementById('new-team').value.trim();
        const tagsRaw = document.getElementById('new-tags').value;
        const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
        
        const submitBtn = document.querySelector('#admin-create-form button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            await TeamService.add({ name, email, role, team, tags, status: 'online' });

            const msg = document.getElementById('admin-create-msg');
            msg.className = 'flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-400';
            msg.innerHTML = '<span class="material-symbols-outlined text-base">check_circle</span> Usuario <strong>' + name + '</strong> creado exitosamente.';
            document.getElementById('admin-create-form').reset();
            
            // Refresh user list tab
            setTimeout(() => this.loadTab('users'), 1000);
        } catch(err) {
            console.error('Error creating user:', err);
            const msg = document.getElementById('admin-create-msg');
            msg.className = 'flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400';
            msg.innerHTML = '<span class="material-symbols-outlined text-base">error</span> ' + (err.message || 'Error al crear usuario');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    },

    // ─── TAB: Log de Actividad ──────────────────────────────────────────────
    async renderActivity() {
        const actionColors = { project_created: 'blue', user_created: 'emerald', user_deleted: 'red', user_updated: 'amber' };
        const actionIcons  = { project_created: 'folder_open', user_created: 'person_add', user_deleted: 'person_remove', user_updated: 'edit' };

        let log = [];
        try {
            log = await ApiAdapter.get('/api/activity?limit=30');
        } catch(e) {
            log = StorageAdapter.get('activity_log', []);
        }

        if (log.length === 0) {
            return `
                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-16 text-center">
                    <span class="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 block mb-3">history</span>
                    <h3 class="font-semibold text-slate-500 dark:text-slate-400">Sin actividad registrada</h3>
                    <p class="text-sm text-slate-400 mt-1">Las acciones de crear proyectos y gestionar usuarios aparecerán aquí.</p>
                </div>`;
        }

        return `
            <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 class="font-bold text-lg">Historial de Actividad</h3>
                    <span class="text-xs text-slate-400">${log.length} eventos registrados</span>
                </div>
                <div class="divide-y divide-slate-100 dark:divide-slate-800">
                    ${log.map(entry => {
            const color = actionColors[entry.action] || 'slate';
            const icon  = actionIcons[entry.action] || 'info';
            const date  = new Date(entry.timestamp);
            const formatted = date.toLocaleString('es-AR', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
            });
            return `
                            <div class="flex items-center gap-4 px-6 py-4">
                                <div class="w-9 h-9 rounded-full bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center flex-shrink-0">
                                    <span class="material-symbols-outlined text-sm text-${color}-600 dark:text-${color}-400">${icon}</span>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm text-slate-700 dark:text-slate-300">
                                        <span class="font-semibold">${entry.by}</span>
                                        ${entry.label}
                                        <span class="font-semibold">${entry.entityName}</span>
                                    </p>
                                    <p class="text-xs text-slate-400 mt-0.5">${formatted}</p>
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    },

    // ─── TAB: Permisos por Rol ──────────────────────────────────────────────
    renderPermissions() {
        const perms = [
            { feature: 'Ver Dashboard', admin: true, dev: true },
            { feature: 'Ver Proyectos', admin: true, dev: true },
            { feature: 'Ver Equipos', admin: true, dev: true },
            { feature: 'Ver Reportes', admin: true, dev: true },
            { feature: 'Crear Proyectos', admin: true, dev: false },
            { feature: 'Editar Proyectos', admin: true, dev: false },
            { feature: 'Agregar Miembros', admin: true, dev: false },
            { feature: 'Editar Miembros', admin: true, dev: false },
            { feature: 'Eliminar Miembros', admin: true, dev: false },
            { feature: 'Acceder a Admin View', admin: true, dev: false },
            { feature: 'Crear Usuarios', admin: true, dev: false },
            { feature: 'Gestionar Permisos', admin: true, dev: false },
            { feature: 'Ver Log de Actividad', admin: true, dev: false },
        ];

        const check = (val) => val
            ? '<span class="material-symbols-outlined text-emerald-500 text-xl">check_circle</span>'
            : '<span class="material-symbols-outlined text-slate-300 dark:text-slate-600 text-xl">cancel</span>';

        return `
            <div class="max-w-2xl">
                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                        <h3 class="font-bold text-lg">Permisos por Rol</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Referencia de lo que puede hacer cada nivel de acceso.</p>
                    </div>
                    <table class="w-full text-left">
                        <thead>
                            <tr class="bg-slate-50 dark:bg-slate-800/50">
                                <th class="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Funcionalidad</th>
                                <th class="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
                                    <span class="flex items-center justify-center gap-1">
                                        <span class="material-symbols-outlined text-sm text-primary">shield</span> Admin
                                    </span>
                                </th>
                                <th class="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
                                    <span class="flex items-center justify-center gap-1">
                                        <span class="material-symbols-outlined text-sm">person</span> Developer
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                            ${perms.map(p => `
                                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td class="px-6 py-3 text-sm text-slate-700 dark:text-slate-300 font-medium">${p.feature}</td>
                                    <td class="px-6 py-3 text-center">${check(p.admin)}</td>
                                    <td class="px-6 py-3 text-center">${check(p.dev)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
};

// Auto-init
if (document.getElementById('admin-container')) {
    window.AdminPage.init();
}
