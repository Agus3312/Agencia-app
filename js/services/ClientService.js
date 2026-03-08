/**
 * ClientService
 * Handles data operations for agency clients.
 */
const ClientService = {
    _cache: null,

    async fetchAll() {
        try {
            this._cache = await ApiAdapter.get('/api/clients');
            return this._cache;
        } catch (err) {
            console.error('ClientService.fetchAll error:', err);
            return this._cache || [];
        }
    },

    getAll() {
        return this._cache || [];
    },

    async add(clientData) {
        const newClient = await ApiAdapter.post('/api/clients', clientData);
        await this.fetchAll();
        return newClient;
    },

    async update(id, updates) {
        const updated = await ApiAdapter.put(`/api/clients/${id}`, updates);
        await this.fetchAll();
        return updated;
    },

    async delete(id) {
        await ApiAdapter.delete(`/api/clients/${id}`);
        this._cache = (this._cache || []).filter(c => c.id !== id);
    }
};

window.ClientService = ClientService;
