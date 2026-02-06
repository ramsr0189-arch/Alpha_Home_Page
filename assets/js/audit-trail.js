// ═══════════════════════════════════════════════════════════════════════════
// ALPHA PROFIN - AUDIT TRAIL VISUALIZATION v1.0
// Enterprise-grade compliance and activity tracking
// Phase 2A - Feature 3
// ═══════════════════════════════════════════════════════════════════════════

class AuditTrailManager {
    constructor() {
        this.auditLogs = [];
        this.filteredLogs = [];
        this.currentFilters = {
            user: 'all',
            action: 'all',
            dateRange: 'all',
            searchTerm: ''
        };

        // Action categories with icons and colors
        this.actionTypes = {
            'LEAD_CREATED': { icon: 'fa-plus-circle', color: '#10b981', label: 'Lead Created' },
            'LEAD_UPDATED': { icon: 'fa-edit', color: '#3b82f6', label: 'Lead Updated' },
            'STATUS_CHANGED': { icon: 'fa-exchange-alt', color: '#f59e0b', label: 'Status Changed' },
            'DOCUMENT_UPLOADED': { icon: 'fa-file-upload', color: '#8b5cf6', label: 'Document Uploaded' },
            'COMMENT_ADDED': { icon: 'fa-comment', color: '#06b6d4', label: 'Comment Added' },
            'LEAD_ASSIGNED': { icon: 'fa-user-plus', color: '#6366f1', label: 'Lead Assigned' },
            'LEAD_DELETED': { icon: 'fa-trash', color: '#ef4444', label: 'Lead Deleted' },
            'APPROVAL_GRANTED': { icon: 'fa-check-circle', color: '#10b981', label: 'Approval Granted' },
            'APPROVAL_REJECTED': { icon: 'fa-times-circle', color: '#ef4444', label: 'Approval Rejected' },
            'LOGIN': { icon: 'fa-sign-in-alt', color: '#64748b', label: 'User Login' },
            'LOGOUT': { icon: 'fa-sign-out-alt', color: '#64748b', label: 'User Logout' },
            'EXPORT': { icon: 'fa-download', color: '#8b5cf6', label: 'Data Export' },
            'SYSTEM': { icon: 'fa-cog', color: '#94a3b8', label: 'System Action' }
        };
    }

    /**
     * Initialize audit trail system
     */
    init() {
        console.log('🔍 Audit Trail Manager initializing...');
        this.loadAuditLogs();
        console.log('✅ Audit Trail Manager initialized');
    }

    /**
     * Load audit logs from localStorage and cloud
     */
    async loadAuditLogs() {
        try {
            // Load from localStorage
            const localLogs = this.loadLocalAuditLogs();

            // Load from cloud (if available)
            const cloudLogs = await this.loadCloudAuditLogs();

            // Merge and deduplicate
            this.auditLogs = this.mergeLogs(localLogs, cloudLogs);

            // Apply filters
            this.applyFilters();

            console.log(`📊 Loaded ${this.auditLogs.length} audit entries`);
        } catch (error) {
            console.error('❌ Failed to load audit logs:', error);
            this.auditLogs = [];
        }
    }

    /**
     * Load audit logs from localStorage
     */
    loadLocalAuditLogs() {
        try {
            const logs = localStorage.getItem('auditTrail');
            return logs ? JSON.parse(logs) : [];
        } catch (error) {
            console.error('❌ Failed to load local audit logs:', error);
            return [];
        }
    }

    /**
     * Load audit logs from cloud
     */
    async loadCloudAuditLogs() {
        // TODO: Implement cloud sync
        // For now, return empty array
        return [];
    }

