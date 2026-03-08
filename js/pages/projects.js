/**
 * Projects Page Controller
 * Renders the project list dynamically from ProjectService
 */
window.ProjectsPage = {
    async init() {
        try {
            this.projects = await ProjectService.fetchAll();
            this.filteredProjects = [...this.projects];
            
            // Render initially
            this.render();

            // Listen for global search
            EventBus.on('global:search', (query) => {
                const currentHash = window.location.hash.substring(1).split(':')[0];
                if (currentHash !== 'projects') return;
                
                this.filteredProjects = (this.projects || []).filter(p => 
                    (p.name && p.name.toLowerCase().includes(query)) || 
                    (p.description && p.description.toLowerCase().includes(query))
                );
                this.renderFiltered();
            });
        } catch (err) {
            console.error('Error initializing ProjectsPage:', err);
        }
    },

    renderFiltered() {
        this.renderList(this.filteredProjects);
        const countEl = document.getElementById('projects-count');
        if (countEl) countEl.textContent = `Mostrando ${this.filteredProjects.length} proyectos`;
    },

    async render() {
        const container = document.getElementById('projects-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Proyectos</h2>
                    <p class="text-slate-500 dark:text-slate-400 mt-1">Gestiona y supervisa las tareas pendientes de tu equipo.</p>
                </div>
                ${AuthService.isAdmin() ? `
                <button onclick="window.location.hash='project-create'"
                    class="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                    <span class="material-symbols-outlined">add</span>
                    Nuevo Proyecto
                </button>` : ''}
            </div>

            <div id="projects-list-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"></div>

            <div id="projects-count" class="mt-6 text-sm text-slate-400 text-center">
                Mostrando ... proyectos
            </div>
        `;

        this.renderFiltered();
    },

    renderList(projects) {
        const listGrid = document.getElementById('projects-list-grid');
        if (!listGrid) return;

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

        if (!this.projects || this.projects.length === 0) {
            listGrid.classList.remove('grid-cols-1', 'md:grid-cols-2', 'xl:grid-cols-3', 'grid');
            listGrid.innerHTML = `
                <div class="flex flex-col items-center justify-center p-12 lg:p-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div class="w-24 h-24 mb-6 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                        <span class="material-symbols-outlined text-5xl">rocket_launch</span>
                    </div>
                    <h3 class="text-2xl font-bold text-slate-800 dark:text-white mb-2">¡Bienvenido a tu Agencia!</h3>
                    <p class="text-slate-500 max-w-md mb-8">No tienes ningún proyecto activo todavía. Crea tu primer proyecto para empezar a gestionar tareas, tiempos y presupuestos con tu equipo.</p>
                    ${AuthService.isAdmin() ? `
                    <button onclick="window.location.hash='project-create'" class="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 flex items-center gap-2">
                        <span class="material-symbols-outlined">add</span>
                        Crear mi Primer Proyecto
                    </button>
                    ` : ''}
                </div>
            `;
            return;
        }

        if (!projects || projects.length === 0) {
            listGrid.innerHTML = `
                <div class="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
                    <span class="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-3 block">search_off</span>
                    <p class="text-slate-500 font-medium">No se encontraron proyectos que coincidan con la búsqueda.</p>
                </div>
            `;
            return;
        }

        // Restore grid classes if they were removed
        listGrid.classList.add('grid', 'grid-cols-1', 'md:grid-cols-2', 'xl:grid-cols-3');

        listGrid.innerHTML = projects.map(p => {
            const progress = ProjectService.getTaskProgress(p);
            const barColor = colorMap[p.color]?.replace('bg-', 'bg-') || 'bg-primary';
            const status = statusConfig[p.status] || statusConfig['in-progress'];

            const teamHtml = (p.team || []).slice(0, 3).map(m =>
                `<div class="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-cover bg-center" style="background-image: url('${m.avatar}')" title="${m.name}" loading="lazy"></div>`
            ).join('');
            const extra = (p.team || []).length > 3 ? `<div class="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">+${p.team.length - 3}</div>` : '';

            return `
            <div onclick="window.location.hash='project-detail:${p.id}'"
                class="cursor-pointer bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-primary/40 transition-all overflow-hidden group">
                <div class="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
                    <div class="h-full ${barColor} transition-all" style="width: ${progress.percent}%"></div>
                </div>
                <div class="p-6">
                    <div class="flex items-start justify-between gap-3 mb-1">
                        <h3 class="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-snug">${p.name}</h3>
                        <span class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${status.color}">
                            <span class="w-1.5 h-1.5 rounded-full ${status.dot}"></span>
                            ${status.label}
                        </span>
                    </div>
                    
                    ${p.client ? `
                    <div class="flex items-center gap-1.5 mb-3">
                        <span class="material-symbols-outlined text-xs text-primary">corporate_fare</span>
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${p.client.name}</span>
                    </div>` : '<div class="h-4 mb-3"></div>'}

                    <p class="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">${p.description || ''}</p>
                    
                    <div class="mb-4">
                        <div class="flex items-center justify-between mb-1.5">
                            <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">Progreso</span>
                            <span class="text-xs font-bold text-slate-600 dark:text-slate-300">${progress.percent}%</span>
                        </div>
                        <div class="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div class="h-full ${barColor} rounded-full transition-all" style="width: ${progress.percent}%"></div>
                        </div>
                    </div>

                    <div class="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800/50">
                        <div class="flex items-center gap-3">
                            <div class="flex -space-x-2">${teamHtml}${extra}</div>
                            ${p.budget ? `
                            <div class="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                <span>$${p.budget.toLocaleString()}</span>
                            </div>` : ''}
                        </div>
                        <div class="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            <span class="material-symbols-outlined text-xs">calendar_today</span>
                            ${p.dueDate ? new Date(p.dueDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : 'S/F'}
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    }
};

if (document.getElementById('projects-container')) {
    ProjectsPage.init();
}
