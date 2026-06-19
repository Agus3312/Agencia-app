const AuthService = {
    STORAGE_KEY: 'auth_user',

    getUser() { return StorageAdapter.get(this.STORAGE_KEY, {}); },
    getUserName() { const u = this.getUser(); return u.name || u.email || 'Usuario'; },

    // [CAMBIO] Problema 3: Para saber si está logueado ya no verificamos getToken, ahora miramos si hay user data.
    isAuthenticated() { return !!(this.getUser().id); },
    isAdmin() { const r = this.getUser().role; return r && r.toLowerCase() === 'admin'; },

    async login(email, password) {
        const data = await ApiAdapter.post('/api/auth/login', { email, password });
        // [CAMBIO] Problema 3: No setear token en LocalStorage
        StorageAdapter.set(this.STORAGE_KEY, data.user);
        EventBus.emit('auth:login', data.user);
        return data;
    },

    async register(name, email, password, role, team) {
        const data = await ApiAdapter.post('/api/auth/register', { name, email, password, role, team });
        // [CAMBIO] Problema 3: No setear token en LocalStorage
        StorageAdapter.set(this.STORAGE_KEY, data.user);
        EventBus.emit('auth:login', data.user);
        return data;
    },

    async refreshUser() {
        try {
            const user = await ApiAdapter.get('/api/auth/me');
            StorageAdapter.set(this.STORAGE_KEY, user);
            return user;
        } catch (e) {
            return this.getUser();
        }
    },

    // [CAMBIO] Problema 3: Llamar al endpoint /logout para que limpie la cookie del backend
    async logout() {
        try {
            await ApiAdapter.post('/api/auth/logout', {});
        } catch (e) {
            console.error('Logout error:', e);
        }
        StorageAdapter.remove(this.STORAGE_KEY);
        EventBus.emit('auth:logout');
        window.location.href = 'pages/login.html';
    },

    getAvatar() {
        const user = this.getUser();
        return user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=1d3faf&color=fff`;
    }
};

window.AuthService = AuthService;
