/**
 * Sidebar Component
 * Renders the navigation sidebar with dynamic pages
 */

const Sidebar = {
    pages: [
        {
            id: 'dashboard',
            title: 'Dashboard',
            icon: 'dashboard',
            icon_name: 'Project Dashboard'
        },
        {
            id: 'projects',
            title: 'Projects',
            icon: 'assignment',
            icon_name: 'All Projects'
        },
        {
            id: 'teams',
            title: 'Equipos',
            icon: 'groups',
            icon_name: 'Team Management'
        },
        {
            id: 'reports',
            title: 'Reports',
            icon: 'bar_chart',
            icon_name: 'Analytics & Reports'
        },
        {
            id: 'admin',
            title: 'Admin',
            icon: 'settings',
            icon_name: 'Admin Portal'
        },
    ],

    init() {
        this.render();
        this.attachEventListeners();
        // Set active item based on hash
        const pageId = window.location.hash.substring(1) || 'dashboard';
        this.setActiveItem(pageId);
    },

    render() {
        const container = document.getElementById('sidebar-container');
        if (!container) return;

        // Get user via AuthService
        const user = AuthService.getUser();
        const isAdmin = AuthService.isAdmin();

        const sidebar = Helpers.createElement('aside', 'sidebar');

        // Header
        const header = Helpers.createElement('div', 'sidebar-header');
        header.innerHTML = `
            <h1 class="sidebar-brand">Agencia</h1>
        `;
        sidebar.appendChild(header);

        // Section label (ClickUp-style)
        const label = Helpers.createElement('div', 'sidebar-section-label');
        label.textContent = 'MENÚ PRINCIPAL';
        sidebar.appendChild(label);

        // Navigation
        const nav = Helpers.createElement('nav', 'sidebar-nav');

        // Filter pages based on permissions
        const visiblePages = this.pages.filter(page => {
            if (page.id === 'admin') {
                return isAdmin;
            }
            return true;
        });

        visiblePages.forEach(page => {
            const navItem = Helpers.createElement('a', 'sidebar-nav-item');
            navItem.href = `#${page.id}`;
            navItem.dataset.page = page.id;
            navItem.title = page.icon_name;
            navItem.innerHTML = `
                <span class="material-symbols-outlined">${page.icon}</span>
                <span>${page.title}</span>
            `;
            nav.appendChild(navItem);
        });
        sidebar.appendChild(nav);

        // Footer with user info
        const footer = Helpers.createElement('div', 'sidebar-footer');
        footer.innerHTML = `
            <div class="sidebar-user">
                <div class="sidebar-avatar">
                    <img src="${AuthService.getAvatar()}" alt="User Avatar">
                </div>
                <div class="sidebar-user-info">
                    <div class="sidebar-user-name">${AuthService.getUserName()}</div>
                    <div class="sidebar-user-role">${user.role || 'Miembro'}</div>
                </div>
                <button class="icon-button" id="logout-btn" title="Logout" style="color: rgba(148,163,184,0.6); width:1.75rem; height:1.75rem;">
                    <span class="material-symbols-outlined" style="font-size:1.1rem">logout</span>
                </button>
            </div>
        `;
        sidebar.appendChild(footer);

        container.appendChild(sidebar);
    },

    attachEventListeners() {
        const navItems = document.querySelectorAll('.sidebar-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = item.dataset.page;
                Router.goTo(pageId);
                this.setActiveItem(pageId);
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('¿Cerrar sesión?')) {
                    AuthService.logout();
                }
            });
        }
    },

    setActiveItem(pageId = null) {
        // Debounce or wait for DOM update if called too early
        setTimeout(() => {
            const navItems = document.querySelectorAll('.sidebar-nav-item');
            const currentPage = pageId || window.location.hash.substring(1) || 'dashboard';

            navItems.forEach(item => {
                // Use exact match or simple includes for now
                if (item.dataset.page === currentPage) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }, 50);
    }
};

// Initialize when DOM is ready
Helpers.onReady(() => {
    if (document.getElementById('sidebar-container')) {
        // Wait for router/auth to be ready if needed, but usually localStorage is synchronous
        Sidebar.init();
    }
});
