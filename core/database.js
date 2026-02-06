// ═══════════════════════════════════════════════════════════════════════════
// ALPHAPROFIN - UNIFIED DATABASE ENGINE
// Single source of truth for all data
// ═══════════════════════════════════════════════════════════════════════════

const AlphaDB = {
    version: '3.0',

    // Data Tables
    tables: {
        leads: [],
        tasks: [],
        users: [],
        audit: []
    },

    // Initialize database
    init() {
        this.load();
        // Force update if "Eswari" is not in the list (Migration to new user list)
        const hasNewUsers = this.tables.users.some(u => u.name === 'Eswari');
        if (this.tables.users.length === 0 || !hasNewUsers) this.seedUsers();
        console.log('✅ AlphaDB initialized');
    },

    // Load from localStorage
    load() {
        try {
            const data = localStorage.getItem('AlphaDB_v3');
            if (data) {
                const parsed = JSON.parse(data);
                this.tables = parsed.tables || this.tables;
            }
        } catch (e) {
            console.error('DB Load Error:', e);
        }
    },

    // Save to localStorage
    save() {
        try {
            localStorage.setItem('AlphaDB_v3', JSON.stringify({
                version: this.version,
                tables: this.tables,
                lastUpdate: new Date().toISOString()
            }));
        } catch (e) {
            console.error('DB Save Error:', e);
        }
    },

    // Seed default users
    seedUsers() {
        const agents = ['Eswari', 'Anitha', 'Deepak', 'Vanitha', 'Bavani', 'Agent 6', 'Agent 7', 'Agent 8', 'Agent 9', 'Agent 10'];
        const admins = ['Ram Kumar', 'Aravindan', 'Elango'];

        // Reset users table to ensure new list is applied
        this.tables.users = [];

        agents.forEach(name => {
            this.tables.users.push({
                id: 'U-' + Date.now() + Math.random().toString(36).substr(2, 4),
                name: name,
                role: 'agent',
                password: 'alpha123', // Default password
                active: true,
                createdAt: new Date().toISOString()
            });
        });

        admins.forEach(name => {
            this.tables.users.push({
                id: 'U-' + Date.now() + Math.random().toString(36).substr(2, 4),
                name: name,
                role: 'admin',
                password: 'admin123',
                active: true,
                createdAt: new Date().toISOString()
            });
        });

        this.save();
        console.log('✅ User Database Updated with Request List');
    },

    // CREATE Lead
    createLead(data) {
        const lead = {
            id: 'L-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
            timestamp: new Date().toISOString(),
            agent: data.agent,
            client: data.client,
            mobile: data.mobile,
            product: data.product,
            amount: data.amount,
            status: 'Submitted',
            cibil: data.cibil || '',
            notes: data.notes || '',
            journey: [{
                date: new Date().toISOString(),
                status: 'Submitted',
                by: data.agent,
                note: 'Lead created'
            }]
        };

        this.tables.leads.push(lead);
        this.audit('CREATE_LEAD', data.agent, lead.id);
        this.save();
        return lead;
    },

    // UPDATE Lead Status
    updateLeadStatus(leadId, newStatus, user, note = '') {
        const lead = this.tables.leads.find(l => l.id === leadId);
        if (!lead) return false;

        lead.status = newStatus;
        lead.journey.push({
            date: new Date().toISOString(),
            status: newStatus,
            by: user,
            note: note
        });

        this.audit('UPDATE_STATUS', user, leadId, { status: newStatus });
        this.save();
        return true;
    },

    // CREATE Task
    createTask(data) {
        const task = {
            id: 'T-' + Date.now().toString().slice(-8),
            leadId: data.leadId || null,
            agent: data.agent,
            title: data.title,
            dueDate: data.dueDate,
            status: 'Pending',
            priority: data.priority || 'Medium',
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tables.tasks.push(task);
        this.audit('CREATE_TASK', data.agent, task.id);
        this.save();
        return task;
    },

    // UPDATE Task
    updateTask(taskId, updates, user) {
        const task = this.tables.tasks.find(t => t.id === taskId);
        if (!task) return false;

        Object.assign(task, updates);
        if (updates.status === 'Completed') {
            task.completedAt = new Date().toISOString();
        }

        this.audit('UPDATE_TASK', user, taskId, updates);
        this.save();
        return true;
    },

    // QUERY Leads
    getLeads(filter = {}) {
        let results = [...this.tables.leads];

        if (filter.agent) results = results.filter(l => l.agent === filter.agent);
        if (filter.product) results = results.filter(l => l.product === filter.product);
        if (filter.status) results = results.filter(l => l.status === filter.status);

        return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    // QUERY Tasks
    getTasks(filter = {}) {
        let results = [...this.tables.tasks];

        if (filter.agent) results = results.filter(t => t.agent === filter.agent);
        if (filter.status) results = results.filter(t => t.status === filter.status);

        return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    // Audit Log
    audit(action, user, target, details = {}) {
        this.tables.audit.push({
            id: 'A-' + Date.now(),
            timestamp: new Date().toISOString(),
            user: user,
            action: action,
            target: target,
            details: details
        });
    },

    // Export to JSON
    export() {
        return JSON.stringify(this.tables, null, 2);
    },

    // Import from JSON
    import(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            this.tables = data;
            this.save();
            return true;
        } catch (e) {
            console.error('Import Error:', e);
            return false;
        }
    }
};

// Auto-initialize
if (typeof window !== 'undefined') {
    window.AlphaDB = AlphaDB;
    AlphaDB.init();
}
