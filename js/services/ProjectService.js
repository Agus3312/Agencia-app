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
            if (!this._cache) this._cache = [];
            const idx = this._cache.findIndex(p => p.id === id);
            if (idx !== -1) {
                this._cache[idx] = project;
            } else {
                this._cache.push(project);
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
    async addTask(projectId, taskData) {
        const payload = typeof taskData === 'string' ? { projectId, title: taskData } : { projectId, ...taskData };
        const newTask = await ApiAdapter.post('/api/tasks', payload);
        await this.fetchById(projectId); // Update specific project cache
        return newTask;
    },

    async updateTask(projectId, taskId, updates) {
        const updatedTask = await ApiAdapter.patch(`/api/tasks/${taskId}`, updates);
        
        // Update local cache
        const project = this.getById(projectId);
        if (project && project.tasks) {
            const idx = project.tasks.findIndex(t => t.id === taskId);
            if (idx !== -1) project.tasks[idx] = { ...project.tasks[idx], ...updatedTask };
        }
        
        return updatedTask;
    },

    async updateTaskStatus(projectId, taskId, newStatus) {
        const isDone = newStatus === 'done';
        return this.updateTask(projectId, taskId, { status: newStatus, done: isDone });
    },

    async toggleTask(projectId, taskId) {
        const project = this.getById(projectId);
        if (!project) return;

        const task = project.tasks.find(t => t.id === taskId);
        if (!task) return;

        const newDone = !task.done;
        const newStatus = newDone ? 'done' : 'todo';

        return this.updateTask(projectId, taskId, { done: newDone, status: newStatus });
    },

    async removeTask(projectId, taskId) {
        const project = this.getById(projectId);
        if (!project) return;

        const originalTasks = [...project.tasks];
        // Optimistic remove
        project.tasks = project.tasks.filter(t => t.id !== taskId);

        try {
            await ApiAdapter.delete(`/api/tasks/${taskId}`);
        } catch (err) {
            // Rollback
            project.tasks = originalTasks;
            throw err;
        }
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

    // ── Updates & Comments ─────────────────────────────────────────────
    async addUpdate(projectId, title, description) {
        await ApiAdapter.post(`/api/projects/${projectId}/updates`, { title, description });
        EventBus.emit('project:update', { projectId });
    },

    async addTaskComment(projectId, taskId, text) {
        const comment = await ApiAdapter.post(`/api/tasks/${taskId}/comments`, { text });
        await this.fetchById(projectId);
        return comment;
    },

    async fetchTaskComments(taskId) {
        return await ApiAdapter.get(`/api/tasks/${taskId}/comments`);
    },

    // ── Time Tracking ──────────────────────────────────────────────────
    async fetchTaskTime(taskId) {
        return await ApiAdapter.get(`/api/tasks/${taskId}/time`);
    },

    async logTime(taskId, duration, note = '') {
        return await ApiAdapter.post(`/api/tasks/${taskId}/time`, { duration, note });
    },

    // ── Notifications ──────────────────────────────────────────────────
    async fetchNotifications() {
        return await ApiAdapter.get('/api/notifications');
    },

    async markNotificationRead(id) {
        return await ApiAdapter.patch(`/api/notifications/${id}/read`, {});
    }
};

window.ProjectService = ProjectService;
