// ═══════════════════════════════════════════════════════════════════════════
// BACKEND INTEGRATION WRAPPER - Makes existing portals work with backend
// ═══════════════════════════════════════════════════════════════════════════

// This file bridges your existing agent/admin code with the new backend

// Override AlphaAuth to use backend
window.AlphaAuth = {
    requireLogin: function (redirectUrl) {
        // DON'T redirect here - just return status
        // Let the calling code handle the redirect
        return isAuthenticated();
    },

    getUser: function () {
        return getCurrentUser();
    },

    isLoggedIn: function () {
        return isAuthenticated();
    },

    logout: function () {
        logoutFromBackend();
    }
};

// Override AlphaDB to use backend API
window.AlphaDB = {
    getLeads: async function (filters = {}) {
        const leads = await fetchLeadsFromBackend(filters);
        return leads || [];
    },

    getTasks: function (filters = {}) {
        // Return empty for now - can be implemented later
        return [];
    },

    saveLead: async function (leadData) {
        const result = await createLeadInBackend(leadData);
        return result;
    },

    updateLead: async function (leadId, updates) {
        // Implementation for updating lead
        return await apiRequest(`/leads/${leadId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    },

    tables: {
        leads: [],
        users: [],
        audit: []
    }
};

// Override AlphaConfig if needed
window.AlphaConfig = window.AlphaConfig || {
    formatCurrency: function (amount) {
        return '₹ ' + new Intl.NumberFormat('en-IN').format(amount || 0);
    },

    formatDate: function (date) {
        return new Date(date).toLocaleDateString('en-IN');
    },

    formatDateTime: function (date) {
        return new Date(date).toLocaleString('en-IN');
    },

    statuses: ['Submitted', 'Docs Pending', 'Under Review', 'Approved', 'Sanctioned', 'Disbursed', 'Rejected'],

    getAllProducts: function () {
        return [];
    },

    getProduct: function (id) {
        return { id, name: id, icon: 'fa-file' };
    }
};

console.log('✅ Backend Integration Wrapper Loaded');
console.log('📍 Your existing portals now use the backend API!');
