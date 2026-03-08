/**
 * Header Component
 * Renders the top navigation header with search and actions
 */

const Header = {
    init() {
        this.render();
        this.attachEventListeners();
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
                <button class="primary-button" id="create-btn">
                    <span class="material-symbols-outlined">add</span>
                    <span>Crear Nuevo</span>
                </button>
            </div>
        `;

        container.appendChild(header);

        // Check permissions via AuthService
        if (!AuthService.isAdmin()) {
            const createBtn = header.querySelector('#create-btn');
            if (createBtn) createBtn.style.display = 'none';
        }
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

        const createBtn = document.getElementById('create-btn');
        if (createBtn) {
            createBtn.addEventListener('click', this.handleCreate.bind(this));
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
        // Implement search functionality here
        // This could filter data or navigate to a search results page
    },

    handleNotifications() {
        Toast.info('No hay notificaciones nuevas');
    },

    handleCreate() {
        const currentPage = window.location.hash.substring(1) || 'dashboard';

        // Navigate based on current page
        if (currentPage === 'projects' || currentPage === 'dashboard' || currentPage === 'admin') {
            Router.goTo('project-create');
        } else {
            Toast.info(`Crear nuevo elemento en: ${currentPage}`);
        }
        // Implement create modal here based on current page
    }
};

// Initialize when DOM is ready
Helpers.onReady(() => {
    if (document.getElementById('header-container')) {
        Header.init();
    }
});
