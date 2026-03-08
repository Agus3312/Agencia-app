/**
 * AuthService
 * Centralized authentication & authorization.
 * Connected to backend API via ApiAdapter.
 *
 * JWT token stored in localStorage as 'auth_token'.
 * User data cached in localStorage as 'auth_user' for quick access.
 */
const AuthService = {
    STORAGE_KEY: 'auth_user',

    /**
     * Get current logged-in user object (from cache)
     */
    getUser() {
        return StorageAdapter.get(this.STORAGE_KEY, {});
    },

    /**
     * Get user's display name
     */
    getUserName() {
        const user = this.getUser();
        return user.name || user.email || 'Usuario';
    },

    /**
     * Check if user is authenticated (has valid token + cached user)
     */
    isAuthenticated() {
        return !!(ApiAdapter.getToken() && this.getUser().id);
    },

    /**
     * Check if user has admin privileges
     */
    isAdmin() {
        const user = this.getUser();
        return user.role === 'Admin';
    },

    /**
     * Log in via API — sends credentials, stores JWT + user data
     * @param {string} email
     * @param {string} password
     * @returns {Promise<{token, user}>}
     */
    async login(email, password) {
        const data = await ApiAdapter.post('/api/auth/login', { email, password });

        // Store JWT token
        ApiAdapter.setToken(data.token);

        // Cache user data for quick access
        StorageAdapter.set(this.STORAGE_KEY, data.user);

        EventBus.emit('auth:login', data.user);
        return data;
    },

    /**
     * Register via API
     * @returns {Promise<{token, user}>}
     */
    async register(name, email, password, role, team) {
        const data = await ApiAdapter.post('/api/auth/register', {
            name, email, password, role, team
        });

        ApiAdapter.setToken(data.token);
        StorageAdapter.set(this.STORAGE_KEY, data.user);

        EventBus.emit('auth:login', data.user);
        return data;
    },

    /**
     * Refresh user data from API
     */
    async refreshUser() {
        try {
            const user = await ApiAdapter.get('/api/auth/me');
            StorageAdapter.set(this.STORAGE_KEY, user);
            return user;
        } catch (e) {
            return this.getUser();
        }
    },

    /**
     * Log out — clears token + user data and redirects
     */
    logout() {
        ApiAdapter.removeToken();
        StorageAdapter.remove(this.STORAGE_KEY);
        EventBus.emit('auth:logout');
        window.location.href = 'pages/login.html';
    },

    /**
     * Get user avatar URL
     */
    getAvatar() {
        const user = this.getUser();
        return user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=1d3faf&color=fff`;
    }
};

window.AuthService = AuthService;
