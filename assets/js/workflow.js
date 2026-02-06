// --- ALPHA WORKFLOW ENGINE (The "Brain") ---
// This file is the Single Source of Truth for the Lead Journey.
// Changing this file AUTOMATICALLY updates both Agent and Admin panels.

const WORKFLOW = {
    // 1. Define the Strict Sequence (The "Tree")
    STAGES: [
        { code: "Submitted", label: "Lead Submitted", progress: 10, role: "Agent" },
        { code: "Docs_Validation", label: "Document Verification", progress: 20, role: "Ops", next: "Login", fail: "Docs_Pending" },
        { code: "Docs_Pending", label: "Docs Pending (Action Req)", progress: 15, role: "Agent", next: "Docs_Validation" }, // Loop back
        { code: "Login", label: "Bank Login Done", progress: 30, role: "Admin", next: "Credit_Review" },
        { code: "Credit_Review", label: "Underwriting", progress: 45, role: "Credit", next: "Sanctioned", fail: "Rejected", optional: "PD_Scheduled" },
        { code: "PD_Scheduled", label: "Field Investigation", progress: 55, role: "Field", next: "Credit_Review" }, // Loop back with report
        { code: "Sanctioned", label: "Sanction Letter Issued", progress: 70, role: "Admin", next: "Offer_Accepted" },
        { code: "Offer_Accepted", label: "Offer Accepted by Client", progress: 80, role: "Agent", next: "Agreement_Stage" },
        { code: "Agreement_Stage", label: "Agreement & eNACH", progress: 90, role: "Ops", next: "Disbursed" },
        { code: "Disbursed", label: "Funds Disbursed", progress: 100, role: "Finance", isFinal: true },
        { code: "Rejected", label: "File Closed / Rejected", progress: 100, role: "System", isFinal: true }
    ],

    // 2. Helper: Get Stage Details
    getStage: function (code) {
        return this.STAGES.find(s => s.code === code) || this.STAGES[0];
    },

    // 3. Helper: Get Valid Next Steps (For Admin UI)
    getNextOptions: function (currentCode) {
        const current = this.getStage(currentCode);
        let options = [];

        // Happy Path
        if (current.next) options.push(this.getStage(current.next));

        // Failure Path (if any)
        if (current.fail) options.push(this.getStage(current.fail));

        // Optional Path (PD)
        if (current.optional) options.push(this.getStage(current.optional));

        // Always allow Reject (unless already final)
        if (!current.isFinal && currentCode !== 'Rejected') {
            options.push(this.getStage('Rejected'));
        }

        return options;
    },

    // 4. Helper: Get Progress % (For Agent UI)
    getProgress: function (code) {
        return this.getStage(code).progress;
    }
};

// Make it global
window.AlphaWorkflow = WORKFLOW;
console.log("AlphaWorkflow Engine Loaded v1.0 🧠");
