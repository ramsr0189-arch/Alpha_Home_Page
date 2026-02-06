// ═══════════════════════════════════════════════════════════════════════════
// ALPHA PROFIN - CUSTOMER JOURNEY TIMELINE v2.0
// Industry-Leading Visual Journey Tracking System
// ═══════════════════════════════════════════════════════════════════════════

const JourneyTimeline = {
    // Configuration
    config: {
        animationDuration: 300,
        autoRefresh: true,
        refreshInterval: 30000,
        showPredictions: true,
        showBottlenecks: true
    },

    // State
    currentLeadId: null,
    timelineData: null,
    isInitialized: false,

    // Journey Stages
    STAGES: {
        SUBMITTED: {
            icon: 'fa-paper-plane',
            color: '#3b82f6',
            label: 'Lead Submitted',
            avgDays: 0
        },
        DOCUMENTS_COLLECTED: {
            icon: 'fa-file-alt',
            color: '#8b5cf6',
            label: 'Documents Collected',
            avgDays: 1
        },
        VERIFICATION: {
            icon: 'fa-shield-alt',
            color: '#06b6d4',
            label: 'Verification in Progress',
            avgDays: 2
        },
        BANK_LOGIN: {
            icon: 'fa-university',
            color: '#10b981',
            label: 'Bank Login Completed',
            avgDays: 3
        },
        CREDIT_REVIEW: {
            icon: 'fa-search-dollar',
            color: '#f59e0b',
            label: 'Credit Assessment',
            avgDays: 5
        },
        FIELD_VERIFICATION: {
            icon: 'fa-map-marker-alt',
            color: '#ec4899',
            label: 'Field Verification',
            avgDays: 7
        },
        SANCTIONED: {
            icon: 'fa-check-circle',
            color: '#10b981',
            label: 'Sanction Letter Issued',
            avgDays: 10
        },
        OFFER_ACCEPTED: {
            icon: 'fa-handshake',
            color: '#8b5cf6',
            label: 'Offer Accepted',
            avgDays: 11
        },
        AGREEMENT: {
            icon: 'fa-file-signature',
            color: '#06b6d4',
            label: 'Agreement & eNACH',
            avgDays: 13
        },
        DISBURSED: {
            icon: 'fa-money-bill-wave',
            color: '#10b981',
            label: 'Funds Disbursed',
            avgDays: 15,
            isFinal: true
        },
        REJECTED: {
            icon: 'fa-times-circle',
            color: '#ef4444',
            label: 'Application Rejected',
            avgDays: 0,
            isFinal: true
        }
    },

    /**
     * Initialize the journey timeline
     */
    init() {
        if (this.isInitialized) return;

        console.log('🗺️ Initializing Customer Journey Timeline v2.0...');

        this.isInitialized = true;
        console.log('✅ Journey Timeline Ready!');
    },

    /**
     * Show journey for a specific lead
     */
    show(leadId) {
        this.currentLeadId = leadId;
        const lead = this.getLeadData(leadId);

        if (!lead) {
            console.error('Lead not found:', leadId);
            return;
        }

        this.timelineData = this.buildTimeline(lead);
        this.render();
    },

    /**
     * Get lead data (integrate with your data source)
     */
    getLeadData(leadId) {
        // TODO: Integrate with actual data source
        // For now, return mock data
        return {
            id: leadId,
            name: 'Rajesh Kumar',
            product: 'Business Loan',
            amount: 5000000,
            currentStage: 'CREDIT_REVIEW',
            submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            events: [
                {
                    stage: 'SUBMITTED',
                    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    user: 'Agent: Priya Sharma',
                    notes: 'Lead submitted via mobile app'
                },
                {
                    stage: 'DOCUMENTS_COLLECTED',
                    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                    user: 'Agent: Priya Sharma',
                    notes: 'All KYC documents uploaded'
                },
                {
                    stage: 'VERIFICATION',
                    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                    user: 'Ops Team',
                    notes: 'Document verification in progress'
                },
                {
                    stage: 'BANK_LOGIN',
                    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    user: 'Admin',
                    notes: 'Bank login completed successfully'
                },
                {
                    stage: 'CREDIT_REVIEW',
                    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                    user: 'Credit Team',
                    notes: 'Underwriting in progress - CIBIL: 780'
                }
            ],
            communications: [
                {
                    type: 'call',
                    timestamp: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString(),
                    from: 'Agent',
                    notes: 'Initial consultation call - 15 mins'
                },
                {
                    type: 'whatsapp',
                    timestamp: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString(),
                    from: 'Agent',
                    notes: 'Sent document checklist'
                },
                {
                    type: 'email',
                    timestamp: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
                    from: 'System',
                    notes: 'Bank login confirmation email sent'
                },
                {
                    type: 'call',
                    timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
                    from: 'Credit Team',
                    notes: 'Clarification call - 8 mins'
                }
            ]
        };
    },

    /**
     * Build timeline data structure
     */
    buildTimeline(lead) {
        const timeline = {
            lead: lead,
            stages: [],
            currentStageIndex: 0,
            progress: 0,
            expectedCompletion: null,
            daysElapsed: 0,
            bottlenecks: []
        };

        // Calculate days elapsed
        const submittedDate = new Date(lead.submittedAt);
        const now = new Date();
        timeline.daysElapsed = Math.floor((now - submittedDate) / (1000 * 60 * 60 * 24));

        // Build stage list
        const stageKeys = Object.keys(this.STAGES).filter(key => key !== 'REJECTED' || lead.currentStage === 'REJECTED');

        stageKeys.forEach((stageKey, index) => {
            const stageConfig = this.STAGES[stageKey];
            const event = lead.events.find(e => e.stage === stageKey);

            const stage = {
                key: stageKey,
                label: stageConfig.label,
                icon: stageConfig.icon,
                color: stageConfig.color,
                avgDays: stageConfig.avgDays,
                status: 'pending',
                timestamp: null,
                user: null,
                notes: null,
                daysInStage: 0
            };

            if (event) {
                stage.status = 'completed';
                stage.timestamp = event.timestamp;
                stage.user = event.user;
                stage.notes = event.notes;

                // Calculate days in stage
                if (index > 0 && timeline.stages[index - 1].timestamp) {
                    const prevDate = new Date(timeline.stages[index - 1].timestamp);
                    const currDate = new Date(event.timestamp);
                    stage.daysInStage = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
                }
            } else if (stageKey === lead.currentStage) {
                stage.status = 'current';
                timeline.currentStageIndex = index;

                // Calculate days in current stage
                const lastEvent = lead.events[lead.events.length - 1];
                if (lastEvent) {
                    const lastDate = new Date(lastEvent.timestamp);
                    stage.daysInStage = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
                }
            }

            timeline.stages.push(stage);
        });

        // Calculate progress
        const completedStages = timeline.stages.filter(s => s.status === 'completed').length;
        timeline.progress = Math.round((completedStages / timeline.stages.length) * 100);

        // Calculate expected completion
        if (lead.currentStage !== 'DISBURSED' && lead.currentStage !== 'REJECTED') {
            const remainingStages = timeline.stages.slice(timeline.currentStageIndex + 1);
            const remainingDays = remainingStages.reduce((sum, stage) => sum + stage.avgDays, 0);
            const expectedDate = new Date(now.getTime() + remainingDays * 24 * 60 * 60 * 1000);
            timeline.expectedCompletion = expectedDate;
        }

        // Identify bottlenecks
        timeline.stages.forEach((stage, index) => {
            if (stage.daysInStage > stage.avgDays * 1.5 && stage.status !== 'pending') {
                timeline.bottlenecks.push({
                    stage: stage.label,
                    daysInStage: stage.daysInStage,
                    avgDays: stage.avgDays,
                    delay: stage.daysInStage - stage.avgDays
                });
            }
        });

        return timeline;
    },

    /**
     * Render the timeline
     */
    render() {
        const container = document.getElementById('journeyTimelineContainer');
        if (!container) {
            console.error('Journey timeline container not found');
            return;
        }

        const html = this.generateHTML();
        container.innerHTML = html;

        // Animate timeline
        setTimeout(() => {
            this.animateTimeline();
        }, 100);
    },

    /**
     * Generate HTML for timeline
     */
    generateHTML() {
        const { lead, stages, progress, expectedCompletion, daysElapsed, bottlenecks } = this.timelineData;

        return `
            <div class="journey-timeline-wrapper">
                <!-- Header -->
                <div class="journey-header">
                    <div class="journey-header-left">
                        <h3 class="journey-title">
                            <i class="fas fa-route"></i>
                            Customer Journey
                        </h3>
                        <p class="journey-subtitle">
                            ${lead.name} • ${lead.product} • ₹${this.formatCurrency(lead.amount)}
                        </p>
                    </div>
                    <div class="journey-header-right">
                        <div class="journey-stat">
                            <div class="journey-stat-label">Progress</div>
                            <div class="journey-stat-value">${progress}%</div>
                        </div>
                        <div class="journey-stat">
                            <div class="journey-stat-label">Days Elapsed</div>
                            <div class="journey-stat-value">${daysElapsed}</div>
                        </div>
                        ${expectedCompletion ? `
                            <div class="journey-stat">
                                <div class="journey-stat-label">Expected</div>
                                <div class="journey-stat-value">${this.formatDate(expectedCompletion)}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Progress Bar -->
                <div class="journey-progress-bar">
                    <div class="journey-progress-fill" style="width: ${progress}%"></div>
                </div>

                <!-- Bottlenecks Alert -->
                ${bottlenecks.length > 0 ? `
                    <div class="journey-bottleneck-alert">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div>
                            <strong>Bottleneck Detected:</strong>
                            ${bottlenecks.map(b => `${b.stage} (${b.delay} days delay)`).join(', ')}
                        </div>
                    </div>
                ` : ''}

                <!-- Timeline -->
                <div class="journey-timeline">
                    ${stages.map((stage, index) => this.renderStage(stage, index)).join('')}
                </div>

                <!-- Communications -->
                <div class="journey-communications">
                    <h4 class="journey-section-title">
                        <i class="fas fa-comments"></i>
                        Communication History
                    </h4>
                    <div class="journey-comm-list">
                        ${lead.communications.map(comm => this.renderCommunication(comm)).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render a single stage
     */
    renderStage(stage, index) {
        const statusClass = `journey-stage-${stage.status}`;

        return `
            <div class="journey-stage ${statusClass}" data-index="${index}">
                <div class="journey-stage-marker">
                    <div class="journey-stage-icon" style="background: ${stage.color}">
                        <i class="fas ${stage.icon}"></i>
                    </div>
                    ${index < this.timelineData.stages.length - 1 ? `
                        <div class="journey-stage-line"></div>
                    ` : ''}
                </div>
                <div class="journey-stage-content">
                    <div class="journey-stage-header">
                        <h4 class="journey-stage-title">${stage.label}</h4>
                        ${stage.timestamp ? `
                            <span class="journey-stage-date">${this.formatDateTime(stage.timestamp)}</span>
                        ` : stage.status === 'current' ? `
                            <span class="journey-stage-badge">In Progress</span>
                        ` : `
                            <span class="journey-stage-badge pending">Pending</span>
                        `}
                    </div>
                    ${stage.user || stage.notes ? `
                        <div class="journey-stage-details">
                            ${stage.user ? `<div class="journey-stage-user"><i class="fas fa-user"></i> ${stage.user}</div>` : ''}
                            ${stage.notes ? `<div class="journey-stage-notes">${stage.notes}</div>` : ''}
                        </div>
                    ` : ''}
                    ${stage.daysInStage > 0 ? `
                        <div class="journey-stage-duration">
                            <i class="fas fa-clock"></i>
                            ${stage.daysInStage} day${stage.daysInStage !== 1 ? 's' : ''}
                            ${stage.daysInStage > stage.avgDays * 1.5 ? `
                                <span class="journey-delay-badge">
                                    <i class="fas fa-exclamation-circle"></i>
                                    Delayed
                                </span>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    /**
     * Render a communication event
     */
    renderCommunication(comm) {
        const icons = {
            call: 'fa-phone',
            whatsapp: 'fa-whatsapp',
            email: 'fa-envelope',
            sms: 'fa-sms',
            meeting: 'fa-handshake'
        };

        const colors = {
            call: '#10b981',
            whatsapp: '#25d366',
            email: '#3b82f6',
            sms: '#8b5cf6',
            meeting: '#f59e0b'
        };

        return `
            <div class="journey-comm-item">
                <div class="journey-comm-icon" style="background: ${colors[comm.type]}">
                    <i class="fas ${icons[comm.type]}"></i>
                </div>
                <div class="journey-comm-content">
                    <div class="journey-comm-header">
                        <span class="journey-comm-from">${comm.from}</span>
                        <span class="journey-comm-time">${this.getTimeAgo(comm.timestamp)}</span>
                    </div>
                    <div class="journey-comm-notes">${comm.notes}</div>
                </div>
            </div>
        `;
    },

    /**
     * Animate timeline
     */
    animateTimeline() {
        const stages = document.querySelectorAll('.journey-stage');
        stages.forEach((stage, index) => {
            setTimeout(() => {
                stage.classList.add('journey-stage-animated');
            }, index * 100);
        });
    },

    /**
     * Format currency
     */
    formatCurrency(amount) {
        if (amount >= 10000000) {
            return `${(amount / 10000000).toFixed(2)}Cr`;
        } else if (amount >= 100000) {
            return `${(amount / 100000).toFixed(2)}L`;
        } else {
            return amount.toLocaleString('en-IN');
        }
    },

    /**
     * Format date
     */
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
        });
    },

    /**
     * Format date and time
     */
    formatDateTime(timestamp) {
        return new Date(timestamp).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Get time ago string
     */
    getTimeAgo(timestamp) {
        const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return this.formatDate(timestamp);
    },

    /**
     * Show timeline in modal
     */
    showModal(leadId) {
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'journeyTimelineModal';
        modal.className = 'journey-modal';
        modal.innerHTML = `
            <div class="journey-modal-overlay" onclick="JourneyTimeline.closeModal()"></div>
            <div class="journey-modal-content">
                <button class="journey-modal-close" onclick="JourneyTimeline.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div id="journeyTimelineContainer"></div>
            </div>
        `;

        document.body.appendChild(modal);

        // Show timeline
        this.show(leadId);

        // Animate modal
        setTimeout(() => {
            modal.classList.add('journey-modal-active');
        }, 10);
    },

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('journeyTimelineModal');
        if (modal) {
            modal.classList.remove('journey-modal-active');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }
};

// Initialize
JourneyTimeline.init();

// Make globally available
window.JourneyTimeline = JourneyTimeline;

console.log('✅ Customer Journey Timeline v2.0 Loaded');
