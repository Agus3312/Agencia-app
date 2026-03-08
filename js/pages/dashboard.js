/**
 * Dashboard Page Controller
 * Productivity workspace — shows actionable work, not just stats.
 *
 * ┌─────────────────────────────────────────────────────┐
 * │ NOTA BACKEND: Cuando migremos, este dashboard       │
 * │ carga datos desde:                                  │
 * │   GET /api/tasks?assignedTo=me&status=pending       │
 * │   GET /api/projects?status=active                   │
 * │   GET /api/activity?limit=5                         │
 * └─────────────────────────────────────────────────────┘
 */
window.DashboardPage = {
    async init() {
        await this.render();
    },

    async render() {
        const container = document.getElementById('dashboard-container');
        if (!container) return;

        const userName = AuthService.getUserName().split(' ')[0];
        // Fetch projects from API
        const projects = window.ProjectService ? await ProjectService.fetchAll() : [];
        const members = window.TeamService ? TeamService.getAll() : [];
        const activityLog = StorageAdapter.get('activity_log', []).slice(0, 5);

        // Collect all tasks assigned to current user (or all tasks as fallback)
        const myTasks = this._getMyTasks(projects);
        const activeProjects = projects.filter(p => p.status !== 'completed').slice(0, 4);

        const totalTeams = members.reduce((acc, m) => {
            acc[m.team] = true;
            return acc;
        }, {});

        const completedTasks = projects.reduce((sum, p) => {
            return sum + (p.tasks || []).filter(t => t.done).length;
        }, 0);
        const totalTasks = projects.reduce((sum, p) => {
            return sum + (p.tasks || []).length;
        }, 0);

        // Greeting based on time
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

        container.innerHTML = `
            <!-- Greeting -->
            <div class="mb-6 fade-in">
                <h1 class="text-2xl font-bold text-slate-900 dark:text-white">${greeting}, ${userName}</h1>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Esto es lo que requiere tu atención hoy.</p>
            </div>

            <!-- ═══ SECTION 1: Your Work Today ═══ -->
            <div class="mb-6 fade-in">
                <div class="flex items-center justify-between mb-3">
                    <h2 class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tus Tareas</h2>
                    <span class="text-xs text-slate-400">${myTasks.length} pendientes</span>
                </div>
                <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    ${myTasks.length === 0 ? `
                        <div class="p-8 text-center">
                            <span class="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600 mb-2 block">task_alt</span>
                            <p class="text-sm text-slate-400">No hay tareas pendientes. ¡Buen trabajo!</p>
                        </div>
                    ` : myTasks.slice(0, 6).map((task, i) => `
                        <div class="flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''} hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                             onclick="window.location.hash='project-detail:${task.projectId}'">
                            <div class="w-5 h-5 rounded border-2 ${task.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600'} flex items-center justify-center flex-shrink-0">
                                ${task.done ? '<span class="material-symbols-outlined text-white" style="font-size:14px">check</span>' : ''}
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-slate-800 dark:text-slate-200 ${task.done ? 'line-through opacity-50' : ''}">${task.title}</p>
                                <p class="text-[11px] text-slate-400 mt-0.5">${task.projectName}</p>
                            </div>
                            ${task.dueLabel ? `
                                <span class="text-[11px] font-semibold px-2 py-0.5 rounded ${task.dueClass}">${task.dueLabel}</span>
                            ` : ''}
                            <span class="text-[11px] font-medium px-2 py-0.5 rounded ${this._statusClass(task.projectStatus)}">${this._statusLabel(task.projectStatus)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- ═══ SECTION 2: Active Projects ═══ -->
            <div class="mb-6 fade-in" style="animation-delay:80ms">
                <div class="flex items-center justify-between mb-3">
                    <h2 class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Proyectos Activos</h2>
                    <button onclick="window.location.hash='projects'" class="text-xs text-primary font-semibold hover:underline">Ver todos →</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    ${activeProjects.map(p => {
                        const progress = ProjectService.getTaskProgress(p);
                        const dueDate = new Date(p.dueDate);
                        const teamHtml = (p.team || []).slice(0, 3).map(m =>
                            `<div class="w-6 h-6 rounded-full bg-cover bg-center border-2 border-white dark:border-slate-900" style="background-image: url('${m.avatar}')" title="${m.name}"></div>`
                        ).join('');
                        return `
                        <div onclick="window.location.hash='project-detail:${p.id}'"
                            class="cursor-pointer bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:border-primary/40 hover:shadow-md transition-all group">
                            <div class="flex items-start justify-between mb-3">
                                <h3 class="text-sm font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors leading-tight">${p.name}</h3>
                                <span class="flex-shrink-0 ml-2 text-[10px] font-bold px-2 py-0.5 rounded ${this._statusClass(p.status)}">${this._statusLabel(p.status)}</span>
                            </div>
                            <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                                <span>${progress.done}/${progress.total} tareas</span>
                                <span>${dueDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span>
                            </div>
                            <div class="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                                <div class="h-full bg-primary rounded-full transition-all" style="width: ${progress.percent}%"></div>
                            </div>
                            <div class="flex -space-x-1.5">
                                ${teamHtml}
                                ${(p.team || []).length > 3 ? `<div class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-500 border-2 border-white dark:border-slate-900">+${p.team.length - 3}</div>` : ''}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <!-- ═══ SECTION 3: Activity + Stats row ═══ -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 fade-in" style="animation-delay:160ms">
                <!-- Recent Activity -->
                <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h2 class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actividad Reciente</h2>
                        <span class="text-[11px] text-slate-400">${activityLog.length} últimos</span>
                    </div>
                    ${activityLog.length === 0 ? `
                        <div class="p-6 text-center text-sm text-slate-400">
                            <span class="material-symbols-outlined text-2xl block mb-1 opacity-40">history</span>
                            Sin actividad aún
                        </div>
                    ` : `
                        <div class="divide-y divide-slate-100 dark:divide-slate-800">
                            ${activityLog.map(entry => {
                                const colors = { add: 'emerald', update: 'blue', delete: 'red' };
                                const icons = { add: 'person_add', update: 'edit', delete: 'person_remove' };
                                const color = colors[entry.action] || 'slate';
                                const icon = icons[entry.action] || 'info';
                                return `
                                <div class="flex items-center gap-3 px-4 py-2.5">
                                    <div class="w-7 h-7 rounded-full bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center flex-shrink-0">
                                        <span class="material-symbols-outlined text-xs text-${color}-600 dark:text-${color}-400">${icon}</span>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <p class="text-xs text-slate-600 dark:text-slate-300">
                                            <span class="font-semibold">${entry.by}</span> ${entry.label} <span class="font-semibold">${entry.memberName}</span>
                                        </p>
                                    </div>
                                    <span class="text-[10px] text-slate-400 flex-shrink-0">${this.timeAgo(new Date(entry.timestamp))}</span>
                                </div>`;
                            }).join('')}
                        </div>
                    `}
                </div>

                <!-- Stats -->
                <div class="space-y-4">
                    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span class="material-symbols-outlined text-primary">folder_open</span>
                        </div>
                        <div>
                            <p class="text-xl font-bold text-slate-900 dark:text-white">${projects.length}</p>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wide">Proyectos</p>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <span class="material-symbols-outlined text-emerald-500">groups</span>
                        </div>
                        <div>
                            <p class="text-xl font-bold text-slate-900 dark:text-white">${Object.keys(totalTeams).length}</p>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wide">Equipos Activos</p>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <span class="material-symbols-outlined text-amber-500">task_alt</span>
                        </div>
                        <div>
                            <p class="text-xl font-bold text-slate-900 dark:text-white">${completedTasks}<span class="text-sm font-normal text-slate-400">/${totalTasks}</span></p>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wide">Tareas Completadas</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // ── Helpers ──────────────────────────────────────────────────────────

    _getMyTasks(projects) {
        const tasks = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        projects.forEach(p => {
            (p.tasks || []).forEach(t => {
                let dueLabel = '';
                let dueClass = 'bg-slate-100 dark:bg-slate-800 text-slate-500';

                // Simulate due dates based on project dueDate
                const projectDue = new Date(p.dueDate);
                if (projectDue <= today) {
                    dueLabel = 'Vencida';
                    dueClass = 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
                } else if (projectDue <= tomorrow) {
                    dueLabel = 'Hoy';
                    dueClass = 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
                } else {
                    const diffDays = Math.ceil((projectDue - today) / (1000 * 60 * 60 * 24));
                    if (diffDays <= 3) {
                        dueLabel = `${diffDays}d`;
                        dueClass = 'bg-amber-50 dark:bg-amber-900/20 text-amber-500';
                    }
                }

                tasks.push({
                    ...t,
                    projectId: p.id,
                    projectName: p.name,
                    projectStatus: p.status,
                    dueLabel,
                    dueClass
                });
            });
        });

        // Show incomplete tasks first, then completed
        return tasks.sort((a, b) => a.done - b.done);
    },

    _statusLabel(status) {
        const map = { 'planning': 'Planificación', 'in-progress': 'En Progreso', 'review': 'Revisión', 'completed': 'Completado' };
        return map[status] || status || 'En Progreso';
    },

    _statusClass(status) {
        const map = {
            'planning': 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
            'in-progress': 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
            'review': 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
            'completed': 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
        };
        return map[status] || map['in-progress'];
    },

    timeAgo(date) {
        const diff = Math.floor((Date.now() - date.getTime()) / 1000);
        if (diff < 60) return 'Ahora';
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return `${Math.floor(diff / 86400)}d`;
    }
};

// Auto-init
if (document.getElementById('dashboard-container')) {
    window.DashboardPage.init();
}
