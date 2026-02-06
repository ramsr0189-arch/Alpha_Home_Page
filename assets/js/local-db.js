// ═══════════════════════════════════════════════════════════════════════════
// ALPHA PROFIN - LOCAL SQL ENGINE (BROWSER BASED)
// ═══════════════════════════════════════════════════════════════════════════
// A lightweight SQL-like database running entirely in the browser memory.
// Persistent via LocalStorage. No Node.js required.

const LocalDB = {
    // TABLES
    tables: {
        leads: [],
        audit: []
    },

    // INIT
    init() {
        console.log('📂 LocalDB: Booting up...');
        this.load('leads');
        this.load('audit');

        // SEED DATA if empty
        if (this.tables.leads.length === 0) {
            console.log('📂 LocalDB: Seeding initial data...');
            this.insert('leads', [
                {
                    id: "L-SEED-01",
                    client: "Rajesh Kumar",
                    amount: "5000000",
                    status: "Submitted",
                    agent: "AGENT_001",
                    type: "BL",
                    cibil: "750",
                    date: new Date().toLocaleDateString(),
                    notes: "High priority seed lead"
                },
                {
                    id: "L-SEED-02",
                    client: "TechFlow Systems",
                    amount: "12000000",
                    status: "Credit_Review",
                    agent: "AGENT_001",
                    type: "LAP",
                    cibil: "810",
                    date: new Date().toLocaleDateString(),
                    notes: "Documents collected"
                },
                {
                    id: "L-SEED-03",
                    client: "Amitabh Validot",
                    amount: "2500000",
                    status: "Rejected",
                    agent: "AGENT_002",
                    type: "PL",
                    cibil: "620",
                    date: new Date().toLocaleDateString(),
                    notes: "Low CIBIL score"
                }
            ]);
        }
    },

    // --- CORE OPERATIONS ---

    load(table) {
        const raw = localStorage.getItem(`LDB_${table}`);
        if (raw) this.tables[table] = JSON.parse(raw);
    },

    save(table) {
        localStorage.setItem(`LDB_${table}`, JSON.stringify(this.tables[table]));
    },

    // SELECT * FROM table
    select(table) {
        return this.tables[table] || [];
    },

    // INSERT INTO table
    insert(table, rows) {
        if (!Array.isArray(rows)) rows = [rows];
        this.tables[table] = [...this.tables[table], ...rows];
        this.save(table);
        console.log(`📂 LocalDB: Inserted ${rows.length} rows into ${table}`);
        return rows;
    },

    // UPDATE table SET ... WHERE id = ...
    update(table, id, updates) {
        let found = false;
        this.tables[table] = this.tables[table].map(row => {
            if (row.id === id) {
                found = true;
                return { ...row, ...updates };
            }
            return row;
        });
        if (found) {
            this.save(table);
            console.log(`📂 LocalDB: Updated record ${id} in ${table}`);
        }
        return found;
    }
};

// Auto Init
try {
    const existing = localStorage.getItem('LDB_leads');
    if (!existing) LocalDB.init();
    else LocalDB.load('leads');
} catch (e) { }

window.LocalDB = LocalDB;
console.log('✅ Local SQL Engine Ready');
