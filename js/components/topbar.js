/**
 * TopBar Component
 * Renders the global top navigation bar with search and user profile
 */

const TopBar = {
    init() {
        try {
            this.render();
        } catch (e) {
            console.error("TopBar rendering failed:", e);
            alert("Error crítico cargando TopBar:\n" + e.message);
        }
    },

    render() {
        const container = document.getElementById('topbar-container');
        if (!container) return;

        const user = window.AuthService ? window.AuthService.getUser() : null;
        if (!user) return; // Don't render topbar if not logged in

        container.innerHTML = `
            <header class="global-topbar flex items-center justify-between lg:justify-end gap-4 p-4 lg:p-0">
                <button id="mobile-menu-btn" class="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-500 hover:text-primary border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                    <span class="material-symbols-outlined">menu</span>
                </button>

                <div class="global-search flex-1 lg:flex-none">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">search</span>
                    <input type="text" id="global-search-input" placeholder="Buscar en el espacio de trabajo..." />
                    <span class="shortcut">Ctrl K</span>
                </div>
                
                <div class="topbar-controls">
                    <!-- Notifications -->
                    <div class="relative">
                        <button id="notif-btn" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
                            <span class="material-symbols-outlined text-[20px]">notifications</span>
                            <span id="notif-badge" class="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 hidden"></span>
                        </button>
                        
                        <!-- Notifications Dropdown -->
                        <div id="notif-dropdown" class="hidden absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/40 border border-slate-100 dark:border-slate-700 py-2 z-50">
                            <div class="px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <span class="font-bold text-sm text-slate-900 dark:text-white">Notificaciones</span>
                                <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Últimas</span>
                            </div>
                            <div id="notif-list" class="max-h-64 overflow-y-auto py-1">
                                <div class="px-4 py-8 text-center text-slate-400 text-xs">
                                    Cargando notificaciones...
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Theme Toggle -->
                    <button id="theme-toggle" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span class="material-symbols-outlined text-[20px] dark:hidden">dark_mode</span>
                        <span class="material-symbols-outlined text-[20px] hidden dark:block">light_mode</span>
                    </button>

                    <!-- User Profile Dropdown Toggle -->
                    <div class="relative ml-2">
                        <button id="profile-menu-btn" class="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 pr-2 rounded-full transition-colors border border-transparent dark:hover:border-slate-700">
                            <img src="${window.AuthService.getAvatar()}" alt="User Avatar" class="w-7 h-7 rounded-full bg-slate-200 object-cover border border-slate-200 dark:border-slate-700">
                            <span class="text-sm font-semibold text-slate-700 dark:text-slate-200 hidden sm:block">${window.AuthService.getUserName().split(' ')[0]}</span>
                            <span class="material-symbols-outlined text-sm text-slate-400">expand_more</span>
                        </button>
                        
                        <!-- Dropdown Menu -->
                        <div id="profile-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg shadow-black/10 dark:shadow-black/40 border border-slate-100 dark:border-slate-700 py-1 z-50">
                            <button id="btn-logout" class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2 transition-colors">
                                <span class="material-symbols-outlined text-[18px]">logout</span>
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </header>
        `;

        // Theme toggle logic
        const themeBtn = container.querySelector('#theme-toggle');
        if(themeBtn) {
            themeBtn.addEventListener('click', () => {
                document.documentElement.classList.toggle('dark');
            });
        }

        // Mobile menu logic
        const mobileMenuBtn = container.querySelector('#mobile-menu-btn');
        const sidebarContainer = document.getElementById('sidebar-container');
        if (mobileMenuBtn && sidebarContainer) {
            mobileMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // We toggle fixed positioning and visibility classes
                sidebarContainer.classList.toggle('hidden');
                sidebarContainer.classList.toggle('fixed');
                sidebarContainer.classList.toggle('inset-y-0');
                sidebarContainer.classList.toggle('left-0');
                sidebarContainer.classList.toggle('w-64');
                sidebarContainer.classList.toggle('shadow-2xl');
            });

            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', (e) => {
                if (window.innerWidth < 1024) {
                    if (!sidebarContainer.classList.contains('hidden') && !sidebarContainer.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                        sidebarContainer.classList.add('hidden');
                        sidebarContainer.classList.remove('fixed', 'inset-y-0', 'left-0', 'w-64', 'shadow-2xl');
                    }
                }
            });
        }

        // Dropdown toggle logic
        const profileBtn = container.querySelector('#profile-menu-btn');
        const profileDropdown = container.querySelector('#profile-dropdown');
        if(profileBtn && profileDropdown) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('hidden');
            });

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
                    profileDropdown.classList.add('hidden');
                }
            });
        }

        // Search logic
        const searchInput = container.querySelector('#global-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim().toLowerCase();
                if (window.EventBus) {
                    window.EventBus.emit('global:search', query);
                }
            });
        }

        // Notification dropdown logic
        const notifBtn = container.querySelector('#notif-btn');
        const notifDropdown = container.querySelector('#notif-dropdown');
        if (notifBtn && notifDropdown) {
            notifBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                notifDropdown.classList.toggle('hidden');
                if (!notifDropdown.classList.contains('hidden')) {
                    this.loadNotifications();
                }
            });

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
                    notifDropdown.classList.add('hidden');
                }
            });
        }

        // Logout logic
        const logoutBtn = container.querySelector('#btn-logout');
        if(logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if(window.AuthService) window.AuthService.logout();
                window.location.reload();
            });
        }
    },

    async loadNotifications() {
        const list = document.getElementById('notif-list');
        if (!list) return;

        try {
            const notifications = await ApiAdapter.get('/api/notifications');
            if (!notifications || notifications.length === 0) {
                list.innerHTML = '<div class="px-4 py-8 text-center text-slate-400 text-xs">No tenés notificaciones</div>';
                const badge = document.getElementById('notif-badge');
                if (badge) badge.classList.add('hidden');
                return;
            }

            const limited = notifications.slice(0, 15);

            list.innerHTML = limited.map(n => `
                <button class="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0 ${n.read ? 'opacity-70' : ''}"
                        onclick="TopBar.handleNotificationClick('${n.id}', '${n.link || ''}')">
                    <div class="flex items-start gap-3">
                        <div class="w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-slate-400' : 'bg-blue-500'}"></div>
                        <div class="flex-1 min-w-0">
                            <p class="text-[13px] text-slate-800 dark:text-slate-100 font-semibold leading-snug">${n.title}</p>
                            <p class="text-[12px] text-slate-500 dark:text-slate-300 mt-0.5 line-clamp-2">${n.message}</p>
                            <p class="text-[10px] text-slate-400 mt-1">${this.formatTimestamp(n.createdAt)}</p>
                        </div>
                    </div>
                </button>
            `).join('');

            const hasUnread = notifications.some(n => !n.read);
            const badge = document.getElementById('notif-badge');
            if (badge) badge.classList.toggle('hidden', !hasUnread);
        } catch (err) {
            console.error('Error loading notifications', err);
            list.innerHTML = `<div class="px-4 py-8 text-center text-red-500 text-xs">Error al cargar notificaciones</div>`;
        }
    },

    async handleNotificationClick(id, link) {
        try {
            await ApiAdapter.patch(`/api/notifications/${id}/read`, {});
        } catch (e) {
            console.error('Error marcando notificación como leída', e);
        }

        const dropdown = document.getElementById('notif-dropdown');
        if (dropdown) dropdown.classList.add('hidden');

        if (link) {
            // link esperado: 'project-detail:ID' o similar
            window.location.hash = link;
        }

        // actualizar badge
        try {
            const notifications = await ApiAdapter.get('/api/notifications', true);
            const hasUnread = notifications.some(n => !n.read);
            const badge = document.getElementById('notif-badge');
            if (badge) badge.classList.toggle('hidden', !hasUnread);
        } catch(_) {}
    },

    formatTimestamp(ts) {
        const date = new Date(ts);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Ahora mismo';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Hace ${diffHours} h`;
        
        return date.toLocaleDateString();
    }
};

// Make it globally available so app.js can initialize it
window.TopBar = TopBar;
