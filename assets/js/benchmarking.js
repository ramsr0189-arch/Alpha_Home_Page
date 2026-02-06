// ═══════════════════════════════════════════════════════════════════════════
// ALPHA PROFIN - PERFORMANCE BENCHMARKING SYSTEM v1.0
// AI-powered performance analytics and goal tracking
// Phase 2A - Feature 4
// ═══════════════════════════════════════════════════════════════════════════

class PerformanceBenchmarking {
    constructor() {
        this.currentAgent = localStorage.getItem('activeAgentName') || 'Agent';
        this.performanceData = null;
        this.benchmarks = null;
        this.goals = [];
        this.timeframe = 'month'; // week, month, quarter, year

        // Performance metrics
        this.metrics = {
            leadsSubmitted: { label: 'Leads Submitted', icon: 'fa-file-alt', color: '#3b82f6' },
            leadsApproved: { label: 'Leads Approved', icon: 'fa-check-circle', color: '#10b981' },
            conversionRate: { label: 'Conversion Rate', icon: 'fa-percentage', color: '#f59e0b' },
            totalRevenue: { label: 'Total Revenue', icon: 'fa-rupee-sign', color: '#8b5cf6' },
            avgDealSize: { label: 'Avg Deal Size', icon: 'fa-chart-line', color: '#06b6d4' },
            responseTime: { label: 'Response Time', icon: 'fa-clock', color: '#ec4899' },
            customerSatisfaction: { label: 'Customer Satisfaction', icon: 'fa-smile', color: '#10b981' },
            activePipeline: { label: 'Active Pipeline', icon: 'fa-funnel-dollar', color: '#6366f1' }
        };
    }

    /**
     * Initialize benchmarking system
     */
    async init() {
        console.log('📊 Performance Benchmarking initializing...');
        await this.loadPerformanceData();
        await this.loadBenchmarks();
        await this.loadGoals();
        console.log('✅ Performance Benchmarking initialized');
    }

    /**
     * Load performance data
     */
    async loadPerformanceData() {
        try {
            // Load from localStorage
            const localData = this.loadLocalPerformanceData();

            // Calculate metrics from leads
            const calculatedData = await this.calculateMetrics();

            // Merge
            this.performanceData = { ...localData, ...calculatedData };

            console.log('📊 Performance data loaded:', this.performanceData);
        } catch (error) {
            console.error('❌ Failed to load performance data:', error);
            this.performanceData = this.getDefaultPerformanceData();
        }
    }

    /**
     * Load local performance data
     */
    loadLocalPerformanceData() {
        try {
            const data = localStorage.getItem(`performance_${this.currentAgent}`);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            return {};
        }
    }

    /**
     * Calculate metrics from actual leads
     */
    async calculateMetrics() {
        try {
            // Get leads from localStorage
            const allLeads = JSON.parse(localStorage.getItem('allLeads') || '[]');

            // Filter by current agent and timeframe
            const agentLeads = this.filterLeadsByTimeframe(allLeads);

            // Calculate metrics
            const leadsSubmitted = agentLeads.length;
            const leadsApproved = agentLeads.filter(l =>
                ['Sanctioned', 'Disbursed', 'Approved'].includes(l.status)
            ).length;
            const conversionRate = leadsSubmitted > 0 ? (leadsApproved / leadsSubmitted * 100) : 0;

            const totalRevenue = agentLeads.reduce((sum, lead) => {
                const amount = parseFloat(lead.amount?.replace(/[^0-9.]/g, '') || 0);
                return sum + (amount * 0.01); // Assuming 1% commission
            }, 0);

            const avgDealSize = leadsSubmitted > 0 ? (totalRevenue / leadsSubmitted) : 0;

            return {
                leadsSubmitted,
                leadsApproved,
                conversionRate: Math.round(conversionRate * 10) / 10,
                totalRevenue: Math.round(totalRevenue),
                avgDealSize: Math.round(avgDealSize),
                responseTime: this.calculateAvgResponseTime(agentLeads),
                customerSatisfaction: this.calculateSatisfactionScore(agentLeads),
                activePipeline: agentLeads.filter(l =>
                    !['Rejected', 'Disbursed'].includes(l.status)
                ).length
            };
        } catch (error) {
            console.error('❌ Failed to calculate metrics:', error);
            return {};
        }
    }

