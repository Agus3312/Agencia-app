/**
 * Toast Notifications
 * Replaces alert() with elegant, non-blocking toasts.
 * 
 * Usage:
 *   Toast.success('Proyecto guardado');
 *   Toast.error('No se pudo eliminar');
 *   Toast.info('Cargando datos...');
 */
const Toast = {
    _container: null,
    _styleInjected: false,

    _ensureContainer() {
        if (this._container) return;
        this._container = document.createElement('div');
        this._container.id = 'toast-container';
        this._container.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;pointer-events:none;';
        document.body.appendChild(this._container);
    },

    _injectStyles() {
        if (this._styleInjected) return;
        this._styleInjected = true;
        const style = document.createElement('style');
        style.textContent = `
            .toast-item {
                display: flex;
                align-items: center;
                gap: 0.625rem;
                padding: 0.75rem 1.125rem;
                border-radius: 0.625rem;
                font-size: 0.8125rem;
                font-weight: 500;
                font-family: 'Inter', sans-serif;
                color: white;
                pointer-events: auto;
                box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                animation: toastIn 0.3s ease-out;
                max-width: 22rem;
                backdrop-filter: blur(8px);
                cursor: pointer;
            }
            .toast-item.removing {
                animation: toastOut 0.25s ease-in forwards;
            }
            .toast-success { background: rgba(16, 185, 129, 0.95); }
            .toast-error   { background: rgba(239, 68, 68, 0.95); }
            .toast-info    { background: rgba(29, 63, 175, 0.95); }
            .toast-warning { background: rgba(245, 158, 11, 0.95); }
            .toast-item .material-symbols-outlined { font-size: 1.2rem; }
            @keyframes toastIn {
                from { opacity: 0; transform: translateX(1rem) scale(0.95); }
                to   { opacity: 1; transform: translateX(0) scale(1); }
            }
            @keyframes toastOut {
                from { opacity: 1; transform: translateX(0) scale(1); }
                to   { opacity: 0; transform: translateX(1rem) scale(0.95); }
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * Show a toast notification
     * @param {string} message - Text to display
     * @param {'success'|'error'|'info'|'warning'} type - Toast type
     * @param {number} duration - ms before auto-dismiss (0 = manual)
     */
    show(message, type = 'info', duration = 3000) {
        this._ensureContainer();
        this._injectStyles();

        const icons = {
            success: 'check_circle',
            error: 'error',
            info: 'info',
            warning: 'warning'
        };

        const toast = document.createElement('div');
        toast.className = `toast-item toast-${type}`;
        toast.innerHTML = `
            <span class="material-symbols-outlined">${icons[type] || 'info'}</span>
            <span>${message}</span>
        `;

        // Click to dismiss
        toast.addEventListener('click', () => this._dismiss(toast));

        this._container.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => this._dismiss(toast), duration);
        }

        return toast;
    },

    _dismiss(toast) {
        if (!toast || toast.classList.contains('removing')) return;
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 250);
    },

    // Shorthand methods
    success(msg, duration) { return this.show(msg, 'success', duration); },
    error(msg, duration)   { return this.show(msg, 'error', duration); },
    info(msg, duration)    { return this.show(msg, 'info', duration); },
    warning(msg, duration) { return this.show(msg, 'warning', duration); }
};

window.Toast = Toast;
