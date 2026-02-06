// ═══════════════════════════════════════════════════════════════════════════
// ALPHA PROFIN - PIPELINE CONTROLLER v2.0
// Bulletproof pipeline management with retry logic and state machine
// CEO Priority: 100% Reliability
// ═══════════════════════════════════════════════════════════════════════════

class PipelineController {
    constructor() {
        // State
        this.state = 'idle'; // idle, loading, loaded, error
        this.leads = [];
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second base delay

        // DOM elements (cached)
        this.containerEl = null;
        this.workspaceEl = null;

        // Bindings
        this.load = this.load.bind(this);
        this.retry = this.retry.bind(this);
        this.onTabVisible = this.onTabVisible.bind(this);
    }

    /**
     * Initialize controller
     */
    init() {
        console.log('🎯 Pipeline Controller initializing...');

        this.cacheElements();

        if (!this.containerEl) {
            console.error('❌ CRITICAL: pipelineTableWrap not found!');
            return false;
        }

        console.log('✅ Pipeline Controller initialized');
        return true;
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.containerEl = document.getElementById('pipelineTableWrap');
        this.workspaceEl = document.getElementById('pipelineWorkspace');

        if (!this.containerEl) {
            console.error('❌ pipelineTableWrap not found');
        }
        if (!this.workspaceEl) {
            console.error('❌ pipelineWorkspace not found');
        }
    }

    /**
     * Called when pipeline tab becomes visible
     */
    onTabVisible() {
        console.log('👁️ Pipeline tab visible');

        // Re-cache elements in case DOM changed
        if (!this.containerEl) {
            this.cacheElements();
        }

        // Auto-load if not already loaded
        if (this.state !== 'loaded') {
            this.load();
        }
    }