    /**
     * Update metrics from external source (Cloud Integration)
     */
    updateMetrics(newMetrics) {
        if (!newMetrics) return;

        // Merge with existing
        this.performanceData = { ...this.performanceData, ...newMetrics };

        // Save to local
        localStorage.setItem(`performance_${this.currentAgent}`, JSON.stringify(this.performanceData));

        // Re-render if visible
        const container = document.getElementById('benchmarkingModalContent');
        if (container && document.getElementById('benchmarkingModal')?.classList.contains('active')) {
            this.render('benchmarkingModalContent');
        }

        console.log('✅ Benchmarking metrics updated from Cloud');
    }

    /**
     * Filter leads by timeframe
     */
    filterLeadsByTimeframe(allLeads) {
        const now = new Date();
        let startDate;

        switch (this.timeframe) {
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'quarter':
                startDate = new Date(now.setMonth(now.getMonth() - 3));
                break;
            case 'year':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                startDate = new Date(now.setMonth(now.getMonth() - 1));
        }

        return allLeads.filter(lead => {
            const leadAgent = (lead.agent || '').trim().toUpperCase();
            const currentAgentUpper = this.currentAgent.trim().toUpperCase();
            const matchesAgent = leadAgent === currentAgentUpper;

            const leadDate = new Date(lead.date || lead.timestamp);
            const matchesTimeframe = leadDate >= startDate;

            return matchesAgent && matchesTimeframe;
        });
    }

    /**
     * Calculate average response time
     */
    calculateAvgResponseTime(leads) {
        // Placeholder - would need actual response time data
        return Math.floor(Math.random() * 60) + 10; // 10-70 minutes
    }

    /**
     * Calculate satisfaction score
     */
    calculateSatisfactionScore(leads) {
        // Placeholder - would need actual satisfaction data
        return (Math.random() * 1.5 + 3.5).toFixed(1); // 3.5-5.0
    }

    /**
     * Get default performance data
     */
    getDefaultPerformanceData() {
        return {
            leadsSubmitted: 0,
            leadsApproved: 0,
            conversionRate: 0,
            totalRevenue: 0,
            avgDealSize: 0,
            responseTime: 0,
            customerSatisfaction: 0,
            activePipeline: 0
        };
    }

    /**
     * Load benchmarks (industry averages and top performers)
     */
    async loadBenchmarks() {
        // In production, this would come from backend
        this.benchmarks = {
            industry: {
                leadsSubmitted: 25,
                leadsApproved: 15,
                conversionRate: 60,
                totalRevenue: 150000,
                avgDealSize: 10000,
                responseTime: 30,
                customerSatisfaction: 4.2,
                activePipeline: 12
            },
            topPerformer: {
                leadsSubmitted: 45,
                leadsApproved: 35,
                conversionRate: 78,
                totalRevenue: 350000,
                avgDealSize: 10000,
                responseTime: 15,
                customerSatisfaction: 4.8,
                activePipeline: 20
            },
            team: {
                leadsSubmitted: 30,
                leadsApproved: 20,
                conversionRate: 67,
                totalRevenue: 200000,
                avgDealSize: 10000,
                responseTime: 25,
                customerSatisfaction: 4.4,
                activePipeline: 15
            }
        };
    }

    /**
     * Load goals
     */
    async loadGoals() {
        try {
            const goalsData = localStorage.getItem(`goals_${this.currentAgent}`);
            this.goals = goalsData ? JSON.parse(goalsData) : this.getDefaultGoals();
        } catch (error) {
            this.goals = this.getDefaultGoals();
        }
    }

    /**
     * Get default goals
     */
    getDefaultGoals() {
        return [
            {
                id: 'goal_1',
                metric: 'leadsSubmitted',
                target: 30,
                current: this.performanceData?.leadsSubmitted || 0,
                deadline: this.getEndOfMonth(),
                status: 'active'
            },
            {
                id: 'goal_2',
                metric: 'conversionRate',
                target: 70,
                current: this.performanceData?.conversionRate || 0,
                deadline: this.getEndOfMonth(),
                status: 'active'
            },
            {
                id: 'goal_3',
                metric: 'totalRevenue',
                target: 200000,
                current: this.performanceData?.totalRevenue || 0,
                deadline: this.getEndOfMonth(),
                status: 'active'
            }
        ];
    }

