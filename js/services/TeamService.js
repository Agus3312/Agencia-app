/**
 * TeamService
 * Handles data operations for team members via backend API.
 * All write methods are async.
 */
const TeamService = {
    _cache: null,

    /**
     * Fetch all team members from API
     * @returns {Promise<Array>}
     */
    async fetchAll() {
        try {
            this._cache = await ApiAdapter.get('/api/teams');
            return this._cache;
        } catch (err) {
            console.error('TeamService.fetchAll error:', err);
            return this._cache || [];
        }
    },

    /**
     * Get cached members (sync)
     */
    getAll() {
        return this._cache || [];
    },

    /**
     * Fetch all team metadata (names of standalone teams)
     * @returns {Promise<Array>}
     */
    async fetchTeams() {
        try {
            return await ApiAdapter.get('/api/teams/metadata');
        } catch (err) {
            console.error('TeamService.fetchTeams error:', err);
            return [];
        }
    },

    /**
     * Create a new empty team
     * @returns {Promise<Object>}
     */
    async createTeam(name) {
        return await ApiAdapter.post('/api/teams/metadata', { name });
    },

    /**
     * Delete an empty team metadata record
     * @returns {Promise<Object>}
     */
    async deleteTeam(name) {
        return await ApiAdapter.delete(`/api/teams/metadata/${encodeURIComponent(name)}`);
    },

    /**
     * Get member by ID (from cache)
     */
    getById(id) {
        return this.getAll().find(m => m.id === id);
    },

    /**
     * Update a team member (admin only)
     * @returns {Promise<Object>}
     */
    async update(id, updates) {
        const result = await ApiAdapter.patch(`/api/teams/${id}`, updates);
        await this.fetchAll(); // Refresh cache
        return result;
    },

    /**
     * Delete a team member (admin only)
     */
    async delete(id) {
        await ApiAdapter.delete(`/api/teams/${id}`);
        this._cache = (this._cache || []).filter(m => m.id !== id);
    },

    /**
     * Register a new team member via auth API
     * @returns {Promise<Object>}
     */
    async add(memberData) {
        // New members are created via the register endpoint
        await ApiAdapter.post('/api/auth/register', {
            name: memberData.name,
            email: memberData.email || `${memberData.name.toLowerCase().replace(/\s+/g, '.')}@acme.com`,
            password: '123456', // Default password
            role: memberData.role,
            team: memberData.team
        });
        await this.fetchAll();
    }
};

window.TeamService = TeamService;