    /**
     * Main load function
     */
    async load(force = false) {
        console.log('🔄 Pipeline load requested (force:', force, ')');

        // Don't reload if already loaded (unless forced)
        if (this.state === 'loaded' && !force) {
            console.log('✅ Pipeline already loaded (use force=true to reload)');
            return;
        }

        // Don't load if already loading
        if (this.state === 'loading') {
            console.log('⏳ Pipeline already loading...');
            return;
        }

        // Check DOM ready
        if (!this.containerEl) {
            console.error('❌ DOM not ready - container not found');
            this.cacheElements();

            if (!this.containerEl) {
                console.error('❌ CRITICAL: Still can\'t find container');
                return;
            }
        }

        // Check workspace visible
        if (this.workspaceEl && this.workspaceEl.style.display === 'none') {
            console.warn('⚠️ Workspace not visible yet, waiting...');
            // Wait a bit and try again
            setTimeout(() => this.load(force), 100);
            return;
        }

        // Start loading
        this.setState('loading');
        this.showLoading();

        try {
            console.log('☁️ Fetching leads from cloud...');

            // Fetch leads
            const allLeads = await this.fetchLeads();
            console.log(`📊 Received ${allLeads.length} leads from cloud`);

            // Filter leads
            const filteredLeads = this.filterLeads(allLeads);
            console.log(`📊 Filtered to ${filteredLeads.length} leads`);

            // Store
            this.leads = filteredLeads;

            // Render
            this.render(filteredLeads);

            // Success
            this.setState('loaded');
            this.retryCount = 0; // Reset retry count

            console.log(`✅ Pipeline loaded successfully: ${filteredLeads.length} leads displayed`);

        } catch (error) {
            console.error('❌ Pipeline load failed:', error);

            // Retry logic
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);

                console.log(`🔄 Retry ${this.retryCount}/${this.maxRetries} in ${delay}ms...`);

                // Show retry in UI
                this.showLoading(); // Update loading message with retry count

                // Exponential backoff retry
                setTimeout(() => this.load(force), delay);

            } else {
                // Max retries reached
                console.error(`❌ Max retries (${this.maxRetries}) reached. Giving up.`);
                this.setState('error');
                this.showError(error.message || 'Failed to load pipeline after multiple attempts');
            }
        }
    }

    /**
     * Fetch leads from cloud
     */
    async fetchLeads() {
        // Check if function exists
        if (typeof syncPipelineFromCloud !== 'function') {
            throw new Error('syncPipelineFromCloud function not available');
        }

        // Call the sync function
        const leads = await syncPipelineFromCloud();

        // Validate
        if (!Array.isArray(leads)) {
            throw new Error('Invalid lead data: expected array');
        }

        return leads;
    }

    /**
     * Filter leads by current agent
     */
    filterLeads(allLeads) {
        const currentAgent = (localStorage.getItem('activeAgentName') || 'AGENT').trim().toUpperCase();
        console.log(`👤 Current agent: "${currentAgent}"`);

        // Filter by agent
        const filtered = allLeads.filter(lead => {
            const leadAgent = (lead.agent || '').trim().toUpperCase();
            const matches = leadAgent === currentAgent || leadAgent === 'SYSTEM' || leadAgent === '';

            if (matches) {
                console.log(`  ✅ ${lead.client} (agent: "${leadAgent}")`);
            }

            return matches;
        });

        // Bypass mode: if no leads after filtering but have leads in system
        if (filtered.length === 0 && allLeads.length > 0) {
            console.warn('⚠️ ═══════════════════════════════════════════');
            console.warn('⚠️ BYPASS MODE ACTIVATED!');
            console.warn('⚠️ Agent filter excluded all leads.');
            console.warn('⚠️ Showing ALL leads instead.');
            console.warn('⚠️ ═══════════════════════════════════════════');
            return allLeads;
        }

        return filtered;
    }

    /**
     * Render leads
     */
    render(leads) {
        if (!this.containerEl) {
            console.error('❌ Cannot render: container not found');
            return;
        }

        if (leads.length === 0) {
            this.showEmpty();
            return;
        }

        // Sort by date (newest first)
        const sorted = leads.sort((a, b) => {
            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            return dateB - dateA;
        });

        // Render cards
        const cardsHtml = sorted.map(lead => this.renderCard(lead)).join('');

        const html = `
            <div style="display:flex; flex-direction:column; gap:16px; padding:16px;">
                ${cardsHtml}
            </div>
        `;

        this.containerEl.innerHTML = html;
        console.log(`✅ Rendered ${sorted.length} lead cards`);
    }

    /**
     * Render single lead card
     */
    renderCard(lead) {
        // Use existing renderTrackerCard if available
        if (typeof renderTrackerCard === 'function') {
            return renderTrackerCard(lead);
        }

        // Fallback simple card
        return `
            <div class="tracker-card glass" style="padding:16px; border:1px solid #e2e8f0; border-radius:12px; background:white;">
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
                    <div>
                        <div style="font-weight:700; font-size:14px; color:#111827;">${lead.client || 'Unknown Client'}</div>
                        <div style="font-size:11px; color:#64748b; margin-top:2px;">ID: ${lead.id || 'N/A'}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:700; font-size:16px; color:#3b82f6;">₹${lead.displayAmount || lead.amount || '0'}</div>
                        <div style="font-size:10px; color:#64748b;">${lead.type || 'BL'}</div>
                    </div>
                </div>
                <div style="padding:8px; background:#f1f5f9; border-radius:6px; margin-top:12px;">
                    <div style="font-size:11px; color:#64748b; font-weight:600;">STATUS</div>
                    <div style="font-size:12px; color:#111827; font-weight:700; margin-top:4px;">${lead.status || 'Submitted'}</div>
                </div>
            </div>
        `;
    }

    /**
     * Show loading state
     */
    showLoading() {
        if (!this.containerEl) return;

        this.containerEl.innerHTML = `
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px; color:var(--primary);">
                <i class="fas fa-circle-notch fa-spin" style="font-size:30px; margin-bottom:12px;"></i>
                <div style="font-size:12px; font-weight:700; letter-spacing:1px;">LOADING PIPELINE...</div>
                <div style="font-size:10px; color:#64748b; margin-top:8px;">Syncing from cloud</div>
                ${this.retryCount > 0 ? `<div style="font-size:10px; color:#f59e0b; margin-top:8px; font-weight:600;">Retry attempt ${this.retryCount} of ${this.maxRetries}</div>` : ''}
            </div>
        `;
    }

    /**
     * Show error state
     */
    showError(message) {
        if (!this.containerEl) return;

        this.containerEl.innerHTML = `
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px; color:#ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size:40px; margin-bottom:16px; opacity:0.8;"></i>
                <div style="font-weight:700; font-size:16px; margin-bottom:8px; color:#111827;">Pipeline Load Failed</div>
                <div style="font-size:12px; color:#64748b; margin-bottom:4px; text-align:center; max-width:400px;">${message}</div>
                <div style="font-size:11px; color:#94a3b8; margin-bottom:20px;">Check your internet connection and try again</div>
                <div style="display:flex; gap:12px;">
                    <button class="btn" style="background:var(--primary); color:white; font-weight:700;" onclick="pipelineController.retry()">
                        <i class="fas fa-sync-alt"></i> RETRY NOW
                    </button>
                    <button class="btn" style="background:#f1f5f9; color:#64748b;" onclick="diagnosePipeline()">
                        <i class="fas fa-bug"></i> RUN DIAGNOSTICS
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Show empty state
     */
    showEmpty() {
        if (!this.containerEl) return;

        const currentAgent = localStorage.getItem('activeAgentName') || 'AGENT';

        this.containerEl.innerHTML = `
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px; color:#94a3b8;">
                <i class="fas fa-inbox" style="font-size:40px; margin-bottom:16px; opacity:0.3;"></i>
                <div style="font-weight:700; font-size:16px; margin-bottom:8px; color:#111827;">No Leads Found</div>
                <div style="font-size:12px; margin-bottom:4px;">No leads assigned to ${currentAgent}</div>
                <div style="font-size:11px; color:#94a3b8; margin-bottom:20px;">Submit your first lead to get started</div>
                <button class="btn" style="background:var(--primary); color:white; font-weight:700;" onclick="switchGlobalMode('lead')">
                    <i class="fas fa-plus"></i> SUBMIT NEW LEAD
                </button>
            </div>
        `;
    }

    /**
     * Retry (max retries reached, user clicks retry)
     */
    retry() {
        console.log('🔄 Manual retry triggered by user');
        this.retryCount = 0; // Reset retry counter
        this.load(true); // Force reload
    }

    /**
     * Set state with logging
     */
    setState(newState) {
        if (this.state !== newState) {
            console.log(`🔄 Pipeline state: ${this.state} → ${newState}`);
            this.state = newState;
        }
    }

    /**
     * Get current state
     */
    getState() {
        return this.state;
    }

    /**
     * Get current leads
     */
    getLeads() {
        return this.leads;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

// Create global instance
const pipelineController = new PipelineController();

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const success = pipelineController.init();
        if (success) {
            console.log('✅ PipelineController ready to use');
        }
    });
} else {
    const success = pipelineController.init();
    if (success) {
        console.log('✅ PipelineController ready to use');
    }
}

// Make globally available
window.pipelineController = pipelineController;

console.log('✅ PipelineController v2.0 loaded');
console.log('💡 Usage: pipelineController.load()');
