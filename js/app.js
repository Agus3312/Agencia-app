/**
 * Main Application Entry Point
 * Initializes all components and modules
 */

const App = {
    version: '1.0.0',
    debug: true,

    init() {
        this.log('Initializing Application...');

        // Initialize dark mode
        this.initDarkMode();

        // All components are initialized via their own initialization code
        // Sidebar.init() - called from components/sidebar.js
        // Header.init() - called from components/header.js
        // Router.init() - called from router.js

        this.setupGlobalEventListeners();
        this.setupServiceWorker();

        this.log('Application initialized successfully');
    },

    /**
     * Initialize dark mode toggle
     */
    initDarkMode() {
        const htmlElement = document.documentElement;
        const savedTheme = Helpers.getStorageItem('theme', 'dark');

        // Set initial theme
        if (savedTheme === 'dark') {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
        }

        // Listen for theme changes
        window.addEventListener('themeChange', (e) => {
            const theme = e.detail.theme;
            if (theme === 'dark') {
                htmlElement.classList.add('dark');
            } else {
                htmlElement.classList.remove('dark');
            }
            Helpers.setStorageItem('theme', theme);
        });
    },

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search (optional)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Escape key to close modals
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal-overlay');
                if (modal) {
                    modal.remove();
                }
            }
        });

        // Handle page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.log('App hidden');
            } else {
                this.log('App visible');
                // Refresh data if needed
            }
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.showNotification('Conexión restaurada', 'success');
        });

        window.addEventListener('offline', () => {
            this.showNotification('Sin conexión a internet', 'error');
        });

        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.log('Window resized');
                // Handle responsive behavior
            }, 250);
        });
    },

    /**
     * Setup service worker for PWA support
     */
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            // Optional: Register service worker for offline support
            // navigator.serviceWorker.register('sw.js')
            //     .then(reg => this.log('Service Worker registered'))
            //     .catch(err => this.log('Service Worker registration failed:', err));
        }
    },

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = Helpers.createElement('div',
            `fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${type === 'success' ? 'bg-green-500' :
                type === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
            }`);
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    /**
     * Logging helper
     */
    log(...args) {
        if (this.debug) {
            console.log('[App]', ...args);
        }
    }
};

// Initialize app when DOM is ready
Helpers.onReady(() => {
    App.init();
});

// Handle any global errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Suppress generic alert for now to avoid bad UX on minor errors
    // App.showNotification('Ocurrió un error. Por favor intente de nuevo.', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Suppress generic alert for now
    // App.showNotification('Ocurrió un error. Por favor intente de nuevo.', 'error');
});
