window.ProjectCreatePage = {
    async init() {
        await this.renderMembers();
        this.attachEventListeners();
    },

    async renderMembers() {
        const select = document.getElementById('project-leader');
        if (!select) return;

        try {
            // Load all users to be potential project leaders
            const members = await TeamService.fetchAll();
            select.innerHTML = '<option value="">Seleccionar responsable...</option>' + 
                members.map(m => `<option value="${m.id}">${m.name} (${m.role})</option>`).join('');
        } catch (error) {
            console.error('Error loading members', error);
            Toast.error('Error cargando responsables');
        }
    },

    attachEventListeners() {
        const form = document.getElementById('create-project-form');
        if (!form) return;

        // Remove old hardcoded submit if it exists
        const oldSubmit = form.onsubmit;
        if (oldSubmit) form.onsubmit = null;

        // Clone and replace to kill inline event listeners from original HTML
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', this.handleSubmit.bind(this));
    },

    async handleSubmit(e) {
        e.preventDefault();
        
        const btn = e.target.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;

        try {
            const name = document.getElementById('project-name').value;
            const description = document.getElementById('project-desc').value;
            const leaderId = document.getElementById('project-leader').value;
            const dueDate = document.getElementById('project-deadline').value;
            // Map HTML priority to DB status/colors simply
            const priorityInput = document.querySelector('input[name="priority"]:checked');
            const priority = priorityInput ? priorityInput.value : 'medium';

            const colorMap = { low: 'green', medium: 'blue', high: 'red' };

            const projectData = {
                name,
                description,
                dueDate,
                color: colorMap[priority],
                status: 'planning',
                memberIds: leaderId ? [leaderId] : []
            };

            await ProjectService.create(projectData);
            Toast.success('Proyecto creado con éxito');
            Router.goTo('projects');
        } catch (error) {
            console.error('Error creating project:', error);
            Toast.error(error.message || 'Error al crear el proyecto');
            if (btn) btn.disabled = false;
        }
    }
};

if (document.getElementById('create-project-form')) {
    window.ProjectCreatePage.init();
}
