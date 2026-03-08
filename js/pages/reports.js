/**
 * Reports Page Logic
 * Renders a Kanban board of projects from ProjectService
 */
window.ReportsPage = {
    async init() {
        try {
            const container = document.getElementById('content');
            if (!container) return;

            // Fetch live projects
            const projects = await ProjectService.fetchAll();
            this.render(projects);

            // Listen for search
            EventBus.on('global:search', (query) => {
                const currentHash = window.location.hash.substring(1).split(':')[0];
                if (currentHash !== 'reports') return;
                
                const filtered = (projects || []).filter(p => 
                    (p.name && p.name.toLowerCase().includes(query)) || 
                    (p.description && p.description.toLowerCase().includes(query))
                );
                this.render(filtered);
            });
        } catch (err) {
            console.error('Error initializing ReportsPage:', err);
        }
    },

    render(projects) {
        const outlet = document.getElementById('content');
        if (!outlet) return;

        const columns = [
            { id: 'planning', label: 'Planificación', color: 'bg-blue-500', lightColor: 'bg-blue-500/5', borderColor: 'border-blue-200' },
            { id: 'in-progress', label: 'En Proceso', color: 'bg-amber-500', lightColor: 'bg-amber-500/5', borderColor: 'border-amber-200' },
            { id: 'review', label: 'En Revisión', color: 'bg-rose-500', lightColor: 'bg-rose-500/5', borderColor: 'border-rose-200' },
            { id: 'completed', label: 'Finalizada', color: 'bg-emerald-500', lightColor: 'bg-emerald-500/5', borderColor: 'border-emerald-200' }
        ];

        let html = `
        <div class="p-6 animate-fade-in h-full" id="pdf-content">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Reportes de Proyectos</h2>
                    <p class="text-slate-500 dark:text-slate-400 mt-1">Vista Kanban interactiva para gestionar el estado de los proyectos.</p>
                </div>
                <button onclick="ReportsPage.exportPDF()" class="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">download</span> Exportar PDF
                </button>
            </div>

            <!-- Kanban Board -->
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start h-[calc(100vh-200px)] overflow-hidden">
        `;

        columns.forEach(col => {
            const colProjects = (projects || []).filter(p => (p.status || 'planning') === col.id);
            html += `
                <div class="flex flex-col gap-3 h-full">
                    <div class="flex items-center justify-between px-1">
                        <div class="flex items-center gap-2">
                            <div class="w-2.5 h-2.5 rounded-full ${col.color}"></div>
                            <span class="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">${col.label}</span>
                        </div>
                        <span class="text-xs font-bold ${col.color.replace('bg-', 'bg-')}/15 ${col.color.replace('bg-', 'text-')} px-2 py-0.5 rounded-full">${colProjects.length}</span>
                    </div>
                    
                    <div class="${col.lightColor} dark:${col.lightColor.replace('/5', '/[0.07]')} border ${col.borderColor} dark:${col.borderColor.replace('-200', '-900/50')} rounded-2xl p-3 flex flex-col gap-3 h-full overflow-y-auto"
                         ondragover="ReportsPage.onDragOver(event)"
                         ondrop="ReportsPage.onDrop(event, '${col.id}')">
                        ${colProjects.length === 0 ? `
                            <div class="py-10 text-center opacity-60">
                                <span class="material-symbols-outlined text-3xl mb-2 block ${col.color.replace('bg-', 'text-')}">inventory_2</span>
                                <span class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Sin proyectos</span>
                            </div>
                        ` : colProjects.map(p => this.renderCard(p, col.color.replace('bg-', 'text-'))).join('')}
                    </div>
                </div>
            `;
        });

        html += `</div></div>`;
        outlet.innerHTML = html;
        this._calculateGlobalHours(projects); // To load times inside cards
    },

    renderCard(p, textColor) {
        const progress = ProjectService.getTaskProgress(p);
        
        return `
            <div draggable="true"
                 ondragstart="ReportsPage.onDragStart(event, '${p.id}')"
                 class="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all cursor-pointer group/card relative">
                 <div onclick="window.location.hash='project-detail:${p.id}'">
                    <div class="flex items-start justify-between mb-3">
                        <span class="text-[10px] font-mono text-slate-400 font-bold uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">${p.client?.name || 'Agencia Interna'}</span>
                        <div class="flex gap-1 border border-slate-100 dark:border-slate-800 p-0.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800" title="Mover proyecto (Drag)">
                            <span class="material-symbols-outlined text-[14px] text-slate-400 hover:text-slate-600 transition-colors">open_with</span>
                        </div>
                    </div>
                    <h4 class="font-bold text-[14px] text-slate-900 dark:text-slate-100 mb-3 leading-snug group-hover/card:text-primary transition-colors">${p.name}</h4>
                    
                    <div class="flex items-center gap-2 mb-3 text-[11px] text-slate-500">
                        <div class="flex -space-x-1.5 overflow-hidden">
                            ${(p.team || []).slice(0, 3).map(m => `<img src="${m.avatar}" class="size-5 rounded-full ring-2 ring-white dark:ring-slate-900" title="${m.name}"/>`).join('')}
                        </div>
                        <span class="font-medium">${(p.team || []).length} Miembros</span>
                    </div>

                    <div class="flex items-center gap-2 mb-3">
                        <div class="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div class="h-full bg-primary rounded-full transition-all" style="width:${progress.percent}%"></div>
                        </div>
                        <span class="text-[10px] font-bold text-slate-500">${progress.percent}%</span>
                    </div>
                    
                    <div class="flex items-center justify-between mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/50">
                        <div class="flex items-center gap-1.5 text-slate-400">
                            <span class="material-symbols-outlined text-[14px]">timer</span>
                            <span class="text-[10px] font-bold" id="time-p-${p.id}">--h --m</span>
                        </div>
                        <span class="text-[11px] font-bold ${textColor}">${p.budget ? '$' + p.budget.toLocaleString() : 'Sin PPTO'}</span>
                    </div>
                </div>
            </div>
        `;
    },

    onDragStart(e, projectId) {
        try {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', projectId);
        } catch (_) {}
        this.draggingProjectId = projectId;
        e.target.style.opacity = '0.5';
    },

    onDragOver(e) {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        // Add subtle style to indicate dropzone
    },

    async onDrop(e, newStatus) {
        e.preventDefault();
        const projectId = this.draggingProjectId || (e.dataTransfer && e.dataTransfer.getData('text/plain'));
        if (!projectId) return;

        this.draggingProjectId = null;

        try {
            await ProjectService.update(projectId, { status: newStatus });
            // Re-render
            const projects = await ProjectService.fetchAll();
            this.render(projects);
            Toast.success('Proyecto movido exitosamente');
        } catch (err) {
            console.error('Error moviendo proyecto:', err);
            Toast.error('No se pudo actualizar el estado del proyecto');
        }
    },

    async _calculateGlobalHours(projects) {
        for (const p of projects) {
            let projectMinutes = 0;
            const tasks = p.tasks || [];
            
            for (const t of tasks) {
                try {
                    const entries = await ProjectService.fetchTaskTime(t.id);
                    const taskMins = entries.reduce((acc, curr) => acc + curr.duration, 0);
                    projectMinutes += taskMins;
                } catch (e) {
                    // Ignore errors for individual tasks
                }
            }
            
            const h = Math.floor(projectMinutes / 60);
            const m = projectMinutes % 60;
            const span = document.getElementById(`time-p-${p.id}`);
            if (span) span.textContent = `${h}h ${m}m`;
        }
    },

    exportPDF() {
        const element = document.getElementById('pdf-content');
        if (!element) return;

        const opt = {
            margin:       0.5,
            filename:     'reporte-proyectos.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
        };

        // Temporarily adjust styles for better PDF output
        const originalHeight = element.querySelector('.grid').style.height;
        element.querySelector('.grid').style.height = 'auto'; // Disable scroll for printing

        html2pdf().set(opt).from(element).save().then(() => {
            // Restore styles
            element.querySelector('.grid').style.height = originalHeight || 'auto';
            Toast.success('PDF generado correctamente');
        }).catch(err => {
            console.error('Error generating PDF:', err);
            Toast.error('Error al generar el PDF');
            element.querySelector('.grid').style.height = originalHeight || 'auto';
        });
    }
};
