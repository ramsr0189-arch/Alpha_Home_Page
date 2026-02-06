// ═══════════════════════════════════════════════════════════════════════════
// ALPHAPROFIN - SYSTEM CONFIGURATION
// Product catalog and system settings
// ═══════════════════════════════════════════════════════════════════════════

const AlphaConfig = {
    // Product Catalog
    products: {
        loans: [
            { id: 'BL', name: 'Business Loan', icon: 'fa-briefcase' },
            { id: 'PL', name: 'Personal Loan', icon: 'fa-user' },
            { id: 'PROF', name: 'Professional Loan', icon: 'fa-user-tie' },
            { id: 'HL', name: 'Housing Loan', icon: 'fa-home' },
            { id: 'LAP', name: 'Loan Against Property', icon: 'fa-building' },
            { id: 'CAR', name: 'Car Loan', icon: 'fa-car' },
            { id: '2W', name: '2 Wheeler Loan', icon: 'fa-motorcycle' },
            { id: 'MED', name: 'Medical Instruments', icon: 'fa-stethoscope' },
            { id: 'MACH', name: 'Machinery Loan', icon: 'fa-cogs' },
            { id: 'CV', name: 'Commercial Vehicle', icon: 'fa-truck' },
            { id: 'CONST', name: 'Construction Vehicle', icon: 'fa-tractor' }
        ],
        investments: [
            { id: 'SIP', name: 'SIP', icon: 'fa-seedling' },
            { id: 'MF', name: 'Mutual Funds', icon: 'fa-pie-chart' },
            { id: 'PENSION', name: 'Pension Plans', icon: 'fa-blind' },
            { id: 'FD', name: 'Fixed Deposits', icon: 'fa-vault' }
        ],
        insurance: [
            { id: 'HEALTH', name: 'Health Insurance', icon: 'fa-heartbeat' },
            { id: 'LIFE', name: 'Life Insurance', icon: 'fa-user-shield' },
            { id: 'TERM', name: 'Term Insurance', icon: 'fa-clock' },
            { id: 'TRAVEL', name: 'Travel Insurance', icon: 'fa-plane' },
            { id: 'VEHICLE_INS', name: 'Vehicle Insurance', icon: 'fa-car-crash' },
            { id: 'MACH_INS', name: 'Machinery Insurance', icon: 'fa-industry' }
        ]
    },

    // Lead Status Flow
    statuses: [
        'Submitted',
        'Docs Pending',
        'Login Done',
        'Credit Review',
        'Sanctioned',
        'Disbursed',
        'Rejected',
        'On Hold'
    ],

    // Task Priorities
    priorities: ['High', 'Medium', 'Low'],

    // Get all products as flat array
    getAllProducts() {
        return [
            ...this.products.loans,
            ...this.products.investments,
            ...this.products.insurance
        ];
    },

    // Get product by ID
    getProduct(id) {
        return this.getAllProducts().find(p => p.id === id);
    },

    // Format currency
    formatCurrency(amount) {
        return '₹ ' + Number(amount).toLocaleString('en-IN');
    },

    // Format date
    formatDate(isoDate) {
        const date = new Date(isoDate);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    },

    // Format datetime
    formatDateTime(isoDate) {
        const date = new Date(isoDate);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};

// Auto-initialize
if (typeof window !== 'undefined') {
    window.AlphaConfig = AlphaConfig;
}
