/**
 * Projects Page Controller
 * Renders the project list dynamically from ProjectService
 */
window.ProjectsPage = {
    async init() {
        await this.render();
    },

    async render() {
        const container = document.getElementById('projects-container');
        if (!container) return;
        if (!window.ProjectService) return;

        const projects = await ProjectService.fetchAll();

        const isAdmin = AuthService.isAdmin();

        const colorMap = {
            blue: 'bg-blue-500', green: 'bg-green-500', orange: 'bg-orange-500',
            purple: 'bg-purple-500', yellow: 'bg-yellow-500', red: 'bg-red-500'
        };

        const statusConfig = {
            'planning':    { label: 'Planificación', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400', dot: 'bg-slate-400' },
            'in-progress': { label: 'En Progreso',   color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',    dot: 'bg-blue-500' },
            'review':      { label: 'En Revisión',   color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
            'completed':   { label: 'Completado',    color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' }
        };

        container.innerHTML = `
            <!-- Header -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Proyectos</h2>
                    <p class="text-slate-500 dark:text-slate-400 mt-1">Gestiona y supervisa las tareas pendientes de tu equipo.</p>
                </div>
                ${isAdmin ? `
                <button onclick="window.location.hash='project-create'"
                    class="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                    <span class="material-symbols-outlined">add</span>
                    Nuevo Proyecto
                </button>` : ''}
            </div>

            <!-- Project Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                ${projects.map(p => {
                    const progress = ProjectService.getTaskProgress(p);
                    const barColor = colorMap[p.color]?.replace('bg-', 'bg-') || 'bg-primary';
                    const status = statusConfig[p.status] || statusConfig['in-progress'];

                    const teamHtml = p.team.slice(0, 3).map(m =>
                        `<div class="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-cover bg-center" style="background-image: url('${m.avatar}')" title="${m.name}"></div>`
                    ).join('');
                    const extra = p.team.length > 3 ? `<div class="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">+${p.team.length - 3}</div>` : '';

                    return `
                    <div onclick="window.location.hash='project-detail:${p.id}'"
                        class="cursor-pointer bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-primary/40 transition-all overflow-hidden group">
                        <!-- Progress bar top -->
                        <div class="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
                            <div class="h-full ${barColor} transition-all" style="width: ${progress.percent}%"></div>
                        </div>
                        <div class="p-6">
                            <!-- Title + Status -->
                            <div class="flex items-start justify-between gap-3 mb-3">
                                <h3 class="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-snug">${p.name}</h3>
                                <span class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${status.color}">
                                    <span class="w-1.5 h-1.5 rounded-full ${status.dot}"></span>
                                    ${status.label}
                                </span>
                            </div>
                            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">${p.description || ''}</p>

                            <!-- Task Progress -->
                            <div class="mb-4">
                                <div class="flex items-center justify-between mb-1.5">
                                    <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">Tareas</span>
                                    <span class="text-xs font-bold ${progress.total === 0 ? 'text-slate-400' : progress.done === progress.total ? 'text-emerald-500' : 'text-slate-600 dark:text-slate-300'}">${progress.done}/${progress.total}</span>
                                </div>
                                <div class="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div class="h-full ${barColor} rounded-full transition-all" style="width: ${progress.percent}%"></div>
                                </div>
                            </div>

                            <!-- Footer: Team + Date -->
                            <div class="flex items-center justify-between">
                                <div class="flex -space-x-2">
                                    ${teamHtml}${extra}
                                </div>
                                <div class="flex items-center gap-1.5 text-xs text-slate-400">
                                    <span class="material-symbols-outlined text-sm">calendar_today</span>
                                    ${new Date(p.dueDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                                </div>
                            </div>
                            <div class="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">chat</span> ${p.chat?.length || 0}</span>
                                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">attach_file</span> ${p.files?.length || 0}</span>
                                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">update</span> ${p.updates?.length || 0}</span>
                            </div>
                        </div>
                    </div>`;
                }).join('')}
            </div>

            <div class="mt-6 text-sm text-slate-400 text-center">
                Mostrando ${projects.length} proyectos
            </div>
        `;
    }
};

if (document.getElementById('projects-container')) {
    window.ProjectsPage.init();
}
