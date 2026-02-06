// ═══════════════════════════════════════════════════════════════════════════
// ALPHA PROFIN - UNIVERSAL CLOUD DATA HUB (CLEAN VERSION)
// ═══════════════════════════════════════════════════════════════════════════

const CloudIntegration = {
    cloudUrl: CONFIG?.CLOUD_URL || '',

    // CACHE STATE
    _leadsCache: [],
    _lastSync: 0,

    /**
     * UNIVERSAL ADAPTER: Maps ANY column name to our internal standard
     */
    normalizeLead(row) {
        const get = (...keys) => {
            for (const k of keys) {
                if (row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k];
                if (row[k.toUpperCase()] !== undefined) return row[k.toUpperCase()];
                if (row[k.toLowerCase()] !== undefined) return row[k.toLowerCase()];
            }
            return '';
        };

        let id = get('id', 'lead_id', 'ID', 'Lead ID', 'ref_no') || 'L-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        let client = get('client', 'client_name', 'name', 'Customer Name', 'Applicant') || 'Unknown Client';
        let money = get('amount', 'loan_amount', 'requested_amount', 'amt');
        let amountVal = parseFloat(String(money).replace(/[^0-9.]/g, '') || 0);
        let agent = get('agent', 'agent_name', 'sourced_by', 'Agent ID') || 'System';
        let status = get('status', 'current_status', 'stage', 'application_status') || 'Submitted';

        return {
            id: String(id),
            client: String(client),
            phone: String(get('phone', 'mobile', 'contact', 'Mobile No')),
            amount: String(money || '0'),
            value: amountVal,
            type: String(get('type', 'loan_type', 'product', 'Category') || 'BL'),
            status: String(status),
            agent: String(agent),
            date: String(get('date', 'timestamp', 'created_at', 'Date') || new Date().toLocaleDateString()),
            notes: String(get('note', 'notes', 'remarks', 'Comments')),
            cibil: String(get('cibil', 'score', 'credit_score') || '0')
        };
    },

    /**
     * CORE SYNC: Fetches from MasterDB and standardizes
     */
    async syncMasterDB() {
        // Mode 1: Local Browser SQL (No Install)
        if (CONFIG?.CLOUD_URL === 'LOCAL_DB') {
            console.log('📂 CONNECTING TO LOCAL SQL ENGINE...');
            if (!window.LocalDB) {
                console.error('❌ LocalDB Engine not loaded');
                return [];
            }

            // Fetch from Local Engine
            const rawRows = window.LocalDB.select('leads');
            const allLeads = rawRows.map(row => this.normalizeLead(row));

            console.log(`✅ LOCAL SQL SUCCESS: Loaded ${allLeads.length} leads`);

            this._leadsCache = allLeads;
            this._lastSync = Date.now();
            this.updateAllComponents();
            return allLeads;
        }

        // Mode 2: External Server (Google or Localhost)
        if (!this.cloudUrl) return [];

        console.log(`☁️ CONNECTING TO ${this.cloudUrl}...`);

        try {
            const response = await fetch(this.cloudUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const text = await response.text();
            let json;
            try { json = JSON.parse(text); } catch (e) { return this.loadLocalBackup(); }

            const rawRows = json.data || json.leads || json.records || json;
            if (!Array.isArray(rawRows)) return [];

            // NORMALIZE
            const allLeads = rawRows
                .filter(row => {
                    const type = row.type || row.TYPE || '';
                    return type !== 'CHAT' && type !== 'LOG';
                })
                .map(row => this.normalizeLead(row));

            console.log(`✅ SYNC SUCCESS: Received ${allLeads.length} leads`);

            this._leadsCache = allLeads;
            this._lastSync = Date.now();
            localStorage.setItem('alpha_master_backup', JSON.stringify(allLeads));

            this.updateAllComponents();
            return allLeads;

        } catch (error) {
            console.warn('⚠️ SYNC FAILED:', error);
            return this.loadLocalBackup();
        }
    },

    /**
     * LOG AUDIT TO CLOUD (Re-added)
     */
    async logAuditToCloud(action, details) {
        if (!this.cloudUrl) return;
        const logEntry = {
            timestamp: new Date().toISOString(),
            user: localStorage.getItem('activeAgentName') || 'Unknown',
            action: action,
            details: JSON.stringify(details)
        };
        try {
            await fetch(this.cloudUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'logAudit', log: logEntry })
            });
        } catch (error) { }
    },

    updateAllComponents() {
        const leads = this._leadsCache;
        const agent = localStorage.getItem('activeAgentName') || 'AGENT';

        if (window.benchmarking && typeof window.benchmarking.updateMetrics === 'function') {
            const metrics = calculateRealMetrics(leads, agent);
            window.benchmarking.updateMetrics(metrics);
        }

        if (window.taskManager && typeof window.taskManager.generateAutomaticTasks === 'function') {
            window.taskManager.generateAutomaticTasks(leads);
        }
    },

    loadLocalBackup() {
        try { return JSON.parse(localStorage.getItem('alpha_master_backup') || '[]'); } catch (e) { return []; }
    },

    // --- TRANSACTIONAL HANDSHAKE METHODS ---

    async submitLead(packet) {
        console.log("🤝 Cloud Handshake: Submitting Lead...");
        // LOCAL MODE
        if (CONFIG?.CLOUD_URL === 'LOCAL_DB' && window.LocalDB) {
            window.LocalDB.insert('leads', packet);
            await this.syncMasterDB(); // Immediate Refresh
            return { success: true };
        }

        // CLOUD MODE
        try {
            await fetch(this.cloudUrl, {
                method: 'POST',
                body: JSON.stringify(packet)
            });
            return { success: true };
        } catch (e) {
            console.error("Handshake Failed", e);
            return { success: false };
        }
    },

    async updateLeadStatus(id, newStatus) {
        console.log(`🤝 Cloud Handshake: Updating Status ${id} -> ${newStatus}`);

        if (CONFIG?.CLOUD_URL === 'LOCAL_DB' && window.LocalDB) {
            window.LocalDB.update('leads', id, { status: newStatus });
            await this.syncMasterDB();
            return { success: true };
        }

        // CLOUD MODE
        try {
            await fetch(this.cloudUrl, {
                method: 'POST',
                body: JSON.stringify({ action: 'UPDATE_STATUS', id, status: newStatus })
            });
            return { success: true };
        } catch (e) { return { success: false }; }
    },

    getLeads(agentName) {
        if (!agentName || agentName === 'ADMIN') return this._leadsCache;
        return this._leadsCache.filter(l => l.agent.toUpperCase() === agentName.toUpperCase());
    }
};

