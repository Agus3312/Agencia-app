/**
 * StorageAdapter
 * Abstraction layer over localStorage.
 * 
 * ┌─────────────────────────────────────────────────────┐
 * │ NOTA BACKEND: Cuando migremos a un backend real,    │
 * │ solo hay que reemplazar este archivo por un          │
 * │ ApiAdapter que haga fetch() a los endpoints.        │
 * │ Los servicios (ProjectService, TeamService, etc.)    │
 * │ NO se tocan.                                        │
 * │                                                     │
 * │ Recomendado: Node.js + Express + PostgreSQL + Prisma│
 * │ Alternativa rápida: Supabase (auth + DB + storage)  │
 * └─────────────────────────────────────────────────────┘
 */
const StorageAdapter = {
    /**
     * Get data by key. Returns parsed JSON or defaultValue.
     * Future: GET /api/{key}
     */
    get(key, defaultValue = null) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) return defaultValue;
            return JSON.parse(raw);
        } catch (e) {
            console.error(`[StorageAdapter] Error reading "${key}":`, e);
            return defaultValue;
        }
    },

    /**
     * Save data by key. Accepts any serializable value.
     * Future: PUT /api/{key}
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            EventBus.emit('storage:changed', { key });
            return true;
        } catch (e) {
            console.error(`[StorageAdapter] Error writing "${key}":`, e);
            return false;
        }
    },

    /**
     * Remove data by key.
     * Future: DELETE /api/{key}
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            EventBus.emit('storage:changed', { key });
            return true;
        } catch (e) {
            console.error(`[StorageAdapter] Error removing "${key}":`, e);
            return false;
        }
    },

    /**
     * Check if key exists.
     */
    has(key) {
        return localStorage.getItem(key) !== null;
    },

    /**
     * Clear all application data (dangerous! not used in normal flow)
     */
    clear() {
        localStorage.clear();
    }
};

window.StorageAdapter = StorageAdapter;