    /**
     * Get end of month
     */
    getEndOfMonth() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    }

    /**
     * Set timeframe
     */
    setTimeframe(timeframe) {
        this.timeframe = timeframe;
        this.loadPerformanceData().then(() => this.render());
    }

    /**
     * Calculate percentile rank
     */
    calculatePercentile(metric) {
        const myValue = this.performanceData[metric] || 0;
        const industryValue = this.benchmarks.industry[metric] || 1;
        const topValue = this.benchmarks.topPerformer[metric] || 1;

        if (myValue >= topValue) return 95;
        if (myValue >= industryValue) {
            const range = topValue - industryValue;
            const position = myValue - industryValue;
            return Math.round(50 + (position / range * 45));
        }

        return Math.round((myValue / industryValue) * 50);
    }

    /**
     * Get skill gaps
     */
    getSkillGaps() {
        const gaps = [];

        Object.keys(this.metrics).forEach(metric => {
            const myValue = this.performanceData[metric] || 0;
            const industryValue = this.benchmarks.industry[metric] || 0;
            const gap = industryValue - myValue;

            if (gap > 0) {
                const gapPercentage = (gap / industryValue * 100);
                if (gapPercentage > 10) { // Only show significant gaps
                    gaps.push({
                        metric,
                        gap,
                        gapPercentage: Math.round(gapPercentage),
                        recommendation: this.getRecommendation(metric)
                    });
                }
            }
        });

        // Sort by gap percentage (highest first)
        return gaps.sort((a, b) => b.gapPercentage - a.gapPercentage);
    }

    /**
     * Get recommendation for metric
     */
    getRecommendation(metric) {
        const recommendations = {
            leadsSubmitted: 'Increase daily prospecting activities and follow-ups',
            leadsApproved: 'Focus on lead quality and proper documentation',
            conversionRate: 'Improve qualification process and customer engagement',
            totalRevenue: 'Target higher-value deals and upsell opportunities',
            avgDealSize: 'Focus on premium products and larger ticket sizes',
            responseTime: 'Set up automated responses and prioritize urgent leads',
            customerSatisfaction: 'Enhance communication and follow-up processes',
            activePipeline: 'Maintain consistent lead generation activities'
        };

        return recommendations[metric] || 'Focus on continuous improvement';
    }

    /**
     * Render benchmarking dashboard
     */
    render(containerId = 'benchmarkingContainer') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('❌ Benchmarking container not found');
            return;
        }

        const html = `
            <div class="benchmarking-wrapper">
                ${this.renderHeader()}
                ${this.renderOverview()}
                ${this.renderMetricsComparison()}
                ${this.renderSkillGaps()}
                ${this.renderGoals()}
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
            <div class="benchmark-header">
                <div>
                    <h2 class="benchmark-title">
                        <i class="fas fa-chart-bar"></i>
                        Performance Benchmarking
                    </h2>
                    <p class="benchmark-subtitle">Compare your performance with industry leaders</p>
                </div>
                <div class="benchmark-timeframe">
                    <button class="timeframe-btn ${this.timeframe === 'week' ? 'active' : ''}" data-timeframe="week">Week</button>
                    <button class="timeframe-btn ${this.timeframe === 'month' ? 'active' : ''}" data-timeframe="month">Month</button>
                    <button class="timeframe-btn ${this.timeframe === 'quarter' ? 'active' : ''}" data-timeframe="quarter">Quarter</button>
                    <button class="timeframe-btn ${this.timeframe === 'year' ? 'active' : ''}" data-timeframe="year">Year</button>
                </div>
            </div>
        `;
    }

    /**
     * Render overview cards
     */
    renderOverview() {
        const percentile = this.calculateOverallPercentile();
        const rank = this.getPerformanceRank(percentile);

        return `
            <div class="benchmark-overview">
                <div class="overview-card rank-card">
                    <div class="rank-icon">${rank.icon}</div>
                    <div class="rank-info">
                        <div class="rank-label">Your Rank</div>
                        <div class="rank-value">${rank.label}</div>
                        <div class="rank-percentile">Top ${100 - percentile}%</div>
                    </div>
                </div>
                <div class="overview-card">
                    <i class="fas fa-trophy" style="color: #f59e0b;"></i>
                    <div class="overview-value">${this.performanceData.leadsApproved || 0}</div>
                    <div class="overview-label">Leads Approved</div>
                </div>
                <div class="overview-card">
                    <i class="fas fa-rupee-sign" style="color: #8b5cf6;"></i>
                    <div class="overview-value">₹${this.formatNumber(this.performanceData.totalRevenue || 0)}</div>
                    <div class="overview-label">Total Revenue</div>
                </div>
                <div class="overview-card">
                    <i class="fas fa-percentage" style="color: #10b981;"></i>
                    <div class="overview-value">${this.performanceData.conversionRate || 0}%</div>
                    <div class="overview-label">Conversion Rate</div>
                </div>
            </div>
        `;
    }

    /**
     * Calculate overall percentile
     */
    calculateOverallPercentile() {
        const percentiles = Object.keys(this.metrics).map(metric =>
            this.calculatePercentile(metric)
        );
        return Math.round(percentiles.reduce((a, b) => a + b, 0) / percentiles.length);
    }

    /**
     * Get performance rank
     */
    getPerformanceRank(percentile) {
        if (percentile >= 90) return { label: 'Elite Performer', icon: '👑', color: '#f59e0b' };
        if (percentile >= 75) return { label: 'Top Performer', icon: '⭐', color: '#8b5cf6' };
        if (percentile >= 50) return { label: 'Above Average', icon: '📈', color: '#3b82f6' };
        if (percentile >= 25) return { label: 'Average', icon: '📊', color: '#64748b' };
        return { label: 'Developing', icon: '🌱', color: '#10b981' };
    }

    /**
     * Render metrics comparison
     */
    renderMetricsComparison() {
        const metricsHtml = Object.keys(this.metrics).map(metric =>
            this.renderMetricCard(metric)
        ).join('');

        return `
            <div class="metrics-section">
                <h3 class="section-title">
                    <i class="fas fa-chart-line"></i>
                    Performance Metrics
                </h3>
                <div class="metrics-grid">
                    ${metricsHtml}
                </div>
            </div>
        `;
    }

    /**
     * Render single metric card
     */
    renderMetricCard(metric) {
        const info = this.metrics[metric];
        const myValue = this.performanceData[metric] || 0;
        const industryValue = this.benchmarks.industry[metric] || 0;
        const topValue = this.benchmarks.topPerformer[metric] || 0;
        const percentile = this.calculatePercentile(metric);

        const isAboveIndustry = myValue >= industryValue;
        const performanceClass = isAboveIndustry ? 'above' : 'below';

        return `
            <div class="metric-card ${performanceClass}">
                <div class="metric-header">
                    <div class="metric-icon" style="background: ${info.color}15; color: ${info.color};">
                        <i class="fas ${info.icon}"></i>
                    </div>
                    <div class="metric-info">
                        <div class="metric-label">${info.label}</div>
                        <div class="metric-value">${this.formatMetricValue(metric, myValue)}</div>
                    </div>
                </div>
                <div class="metric-comparison">
                    <div class="comparison-bar">
                        <div class="bar-segment" style="width: ${Math.min(percentile, 100)}%; background: ${info.color};"></div>
                    </div>
                    <div class="comparison-labels">
                        <span class="label-you">You: ${this.formatMetricValue(metric, myValue)}</span>
                        <span class="label-industry">Avg: ${this.formatMetricValue(metric, industryValue)}</span>
                        <span class="label-top">Top: ${this.formatMetricValue(metric, topValue)}</span>
                    </div>
                </div>
                <div class="metric-percentile">
                    <i class="fas ${isAboveIndustry ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                    Top ${100 - percentile}% Percentile
                </div>
            </div>
        `;
    }

    /**
     * Format metric value
     */
    formatMetricValue(metric, value) {
        if (metric === 'totalRevenue' || metric === 'avgDealSize') {
            return '₹' + this.formatNumber(value);
        }
        if (metric === 'conversionRate') {
            return value + '%';
        }
        if (metric === 'responseTime') {
            return value + ' min';
        }
        if (metric === 'customerSatisfaction') {
            return value + '/5';
        }
        return value;
    }

    /**
     * Format number with commas
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * Render skill gaps
     */
    renderSkillGaps() {
        const gaps = this.getSkillGaps();

        if (gaps.length === 0) {
            return `
                <div class="skill-gaps-section">
                    <h3 class="section-title">
                        <i class="fas fa-bullseye"></i>
                        Skill Gaps
                    </h3>
                    <div class="no-gaps">
                        <i class="fas fa-check-circle"></i>
                        <p>Excellent! You're meeting or exceeding industry standards across all metrics.</p>
                    </div>
                </div>
            `;
        }

        const gapsHtml = gaps.map(gap => {
            const info = this.metrics[gap.metric];
            return `
                <div class="gap-card">
                    <div class="gap-header">
                        <div class="gap-icon" style="background: ${info.color}15; color: ${info.color};">
                            <i class="fas ${info.icon}"></i>
                        </div>
                        <div class="gap-info">
                            <div class="gap-metric">${info.label}</div>
                            <div class="gap-percentage">${gap.gapPercentage}% below average</div>
                        </div>
                    </div>
                    <div class="gap-recommendation">
                        <i class="fas fa-lightbulb"></i>
                        ${gap.recommendation}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="skill-gaps-section">
                <h3 class="section-title">
                    <i class="fas fa-bullseye"></i>
                    Areas for Improvement
                </h3>
                <div class="gaps-grid">
                    ${gapsHtml}
                </div>
            </div>
        `;
    }

    /**
     * Render goals
     */
    renderGoals() {
        const goalsHtml = this.goals.map(goal => this.renderGoalCard(goal)).join('');

        return `
            <div class="goals-section">
                <h3 class="section-title">
                    <i class="fas fa-flag-checkered"></i>
                    Your Goals
                </h3>
                <div class="goals-grid">
                    ${goalsHtml}
                </div>
            </div>
        `;
    }

    /**
     * Render goal card
     */
    renderGoalCard(goal) {
        const info = this.metrics[goal.metric];
        const progress = Math.min((goal.current / goal.target * 100), 100);
        const daysLeft = this.getDaysUntil(goal.deadline);
        const isOnTrack = progress >= 50 || daysLeft > 15;

        return `
            <div class="goal-card ${isOnTrack ? 'on-track' : 'at-risk'}">
                <div class="goal-header">
                    <div class="goal-icon" style="background: ${info.color}15; color: ${info.color};">
                        <i class="fas ${info.icon}"></i>
                    </div>
                    <div class="goal-info">
                        <div class="goal-metric">${info.label}</div>
                        <div class="goal-target">${this.formatMetricValue(goal.metric, goal.target)} target</div>
                    </div>
                </div>
                <div class="goal-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%; background: ${info.color};"></div>
                    </div>
                    <div class="progress-label">${Math.round(progress)}% Complete</div>
                </div>
                <div class="goal-footer">
                    <span class="goal-current">${this.formatMetricValue(goal.metric, goal.current)} / ${this.formatMetricValue(goal.metric, goal.target)}</span>
                    <span class="goal-deadline">${daysLeft} days left</span>
                </div>
            </div>
        `;
    }

    /**
     * Get days until deadline
     */
    getDaysUntil(deadline) {
        const now = new Date();
        const end = new Date(deadline);
        const diffTime = end - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Timeframe buttons
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const timeframe = e.target.dataset.timeframe;
                this.setTimeframe(timeframe);
            });
        });
    }

    /**
     * Open benchmarking modal
     */
    openModal() {
        let modal = document.getElementById('benchmarkingModal');
        if (!modal) {
            modal = this.createModal();
            document.body.appendChild(modal);
        }

        this.render('benchmarkingModalContent');
        modal.classList.add('active');
    }

    /**
     * Create modal
     */
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'benchmarkingModal';
        modal.className = 'benchmark-modal';
        modal.innerHTML = `
            <div class="benchmark-modal-overlay" onclick="benchmarking.closeModal()"></div>
            <div class="benchmark-modal-content">
                <button class="benchmark-modal-close" onclick="benchmarking.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div id="benchmarkingModalContent"></div>
            </div>
        `;
        return modal;
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('benchmarkingModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

// Create global instance
const benchmarking = new PerformanceBenchmarking();

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        benchmarking.init();
    });
} else {
    benchmarking.init();
}

// Make globally available
window.benchmarking = benchmarking;

console.log('✅ Performance Benchmarking v1.0 loaded');
console.log('💡 Usage: benchmarking.openModal()');