    /**
     * Merge and deduplicate logs
     */
    mergeLogs(localLogs, cloudLogs) {
        const allLogs = [...localLogs, ...cloudLogs];

        // Deduplicate by ID
        const uniqueLogs = allLogs.reduce((acc, log) => {
            if (!acc.find(l => l.id === log.id)) {
                acc.push(log);
            }
            return acc;
        }, []);

        // Sort by timestamp (newest first)
        return uniqueLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Log an action
     */
    log(action, details = {}) {
        const entry = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            user: localStorage.getItem('activeAgentName') || 'System',
            action: action,
            details: details,
            ipAddress: 'N/A', // TODO: Get actual IP
            userAgent: navigator.userAgent
        };

        // Add to array
        this.auditLogs.unshift(entry);

        // Save to localStorage
        this.saveToLocalStorage();

        // Sync to cloud (async, don't wait)
        this.syncToCloud(entry).catch(err => console.error('Cloud sync failed:', err));

        console.log('📝 Audit logged:', action, details);

        return entry;
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Save to localStorage
     */
    saveToLocalStorage() {
        try {
            // Keep only last 1000 entries in localStorage
            const logsToSave = this.auditLogs.slice(0, 1000);
            localStorage.setItem('auditTrail', JSON.stringify(logsToSave));
        } catch (error) {
            console.error('❌ Failed to save audit logs:', error);
        }
    }

    /**
     * Sync to cloud
     */
    async syncToCloud(entry) {
        // TODO: Implement cloud sync
        return Promise.resolve();
    }

    /**
     * Apply filters
     */
    applyFilters() {
        let filtered = [...this.auditLogs];

        // Filter by user
        if (this.currentFilters.user !== 'all') {
            filtered = filtered.filter(log => log.user === this.currentFilters.user);
        }

        // Filter by action
        if (this.currentFilters.action !== 'all') {
            filtered = filtered.filter(log => log.action === this.currentFilters.action);
        }

        // Filter by date range
        if (this.currentFilters.dateRange !== 'all') {
            const now = new Date();
            let startDate;

            switch (this.currentFilters.dateRange) {
                case 'today':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    break;
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
                    break;
            }

            if (startDate) {
                filtered = filtered.filter(log => new Date(log.timestamp) >= startDate);
            }
        }

        // Filter by search term
        if (this.currentFilters.searchTerm) {
            const term = this.currentFilters.searchTerm.toLowerCase();
            filtered = filtered.filter(log => {
                return (
                    log.user.toLowerCase().includes(term) ||
                    log.action.toLowerCase().includes(term) ||
                    JSON.stringify(log.details).toLowerCase().includes(term)
                );
            });
        }

        this.filteredLogs = filtered;
    }

    /**
     * Set filter
     */
    setFilter(filterType, value) {
        this.currentFilters[filterType] = value;
        this.applyFilters();
        this.render();
    }

    /**
     * Get unique users
     */
    getUniqueUsers() {
        const users = [...new Set(this.auditLogs.map(log => log.user))];
        return users.sort();
    }

    /**
     * Get unique actions
     */
    getUniqueActions() {
        const actions = [...new Set(this.auditLogs.map(log => log.action))];
        return actions.sort();
    }

    /**
     * Render audit trail UI
     */
    render(containerId = 'auditTrailContainer') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('❌ Audit trail container not found');
            return;
        }

        const html = `
            <div class="audit-trail-wrapper">
                ${this.renderHeader()}
                ${this.renderFilters()}
                ${this.renderTimeline()}
            </div>
        `;

