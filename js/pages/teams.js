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

            // Show delete button only if admin
            if (window.AuthService && window.AuthService.isAdmin()) {
                deleteBtn.classList.remove('hidden');
                deleteBtn.onclick = () => window.deleteMember(memberId);
            } else {
                deleteBtn.classList.add('hidden');
            }
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
        try {
            await TeamService.delete(id);
            Toast.success('Miembro eliminado correctamente');
            window.closeMemberModal(); // Added explicit window reference for modal
            
            // Re-render
            if (window.TeamsPage) {
                await window.TeamsPage.renderTeams();
            }
        } catch (e) {
            console.error(e);
            Toast.error('Error al eliminar miembro');
        }
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

window.deleteTeam = async (name) => {
    if (confirm(`¿Estás SEGURO de que deseas eliminar el equipo "${name}"? Solo se pueden eliminar equipos sin miembros.`)) {
        try {
            await TeamService.deleteTeam(name);
            Toast.success('Equipo eliminado correctamente');
            await TeamsPage.renderTeams();
        } catch(err) {
            Toast.error(err.message || 'Error al eliminar el equipo');
        }
    }
};

window.toggleTeam = (teamName) => {
    const content = document.getElementById(`team-content-${teamName}`);
    const icon = document.getElementById(`team-icon-${teamName}`);
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.style.transform = 'rotate(0deg)';
    } else {
        content.classList.add('hidden');
        icon.style.transform = 'rotate(-90deg)';
    }
};

