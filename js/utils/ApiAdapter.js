/**
 * ApiAdapter
 * HTTP client for the backend API.
 * Centralizes all fetch calls and handles JWT token injection.
 *
 * Usage:
 *   const projects = await ApiAdapter.get('/api/projects');
 *   const data = await ApiAdapter.post('/api/auth/login', { email, password });
 */
const ApiAdapter = {
    // Base URL — points to deployed backend on Railway
    BASE_URL: 'https://agencia-app-production.up.railway.app',
    TOKEN_KEY: 'auth_token',
    _cache: {},

    clearCache() {
        this._cache = {};
    },

    /**
     * Get stored JWT token
     */
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    /**
     * Store JWT token
     */
    setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    },

    /**
     * Remove JWT token
     */
    removeToken() {
        localStorage.removeItem(this.TOKEN_KEY);
    },

    /**
     * Build fetch headers with auth token
     */
    _headers() {
        const h = { 'Content-Type': 'application/json' };
        const token = this.getToken();
        if (token) h['Authorization'] = `Bearer ${token}`;
        return h;
    },

    /**
     * Handle response: parse JSON, handle errors
     */
    async _handleResponse(res) {
        if (res.status === 401) {
            // Token expired or invalid — logout
            this.removeToken();
            StorageAdapter.remove('auth_user');
            window.location.href = 'pages/login.html';
            throw new Error('Sesión expirada');
        }

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || `Error ${res.status}`);
        }

        return data;
    },

    /**
     * GET request
     */
    async get(path, forceRefresh = false) {
        if (!forceRefresh && this._cache[path]) {
            return this._cache[path];
        }

        const res = await fetch(this.BASE_URL + path, {
            method: 'GET',
            headers: this._headers()
        });
        
        const data = await this._handleResponse(res);
        this._cache[path] = data; // Guardar en caché
        return data;
    },

    /**
     * POST request
     */
    async post(path, body) {
        const res = await fetch(this.BASE_URL + path, {
            method: 'POST',
            headers: this._headers(),
            body: JSON.stringify(body)
        });
        this.clearCache(); // Invalidar caché en mutaciones
        return this._handleResponse(res);
    },

    /**
     * PATCH request
     */
    async patch(path, body) {
        const res = await fetch(this.BASE_URL + path, {
            method: 'PATCH',
            headers: this._headers(),
            body: JSON.stringify(body)
        });
        this.clearCache(); // Invalidar caché
        return this._handleResponse(res);
    },

    /**
     * DELETE request
     */
    async delete(path) {
        const res = await fetch(this.BASE_URL + path, {
            method: 'DELETE',
            headers: this._headers()
        });
        this.clearCache(); // Invalidar caché
        return this._handleResponse(res);
    }
};

window.ApiAdapter = ApiAdapter;
