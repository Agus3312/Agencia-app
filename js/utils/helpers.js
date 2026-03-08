/**
 * Helper Functions
 * Utility functions used across the application
 */

const Helpers = {
    /**
     * Format date to readable format
     */
    formatDate(date) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(date).toLocaleDateString('es-ES', options);
    },

    /**
     * Capitalize first letter
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    /**
     * Truncate text
     */
    truncate(str, length = 50) {
        return str.length > length ? str.substring(0, length) + '...' : str;
    },

    /**
     * Get initials from name
     */
    getInitials(name) {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    },

    /**
     * Generate random color
     */
    getRandomColor() {
        const colors = [
            '#6366f1', '#8b5cf6', '#d946ef', '#ec4899',
            '#f43f5e', '#f97316', '#fa8c16', '#facc15',
            '#eab308', '#84cc16', '#65a30d', '#22c55e',
            '#16a34a', '#059669', '#10b981', '#06b6d4',
            '#0891b2', '#0284c7', '#2563eb', '#1d4ed8'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Check if element is in viewport
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * Add class with animation
     */
    addClassWithAnimation(element, className, duration = 300) {
        element.classList.add(className);
        setTimeout(() => {
            element.classList.remove(className);
        }, duration);
    },

    /**
     * Create element with classes
     */
    createElement(tag, classes = '', html = '') {
        const element = document.createElement(tag);
        if (classes) {
            element.className = classes;
        }
        if (html) {
            element.innerHTML = html;
        }
        return element;
    },

    /**
     * Get localStorage with error handling
     */
    getStorageItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return defaultValue;
        }
    },

    /**
     * Set localStorage with error handling
     */
    setStorageItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error writing to localStorage:', e);
            return false;
        }
    },

    /**
     * Get URL parameters
     */
    getQueryParam(param) {
        const params = new URLSearchParams(window.location.search);
        return params.get(param);
    },

    /**
     * Format number to locale string
     */
    formatNumber(number) {
        return new Intl.NumberFormat('es-ES').format(number);
    },

    /**
     * Calculate percentage with precision
     */
    calculatePercentage(value, total, decimals = 2) {
        return ((value / total) * 100).toFixed(decimals);
    },

    /**
     * Fade in animation
     */
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const start = Date.now();
        const animate = () => {
            const progress = (Date.now() - start) / duration;
            element.style.opacity = Math.min(progress, 1);
            if (progress < 1) requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    },

    /**
     * Execute function after DOM is ready
     */
    onReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Helpers;
}
