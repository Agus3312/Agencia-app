/**
 * Dashboard Page Controller
 * Productivity workspace — shows actionable work, not just stats.
 */
window.DashboardPage = {
    async init() {
        await this.render();
    },

    async render() {
        const container = document.getElementById('dashboard-container');
        if (!container) return;

        // 1. If we have cached data, render it immediately
        if (window.ProjectService && ProjectService.getAll().length > 0) {
            this._doRender(container, ProjectService.getAll(), TeamService.getAll());
        }

        // 2. Fetch fresh data in the background
        const projects = window.ProjectService ? await ProjectService.fetchAll() : [];
        const members = window.TeamService ? await TeamService.fetchAll() : [];
        
        // 3. Re-render with fresh data
        this._doRender(container, projects, members);
    },

    async _doRender(container, projects, members) {
        const userName = AuthService.getUserName().split(' ')[0];
        
        let activityLog = [];
        try {
            activityLog = await ApiAdapter.get('/api/activity?limit=5');
        } catch(e) {
            activityLog = StorageAdapter.get('activity_log', []).slice(0, 5);
        }

        const myTasks = this._getMyTasks(projects);
        const overdueTasks = myTasks.filter(t => t.dueLabel === 'Vencida' && !t.done);
        const todayTasks = myTasks.filter(t => t.dueLabel === 'Hoy' && !t.done);
        const upcomingTasks = myTasks.filter(t => !t.done && t.dueLabel && !['Vencida', 'Hoy'].includes(t.dueLabel));
        const activeProjects = projects.filter(p => p.status !== 'completed').slice(0, 4);

        const totalTeams = members.reduce((acc, m) => {
            acc[m.team] = true;
            return acc;
        }, {});

        const completedTasks = projects.reduce((sum, p) => sum + (p.tasks || []).filter(t => t.done).length, 0);
        const totalTasks = projects.reduce((sum, p) => sum + (p.tasks || []).length, 0);

        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

        container.innerHTML = `
            <div class="mb-6 fade-in flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-slate-900 dark:text-white">${greeting}, ${userName}</h1>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 italic">Esto es lo que requiere tu atención hoy.</p>
                </div>
                <div class="hidden md:flex items-center gap-2">
                    <button onclick="window.location.hash='myspace'" class="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-all">
                        <span class="material-symbols-outlined text-sm">add_task</span>
                        Nueva Tarea Personal
                    </button>
                </div>
            </div>


            <div class="mb-6 fade-in">
                <div class="flex items-center justify-between mb-3">
                    <h2 class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tus Tareas</h2>
                    <span class="text-xs text-slate-400">${myTasks.filter(t => !t.done).length} pendientes</span>
                </div>
                <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    ${myTasks.filter(t => !t.done).length === 0 ? `
                        <div class="p-8 text-center">
                            <span class="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600 mb-2 block">task_alt</span>
                            <p class="text-sm text-slate-400">No hay tareas pendientes. ¡Buen trabajo!</p>
                        </div>
                    ` : `
                        ${this._renderTaskGroup('Atrasadas', overdueTasks)}
                        ${this._renderTaskGroup('Hoy', todayTasks)}
                        ${this._renderTaskGroup('Próximos días', upcomingTasks)}
                    `}
                </div>
            </div>

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
                            `<div class="w-6 h-6 rounded-full bg-cover bg-center border-2 border-white dark:border-slate-900" style="background-image: url('${m.avatar}')" title="${m.name}" loading="lazy"></div>`
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
                            <div class="flex -space-x-1.5">${teamHtml}</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 fade-in" style="animation-delay:160ms">
                <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h2 class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actividad Reciente</h2>
                        <span class="text-[11px] text-slate-400">${activityLog.length} últimos</span>
                    </div>
                    ${activityLog.length === 0 ? `<div class="p-6 text-center text-sm text-slate-400">Sin actividad aún</div>` : `
                        <div class="divide-y divide-slate-100 dark:divide-slate-800">
                            ${activityLog.map(entry => `
                                <div class="flex items-center gap-3 px-4 py-2.5">
                                    <div class="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center flex-shrink-0">
                                        <span class="material-symbols-outlined text-xs text-slate-500">info</span>
                                    </div>
                                    <p class="text-xs text-slate-600 dark:text-slate-300 flex-1 min-w-0">
                                        <span class="font-semibold">${entry.by}</span> ${entry.label} <span class="font-semibold">${entry.entityName || ''}</span>
                                    </p>
                                    <span class="text-[10px] text-slate-400">${this.timeAgo(new Date(entry.timestamp))}</span>
                                </div>`).join('')}
                        </div>
                    `}
                </div>
                <div class="space-y-4">
                    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><span class="material-symbols-outlined text-primary">folder_open</span></div>
                        <div><p class="text-xl font-bold text-slate-900 dark:text-white">${projects.length}</p><p class="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wide">Proyectos</p></div>
                    </div>
                    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center"><span class="material-symbols-outlined text-emerald-500">groups</span></div>
                        <div><p class="text-xl font-bold text-slate-900 dark:text-white">${Object.keys(totalTeams).length}</p><p class="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wide">Equipos</p></div>
                    </div>
                    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><span class="material-symbols-outlined text-amber-500">task_alt</span></div>
                        <div><p class="text-xl font-bold text-slate-900 dark:text-white">${completedTasks}/${totalTasks}</p><p class="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wide">Tareas</p></div>
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

                // Use task dueDate if exists, otherwise fallback to project dueDate
                const taskDue = t.dueDate ? new Date(t.dueDate) : new Date(p.dueDate);
                
                if (taskDue <= today) {
                    dueLabel = 'Vencida';
                    dueClass = 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400';
                } else if (taskDue.toDateString() === today.toDateString()) {
                    dueLabel = 'Hoy';
                    dueClass = 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
                } else if (taskDue.toDateString() === tomorrow.toDateString()) {
                    dueLabel = 'Mañana';
                    dueClass = 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
                } else {
                    const diffDays = Math.ceil((taskDue - today) / (1000 * 60 * 60 * 24));
                    if (diffDays <= 7) {
                        dueLabel = `${diffDays}d`;
                        dueClass = 'bg-slate-100 dark:bg-slate-800 text-slate-500';
                    }
                }

                tasks.push({
                    ...t,
                    projectId: p.id,
                    projectName: p.name,
                    clientName: p.client ? p.client.name : null,
                    projectStatus: p.status,
                    dueLabel,
                    dueClass
                });
            });
        });

        // Sort: done = false first, then by priority (urgent > high > medium > low), then by date
        const priorityScore = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
        
        return tasks.sort((a, b) => {
            if (a.done !== b.done) return a.done - b.done;
            const scoreA = priorityScore[a.priority] || 0;
            const scoreB = priorityScore[b.priority] || 0;
            if (scoreA !== scoreB) return scoreB - scoreA;
            return new Date(a.dueDate || a.createdAt) - new Date(b.dueDate || b.createdAt);
        });
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

    _priorityClass(priority) {
        const map = {
            'urgent': 'bg-rose-500 text-white',
            'high': 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
            'medium': 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
            'low': 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
        };
        return map[priority] || map['medium'];
    },

    _renderTaskGroup(title, tasks) {
        if (!tasks || tasks.length === 0) {
            return '';
        }

        return `
            <div class="border-t border-slate-100 dark:border-slate-800 first:border-t-0">
                <div class="px-4 pt-3 pb-1 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/60">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${title}</span>
                    <span class="text-[10px] text-slate-400">${tasks.length}</span>
                </div>
                ${tasks.slice(0, 4).map((task, i) => `
                    <div class="flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''} hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group/task"
                         onclick="window.location.hash='project-detail:${task.projectId}'">
                        <div class="w-5 h-5 rounded border-2 ${task.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600'} flex items-center justify-center flex-shrink-0 transition-all group-hover/task:scale-110">
                            ${task.done ? '<span class="material-symbols-outlined text-white" style="font-size:14px">check</span>' : ''}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <p class="text-sm font-medium text-slate-800 dark:text-slate-200 ${task.done ? 'line-through opacity-50' : ''}">${task.title}</p>
                                ${task.priority === 'urgent' ? '<span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title="Urgente"></span>' : ''}
                            </div>
                            <div class="flex items-center gap-1.5 mt-0.5">
                                <span class="text-[10px] font-bold uppercase tracking-wider text-primary">${task.projectName}</span>
                                ${task.clientName ? `<span class="text-[10px] text-slate-400">• ${task.clientName}</span>` : ''}
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            ${task.priority ? `<span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${this._priorityClass(task.priority)}">${task.priority}</span>` : ''}
                            ${task.dueLabel ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded ${task.dueClass}">${task.dueLabel}</span>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
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
