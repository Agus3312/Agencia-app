/**
 * Teams Page Controller
 * Handles rendering and user interactions for the Teams page
 */

// Global functions for HTML event handlers
window.openMemberModal = (memberId = null) => {
    const modal = document.getElementById('member-modal');
    const form = document.getElementById('member-form');
    const title = document.getElementById('modal-title');

    // Reset form
    form.reset();
    document.getElementById('member-id').value = '';
    const deleteBtn = document.getElementById('btn-delete-member');

    if (memberId) {
        title.textContent = 'Editar Miembro';
        const member = TeamService.getById(memberId);
        if (member) {
            document.getElementById('member-id').value = member.id;
            document.getElementById('member-name').value = member.name;
            document.getElementById('member-role').value = member.role;
            document.getElementById('member-team').value = member.team;
            document.getElementById('member-tags').value = member.tags.join(', ');
            document.getElementById('member-image').value = member.image || '';

            // Show delete button
            deleteBtn.classList.remove('hidden');
            deleteBtn.onclick = () => window.deleteMember(memberId);
        }
    } else {
        title.textContent = 'Agregar Nuevo Miembro';
        // Random avatar for new users if not specified (placeholder)
        document.getElementById('member-image').placeholder = 'Dejar vacío para avatar aleatorio';

        // Hide delete button
        deleteBtn.classList.add('hidden');
    }

    modal.classList.remove('hidden');
    Helpers.fadeIn(modal.firstElementChild.nextElementSibling);
};

window.closeMemberModal = () => {
    const modal = document.getElementById('member-modal');
    modal.classList.add('hidden');
};

window.deleteMember = async (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar a este miembro? Esta acción no se puede deshacer.')) {
        await TeamService.delete(id);
        App.showNotification('Miembro eliminado correctamente', 'success');
        closeMemberModal();
        await TeamsPage.renderTeams();
    }
};

window.createEmptyTeam = async () => {
    const name = prompt('Nombre del nuevo equipo:');
    if (!name || !name.trim()) return;
    try {
        await TeamService.createTeam(name.trim());
        Toast.success('Equipo creado correctamente');
        await TeamsPage.renderTeams();
    } catch(err) {
        Toast.error('Error al crear el equipo. Quizás ya exista.');
    }
};

