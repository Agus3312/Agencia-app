const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);
const FALLBACK_REMOTE_URL = 'https://agencia-app-production.up.railway.app';

function resolveBaseUrl() {
    const configuredBaseUrl =
        window.__API_BASE_URL__ ||
        document.querySelector('meta[name="api-base-url"]')?.content;

    if (configuredBaseUrl) {
        return configuredBaseUrl.replace(/\/$/, '');
    }

    if (window.location.protocol === 'file:') {
        return 'http://localhost:3001';
    }

    if (LOCAL_HOSTS.has(window.location.hostname)) {
        return `http://${window.location.hostname}:3001`;
    }

    if (window.location.origin && window.location.origin !== 'null') {
        return window.location.origin.replace(/\/$/, '');
    }

    return FALLBACK_REMOTE_URL;
}

function clearStoredAuthUser() {
    if (window.StorageAdapter?.remove) {
        window.StorageAdapter.remove('auth_user');
        return;
    }

    try {
        window.localStorage.removeItem('auth_user');
    } catch (error) {
        console.warn('Unable to clear auth_user from localStorage', error);
    }
}

function getLoginPath() {
    return window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
}

const ApiAdapter = {
    BASE_URL: resolveBaseUrl(),

    // [CAMBIO] Problema 3: Ya no se usa localStorage para el token JWT
    _cache: {},

    clearCache() { this._cache = {}; },

    _headers() {
        // [CAMBIO] Problema 3: Removido el setting del header Authorization. Ahora viaja via Cookie HttpOnly.
        return { 'Content-Type': 'application/json' };
    },

    // [CAMBIO] Problema 4: Wrapper interno para manejar excepciones puras de red en fetch
    async _fetchWithHandling(url, options) {
        // [CAMBIO] Problema 3: credentials 'include' para enviar cookies automatically
        options.credentials = 'include';
        try {
            return await fetch(url, options);
        } catch (error) {
            console.error('Fetch network error:', error);
            const msg = this.BASE_URL.includes('localhost:3001')
                ? 'No se pudo conectar al backend local en http://localhost:3001. Inicia el servidor e intenta de nuevo.'
                : 'No se pudo conectar al servidor. Verifica tu conexion e intenta de nuevo.';
            if (window.Toast && Toast.error) {
                Toast.error(msg);
            } else {
                console.error(msg);
            }
            throw new Error('Network error');
        }
    },

    async _handleResponse(res, path) {
        const isLoginRequest = path === '/api/auth/login';

        if (res.status === 401 && !isLoginRequest) {
            clearStoredAuthUser();
            window.location.href = getLoginPath();
            throw new Error('Sesion expirada');
        }

        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await res.json() : {};

        if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
        return data;
    },

    // [CAMBIO] Problema 2: forceRefresh argument passthru y Problema 4: Usar _fetchWithHandling
    async get(path, forceRefresh = false) {
        if (!forceRefresh && this._cache[path]) return this._cache[path];
        const res = await this._fetchWithHandling(this.BASE_URL + path, { method: 'GET', headers: this._headers() });
        const data = await this._handleResponse(res, path);
        this._cache[path] = data;
        return data;
    },

    async post(path, body) {
        const res = await this._fetchWithHandling(this.BASE_URL + path, { method: 'POST', headers: this._headers(), body: JSON.stringify(body) });
        this.clearCache();
        return this._handleResponse(res, path);
    },

    async put(path, body) {
        const res = await this._fetchWithHandling(this.BASE_URL + path, { method: 'PUT', headers: this._headers(), body: JSON.stringify(body) });
        this.clearCache();
        return this._handleResponse(res, path);
    },

    async patch(path, body) {
        const res = await this._fetchWithHandling(this.BASE_URL + path, { method: 'PATCH', headers: this._headers(), body: JSON.stringify(body) });
        this.clearCache();
        return this._handleResponse(res, path);
    },

    async delete(path) {
        const res = await this._fetchWithHandling(this.BASE_URL + path, { method: 'DELETE', headers: this._headers() });
        this.clearCache();
        return this._handleResponse(res, path);
    }
};

window.ApiAdapter = ApiAdapter;
