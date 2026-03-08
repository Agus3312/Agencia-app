/**
 * Router Module
 * Handles client-side routing and page navigation
 */

const Router = {
    routes: {
        dashboard: {
            path: 'pages/dashboard.html',
            title: 'Project Dashboard'
        },
        admin: {
            path: 'pages/admin.html',
            title: 'Admin View'
        },
        teams: {
            path: 'pages/teams.html',
            title: 'Team Management'
        },
        'project-create': {
            path: 'pages/project-create.html',
            title: 'Crear Nuevo Proyecto'
        },
        projects: {
            path: 'pages/projects.html',
            title: 'All Projects'
        },
        'project-detail': {
            path: 'pages/project-detail.html',
            title: 'Detalle de Proyecto'
        },
        reports: {
            path: 'pages/reports.html',
            title: 'Reports & Analytics'
        },
        settings: {
            path: 'pages/settings.html',
            title: 'Settings'
        }
    },

    currentPage: null,
    currentPageParam: null,
    pageCache: {},

    init() {
        this.checkAuth();
        window.addEventListener('hashchange', () => this.handleRouteChange());
        this.handleRouteChange();
        this.setupLogout();
    },

    /**
     * Check if user is authenticated
     */
    checkAuth() {
        if (!AuthService.isAuthenticated()) {
            window.location.href = 'pages/login.html';
        }
    },

    /**
     * Setup logout functionality
     */
    setupLogout() {
        // Logout is handled by Sidebar → AuthService.logout()
        // This method kept for backward compatibility
        const icons = document.querySelectorAll('.material-symbols-outlined');
        icons.forEach(icon => {
            if (icon.textContent === 'logout') {
                const btn = icon.parentElement;
                if (btn && !btn._logoutBound) {
                    btn._logoutBound = true;
                    btn.addEventListener('click', () => AuthService.logout());
                }
            }
        });
    },

    /**
     * Navigate to a specific page
     */
    async goTo(pageId, param) {
        if (!this.routes[pageId]) {
            console.error(`Route not found: ${pageId}`);
            this.goTo('dashboard');
            return;
        }

        // Check Admin Permissions
        if (pageId === 'admin') {
            if (!AuthService.isAdmin()) {
                Toast.error('Acceso Denegado: Se requieren permisos de administrador.');
                this.goTo('dashboard');
                return;
            }
        }

        // For pages with params (like project-detail:ID) always reload
        if (this.currentPage === pageId && !param) {
            return; // Already on this page
        }

        try {
            this.currentPageParam = param || null;
            await this.loadPage(pageId);
            this.currentPage = pageId;
            window.location.hash = param ? `${pageId}:${param}` : pageId;
        } catch (error) {
            console.error('Error navigating to page:', error);
            this.showError('Error loading page');
        }
    },

    /**
     * Load page content
     */
    async loadPage(pageId) {
        const container = document.getElementById('pages-container');
        if (!container) return;

        // Show loading state
        container.innerHTML = '<div class="flex items-center justify-center h-full"><span class="text-slate-400">Cargando...</span></div>';

        try {
            const route = this.routes[pageId];
            let content;

            // Check cache first
            if (this.pageCache[pageId]) {
                content = this.pageCache[pageId];
            } else {
                const response = await fetch(route.path);
                if (!response.ok) {
                    throw new Error(`Failed to load page: ${response.statusText}`);
                }
                content = await response.text();
                this.pageCache[pageId] = content;
            }

            // Update title
            document.title = `${route.title} - Admin Dashboard`;

            // Set page content with animation
            container.innerHTML = `<div class="page-transition">${content}</div>`;

            // Update sidebar active state
            Sidebar.setActiveItem(pageId);

            // Re-initialize page-specific functionality
            this.initPageScripts(pageId);

            return true;
        } catch (error) {
            console.error('Error loading page:', error);
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full gap-4 text-center">
                    <span class="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">sentiment_dissatisfied</span>
                    <div>
                        <h2 class="text-xl font-bold text-slate-700 dark:text-slate-200">Algo salió mal</h2>
                        <p class="text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">No pudimos cargar la sección solicitada. Por favor, intenta de nuevo.</p>
                        <p class="text-xs text-slate-400 mt-2 font-mono bg-slate-100 dark:bg-slate-800 p-1 rounded inline-block">${error.message}</p>
                    </div>
                    <button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20" onclick="window.location.reload()">
                        Recargar Página
                    </button>
                </div>
            `;
            return false;
        }
    },

    /**
     * Handle route changes from hash
     */
    handleRouteChange() {
        let raw = window.location.hash.substring(1);
        let pageId = raw;
        let param = null;

        // Support hash like project-detail:p1
        if (raw.includes(':')) {
            const parts = raw.split(':');
            pageId = parts[0];
            param = parts.slice(1).join(':');
        }

        // Default to dashboard if no page specified
        if (!pageId || !this.routes[pageId]) {
            pageId = 'dashboard';
            window.location.hash = pageId;
        }

        this.goTo(pageId, param);
    },

    /**
     * Initialize page-specific scripts
     */
    initPageScripts(pageId) {
        // This method can be extended to run page-specific initialization
        // For example, initialize charts, tables, event listeners, etc.
        console.log(`Page '${pageId}' loaded and initialized`);

        if (pageId === 'teams') {
            // Load TeamService if not already loaded
            if (!window.TeamService) {
                const scriptService = document.createElement('script');
                scriptService.src = 'js/services/TeamService.js';
                document.body.appendChild(scriptService);

                scriptService.onload = () => {
                    // Load controller after service is ready
                    this.loadController('js/pages/teams.js', 'TeamsPage');
                };
            } else {
                this.loadController('js/pages/teams.js', 'TeamsPage');
            }
        }

        if (pageId === 'dashboard') {
            // Dashboard needs both TeamService and ProjectService
            const loadDashboard = () => {
                this.loadService('js/services/ProjectService.js', 'ProjectService', () => {
                    this.loadController('js/pages/dashboard.js', 'DashboardPage');
                });
            };

            if (!window.TeamService) {
                const scriptService = document.createElement('script');
                scriptService.src = 'js/services/TeamService.js';
                document.body.appendChild(scriptService);
                scriptService.onload = loadDashboard;
            } else {
                loadDashboard();
            }
        }

        if (pageId === 'admin') {
            if (!window.TeamService) {
                const scriptService = document.createElement('script');
                scriptService.src = 'js/services/TeamService.js';
                document.body.appendChild(scriptService);
                scriptService.onload = () => {
                    this.loadController('js/pages/admin.js', 'AdminPage');
                };
            } else {
                this.loadController('js/pages/admin.js', 'AdminPage');
            }
        }

        if (pageId === 'projects') {
            this.loadService('js/services/ProjectService.js', 'ProjectService', () => {
                this.loadController('js/pages/projects.js', 'ProjectsPage');
            });
        }

        if (pageId === 'project-detail') {
            this.loadService('js/services/ProjectService.js', 'ProjectService', () => {
                this.loadControllerWithCallback('js/pages/project-detail.js', 'ProjectDetailPage', () => {
                    if (window.ProjectDetailPage && this.currentPageParam) {
                        ProjectDetailPage.init(this.currentPageParam);
                    }
                });
            });
        }

        // Dispatch custom event for pages to listen to
        window.dispatchEvent(new CustomEvent('pageLoaded', {
            detail: { pageId }
        }));
    },

    loadController(src, globalObjectName = null) {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            if (globalObjectName && window[globalObjectName] && window[globalObjectName].init) {
                console.log(`Re-initializing ${globalObjectName}`);
                window[globalObjectName].init();
            }
        } else {
            const script = document.createElement('script');
            script.src = src;
            if (globalObjectName) {
                script.onload = () => {
                    if (window[globalObjectName] && window[globalObjectName].init) {
                        window[globalObjectName].init();
                    }
                };
            }
            document.body.appendChild(script);
        }
    },

    /**
     * Load a service script if not already loaded, then call callback
     */
    loadService(src, globalName, callback) {
        if (window[globalName]) {
            callback();
        } else {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                // Script tag exists but global might not be ready yet
                const check = setInterval(() => {
                    if (window[globalName]) { clearInterval(check); callback(); }
                }, 50);
            } else {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => callback();
                document.body.appendChild(script);
            }
        }
    },

    /**
     * Load a controller script with a custom callback instead of auto-init
     */
    loadControllerWithCallback(src, globalName, callback) {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            if (window[globalName]) {
                callback();
            }
        } else {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => callback();
            document.body.appendChild(script);
        }
    },

    /**
     * Preload a page
     */
    async preloadPage(pageId) {
        if (this.pageCache[pageId] || !this.routes[pageId]) {
            return;
        }

        try {
            const response = await fetch(this.routes[pageId].path);
            if (response.ok) {
                const content = await response.text();
                this.pageCache[pageId] = content;
            }
        } catch (error) {
            console.warn(`Failed to preload page ${pageId}:`, error);
        }
    },

    /**
     * Clear specific page cache
     */
    clearPageCache(pageId) {
        if (pageId) {
            delete this.pageCache[pageId];
        } else {
            this.pageCache = {}; // Clear all
        }
    },

    /**
     * Get current page ID
     */
    getCurrentPage() {
        return this.currentPage || 'dashboard';
    },

    /**
     * Show error message
     */
    showError(message) {
        const container = document.getElementById('pages-container');
        if (container) {
            container.innerHTML = `
                <div class="flex items-center gap-4 p-4 m-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
                    <span class="material-symbols-outlined text-red-500">error</span>
                    <p class="text-red-700 dark:text-red-400">${message}</p>
                </div>
            `;
        }
    }
};

// Initialize router when DOM is ready
Helpers.onReady(() => {
    // Preload common pages for faster navigation
    Router.preloadPage('dashboard');
    Router.preloadPage('admin');
    Router.preloadPage('teams');
    Router.preloadPage('project-create');

    // Start router
    Router.init();
});