// Make TeamsPage global to avoid redeclaration issues and allow re-init
window.TeamsPage = {
    currentFilter: 'all', // 'all', 'departments', 'projects'

    async init() {
        await this.renderTeams();
        this.setupEventListeners();
        this.setupFilters();
    },

    async renderTeams() {
        const container = document.getElementById('teams-container');
        if (!container) return;

        let members = await TeamService.fetchAll();
        let teamMetadata = await TeamService.fetchTeams() || [];

        // Apply Filters
        if (this.currentFilter === 'departments') {
            // Use metadata
        } else if (this.currentFilter === 'projects') {
            members = members.filter(m => m.tags && m.tags.length > 0);
        }

        // Group members by team
        const teams = members.reduce((acc, member) => {
            if (!acc[member.team]) acc[member.team] = [];
            acc[member.team].push(member);
            return acc;
        }, {});

        // Add empty teams from metadata
        teamMetadata.forEach(t => {
            if (!teams[t.name]) teams[t.name] = [];
        });

        const isAdmin = AuthService.isAdmin();

        // Generate HTML
        let html = isAdmin ? `
            <div class="mb-6 flex justify-end">
                <button onclick="window.createEmptyTeam()" class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                    <span class="material-symbols-outlined text-base">domain_add</span> Crear Nuevo Equipo
                </button>
            </div>
        ` : '';

        if (Object.keys(teams).length === 0) {
            html += `
                <div class="flex flex-col items-center justify-center py-20 text-slate-400">
                    <span class="material-symbols-outlined text-6xl mb-4">search_off</span>
                    <p class="text-lg font-medium">No se encontraron equipos ni miembros</p>
                </div>
            `;
        } else {
            Object.keys(teams).sort().forEach(teamName => {
                const teamMembers = teams[teamName];

                html += `
                    <section class="animate-enter">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-lg font-bold flex items-center gap-2">
                                ${teamName}
                                <span class="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full">${teamMembers.length} miembros</span>
                            </h3>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            ${teamMembers.map(member => this.createMemberCard(member)).join('')}
                            
                            <!-- Add Button Card for each team (Only for Admins) -->
                            ${isAdmin ? `
                            <div onclick="window.location.hash='admin';setTimeout(()=>{if(window.AdminPage)AdminPage.switchTab('create');},300);" class="cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-slate-400 hover:text-primary hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-surface-dark/50 transition-all min-h-[220px]">
                                <span class="material-symbols-outlined text-4xl mb-2">add_circle</span>
                                <span class="text-sm font-medium">Agregar a ${teamName}</span>
                                <span class="text-xs text-slate-400 mt-1">Ir al panel Admin</span>
                            </div>
                            ` : ''}
                        </div>
                    </section>
                `;
            });
        }

        container.innerHTML = html;

        // Add animation delay to cards
        const sections = container.querySelectorAll('section');
        sections.forEach((section, index) => {
            section.style.animationDelay = `${index * 100}ms`;
        });
    },

    createMemberCard(member) {
        const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(member.name) + '&background=random';

        return `
            <div class="metric-card p-5 hover:shadow-lg hover:shadow-primary/5 group relative">
                <div class="flex justify-between items-start mb-4">
                    <div class="relative">
                        <div class="w-14 h-14 rounded-full bg-cover bg-center border-2 border-white dark:border-slate-700" 
                             style="background-image: url('${member.image || defaultAvatar}')"></div>
                        <div class="absolute bottom-0 right-0 w-3.5 h-3.5 ${member.status === 'online' ? 'bg-green-500' : 'bg-slate-400'} border-2 border-white dark:border-surface-dark rounded-full"></div>
                    </div>
                    <button class="icon-button text-xs" onclick="openMemberModal('${member.id}')">
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                    ${AuthService.isAdmin() ? `
                    <button class="icon-button text-xs bg-red-50 text-red-500 hover:bg-red-100" onclick="deleteMember('${member.id}')" title="Eliminar miembro">
                        <span class="material-symbols-outlined">delete</span>
                    </button>` : ''}
                </div>
                <h4 class="font-bold text-slate-900 dark:text-white truncate" title="${member.name}">${member.name}</h4>
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4 truncate" title="${member.role}">${member.role}</p>
                
                <div class="flex flex-wrap gap-1.5 mb-5 h-12 overflow-hidden content-start">
                    ${member.tags.map(tag => {
            const colors = ['blue', 'emerald', 'purple', 'orange', 'cyan'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            return `<span class="text-[10px] px-2 py-0.5 rounded bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400 font-bold uppercase">${tag.trim()}</span>`;
        }).join('')}
                </div>
                
                <div class="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                    <span class="text-xs text-slate-400">ID: ${member.id}</span>
                    <button class="text-xs font-bold text-primary group-hover:underline">Ver Perfil</button>
                </div>
            </div>
        `;
    },

    setupFilters() {
        const buttons = document.querySelectorAll('.px-8.border-t button');
        // 0: All Teams, 1: Departments, 2: Active Projects

        if (buttons.length >= 3) {
            buttons[0].onclick = () => this.setFilter('all', buttons[0]);
            buttons[1].onclick = () => this.setFilter('departments', buttons[1]);
            buttons[2].onclick = () => this.setFilter('projects', buttons[2]);
        }
    },

    async setFilter(filterType, activeButton) {
        this.currentFilter = filterType;
        await this.renderTeams();

        // Update styling
        const buttons = document.querySelectorAll('.px-8.border-t button');
        buttons.forEach(btn => {
            btn.className = 'pb-4 border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium text-sm transition-all';
        });

        activeButton.className = 'pb-4 border-b-2 border-primary text-primary font-semibold text-sm transition-all';
    },

    setupEventListeners() {
        const form = document.getElementById('member-form');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();

                const id = document.getElementById('member-id').value;
                const name = document.getElementById('member-name').value;
                const role = document.getElementById('member-role').value;
                const team = document.getElementById('member-team').value;
                const tagsInput = document.getElementById('member-tags').value;
                const image = document.getElementById('member-image').value;

                const memberData = {
                    name,
                    role,
                    team,
                    tags: tagsInput.split(',').map(t => t.trim()).filter(t => t),
                    image,
                    status: 'online'
                };

                if (id) {
                    await TeamService.update(id, memberData);
                    App.showNotification('Miembro actualizado correctamente', 'success');
                } else {
                    await TeamService.add(memberData);
                    App.showNotification('Miembro agregado correctamente', 'success');
                }

                closeMemberModal();
                await this.renderTeams();
            };
        }
    }
};

// Initialize when the script is loaded if not already initialized via Router logic
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // Check if we are on the teams page before auto-initializing
    if (document.getElementById('teams-container')) {
        window.TeamsPage.init();
    }
}