// Make Globally Available
window.CloudIntegration = CloudIntegration;

// UTILITY: Calculate Metrics
function calculateRealMetrics(leads, agent) {
    const agentLeads = leads.filter(lead => (lead.agent || '').trim().toUpperCase() === (agent || '').trim().toUpperCase());
    const totalLeads = agentLeads.length;
    const approvedLeads = agentLeads.filter(l => l.status === 'Approved' || l.status === 'Disbursed').length;

    // Revenue Calc
    const totalRevenue = agentLeads
        .filter(l => l.status === 'Disbursed')
        .reduce((sum, l) => sum + parseFloat(String(l.amount).replace(/[^0-9.]/g, '') || 0), 0);

    return {
        leadsSubmitted: totalLeads,
        leadsApproved: approvedLeads,
        conversionRate: totalLeads > 0 ? ((approvedLeads / totalLeads) * 100).toFixed(1) : 0,
        totalRevenue: totalRevenue,
        avgCIBIL: 0 // Simplified
    };
}
window.calculateRealMetrics = calculateRealMetrics;

// AUTO-INIT
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        CloudIntegration.syncMasterDB().then(leads => {
            window.dispatchEvent(new CustomEvent('MasterDBSynced', { detail: { count: leads.length } }));
            if (window.refreshData) window.refreshData(); // Admin Refresh
            if (typeof renderPipelineToTab === 'function') renderPipelineToTab(); // Agent Refresh
        });
    }, 1000);

    // Enhance Audit Trail ONCE
    if (window.auditTrail && !window.auditTrail.isCloudEnhanced) {
        const originalLog = window.auditTrail.log.bind(window.auditTrail);
        window.auditTrail.log = function (action, details) {
            originalLog(action, details);
            CloudIntegration.logAuditToCloud(action, details);
        };
        window.auditTrail.isCloudEnhanced = true;
    }
});
