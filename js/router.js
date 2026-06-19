/**
 * Router Module
 * Handles client-side routing and page navigation
 */

const Router = {
    routes: {
        dashboard: { path: 'pages/dashboard.html', title: 'Project Dashboard' },
        admin: { path: 'pages/admin.html', title: 'Admin View' },
        teams: { path: 'pages/teams.html', title: 'Team Management' },
        'project-create': { path: 'pages/project-create.html', title: 'Crear Nuevo Proyecto' },
        projects: { path: 'pages/projects.html', title: 'All Projects' },
        'project-detail': { path: 'pages/project-detail.html', title: 'Detalle de Proyecto' },
        reports: { path: 'pages/reports.html', title: 'Reports & Analytics' },
        myspace: { path: 'pages/myspace.html', title: 'Mi Espacio' },
        settings: { path: 'pages/settings.html', title: 'Settings' },
        clients: { path: 'pages/clients.html', title: 'Gestión de Clientes' }
    },

    // [CAMBIO] Problema 1: Configuración centralizada de scripts por página
    pageConfig: {
        'dashboard': {
            services: [{ src: 'js/services/TeamService.js', name: 'TeamService' }, { src: 'js/services/ProjectService.js', name: 'ProjectService' }],
            controller: { src: 'js/pages/dashboard.js', name: 'DashboardPage' }
        },
        'myspace': {
            services: [],
            controller: { src: 'js/pages/myspace.js', name: 'MySpacePage' }
        },
        'teams': {
            services: [{ src: 'js/services/TeamService.js', name: 'TeamService' }],
            controller: { src: 'js/pages/teams.js', name: 'TeamsPage' }
        },
        'reports': {
            services: [{ src: 'js/services/ProjectService.js', name: 'ProjectService' }],
            controller: { src: 'js/pages/reports.js', name: 'ReportsPage' }
        },
        'admin': {
            services: [{ src: 'js/services/TeamService.js', name: 'TeamService' }],
            controller: { src: 'js/pages/admin.js', name: 'AdminPage' }
        },
        'projects': {
            services: [{ src: 'js/services/ProjectService.js', name: 'ProjectService' }],
            controller: { src: 'js/pages/projects.js', name: 'ProjectsPage' }
        },
        'project-create': {
            services: [{ src: 'js/services/ProjectService.js', name: 'ProjectService' }, { src: 'js/services/TeamService.js', name: 'TeamService' }],
            controller: { src: 'js/pages/project-create.js', name: 'ProjectCreatePage', customInit: true }
        },
        'project-detail': {
            services: [{ src: 'js/services/ProjectService.js', name: 'ProjectService' }],
            controller: { src: 'js/pages/project-detail.js', name: 'ProjectDetailPage', customInitParam: true }
        },
        'clients': {
            services: [{ src: 'js/services/ClientService.js', name: 'ClientService' }],
            controller: { src: 'js/pages/clients.js', name: 'ClientsPage' }
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

    checkAuth() {
        if (!AuthService.isAuthenticated()) {
            window.location.href = 'pages/login.html';
        }
    },

    setupLogout() {
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

    // [CAMBIO] Problema 2: forceRefresh parametro por defecto
    async goTo(pageId, param, forceRefresh = false) {
        if (!this.routes[pageId]) {
            console.error(`Route not found: ${pageId}`);
            this.goTo('dashboard');
            return;
        }

        if (pageId === 'admin') {
            if (!AuthService.isAdmin()) {
                Toast.error('Acceso Denegado: Se requieren permisos de administrador.');
                this.goTo('dashboard');
                return;
            }
        }

        if (this.currentPage === pageId && !param && !forceRefresh) {
            return;
        }

        // [CAMBIO] Problema 2: Limpieza de cache al navegar a otra pagina
        if (this.currentPage && this.currentPage !== pageId) {
             this.clearPageCache(this.currentPage);
        }

        try {
            this.currentPageParam = param || null;
            await this.loadPage(pageId, forceRefresh);
            this.currentPage = pageId;
            window.location.hash = param ? `${pageId}:${param}` : pageId;
        } catch (error) {
            console.error('Error navigating to page:', error);
            this.showError('Error loading page');
        }
    },

    // [CAMBIO] Problema 2: Propagation forceRefresh
    async loadPage(pageId, forceRefresh = false) {
        const container = document.getElementById('content');
        if (!container) return;

        container.innerHTML = '<div class="flex items-center justify-center h-full"><span class="text-slate-400">Cargando...</span></div>';

        try {
            const route = this.routes[pageId];
            let content;

            // [CAMBIO] Problema 2: Comportamiento cache vs forceRefresh
            if (this.pageCache[pageId] && !forceRefresh) {
                content = this.pageCache[pageId];
            } else {
                const response = await fetch(route.path);
                if (!response.ok) throw new Error(`Failed to load page: ${response.statusText}`);
                content = await response.text();
                this.pageCache[pageId] = content;
            }

            document.title = `${route.title} - Admin Dashboard`;
            container.innerHTML = `<div class="page-transition">${content}</div>`;
            if(window.Sidebar) Sidebar.setActiveItem(pageId);
            this.initPageScripts(pageId);
            return true;
        } catch (error) {
            console.error('Error loading page:', error);
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full gap-4 text-center">
                    <span class="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">sentiment_dissatisfied</span>
                    <div>
                        <h2 class="text-xl font-bold text-slate-700 dark:text-slate-200">Algo salió mal</h2>
                        <p class="text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">No pudimos cargar la sección solicitada.</p>
                        <p class="text-xs text-slate-400 mt-2 font-mono bg-slate-100 dark:bg-slate-800 p-1 rounded inline-block">${error.message}</p>
                    </div>
                    <button class="px-4 py-2 bg-primary text-white rounded-lg" onclick="window.location.reload()">Recargar Página</button>
                </div>
            `;
            return false;
        }
    },

    handleRouteChange() {
        let raw = window.location.hash.substring(1);
        let pageId = raw;
        let param = null;

        if (raw.includes(':')) {
            const parts = raw.split(':');
            pageId = parts[0];
            param = parts.slice(1).join(':');
        }

        if (!pageId || !this.routes[pageId]) {
            pageId = 'dashboard';
            window.location.hash = pageId;
        }

        this.goTo(pageId, param);
    },

    // [CAMBIO] Problema 1: Rewrite del inicializador de scripts eliminando el switch
    initPageScripts(pageId) {
        console.log(`Page '${pageId}' loaded and initialized`);

        const config = this.pageConfig[pageId];
        if (config) {
            this._loadServicesRecursively(config.services, 0, () => {
                if (config.controller) {
                    if (config.controller.customInitParam) {
                        this.loadControllerWithCallback(config.controller.src, config.controller.name, () => {
                             if (window[config.controller.name] && this.currentPageParam) {
                                  window[config.controller.name].init(this.currentPageParam);
                             }
                        });
                    } else if (config.controller.customInit) {
                         this.loadControllerWithCallback(config.controller.src, config.controller.name, () => {
                             if (window[config.controller.name]) window[config.controller.name].init();
                         });
                    } else {
                        this.loadController(config.controller.src, config.controller.name);
                    }
                }
            });
        }
        window.dispatchEvent(new CustomEvent('pageLoaded', { detail: { pageId } }));
    },
    
    // [CAMBIO] Problema 1: Carga recursiva de array de dependencias
    _loadServicesRecursively(services, index, callback) {
        if (index >= services.length) {
            callback();
            return;
        }
        const srv = services[index];
        this.loadService(srv.src, srv.name, () => {
            this._loadServicesRecursively(services, index + 1, callback);
        });
    },

    loadController(src, globalObjectName = null) {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            if (globalObjectName && window[globalObjectName]?.init) {
                window[globalObjectName].init();
            }
        } else {
            const script = document.createElement('script');
            script.src = src;
            if (globalObjectName) {
                script.onload = () => { if (window[globalObjectName]?.init) window[globalObjectName].init(); };
            }
            document.body.appendChild(script);
        }
    },

    loadService(src, globalName, callback) {
        if (window[globalName]) {
            callback();
        } else {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                const check = setInterval(() => { if (window[globalName]) { clearInterval(check); callback(); } }, 50);
            } else {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => callback();
                document.body.appendChild(script);
            }
        }
    },

    loadControllerWithCallback(src, globalName, callback) {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            if (window[globalName]) callback();
        } else {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => callback();
            document.body.appendChild(script);
        }
    },

    async preloadPage(pageId) {
        if (this.pageCache[pageId] || !this.routes[pageId]) return;
        try {
            const response = await fetch(this.routes[pageId].path);
            if (response.ok) this.pageCache[pageId] = await response.text();
        } catch (error) {
            console.warn(`Failed to preload page ${pageId}:`, error);
        }
    },

    clearPageCache(pageId) {
        if (pageId) delete this.pageCache[pageId];
        else this.pageCache = {};
    },

    getCurrentPage() { return this.currentPage || 'dashboard'; },

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

Helpers.onReady(() => {
    Router.preloadPage('dashboard');
    Router.preloadPage('admin');
    Router.preloadPage('teams');
    Router.preloadPage('project-create');
    Router.init();
});
