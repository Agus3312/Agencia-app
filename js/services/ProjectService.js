/**
 * ProjectService
 * Handles data operations for projects via the backend API.
 * Uses ApiAdapter for HTTP calls and caches data locally.
 *
 * All methods that hit the API are async.
 * Methods that only read cached data are sync (for backward compatibility).
 */
const ProjectService = {
    _cache: null,

    /**
     * Fetch all projects from API and cache them
     * @returns {Promise<Array>}
     */
    async fetchAll() {
        try {
            this._cache = await ApiAdapter.get('/api/projects');
            return this._cache;
        } catch (err) {
            console.error('ProjectService.fetchAll error:', err);
            return this._cache || [];
        }
    },

    /**
     * Get cached projects (sync — for components that need instant data)
     * Call fetchAll() first to populate the cache.
     */
    getAll() {
        return this._cache || [];
    },

    /**
     * Get a single project by ID (from cache)
     */
    getById(id) {
        return this.getAll().find(p => p.id === id) || null;
    },

    /**
     * Fetch a single project with full detail from API
     * @returns {Promise<Object>}
     */
    async fetchById(id) {
        try {
            const project = await ApiAdapter.get(`/api/projects/${id}`);
            // Update cache
            if (this._cache) {
                const idx = this._cache.findIndex(p => p.id === id);
                if (idx !== -1) this._cache[idx] = project;
            }
            return project;
        } catch (err) {
            console.error('ProjectService.fetchById error:', err);
            return this.getById(id);
        }
    },

    /**
     * Create a new project
     * @returns {Promise<Object>}
     */
    async add(project) {
        const newProject = await ApiAdapter.post('/api/projects', project);
        await this.fetchAll(); // Refresh cache
        return newProject;
    },

    /**
     * Update a project
     * @returns {Promise<Object>}
     */
    async update(id, updates) {
        const updated = await ApiAdapter.patch(`/api/projects/${id}`, updates);
        await this.fetchAll(); // Refresh cache
        return updated;
    },

    /**
     * Delete a project
     */
    async delete(id) {
        await ApiAdapter.delete(`/api/projects/${id}`);
        this._cache = (this._cache || []).filter(p => p.id !== id);
    },

    // ── Tasks ────────────────────────────────────────────────────────────
    async addTask(projectId, title) {
        await ApiAdapter.post('/api/tasks', { projectId, title });
        await this.fetchAll();
    },

    async toggleTask(projectId, taskId) {
        const project = this.getById(projectId);
        if (!project) return;
        const task = project.tasks.find(t => t.id === taskId);
        if (task) {
            await ApiAdapter.patch(`/api/tasks/${taskId}`, { done: !task.done });
            await this.fetchAll();
        }
    },

    async removeTask(projectId, taskId) {
        await ApiAdapter.delete(`/api/tasks/${taskId}`);
        await this.fetchAll();
    },

    getTaskProgress(project) {
        const tasks = project.tasks || [];
        if (tasks.length === 0) return { done: 0, total: 0, percent: 0 };
        const done = tasks.filter(t => t.done).length;
        return { done, total: tasks.length, percent: Math.round((done / tasks.length) * 100) };
    },

    // ── Chat ────────────────────────────────────────────────────────────
    async addMessage(projectId, message) {
        await ApiAdapter.post(`/api/projects/${projectId}/messages`, { text: message });
        EventBus.emit('project:message', { projectId });
    },

    // ── Files ───────────────────────────────────────────────────────────
    async addFile(projectId, fileName, fileType) {
        await ApiAdapter.post(`/api/projects/${projectId}/files`, {
            name: fileName,
            type: fileType || 'document'
        });
        EventBus.emit('project:file', { projectId });
    },

    async removeFile(projectId, fileId) {
        // TODO: Add DELETE /api/files/:id endpoint
        console.warn('removeFile: endpoint not implemented yet');
    },

    // ── Updates ─────────────────────────────────────────────────────────
    async addUpdate(projectId, title, description) {
        await ApiAdapter.post(`/api/projects/${projectId}/updates`, { title, description });
        EventBus.emit('project:update', { projectId });
    }
};

window.ProjectService = ProjectService;
