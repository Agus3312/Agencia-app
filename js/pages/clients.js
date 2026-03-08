/**
 * ClientsPage Controller
 * Handles the logic for managing agency clients.
 */
const ClientsPage = {
    clients: [],
    viewMode: 'grid', // 'grid' or 'list'
    searchTerm: '',

    async init() {
        console.log('Initializing ClientsPage...');
        await this.loadClients();
    },

    async loadClients() {
        const container = document.getElementById('clients-container');
        const emptyState = document.getElementById('clients-empty');
        
        try {
            this.clients = await ClientService.fetchAll();
            this.render();
        } catch (err) {
            console.error('Error loading clients:', err);
            Toast.error('No se pudieron cargar los clientes');
        }
    },

    setView(mode) {
        this.viewMode = mode;
        const btnGrid = document.getElementById('btn-view-grid');
        const btnList = document.getElementById('btn-view-list');

        if (mode === 'grid') {
            btnGrid.classList.add('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-primary');
            btnGrid.classList.remove('text-slate-400');
            btnList.classList.remove('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-primary');
            btnList.classList.add('text-slate-400');
        } else {
            btnList.classList.add('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-primary');
            btnList.classList.remove('text-slate-400');
            btnGrid.classList.remove('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-primary');
            btnGrid.classList.add('text-slate-400');
        }

        this.render();
    },

    handleSearch(val) {
        this.searchTerm = val.toLowerCase();
        this.render();
    },

    render() {
        const container = document.getElementById('clients-container');
        const emptyState = document.getElementById('clients-empty');
        if (!container) return;

        const filtered = this.clients.filter(c => 
            c.name.toLowerCase().includes(this.searchTerm) || 
            (c.company && c.company.toLowerCase().includes(this.searchTerm))
        );

        if (filtered.length === 0) {
            container.classList.add('hidden');
            emptyState.classList.remove('hidden');
            emptyState.style.display = 'flex';
            return;
        }

        container.classList.remove('hidden');
        emptyState.classList.add('hidden');
        emptyState.style.display = '';

        if (this.viewMode === 'grid') {
            container.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-enter";
            container.innerHTML = filtered.map(c => this._renderGridCard(c)).join('');
        } else {
            container.className = "flex flex-col gap-3 animate-enter";
            container.innerHTML = filtered.map(c => this._renderListRow(c)).join('');
        }
    },

    _renderGridCard(c) {
        const projectCount = c._count?.projects || 0;
        return `
            <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/20 transition-all group relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onclick="ClientsPage.openEditModal('${c.id}')" class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary transition-colors">
                        <span class="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button onclick="ClientsPage.deleteClient('${c.id}')" class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors">
                        <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                </div>

                <div class="flex items-center gap-4 mb-5">
                    <div class="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                        ${c.image ? `<img src="${c.image}" class="w-full h-full object-cover">` : `<span class="text-xl font-bold text-primary">${c.name.charAt(0)}</span>`}
                    </div>
                    <div class="min-w-0">
                        <h3 class="font-bold text-slate-800 dark:text-white truncate">${c.name}</h3>
                        <p class="text-xs text-slate-400 truncate">${c.company || 'Sin empresa'}</p>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                    <div>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Proyectos</p>
                        <p class="text-sm font-bold text-slate-700 dark:text-slate-200">${projectCount}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Miembro desde</p>
                        <p class="text-xs text-slate-500">${new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>

                <div class="mt-5">
                    <button onclick="window.location.hash = 'projects:client=${c.id}'" 
                        class="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-primary hover:text-white transition-all">
                        Ver Proyectos
                    </button>
                </div>
            </div>
        `;
    },

    _renderListRow(c) {
        return `
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 px-5 flex items-center justify-between group hover:border-primary/50 transition-all">
                <div class="flex items-center gap-4 flex-1">
                    <div class="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                        ${c.image ? `<img src="${c.image}" class="w-full h-full object-cover">` : `<span class="text-sm font-bold text-primary">${c.name.charAt(0)}</span>`}
                    </div>
                    <div>
                        <h4 class="text-sm font-bold text-slate-800 dark:text-white">${c.name}</h4>
                        <p class="text-[11px] text-slate-400">${c.company || 'Sin empresa'} • ${c.email || 'Sin email'}</p>
                    </div>
                </div>
                
                <div class="flex items-center gap-6">
                    <div class="hidden md:block text-right">
                        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Proyectos</p>
                        <p class="text-xs font-bold">${c._count?.projects || 0}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="ClientsPage.openEditModal('${c.id}')" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <span class="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button onclick="ClientsPage.deleteClient('${c.id}')" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                            <span class="material-symbols-outlined text-sm">delete</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    openCreateModal() {
        document.getElementById('client-modal-title').textContent = 'Nuevo Cliente';
        document.getElementById('client-form').reset();
        document.getElementById('client-id').value = '';
        document.getElementById('client-modal').classList.remove('hidden');
    },

    openEditModal(id) {
        const c = this.clients.find(x => x.id === id);
        if (!c) return;

        document.getElementById('client-modal-title').textContent = 'Editar Cliente';
        document.getElementById('client-id').value = c.id;
        document.getElementById('client-name').value = c.name;
        document.getElementById('client-company').value = c.company || '';
        document.getElementById('client-email').value = c.email || '';
        document.getElementById('client-image').value = c.image || '';
        
        document.getElementById('client-modal').classList.remove('hidden');
    },

    closeModal() {
        document.getElementById('client-modal').classList.add('hidden');
    },

    async handleSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('client-id').value;
        const data = {
            name: document.getElementById('client-name').value,
            company: document.getElementById('client-company').value,
            email: document.getElementById('client-email').value,
            image: document.getElementById('client-image').value
        };

        try {
            if (id) {
                await ClientService.update(id, data);
                Toast.success('Cliente actualizado');
            } else {
                await ClientService.add(data);
                Toast.success('Cliente creado correctamente');
            }
            this.closeModal();
            await this.loadClients();
        } catch (err) {
            console.error('Submit error:', err);
            Toast.error('Error al guardar el cliente');
        }
    },

    async deleteClient(id) {
        if (!confirm('¿Estás seguro de eliminar este cliente? Se desvinculará de sus proyectos.')) return;
        
        try {
            await ClientService.delete(id);
            Toast.success('Cliente eliminado');
            await this.loadClients();
        } catch (err) {
            console.error('Delete error:', err);
            Toast.error('No se pudo eliminar el cliente');
        }
    }
};

// Export to window
window.ClientsPage = ClientsPage;
