// ═══════════════════════════════════════════════════════════════════════════
// ALPHA PROFIN - INTELLIGENT TASK MANAGEMENT SYSTEM v1.0
// AI-powered task prioritization and workflow automation
// Phase 2A - Feature 5
// ═══════════════════════════════════════════════════════════════════════════

class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentAgent = localStorage.getItem('activeAgentName') || 'Agent';
        this.currentFilter = 'all'; // all, today, overdue, completed
        this.currentSort = 'priority'; // priority, deadline, created

        // Task priorities
        this.priorities = {
            critical: { label: 'Critical', color: '#ef4444', icon: 'fa-exclamation-circle', weight: 4 },
            high: { label: 'High', color: '#f59e0b', icon: 'fa-arrow-up', weight: 3 },
            medium: { label: 'Medium', color: '#3b82f6', icon: 'fa-minus', weight: 2 },
            low: { label: 'Low', color: '#64748b', icon: 'fa-arrow-down', weight: 1 }
        };

        // Task categories
        this.categories = {
            followup: { label: 'Follow-up', icon: 'fa-phone', color: '#3b82f6' },
            documentation: { label: 'Documentation', icon: 'fa-file-alt', color: '#8b5cf6' },
            approval: { label: 'Approval', icon: 'fa-check-circle', color: '#10b981' },
            meeting: { label: 'Meeting', icon: 'fa-calendar', color: '#f59e0b' },
            review: { label: 'Review', icon: 'fa-eye', color: '#06b6d4' },
            other: { label: 'Other', icon: 'fa-tasks', color: '#64748b' }
        };
    }

    /**
     * Initialize task manager
     */
    async init() {
        console.log('✅ Task Manager initializing...');
        await this.loadTasks();
        this.startAutoSave();
        this.startDeadlineChecker();
        console.log('✅ Task Manager initialized');
    }

    /**
     * Load tasks from storage
     */
    async loadTasks() {
        try {
            // Load from localStorage
            const localTasks = this.loadLocalTasks();

            // Load from cloud (if available)
            const cloudTasks = await this.loadCloudTasks();

            // Merge and deduplicate
            this.tasks = this.mergeTasks(localTasks, cloudTasks);

            // Auto-generate tasks from leads
            await this.generateAutomaticTasks();

            console.log(`📋 Loaded ${this.tasks.length} tasks`);
        } catch (error) {
            console.error('❌ Failed to load tasks:', error);
            this.tasks = [];
        }
    }

    /**
     * Load tasks from localStorage
     */
    loadLocalTasks() {
        try {
            const tasks = localStorage.getItem(`tasks_${this.currentAgent}`);
            return tasks ? JSON.parse(tasks) : [];
        } catch (error) {
            console.error('❌ Failed to load local tasks:', error);
            return [];
        }
    }

    /**
     * Load tasks from cloud
     */
    async loadCloudTasks() {
        if (!CONFIG?.CLOUD_URL) {
            console.warn('No cloud URL configured');
            return [];
        }

        try {
            const response = await fetch(`${CONFIG.CLOUD_URL}?action=getTasks&agent=${this.currentAgent}`);
            const data = await response.json();

            if (data.success && Array.isArray(data.tasks)) {
                console.log(`☁️ Loaded ${data.tasks.length} tasks from cloud`);
                return data.tasks;
            }

            return [];
        } catch (error) {
            console.warn('Cloud fetch failed:', error);
            return [];
        }
    }

    /**
     * Merge and deduplicate tasks
     */
    mergeTasks(localTasks, cloudTasks) {
        const allTasks = [...localTasks, ...cloudTasks];

        // Deduplicate by ID
        const uniqueTasks = allTasks.reduce((acc, task) => {
            if (!acc.find(t => t.id === task.id)) {
                acc.push(task);
            }
            return acc;
        }, []);

        // Sort by priority and deadline
        return this.sortTasks(uniqueTasks);
    }

    /**
     * Generate automatic tasks from leads
     */
    async generateAutomaticTasks(externalLeads = null) {
        try {
            // Priority: External > Cloud Hub > Local
            let leads = externalLeads;
            if (!leads && window.CloudIntegration) {
                leads = window.CloudIntegration.getLeads(this.currentAgent);
            }
            if (!leads) {
                leads = JSON.parse(localStorage.getItem('alphaSubmittedLeads') || '[]');
            }

            if (!Array.isArray(leads)) return;

            // Generate tasks for new leads
            leads.forEach(lead => {
                if (!['Rejected', 'Disbursed'].includes(lead.status)) {
                    // Check if task already exists
                    const exists = this.tasks.some(t => t.leadId === lead.id && !t.completed);

                    if (!exists) {
                        this.createTask({
                            title: `Follow up: ${lead.client}`,
                            description: `Current Status: ${lead.status}. Client needs attention.`,
                            priority: this.calculateLeadPriority(lead),
                            deadline: this.calculateFollowUpDeadline(lead),
                            leadId: lead.id,
                            type: 'auto-followup',
                            autoGenerated: true
                        }, false); // Don't save yet
                    }
                }
            });

            // Batch Save
            this.saveTasks();

        } catch (error) {
            console.error('❌ Failed to generate automatic tasks:', error);
        }
    }

    /**
     * Calculate lead priority
     */
    calculateLeadPriority(lead) {
        const amount = parseFloat(lead.amount?.replace(/[^0-9.]/g, '') || 0);
        const daysOld = this.getDaysOld(lead.date || lead.timestamp);

        if (amount > 5000000 || daysOld > 7) return 'critical';
        if (amount > 1000000 || daysOld > 3) return 'high';
        if (amount > 500000) return 'medium';
        return 'low';
    }

    /**
     * Calculate follow-up deadline
     */
    calculateFollowUpDeadline(lead) {
        const created = new Date(lead.date || lead.timestamp);
        const deadline = new Date(created);
        deadline.setDate(deadline.getDate() + 2); // 2 days follow-up
        return deadline.toISOString();
    }

    /**
     * Get days old
     */
    getDaysOld(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now - date;
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Create new task
     */
    createTask(taskData, save = true) {
        const task = {
            id: taskData.id || this.generateId(),
            title: taskData.title,
            description: taskData.description || '',
            category: taskData.category || 'other',
            priority: taskData.priority || 'medium',
            deadline: taskData.deadline || this.getDefaultDeadline(),
            assignedTo: taskData.assignedTo || this.currentAgent,
            createdBy: this.currentAgent,
            createdAt: new Date().toISOString(),
            status: 'pending',
            completed: false,
            completedAt: null,
            leadId: taskData.leadId || null,
            type: taskData.type || 'manual',
            autoGenerated: taskData.autoGenerated || false,
            reminders: taskData.reminders || [],
            notes: taskData.notes || []
        };

        this.tasks.push(task);

        if (save) {
            this.saveTasks();
            this.notifyTaskCreated(task);
        }

        return task;
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get default deadline (tomorrow)
     */
    getDefaultDeadline() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(17, 0, 0, 0); // 5 PM
        return tomorrow.toISOString();
    }

    /**
     * Update task
     */
    updateTask(taskId, updates) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            console.error('❌ Task not found:', taskId);
            return null;
        }

        Object.assign(task, updates);
        this.saveTasks();

        return task;
    }

    /**
     * Complete task
     */
    completeTask(taskId) {
        const task = this.updateTask(taskId, {
            status: 'completed',
            completed: true,
            completedAt: new Date().toISOString()
        });

        if (task) {
            this.notifyTaskCompleted(task);

            // Log audit trail
            if (window.auditTrail) {
                window.auditTrail.log('TASK_COMPLETED', {
                    taskId: task.id,
                    title: task.title,
                    category: task.category
                });
            }
        }

        return task;
    }

    /**
     * Delete task
     */
    deleteTask(taskId) {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index === -1) {
            console.error('❌ Task not found:', taskId);
            return false;
        }

        const task = this.tasks[index];
        this.tasks.splice(index, 1);
        this.saveTasks();

        // Log audit trail
        if (window.auditTrail) {
            window.auditTrail.log('TASK_DELETED', {
                taskId: task.id,
                title: task.title
            });
        }

        return true;
    }

    /**
     * Save tasks to storage
     */
    saveTasks() {
        try {
            localStorage.setItem(`tasks_${this.currentAgent}`, JSON.stringify(this.tasks));

            // Sync to cloud (async, don't wait)
            this.syncToCloud().catch(err => console.error('Cloud sync failed:', err));
        } catch (error) {
            console.error('❌ Failed to save tasks:', error);
        }
    }

    /**
     * Sync to cloud
     */
    async syncToCloud() {
        if (!CONFIG?.CLOUD_URL) return;

        try {
            await fetch(CONFIG.CLOUD_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'saveTasks',
                    agent: this.currentAgent,
                    tasks: this.tasks
                })
            });

            console.log('☁️ Tasks synced to cloud');
        } catch (error) {
            console.warn('Cloud sync failed, saved locally:', error);
        }
    }

    /**
     * Start auto-save interval
     */
    startAutoSave() {
        setInterval(() => {
            this.saveTasks();
        }, 60000); // Auto-save every minute
    }

    /**
     * Start deadline checker
     */
    startDeadlineChecker() {
        setInterval(() => {
            this.checkDeadlines();
        }, 300000); // Check every 5 minutes
    }

    /**
     * Check deadlines and send notifications
     */
    checkDeadlines() {
        const now = new Date();

        this.tasks.forEach(task => {
            if (task.completed) return;

            const deadline = new Date(task.deadline);
            const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);

            // Notify if deadline is within 2 hours
            if (hoursUntilDeadline > 0 && hoursUntilDeadline <= 2) {
                this.notifyDeadlineApproaching(task, hoursUntilDeadline);
            }

            // Notify if overdue
            if (hoursUntilDeadline < 0) {
                this.notifyOverdue(task);
            }
        });
    }

    /**
     * Sort tasks
     */
    sortTasks(tasks = this.tasks) {
        const sorted = [...tasks];

        switch (this.currentSort) {
            case 'priority':
                sorted.sort((a, b) => {
                    const priorityDiff = this.priorities[b.priority].weight - this.priorities[a.priority].weight;
                    if (priorityDiff !== 0) return priorityDiff;
                    return new Date(a.deadline) - new Date(b.deadline);
                });
                break;

            case 'deadline':
                sorted.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
                break;

            case 'created':
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }

        return sorted;
    }

    /**
     * Filter tasks
     */
    filterTasks() {
        let filtered = [...this.tasks];

        switch (this.currentFilter) {
            case 'today':
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                filtered = filtered.filter(task => {
                    const deadline = new Date(task.deadline);
                    return deadline >= today && deadline < tomorrow && !task.completed;
                });
                break;

            case 'overdue':
                const now = new Date();
                filtered = filtered.filter(task => {
                    return new Date(task.deadline) < now && !task.completed;
                });
                break;

            case 'completed':
                filtered = filtered.filter(task => task.completed);
                break;

            case 'all':
            default:
                filtered = filtered.filter(task => !task.completed);
                break;
        }

        return this.sortTasks(filtered);
    }

    /**
     * Set filter
     */
    setFilter(filter) {
        this.currentFilter = filter;
        this.render();
    }

    /**
     * Set sort
     */
    setSort(sort) {
        this.currentSort = sort;
        this.render();
    }

    /**
     * Notify task created
     */
    notifyTaskCreated(task) {
        if (window.notificationSystem) {
            window.notificationSystem.create({
                title: 'New Task Created',
                message: task.title,
                priority: 'medium',
                category: 'task',
                actions: [
                    { label: 'View', action: () => this.openTaskDetails(task.id) }
                ]
            });
        }
    }

    /**
     * Notify task completed
     */
    notifyTaskCompleted(task) {
        if (window.notificationSystem) {
            window.notificationSystem.create({
                title: 'Task Completed! 🎉',
                message: task.title,
                priority: 'low',
                category: 'success'
            });
        }
    }

    /**
     * Notify deadline approaching
     */
    notifyDeadlineApproaching(task, hoursLeft) {
        if (window.notificationSystem) {
            window.notificationSystem.create({
                title: 'Deadline Approaching!',
                message: `${task.title} - ${Math.round(hoursLeft)} hours left`,
                priority: 'high',
                category: 'deadline',
                actions: [
                    { label: 'Complete', action: () => this.completeTask(task.id) },
                    { label: 'View', action: () => this.openTaskDetails(task.id) }
                ]
            });
        }
    }

    /**
     * Notify overdue
     */
    notifyOverdue(task) {
        if (window.notificationSystem) {
            window.notificationSystem.create({
                title: 'Task Overdue!',
                message: task.title,
                priority: 'critical',
                category: 'overdue',
                actions: [
                    { label: 'Complete', action: () => this.completeTask(task.id) },
                    { label: 'Reschedule', action: () => this.openTaskDetails(task.id) }
                ]
            });
        }
    }

    /**
     * Render task manager UI
     */
    render(containerId = 'taskManagerContainer') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('❌ Task manager container not found');
            return;
        }

        const html = `
            <div class="task-manager-wrapper">
                ${this.renderHeader()}
                ${this.renderFilters()}
                ${this.renderTaskList()}
            </div>
        `;

        container.innerHTML = html;
        this.attachEventListeners();
    }

    /**
     * Render header
     */
    renderHeader() {
        const stats = this.getTaskStats();

        return `
            <div class="task-header">
                <div>
                    <h2 class="task-title">
                        <i class="fas fa-tasks"></i>
                        Task Management
                    </h2>
                    <p class="task-subtitle">${stats.pending} pending • ${stats.overdue} overdue • ${stats.completed} completed today</p>
                </div>
                <div class="task-actions">
                    <button class="btn btn-primary" onclick="taskManager.openCreateTaskModal()">
                        <i class="fas fa-plus"></i> New Task
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Get task stats
     */
    getTaskStats() {
        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));

        return {
            pending: this.tasks.filter(t => !t.completed).length,
            overdue: this.tasks.filter(t => !t.completed && new Date(t.deadline) < now).length,
            completed: this.tasks.filter(t => t.completed && new Date(t.completedAt) >= today).length,
            total: this.tasks.length
        };
    }

    /**
     * Render filters
     */
    renderFilters() {
        return `
            <div class="task-filters">
                <div class="filter-tabs">
                    <button class="filter-tab ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">
                        <i class="fas fa-list"></i> All Tasks
                    </button>
                    <button class="filter-tab ${this.currentFilter === 'today' ? 'active' : ''}" data-filter="today">
                        <i class="fas fa-calendar-day"></i> Today
                    </button>
                    <button class="filter-tab ${this.currentFilter === 'overdue' ? 'active' : ''}" data-filter="overdue">
                        <i class="fas fa-exclamation-triangle"></i> Overdue
                    </button>
                    <button class="filter-tab ${this.currentFilter === 'completed' ? 'active' : ''}" data-filter="completed">
                        <i class="fas fa-check-circle"></i> Completed
                    </button>
                </div>
                <div class="sort-dropdown">
                    <label><i class="fas fa-sort"></i> Sort by:</label>
                    <select id="taskSort" class="sort-select">
                        <option value="priority" ${this.currentSort === 'priority' ? 'selected' : ''}>Priority</option>
                        <option value="deadline" ${this.currentSort === 'deadline' ? 'selected' : ''}>Deadline</option>
                        <option value="created" ${this.currentSort === 'created' ? 'selected' : ''}>Created Date</option>
                    </select>
                </div>
            </div>
        `;
    }

    /**
     * Render task list
     */
    renderTaskList() {
        const tasks = this.filterTasks();

        if (tasks.length === 0) {
            return this.renderEmpty();
        }

        const tasksHtml = tasks.map(task => this.renderTaskCard(task)).join('');

        return `
            <div class="task-list">
                ${tasksHtml}
            </div>
        `;
    }

    /**
     * Render task card
     */
    renderTaskCard(task) {
        const priority = this.priorities[task.priority];
        const category = this.categories[task.category];
        const isOverdue = !task.completed && new Date(task.deadline) < new Date();
        const timeLeft = this.getTimeLeft(task.deadline);

        return `
            <div class="task-card ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-task-id="${task.id}">
                <div class="task-card-header">
                    <div class="task-checkbox">
                        <input 
                            type="checkbox" 
                            ${task.completed ? 'checked' : ''} 
                            onchange="taskManager.toggleTaskComplete('${task.id}')"
                        />
                    </div>
                    <div class="task-content">
                        <div class="task-title-row">
                            <h3 class="task-card-title">${task.title}</h3>
                            <div class="task-priority" style="background: ${priority.color}15; color: ${priority.color};">
                                <i class="fas ${priority.icon}"></i>
                                ${priority.label}
                            </div>
                        </div>
                        ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                        <div class="task-meta">
                            <span class="task-category" style="background: ${category.color}15; color: ${category.color};">
                                <i class="fas ${category.icon}"></i>
                                ${category.label}
                            </span>
                            <span class="task-deadline ${isOverdue ? 'overdue' : ''}">
                                <i class="fas fa-clock"></i>
                                ${timeLeft}
                            </span>
                            ${task.autoGenerated ? '<span class="task-auto"><i class="fas fa-magic"></i> Auto</span>' : ''}
                        </div>
                    </div>
                    <div class="task-actions-menu">
                        <button class="task-action-btn" onclick="taskManager.openTaskDetails('${task.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="task-action-btn" onclick="taskManager.deleteTask('${task.id}'); taskManager.render();">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get time left string
     */
    getTimeLeft(deadline) {
        const now = new Date();
        const end = new Date(deadline);
        const diffMs = end - now;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMs < 0) {
            const overdueDays = Math.abs(diffDays);
            if (overdueDays === 0) return 'Overdue today';
            return `Overdue ${overdueDays} day${overdueDays > 1 ? 's' : ''}`;
        }

        if (diffMins < 60) return `${diffMins} min left`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} left`;
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        return `${diffDays} days left`;
    }

    /**
     * Render empty state
     */
    renderEmpty() {
        let message = 'No tasks found';
        let icon = 'fa-inbox';

        if (this.currentFilter === 'today') {
            message = 'No tasks due today';
            icon = 'fa-calendar-check';
        } else if (this.currentFilter === 'overdue') {
            message = 'No overdue tasks! 🎉';
            icon = 'fa-check-circle';
        } else if (this.currentFilter === 'completed') {
            message = 'No completed tasks yet';
            icon = 'fa-tasks';
        }

        return `
            <div class="task-empty">
                <i class="fas ${icon}"></i>
                <h3>${message}</h3>
                <p>Create a new task to get started</p>
                <button class="btn btn-primary" onclick="taskManager.openCreateTaskModal()">
                    <i class="fas fa-plus"></i> Create Task
                </button>
            </div>
        `;
    }

    /**
     * Toggle task complete
     */
    toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        if (task.completed) {
            this.updateTask(taskId, {
                status: 'pending',
                completed: false,
                completedAt: null
            });
        } else {
            this.completeTask(taskId);
        }

        this.render();
    }

    /**
     * Open create task modal
     */
    openCreateTaskModal() {
        // TODO: Implement modal
        const title = prompt('Task title:');
        if (!title) return;

        const description = prompt('Description (optional):');

        this.createTask({
            title,
            description,
            category: 'other',
            priority: 'medium'
        });

        this.render();
    }

    /**
     * Open task details
     */
    openTaskDetails(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // TODO: Implement detailed modal
        alert(`Task: ${task.title}\n\nDescription: ${task.description}\n\nPriority: ${task.priority}\nDeadline: ${new Date(task.deadline).toLocaleString()}`);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.setFilter(filter);
            });
        });

        // Sort dropdown
        const sortSelect = document.getElementById('taskSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.setSort(e.target.value);
            });
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

// Create global instance
const taskManager = new TaskManager();

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        taskManager.init();
    });
} else {
    taskManager.init();
}

// Make globally available
window.taskManager = taskManager;

console.log('✅ Task Manager v1.0 loaded');
console.log('💡 Usage: taskManager.createTask({ title, description, priority, deadline })');
