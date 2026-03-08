// Mi Espacio Controller
window.MySpacePage = {
    activeTab: 'tasks',

    async init() {
        this.loadTab(this.activeTab);
    },

    async loadTab(tabId) {
        this.activeTab = tabId;
        const content = document.getElementById('myspace-content');
        if (!content) return;

        // Update tabs styling with modern underline look
        const tabsContainer = document.querySelector('.flex.gap-8.border-b');
        if (tabsContainer) {
            tabsContainer.className = 'flex gap-8 border-b border-slate-100 dark:border-slate-800 mb-8';
        }

        document.querySelectorAll('[id^="tab-myspace-"]').forEach(btn => {
            btn.className = 'pb-4 px-1 border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium text-sm transition-all flex items-center gap-2 relative';
        });

        const activeBtn = document.getElementById(`tab-myspace-${tabId}`);
        if(activeBtn) {
            activeBtn.className = 'pb-4 px-1 border-b-2 border-primary text-primary font-semibold text-sm transition-all flex items-center gap-2 relative';
        }

        if (tabId === 'tasks') {
            await this.renderTasks(content);
        } else if (tabId === 'notes') {
            await this.renderNotes(content);
        }
    },

    async renderTasks(container) {
        let tasks = [];
        try {
            tasks = await ApiAdapter.get('/api/myspace/tasks');
        } catch (e) {
            console.error('Error loading tasks', e);
        }

        const pending = tasks.filter(t => !t.done).length;
        const completed = tasks.filter(t => t.done).length;
        const todayCount = tasks.filter(t => {
            const date = new Date(t.createdAt || Date.now());
            return date.toDateString() === new Date().toDateString();
        }).length;

        container.innerHTML = `
            <div class="max-w-4xl mx-auto space-y-6 fade-in">
                <!-- Subtle Stats Bar -->
                <div class="flex items-center gap-6 px-2">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hoy:</span>
                        <span class="text-xs font-bold text-slate-900 dark:text-white">${todayCount}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pendientes:</span>
                        <span class="text-xs font-bold text-slate-900 dark:text-white">${pending}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completadas:</span>
                        <span class="text-xs font-bold text-slate-900 dark:text-white">${completed}</span>
                    </div>
                </div>

                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                    <!-- Modern Quick-Add Input -->
                    <div class="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 group focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
                        <form onsubmit="MySpacePage.addTask(event)" class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-slate-300 group-focus-within:text-primary transition-colors">add</span>
                            <input type="text" id="new-personal-task" 
                                placeholder="+ Escribir una tarea y presionar Enter..."
                                onkeydown="if(event.key==='Enter') MySpacePage.addTask(event)"
                                class="flex-1 bg-transparent border-none py-2 text-sm outline-none placeholder:text-slate-400 dark:text-white font-medium"/>
                            <button type="submit" class="text-xs font-bold text-primary hover:text-blue-700 transition-colors opacity-0 group-focus-within:opacity-100 px-3 py-1.5 rounded-lg bg-primary/10">Agregar</button>
                        </form>
                    </div>

                    <!-- Task List with drag structure -->
                    <div class="flex-1 divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto">
                        ${tasks.length === 0 ? this._renderEmptyState() : tasks.map(t => this._renderTaskRow(t)).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    _renderTaskRow(t) {
        return `
            <div class="flex items-center gap-2 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group border-l-2 border-transparent hover:border-primary/30"
                 draggable="true" data-id="${t.id}">
                
                <!-- Drag Handle -->
                <div class="cursor-grab active:cursor-grabbing p-1 text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span class="material-symbols-outlined text-lg">drag_indicator</span>
                </div>

                <button onclick="MySpacePage.toggleTask('${t.id}')"
                    class="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${t.done 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-primary bg-white dark:bg-slate-900'}">
                    ${t.done ? '<span class="material-symbols-outlined text-xs">check</span>' : ''}
                </button>

                <div class="flex-1 min-w-0 ml-1">
                    <p class="text-sm transition-all ${t.done ? 'line-through text-slate-400 opacity-60' : 'text-slate-700 dark:text-slate-200 font-medium'}">${t.title}</p>
                </div>

                <div class="relative opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="MySpacePage.showTaskMenu(event, '${t.id}')" 
                            class="p-1 px-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all">
                        <span class="material-symbols-outlined text-lg">more_horiz</span>
                    </button>
                </div>
            </div>
        `;
    },

    _renderEmptyState() {
        return `
            <div class="flex flex-col items-center justify-center py-20 px-8 text-center animate-pulse-subtle">
                <div class="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6">
                    <span class="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">playlist_add_check</span>
                </div>
                <h4 class="text-lg font-bold text-slate-800 dark:text-white mb-2">No tenés tareas pendientes</h4>
                <p class="text-sm text-slate-400 max-w-xs mb-8">Empezá escribiendo algo arriba. Acá tenés unos ejemplos:</p>
                
                <div class="space-y-3 w-full max-w-xs">
                    <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 text-xs text-left text-slate-500">
                        <div class="w-4 h-4 rounded border border-slate-300 dark:border-slate-600"></div>
                        <span>Revisar entregable del proyecto cliente</span>
                    </div>
                    <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 text-xs text-left text-slate-500">
                        <div class="w-4 h-4 rounded border border-slate-300 dark:border-slate-600"></div>
                        <span>Preparar notas para la reunión de mañana</span>
                    </div>
                </div>
            </div>
        `;
    },

    async renderNotes(container) {
        let notesText = '';
        try {
            const noteData = await ApiAdapter.get('/api/myspace/notes');
            notesText = noteData?.content || '';
        } catch(e) {
            console.error('Error loading notes', e);
        }
        
        container.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden max-w-4xl mx-auto flex flex-col h-[600px] fade-in">
                <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                    <div>
                        <h3 class="font-bold text-lg">Bloc de Notas Privado</h3>
                        <p class="text-[10px] font-bold uppercase tracking-wider text-primary mt-0.5">Automáticamente privado</p>
                    </div>
                    <button id="btn-save-notes" onclick="MySpacePage.saveNotes()" class="px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
                        <span class="material-symbols-outlined text-base">save</span> Guardar
                    </button>
                </div>
                
                <div class="flex-1 p-8 bg-white dark:bg-slate-900">
                    <textarea id="personal-notes-area"
                        class="w-full h-full bg-transparent border-none resize-none outline-none text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-700 leading-relaxed font-serif text-lg"
                        placeholder="Empezá a escribir tus pensamientos acá...">${notesText}</textarea>
                </div>
            </div>
        `;
    },

    showTaskMenu(e, id) {
        e.stopPropagation();
        // In a real app we would use a dropdown component. For now, a clean prompt/confirm flow or custom HTML.
        // Let's implement a simple custom modal/menu logic if needed, but for MVP keep it functional.
        if (confirm('¿Eliminar esta tarea?')) {
            this.deleteTask(id);
        }
    },

    async addTask(e) {
        e.preventDefault();
        const input = document.getElementById('new-personal-task');
        const title = input?.value.trim();
        if (!title) return;

        // Optimistic UI could be added here later
        input.value = '';
        input.disabled = true;

        try {
            await ApiAdapter.post('/api/myspace/tasks', { title });
            // Re-render task list only (to get the real ID and proper order)
            // but we can do it silently or just reload the tab. 
            // For now, reload is fine for adding, but let's make it silent.
            await this.loadTab('tasks');
        } catch (e) {
            Toast.error('Error al agregar la tarea');
            input.value = title;
        } finally {
            input.disabled = false;
            input.focus();
        }
    },

    async toggleTask(id) {
        // Optimistic UI toggle
        const taskRow = document.querySelector(`[data-id="${id}"]`);
        if (!taskRow) return;

        const btn = taskRow.querySelector('button');
        const text = taskRow.querySelector('p');
        if (!btn || !text) return;

        const isDone = btn.classList.contains('bg-emerald-500');
        
        // Update local UI immediately
        if (!isDone) {
            // Transition to Checked
            btn.classList.add('bg-emerald-500', 'border-emerald-500', 'text-white');
            btn.classList.remove('border-slate-200', 'dark:border-slate-700', 'bg-white', 'dark:bg-slate-900');
            btn.innerHTML = '<span class="material-symbols-outlined text-xs">check</span>';
            text.classList.add('line-through', 'text-slate-400', 'opacity-60');
            text.classList.remove('text-slate-700', 'dark:text-slate-200', 'font-medium');
        } else {
            // Transition to Unchecked
            btn.classList.remove('bg-emerald-500', 'border-emerald-500', 'text-white');
            btn.classList.add('border-slate-200', 'dark:border-slate-700', 'bg-white', 'dark:bg-slate-900');
            btn.innerHTML = '';
            text.classList.remove('line-through', 'text-slate-400', 'opacity-60');
            text.classList.add('text-slate-700', 'dark:text-slate-200', 'font-medium');
        }

        try {
            await ApiAdapter.patch(`/api/myspace/tasks/${id}`, {});
            this.updateStats();
        } catch (e) {
            Toast.error('Error al actualizar la tarea');
            // Rollback UI (recursive call or manual flip - manual flip is safer for state preservation)
            // For simplicity, let's just reload to be 100% sure of state on error
            this.loadTab('tasks');
        }
    },

    async updateStats() {
        try {
            const tasks = await ApiAdapter.get('/api/myspace/tasks', true); // Force refresh
            const pending = tasks.filter(t => !t.done).length;
            const completed = tasks.filter(t => t.done).length;
            const todayCount = tasks.filter(t => {
                const date = new Date(t.createdAt || Date.now());
                return date.toDateString() === new Date().toDateString();
            }).length;

            // Update stats elements if they exist
            const statsLabels = document.querySelectorAll('.flex.items-center.gap-6.px-2 span.text-xs.font-bold');
            if (statsLabels.length >= 3) {
                statsLabels[0].textContent = todayCount;
                statsLabels[1].textContent = pending;
                statsLabels[2].textContent = completed;
            }
        } catch (e) {
            console.error('Error updating stats', e);
        }
    },

    async deleteTask(id) {
        // Optimistic hide
        const taskRow = document.querySelector(`[data-id="${id}"]`);
        if (taskRow) {
            taskRow.classList.add('opacity-0', '-translate-x-4');
            setTimeout(() => { if(taskRow.parentNode) taskRow.remove(); }, 300);
        }

        try {
            await ApiAdapter.delete(`/api/myspace/tasks/${id}`);
            this.updateStats();
        } catch (e) {
            this.loadTab('tasks'); // Rollback to show it again
            Toast.error('Error al eliminar la tarea');
        }
    },

    async saveNotes() {
        const btn = document.getElementById('btn-save-notes');
        const content = document.getElementById('personal-notes-area').value;
        const originalHtml = btn.innerHTML;
        
        btn.innerHTML = '<span class="material-symbols-outlined text-base animate-spin">sync</span> Guardando...';
        btn.disabled = true;

        try {
            await ApiAdapter.put('/api/myspace/notes', { content });
            btn.innerHTML = '<span class="material-symbols-outlined text-base">check</span> Guardado';
            btn.classList.replace('bg-primary', 'bg-emerald-500');
            setTimeout(() => {
                btn.innerHTML = originalHtml;
                btn.disabled = false;
                btn.classList.replace('bg-emerald-500', 'bg-primary');
            }, 2000);
        } catch (e) {
            Toast.error('Error al guardar las notas');
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    }
};