// Make TeamsPage global to avoid redeclaration issues and allow re-init
window.TeamsPage = {
    currentFilter: 'all', // 'all', 'departments', 'projects'
    searchTerm: '',

    async init() {
        // Unhide Create Team button for Admins
        const btnCreateTeam = document.getElementById('btn-create-team');
        if (btnCreateTeam) btnCreateTeam.classList.toggle('hidden', !AuthService.isAdmin());

        await this.populateTeamSelect();
        await this.renderTeams();
        this.setupEventListeners();
        this.setupFilters();

        // Listen for global search
        EventBus.on('global:search', (query) => {
            const currentHash = window.location.hash.substring(1).split(':')[0];
            if (currentHash !== 'teams') return;
            this.onSearch(query);
        });
    },

    async populateTeamSelect() {
        const select = document.getElementById('member-team');
        if (!select) return;
        const teams = await TeamService.fetchTeams() || [];
        select.innerHTML = '<option value="">Seleccione un equipo...</option>' + 
            teams.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
    },

    onSearch(value) {
        this.searchTerm = value.toLowerCase().trim();
        this.renderTeams();
    },

    async renderTeams() {
        const container = document.getElementById('teams-container');
        if (!container) return;

        let members = await TeamService.fetchAll();
        let teamMetadata = await TeamService.fetchTeams() || [];

        // Apply Search Filter
        if (this.searchTerm) {
            members = members.filter(m => {
                const tags = m.tags || [];
                return m.name.toLowerCase().includes(this.searchTerm) || 
                       m.role.toLowerCase().includes(this.searchTerm) || 
                       m.team.toLowerCase().includes(this.searchTerm) ||
                       tags.some(tag => tag.toLowerCase().includes(this.searchTerm));
            });
        }

        // Apply Logic Filters
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

        // Update Stats in Header
        const statsContainer = document.getElementById('teams-stats-container');
        if (statsContainer) {
            statsContainer.innerHTML = `${members.length} members • ${Object.keys(teams).length} teams`;
        }

        // Generate HTML
        let html = '';

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
                const safeName = teamName.replace(/\s+/g, '-');

                html += `
                    <section class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-enter mb-6">
                        <!-- Collapsible Header -->
                        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between group/section cursor-pointer" onclick="window.toggleTeam('${safeName}')">
                            <div class="flex items-center gap-3">
                                <span id="team-icon-${safeName}" class="material-symbols-outlined text-slate-400 transition-transform duration-200">expand_more</span>
                                <h3 class="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                                    ${teamName}
                                    <span class="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs px-2.5 py-0.5 rounded-full font-semibold">${teamMembers.length} members</span>
                                </h3>
                                
                                <div class="flex items-center gap-2 ml-4">
                                    ${isAdmin && teamMembers.length === 0 ? `
                                    <button onclick="event.stopPropagation(); window.deleteTeam('${teamName}')" title="Eliminar equipo vacío"
                                        class="opacity-0 group-hover/section:opacity-100 p-1.5 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all">
                                        <span class="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <!-- Header Action (Add Member) -->
                            ${isAdmin ? `
                            <button onclick="event.stopPropagation(); window.location.hash='admin';setTimeout(()=>{if(window.AdminPage)AdminPage.switchTab('create');},300);" 
                                class="opacity-0 group-hover/section:opacity-100 flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-semibold transition-colors">
                                <span class="material-symbols-outlined text-[16px]">person_add</span> Add Member
                            </button>
                            ` : ''}
                        </div>
                        
                        <!-- Grid Content -->
                        <div id="team-content-${safeName}" class="p-6 transition-all duration-300">
                            ${teamMembers.length === 0 ? `
                                <div class="text-center py-8 text-slate-400 text-sm">Este equipo está vacío. Podés agregar miembros o eliminarlo.</div>
                            ` : `
                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                                    ${teamMembers.map(member => this.createMemberCard(member)).join('')}
                                </div>
                            `}
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
        // Mock data for metadata
        const activeProjects = Math.floor(Math.random() * 4);
        const activeTasks = Math.floor(Math.random() * 12);

        return `
            <div class="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 group relative">
                
                <!-- Card Header: Avatar & Actions -->
                <div class="flex justify-between items-start mb-4">
                    <div class="relative">
                        <div class="w-14 h-14 rounded-full bg-cover bg-center border-2 border-white dark:border-slate-800 shadow-sm" 
                             style="background-image: url('${member.image || defaultAvatar}')" loading="lazy"></div>
                        <div class="absolute bottom-0 right-0 w-3.5 h-3.5 ${member.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'} border-2 border-white dark:border-slate-800 rounded-full" title="${member.status === 'online' ? 'Online' : 'Offline'}"></div>
                    </div>
                    
                    <!-- Hover Action Menu -->
                    <div class="opacity-0 group-hover:opacity-100 transition-opacity flex bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 p-1 gap-1">
                        <button class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-primary transition-colors" title="View Profile">
                            <span class="material-symbols-outlined text-[16px]">visibility</span>
                        </button>
                        <button class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-primary transition-colors" onclick="openMemberModal('${member.id}')" title="Edit Member">
                            <span class="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        ${AuthService.isAdmin() ? `
                        <button class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-500 transition-colors" onclick="deleteMember('${member.id}')" title="Remove from Team">
                            <span class="material-symbols-outlined text-[16px]">person_remove</span>
                        </button>` : ''}
                    </div>
                </div>
                
                <!-- Info Section -->
                <h4 class="font-bold text-slate-900 dark:text-white truncate text-[15px]" title="${member.name}">${member.name}</h4>
                <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4 truncate" title="${member.role}">${member.role}</p>
                
                <!-- Skills Chips (Compact) -->
                ${(member.tags || []).length > 0 ? `
                <div class="flex gap-1.5 mb-5 flex-wrap">
                    ${(member.tags || []).slice(0, 3).map(tag => `
                        <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap border border-slate-200 dark:border-slate-700">${tag.trim()}</span>
                    `).join('')}
                    ${(member.tags || []).length > 3 ? `<span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 font-medium border border-slate-100 dark:border-slate-700/50">+${(member.tags || []).length - 3}</span>` : ''}
                </div>
                ` : '<div class="h-8 mb-5"></div>'}
                
                <!-- Metadata Footer -->
                <div class="flex items-center justify-between border-t border-slate-100 dark:border-slate-700/50 pt-3 mt-auto">
                    <div class="flex gap-4">
                        <div class="flex items-center gap-1.5" title="Active Projects">
                            <span class="material-symbols-outlined text-[14px] text-slate-400">folder_open</span>
                            <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">${activeProjects}</span>
                        </div>
                        <div class="flex items-center gap-1.5" title="Active Tasks">
                            <span class="material-symbols-outlined text-[14px] text-slate-400">task_alt</span>
                            <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">${activeTasks}</span>
                        </div>
                    </div>
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
