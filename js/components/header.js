/**
 * Header Component
 * Renders the top navigation header with search and actions
 */

const Header = {
    init() {
        this.render();
        this.attachEventListeners();
        this.setupSocket();
    },

    setupSocket() {
        if (window.socket) {
            const user = AuthService.getUser();
            if (user && user.id) {
                window.socket.on(`notification:${user.id}`, (data) => {
                    this.refreshNotifications();
                    Toast.info(data.title || 'Nueva notificación');
                });
            }
        }
    },

    render() {
        const container = document.getElementById('header-container');
        if (!container) return;

        // Apply saved theme on mount
        const savedTheme = StorageAdapter.get('theme_preference');
        if (savedTheme === 'light') {
            document.documentElement.classList.remove('dark');
        } else {
            document.documentElement.classList.add('dark');
        }

        const isDark = document.documentElement.classList.contains('dark');

        const header = Helpers.createElement('header', 'header');
        header.innerHTML = `
            <button class="icon-button lg:hidden mr-2" id="mobile-menu-btn" title="Menú">
                <span class="material-symbols-outlined">menu</span>
            </button>
            <div class="search-box">
                <span class="search-icon material-symbols-outlined">search</span>
                <input 
                    type="text" 
                    class="search-input" 
                    id="search-input"
                    placeholder="Buscar proyectos, tareas o miembros..."
                    aria-label="Search"
                />
            </div>
            <div class="header-actions">
                <button class="icon-button" id="theme-toggle-btn" title="Cambiar tema">
                    <span class="material-symbols-outlined" id="theme-icon">${isDark ? 'light_mode' : 'dark_mode'}</span>
                </button>
                <button class="icon-button" id="notifications-btn" title="Notificaciones">
                    <span class="material-symbols-outlined">notifications</span>
                    <span class="notification-badge"></span>
                </button>
                <div style="width: 1px; height: 1.5rem; background: #e2e8f0; dark:background: var(--border-dark); margin: 0 0.5rem;"></div>
            </div>
        `;

        container.appendChild(header);

        // Check permissions via AuthService
    },

    attachEventListeners() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', Helpers.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
        }

        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', this.handleThemeToggle.bind(this));
        }

        const notificationsBtn = document.getElementById('notifications-btn');
        if (notificationsBtn) {
            notificationsBtn.addEventListener('click', this.handleNotifications.bind(this));
        }

        // Mobile Menu Toggle
        const mobileMenuBtn = container.querySelector('#mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Avoid triggering document click
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) sidebar.classList.toggle('open');
            });
        }
    },

    handleThemeToggle() {
        const html = document.documentElement;
        const isDark = html.classList.contains('dark');
        if (isDark) {
            html.classList.remove('dark');
            StorageAdapter.set('theme_preference', 'light');
        } else {
            html.classList.add('dark');
            StorageAdapter.set('theme_preference', 'dark');
        }
        // Update icon
        const icon = document.getElementById('theme-icon');
        if (icon) icon.textContent = html.classList.contains('dark') ? 'light_mode' : 'dark_mode';
    },

    handleSearch(query) {
        if (query.trim().length === 0) {
            console.log('Search query cleared');
            return;
        }

        console.log('Searching for:', query);
        Toast.info('Búsqueda en desarrollo');
    },

    async handleNotifications() {
        const btn = document.getElementById('notifications-btn');
        if (!btn) return;

        // Toggle dropdown if exists
        let dropdown = document.getElementById('notifications-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
            return;
        }

        // Create dropdown
        dropdown = document.createElement('div');
        dropdown.id = 'notifications-dropdown';
        dropdown.className = 'absolute right-0 top-14 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 animate-scale-in overflow-hidden';
        
        btn.parentElement.style.position = 'relative';
        btn.parentElement.appendChild(dropdown);

        await this.refreshNotifications();

        // Close on click outside
        const closeDropdown = (e) => {
            if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
                dropdown.classList.add('hidden');
                document.removeEventListener('click', closeDropdown);
            }
        };
        setTimeout(() => document.addEventListener('click', closeDropdown), 10);
    },

    async refreshNotifications() {
        const dropdown = document.getElementById('notifications-dropdown');
        if (!dropdown) return;

        dropdown.innerHTML = `
            <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <span class="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Notificaciones</span>
                <button onclick="Header.markAllRead()" class="text-[10px] font-bold text-primary hover:underline">Marcar todo como leído</button>
            </div>
            <div id="notifications-list" class="max-h-[400px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
                <div class="p-8 text-center text-slate-400">
                    <div class="inline-block animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mb-2"></div>
                    <p class="text-[10px] font-bold uppercase tracking-widest">Cargando...</p>
                </div>
            </div>
        `;

        try {
            const notifications = await ProjectService.fetchNotifications();
            const list = document.getElementById('notifications-list');
            
            if (notifications.length === 0) {
                list.innerHTML = `
                    <div class="p-10 text-center text-slate-400">
                        <span class="material-symbols-outlined text-3xl mb-2 opacity-20">notifications_off</span>
                        <p class="text-xs font-medium">No tienes notificaciones</p>
                    </div>
                `;
                return;
            }

            // Update badge in header
            const badge = document.querySelector('.notification-badge');
            const unreadCount = notifications.filter(n => !n.read).length;
            if (badge) {
                badge.textContent = unreadCount > 0 ? unreadCount : '';
                badge.style.display = unreadCount > 0 ? 'flex' : 'none';
            }

            list.innerHTML = notifications.map(n => `
                <div class="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group ${!n.read ? 'bg-primary/5 border-l-2 border-primary' : ''}"
                     onclick="Header.handleNotificationClick('${n.id}', '${n.link}')">
                    <p class="text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-0.5">${n.title}</p>
                    <p class="text-[12px] text-slate-500 dark:text-slate-400 leading-tight mb-1 truncate">${n.message}</p>
                    <p class="text-[9px] text-slate-400">${new Date(n.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            `).join('');

        } catch (e) {
            console.error('Error fetching notifications:', e);
            document.getElementById('notifications-list').innerHTML = `
                <div class="p-6 text-center text-red-400">
                    <p class="text-xs">Error al cargar</p>
                </div>
            `;
        }
    },

    async markAllRead() {
        try {
            await ApiAdapter.post('/api/notifications/read-all');
            await this.refreshNotifications();
            Toast.success('Notificaciones marcadas como leídas');
        } catch (e) {
            Toast.error('No se pudo marcar como leídas');
        }
    },

    async handleNotificationClick(id, link) {
        try {
            await ProjectService.markNotificationRead(id);
            if (link) {
                window.location.hash = link;
            }
            document.getElementById('notifications-dropdown')?.classList.add('hidden');
            await this.refreshNotifications();
        } catch (e) {
            console.error('Error handling notification click:', e);
        }
    }
};

// Initialize when DOM is ready
Helpers.onReady(() => {
    if (document.getElementById('header-container')) {
        Header.init();
    }
});