        container.innerHTML = html;
        this.attachEventListeners();
    }

    /**
     * Render header
     */
    renderHeader() {
        return `
            <div class="audit-header">
                <div>
                    <h2 class="audit-title">
                        <i class="fas fa-clipboard-list"></i>
                        Audit Trail
                    </h2>
                    <p class="audit-subtitle">Complete activity history and compliance tracking</p>
                </div>
                <div class="audit-actions">
                    <button class="btn btn-secondary" onclick="auditTrail.exportToCSV()">
                        <i class="fas fa-download"></i> Export CSV
                    </button>
                    <button class="btn btn-secondary" onclick="auditTrail.exportToPDF()">
                        <i class="fas fa-file-pdf"></i> Export PDF
                    </button>
                    <button class="btn btn-primary" onclick="auditTrail.refresh()">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render filters
     */
    renderFilters() {
        const users = this.getUniqueUsers();
        const actions = this.getUniqueActions();

        return `
            <div class="audit-filters">
                <div class="filter-group">
                    <label><i class="fas fa-user"></i> User</label>
                    <select id="auditFilterUser" class="filter-select">
                        <option value="all">All Users</option>
                        ${users.map(user => `<option value="${user}" ${this.currentFilters.user === user ? 'selected' : ''}>${user}</option>`).join('')}
                    </select>
                </div>

                <div class="filter-group">
                    <label><i class="fas fa-bolt"></i> Action</label>
                    <select id="auditFilterAction" class="filter-select">
                        <option value="all">All Actions</option>
                        ${actions.map(action => {
            const actionInfo = this.actionTypes[action] || { label: action };
            return `<option value="${action}" ${this.currentFilters.action === action ? 'selected' : ''}>${actionInfo.label}</option>`;
        }).join('')}
                    </select>
                </div>

                <div class="filter-group">
                    <label><i class="fas fa-calendar"></i> Date Range</label>
                    <select id="auditFilterDate" class="filter-select">
                        <option value="all" ${this.currentFilters.dateRange === 'all' ? 'selected' : ''}>All Time</option>
                        <option value="today" ${this.currentFilters.dateRange === 'today' ? 'selected' : ''}>Today</option>
                        <option value="week" ${this.currentFilters.dateRange === 'week' ? 'selected' : ''}>Last 7 Days</option>
                        <option value="month" ${this.currentFilters.dateRange === 'month' ? 'selected' : ''}>Last 30 Days</option>
                    </select>
                </div>

                <div class="filter-group filter-search">
                    <label><i class="fas fa-search"></i> Search</label>
                    <input 
                        type="text" 
                        id="auditFilterSearch" 
                        class="filter-input" 
                        placeholder="Search audit logs..."
                        value="${this.currentFilters.searchTerm}"
                    />
                </div>

                <div class="filter-stats">
                    <span class="stat-badge">
                        <i class="fas fa-list"></i>
                        ${this.filteredLogs.length} of ${this.auditLogs.length} entries
                    </span>
                </div>
            </div>
        `;
    }

    /**
     * Render timeline
     */
    renderTimeline() {
        if (this.filteredLogs.length === 0) {
            return this.renderEmpty();
        }

        const logsHtml = this.filteredLogs.map(log => this.renderLogEntry(log)).join('');

        return `
            <div class="audit-timeline">
                ${logsHtml}
            </div>
        `;
    }

    /**
     * Render single log entry
     */
    renderLogEntry(log) {
        const actionInfo = this.actionTypes[log.action] || {
            icon: 'fa-circle',
            color: '#94a3b8',
            label: log.action
        };

        const timeAgo = this.getTimeAgo(log.timestamp);
        const formattedTime = new Date(log.timestamp).toLocaleString();

        return `
            <div class="audit-entry">
                <div class="audit-entry-icon" style="background: ${actionInfo.color}15; color: ${actionInfo.color};">
                    <i class="fas ${actionInfo.icon}"></i>
                </div>
                <div class="audit-entry-content">
                    <div class="audit-entry-header">
                        <div class="audit-entry-action">${actionInfo.label}</div>
                        <div class="audit-entry-time" title="${formattedTime}">${timeAgo}</div>
                    </div>
                    <div class="audit-entry-user">
                        <i class="fas fa-user"></i> ${log.user}
                    </div>
                    ${this.renderLogDetails(log.details)}
                </div>
            </div>
        `;
    }

    /**
     * Render log details
     */
    renderLogDetails(details) {
        if (!details || Object.keys(details).length === 0) {
            return '';
        }

        const detailsHtml = Object.entries(details)
            .map(([key, value]) => {
                return `<div class="detail-item"><strong>${this.formatKey(key)}:</strong> ${this.formatValue(value)}</div>`;
            })
            .join('');

        return `<div class="audit-entry-details">${detailsHtml}</div>`;
    }

    /**
     * Format key for display
     */
    formatKey(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    /**
     * Format value for display
     */
    formatValue(value) {
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value);
    }

    /**
     * Get time ago string
     */
    getTimeAgo(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return then.toLocaleDateString();
    }

    /**
     * Render empty state
     */
    renderEmpty() {
        return `
            <div class="audit-empty">
                <i class="fas fa-clipboard-list"></i>
                <h3>No Audit Entries Found</h3>
                <p>No activities match your current filters</p>
                <button class="btn btn-primary" onclick="auditTrail.clearFilters()">
                    Clear Filters
                </button>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // User filter
        const userFilter = document.getElementById('auditFilterUser');
        if (userFilter) {
            userFilter.addEventListener('change', (e) => {
                this.setFilter('user', e.target.value);
            });
        }

        // Action filter
        const actionFilter = document.getElementById('auditFilterAction');
        if (actionFilter) {
            actionFilter.addEventListener('change', (e) => {
                this.setFilter('action', e.target.value);
            });
        }

        // Date filter
        const dateFilter = document.getElementById('auditFilterDate');
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.setFilter('dateRange', e.target.value);
            });
        }

        // Search filter
        const searchFilter = document.getElementById('auditFilterSearch');
        if (searchFilter) {
            searchFilter.addEventListener('input', (e) => {
                this.setFilter('searchTerm', e.target.value);
            });
        }
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.currentFilters = {
            user: 'all',
            action: 'all',
            dateRange: 'all',
            searchTerm: ''
        };
        this.applyFilters();
        this.render();
    }

    /**
     * Refresh audit trail
     */
    async refresh() {
        await this.loadAuditLogs();
        this.render();
    }

    /**
     * Export to CSV
     */
    exportToCSV() {
        const headers = ['Timestamp', 'User', 'Action', 'Details'];
        const rows = this.filteredLogs.map(log => [
            new Date(log.timestamp).toLocaleString(),
            log.user,
            this.actionTypes[log.action]?.label || log.action,
            JSON.stringify(log.details)
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        this.downloadFile(csv, 'audit-trail.csv', 'text/csv');
        this.log('EXPORT', { format: 'CSV', entries: this.filteredLogs.length });
    }

    /**
     * Export to PDF
     */
    exportToPDF() {
        // Simple PDF export (would need a library like jsPDF for production)
        alert('PDF export feature coming soon! Use CSV export for now.');
        this.log('EXPORT', { format: 'PDF', entries: this.filteredLogs.length });
    }

    /**
     * Download file helper
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Open audit trail modal
     */
    openModal() {
        // Create modal if it doesn't exist
        let modal = document.getElementById('auditTrailModal');
        if (!modal) {
            modal = this.createModal();
            document.body.appendChild(modal);
        }

        // Render content
        this.render('auditTrailModalContent');

        // Show modal
        modal.classList.add('active');
    }

    /**
     * Create modal
     */
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'auditTrailModal';
        modal.className = 'audit-modal';
        modal.innerHTML = `
            <div class="audit-modal-overlay" onclick="auditTrail.closeModal()"></div>
            <div class="audit-modal-content">
                <button class="audit-modal-close" onclick="auditTrail.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div id="auditTrailModalContent"></div>
            </div>
        `;
        return modal;
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('auditTrailModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

// Create global instance
const auditTrail = new AuditTrailManager();

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        auditTrail.init();
    });
} else {
    auditTrail.init();
}

// Make globally available
window.auditTrail = auditTrail;

console.log('✅ Audit Trail Manager v1.0 loaded');
console.log('💡 Usage: auditTrail.log("ACTION_NAME", { details })');
