const CONFIG = {
    // UPDATED: Correct Deployment URL provided by User
    CLOUD_URL: "https://script.google.com/macros/s/AKfycbywmavCafKtC9YeAVTprit7XTLxcFM9ZsJrbUk0_WJbUSIlrYrEmCgH48hIbcYhQtvV/exec",
    ADMIN_PIN: "777"
};

// --- ALPHA WORKFLOW ENGINE (The "Brain") ---
// Embedded directly to ensure it loads before any rendering logic
window.AlphaWorkflow = {
    STAGES: [
        { code: "Submitted", label: "Lead Submitted", progress: 10, role: "Agent" },
        { code: "Docs_Pending", label: "Docs Pending (Return)", progress: 15, role: "Agent", next: "Login_Done" },
        { code: "Login_Done", label: "Bank Login Done", progress: 30, role: "Admin", next: "Credit_Review" },
        { code: "Credit_Review", label: "Underwriting", progress: 45, role: "Credit", next: "Sanctioned", fail: "Rejected", optional: "PD_Scheduled" },
        { code: "PD_Scheduled", label: "Field Investigation", progress: 55, role: "Field", next: "Credit_Review" },
        { code: "Sanctioned", label: "Sanction Letter Issued", progress: 70, role: "Admin", next: "Offer_Accepted" },
        { code: "Offer_Accepted", label: "Offer Accepted by Client", progress: 80, role: "Agent", next: "Agreement_Signed" },
        { code: "Agreement_Signed", label: "Agreement & eNACH", progress: 90, role: "Ops", next: "Disbursed" },
        { code: "Disbursed", label: "Funds Disbursed", progress: 100, role: "Finance", isFinal: true },
        { code: "Rejected", label: "File Closed / Rejected", progress: 100, role: "System", isFinal: true }
    ],
    getStage: function (code) { return this.STAGES.find(s => s.code === code) || { label: code, progress: 0 }; },
    getNextOptions: function (currentCode) {
        const current = this.getStage(currentCode);
        let options = [];
        if (current.next) options.push(this.getStage(current.next));
        if (current.fail) options.push(this.getStage(current.fail));
        if (current.optional) options.push(this.getStage(current.optional));
        if (!current.isFinal && currentCode !== 'Rejected') options.push(this.getStage('Rejected'));
        return options;
    }
};

// --- DEBUGGER (MOVED TO TOP TO PREVENT CRASH) ---
let auditLogs = ["[SYSTEM] Audit Log Initialized"];

function logToAudit(msg, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const color = type === 'error' ? '#ef4444' : (type === 'success' ? '#10b981' : '#f1f5f9');
    auditLogs.unshift(`[${timestamp}] <span style="color:${color}">${msg}</span>`);
    if (auditLogs.length > 50) auditLogs.pop();

    const el = document.getElementById('auditConsole');
    if (el) {
        el.innerHTML = auditLogs.map(x => `<div><span style="opacity:0.5">></span> ${x}</div>`).join('');
    }
}

// --- AUTHENTICATION ---
document.addEventListener('DOMContentLoaded', () => {
    // DISABLE AUTH for Stability
    localStorage.setItem('alphaAdminAuth', 'true');
    const session = 'true';
    const authScreen = document.getElementById('authScreen');

    logToAudit("DOM Loaded. Auto-Login Active...", "info");

    if (session === 'true') {
        if (authScreen) authScreen.style.display = 'none';
        logToAudit("System Unlocked. Starting Data Sync...", "success");
        initCharts();
        refreshData();
        setInterval(refreshData, 5000);
    }
});

function login() {
    const pin = document.getElementById('pin').value;
    if (pin === CONFIG.ADMIN_PIN) {
        localStorage.setItem('alphaAdminAuth', 'true');
        document.getElementById('authScreen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('authScreen').style.display = 'none';
            logToAudit("Login Success. Starting System...", "success");
            initCharts();
            refreshData();
            setInterval(refreshData, 5000);
        }, 300);
    } else {
        alert("ACCESS DENIED: INCORRECT PIN");
        document.getElementById('pin').value = '';
    }
}

function logout() {
    if (confirm("Terminate Secure Session?")) {
        localStorage.removeItem('alphaAdminAuth');
        window.location.reload();
    }
}

// --- STATE ---
let globalLeads = [];
let globalChats = [];
let charts = {};

// --- NAVIGATION ---
window.switchView = function (viewName, el) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if (el) el.classList.add('active');

    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.add('active');

    if (viewName === 'dashboard') {
        if (charts.volume) charts.volume.resize();
        if (charts.risk) charts.risk.resize();
    }

    // Force Audit Log Repaint
    if (viewName === 'audit') {
        const el = document.getElementById('auditConsole');
        if (el && auditLogs.length > 0) {
            el.innerHTML = auditLogs.map(x => `<div><span style="opacity:0.5">></span> ${x}</div>`).join('');
        }
    }
}

// --- CORE DATA LOGIC ---
async function refreshData() {
    logToAudit("Refresh Cycle Triggered", "info");
    let leads = [];

    // 1. LOCAL BRIDGE
    try {
        const raw = localStorage.getItem('alphaSubmittedLeads');
        if (raw) leads = JSON.parse(raw);
    } catch (e) { }

    // 2. CLOUD SYNC (VIA DATA HUB)
    if (navigator.onLine && window.CloudIntegration) {
        logToAudit("Syncing with MasterDB...", "info");
        try {
            // Get Normalized Leads
            leads = await window.CloudIntegration.syncMasterDB();

            // PRIORITY CHECK
            checkPriorityPopup(leads);

            // Save to Local
            localStorage.setItem('alphaSubmittedLeads', JSON.stringify(leads));

            logToAudit(`RX: ${leads.length} Leads Synced`, "success");

        } catch (e) {
            logToAudit(`Hub Sync Error: ${e.message}`, "error");
        }
    } else {
        logToAudit("Offline Mode / Hub Missing", "warning");
    }

    globalLeads = leads;

    renderKPIs(leads);
    renderLedger(leads);
    if (typeof renderCreditQueue === 'function') renderCreditQueue(leads);
}

// --- RENDERERS ---
function renderKPIs(leads) {
    const total = leads.reduce((sum, l) => sum + (parseFloat(String(l.amount).replace(/,/g, '')) || 0), 0);
    const elExp = document.getElementById('kpiExposure');
    if (elExp) elExp.innerText = "₹ " + (total / 100000).toFixed(2) + " L";

    const elLeads = document.getElementById('kpiLeads');
    if (elLeads) elLeads.innerText = leads.length;

    const valid = leads.filter(l => l.cibil);
    const avg = valid.length ? Math.round(valid.reduce((sum, l) => sum + parseInt(l.cibil), 0) / valid.length) : 0;
    const elScore = document.getElementById('kpiScore');
    if (elScore) elScore.innerText = avg;

    const riskEl = document.getElementById('kpiRisk');
    if (riskEl) {
        if (avg >= 750) { riskEl.innerText = "Low Risk"; riskEl.style.color = "var(--success)"; }
        else if (avg < 650) { riskEl.innerText = "High Risk"; riskEl.style.color = "var(--danger)"; }
        else { riskEl.innerText = "Moderate Risk"; riskEl.style.color = "var(--warning)"; }
    }

    const kyc = leads.filter(l => ['Approved', 'Disbursed'].includes(l.status)).length;
    const rate = leads.length ? Math.round((kyc / leads.length) * 100) : 0;
    const elConv = document.getElementById('kpiConv');
    if (elConv) elConv.innerText = rate + "%";
}

window.refreshDashboard = function () {
    refreshData(); // Calls syncMasterDB
    showToast("Dashboard Refreshing...");
}

window.exportDashboard = function () {
    window.print();
}

function renderLedger(leads = globalLeads) {
    const tbody = document.getElementById('ledgerBody');
    if (!tbody) return;

    tbody.innerHTML = leads.map(l => {
        const s = l.status;
        const currentStage = window.AlphaWorkflow ? window.AlphaWorkflow.getStage(s) : { label: s, role: 'System' };

        // 1. DETERMINE ACTIONS (Happy Path Button)
        let actionHTML = '';
        if (window.AlphaWorkflow) {
            const nextOptions = window.AlphaWorkflow.getNextOptions(s);
            if (nextOptions.length > 0) {
                const primary = nextOptions[0];
                actionHTML = `
                    <button onclick="updateLeadStatus('${l.id}', '${primary.code}')" 
                        class="btn-mini" style="background:var(--primary-soft); color:var(--primary); font-weight:700; border:1px solid var(--primary); padding:6px 10px; border-radius:6px; cursor:pointer; width:100%; white-space:nowrap;">
                        <i class="fas fa-arrow-right"></i> ${primary.label}
                    </button>
                `;
            } else {
                actionHTML = `<span style="color:var(--text-gray); font-size:11px;">Completed</span>`;
            }
        }

        // 2. FULL STATUS DROPDOWN (For Admin Override) + SUBMIT BUTTON
        const allStages = window.AlphaWorkflow ? window.AlphaWorkflow.STAGES : [];
        const statusDropdown = `
            <div style="display:flex; gap:6px; align-items:center;">
                <select id="status_${l.id}" 
                    style="font-size:11px; padding:4px; border-radius:4px; border:1px solid #e2e8f0; width:140px; background:#f8fafc; cursor:pointer;">
                    ${allStages.map(st => `<option value="${st.code}" ${st.code === s ? 'selected' : ''}>${st.label}</option>`).join('')}
                </select>
                <button onclick="submitStatusChange('${l.id}')" 
                    style="background:var(--primary); color:white; border:none; padding:6px 12px; border-radius:6px; font-size:10px; font-weight:700; cursor:pointer; white-space:nowrap;">
                    <i class="fas fa-check"></i> SUBMIT
                </button>
            </div>
        `;

        const isUrgent = l.priority === 'URGENT';

        return `
            <tr>
                <td style="color:var(--text-gray); font-size:12px;">${l.date || 'Today'}</td>
                <td style="font-weight:600;">
                    ${l.client} 
                    ${isUrgent ? '<span class="badge" style="background:var(--danger); color:white; scale:0.75;">URGENT</span>' : ''}
                </td>
                <td><span class="badge neutral">${l.type}</span></td>
                <td style="font-family:monospace; font-weight:600;">₹ ${l.displayAmount || l.amount}</td>
                
                <td>
                    ${statusDropdown}
                </td>
                
                <td>
                   ${actionHTML}
                </td>

                <td>
                    <button onclick="openLeadDetails('${l.id}')" style="background:none; border:none; color:var(--accent); cursor:pointer;">
                        <i class="fas fa-eye"></i>
                    </button>
                    <i class="fas fa-cog" style="color:#cbd5e1; cursor:pointer; margin-left:8px;" onclick="toggleAdvancedStatus('${l.id}')"></i>
                </td>
            </tr>
        `;
    }).join('');
}

// --- ACTIONS ---
// NEW: Submit button handler for status changes
window.submitStatusChange = async function (id) {
    const dropdown = document.getElementById(`status_${id}`);
    const button = event.target.closest('button');

    if (!dropdown) {
        showToast("Status dropdown not found", "error");
        return;
    }

    const newStatus = dropdown.value;
    const originalHTML = button.innerHTML;

    // Disable button and show loading
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> UPDATING...';

    try {
        await updateLeadStatus(id, newStatus);
    } finally {
        // Re-enable button after update
        setTimeout(() => {
            button.disabled = false;
            button.innerHTML = originalHTML;
        }, 1000);
    }
}

window.updateLeadStatus = async function (id, newStatus) {
    const idx = globalLeads.findIndex(l => l.id === id);
    if (idx > -1) {
        // UI OPTIMISTIC UPDATE
        const oldStatus = globalLeads[idx].status;
        globalLeads[idx].status = newStatus;
        localStorage.setItem('alphaSubmittedLeads', JSON.stringify(globalLeads));

        renderLedger(globalLeads);
        renderKPIs(globalLeads); // Re-calc KPIs immediately

        logToAudit(`Status Change: ${id} → ${newStatus}`, "info");

        // 🔐 SOLID HANDSHAKE (Routes to LocalDB or Cloud)
        if (window.CloudIntegration) {
            const res = await window.CloudIntegration.updateLeadStatus(id, newStatus);
            if (res.success) {
                showToast(`✓ Status Confirmed: ${newStatus}`, "success");
                logToAudit(`Cloud Sync Success: ${id}`, "success");
                // Refresh to ensure sync
                setTimeout(() => refreshData(), 500);
            } else {
                console.error("Sync Failed");
                showToast("⚠ Sync Failed - Saved Locally", "warning");
                // We keep the local update as it is better than reverting for end user
            }
        }
    }
}

window.exportLedgerToCSV = function () {
    const header = "ID,Client,Amount,Type,Status,Risk\n";
    const rows = globalLeads.map(l => `${l.id},"${l.client}","${l.amount}",${l.type},${l.status},${l.cibil}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ledger_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
}

function showToast(msg) {
    const t = document.createElement('div');
    t.style = "background:#1e293b; color:white; padding:12px 24px; border-radius:8px; font-size:14px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); animation:fadeIn 0.3s forwards";
    t.innerHTML = `<i class="fas fa-check-circle"></i> ${msg}`;
    const c = document.getElementById('toast-container');
    if (c) {
        c.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }
}

// --- CHAT LOGIC ---
function renderChat() {
    const chatContainer = document.getElementById('adminChatHistory');
    if (!chatContainer) return;

    if (globalChats.length === 0) {
        chatContainer.innerHTML = `<div style="text-align:center; color:#94a3b8; margin-top:50px;">
            <i class="fas fa-satellite-dish" style="font-size:32px; margin-bottom:10px;"></i>
            <br>No active communications.
        </div>`;
        return;
    }

    // Render Logic
    chatContainer.innerHTML = globalChats.map(msg => {
        const isMe = msg.isAdmin;
        const align = isMe ? 'flex-end' : 'flex-start';
        const bg = isMe ? 'var(--accent)' : '#f1f5f9';
        const color = isMe ? 'white' : 'var(--text-dark)';
        const radius = isMe ? '12px 12px 0 12px' : '12px 12px 12px 0';

        return `
            <div style="display:flex; justify-content:${align}; width:100%;">
                <div style="max-width:70%;">
                    <div style="font-size:10px; color:#94a3b8; margin-bottom:4px; text-align:${isMe ? 'right' : 'left'}">
                        ${msg.sender} • ${msg.time}
                    </div>
                    <div style="background:${bg}; color:${color}; padding:8px 12px; border-radius:${radius}; font-size:13px; line-height:1.4; box-shadow:0 1px 2px rgba(0,0,0,0.1);">
                        ${msg.text}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

window.sendAdminReply = function () {
    const input = document.getElementById('adminChatInput');
    const txt = input.value.trim();
    if (!txt) return;

    // Optimistic UI
    const chatContainer = document.getElementById('adminChatHistory');
    chatContainer.innerHTML += `
        <div style="display:flex; justify-content:flex-end; width:100%; opacity:0.5;">
            <div style="max-width:70%;">
                <div style="background:var(--accent); color:white; padding:8px 12px; border-radius:12px 12px 0 12px; font-size:13px;">
                    ${txt} <i class="fas fa-spinner fa-spin" style="margin-left:4px; font-size:10px;"></i>
                </div>
            </div>
        </div>
    `;
    chatContainer.scrollTop = chatContainer.scrollHeight;
    input.value = '';

    // Send
    // NOTE: Mapping to Lead Sheet Columns to ensure save
    const packet = {
        action: 'CHAT',
        type: 'CHAT',
        client: 'ADMIN', // Mapped to Client Column
        note: txt,       // Mapped to Note Column
        amount: '0',     // Required Field
        cibil: '0',      // Required Field
        status: 'Sent',  // Required Field
        timestamp: Date.now(),
        date: new Date().toLocaleTimeString()
    };

    fetch(CONFIG.CLOUD_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(packet)
    }).then(() => {
        logToAudit("Message Sent to Cloud", "success");
        setTimeout(refreshData, 2000); // Quick refresh to confirm
    });
}

// --- POPUP & MODAL LOGIC ---
// GLOBALS MOVED TO TOP
// New Chat State
let seenLeads = new Set();
let isFirstLoad = true;

function checkPriorityPopup(leads) {
    if (isFirstLoad) {
        leads.forEach(l => seenLeads.add(l.id));
        isFirstLoad = false;
        return;
    }

    const newLeads = leads.filter(l => !seenLeads.has(l.id));
    newLeads.forEach(l => {
        seenLeads.add(l.id);
        // Only trigger for URGENT or HIGH_NET
        if (l.priority === 'URGENT' || l.priority === 'HIGH_NET') {
            const alert = document.getElementById('priorityAlert');
            const msg = document.getElementById('alertMsg');
            if (alert && msg) {
                msg.innerText = l.priority === 'URGENT' ? `URGENT REQUEST: ${l.client}` : `HNI CLIENT: ${l.client}`;
                alert.style.display = 'flex';
                const sound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Subtle Ping
                try { sound.play(); } catch (e) { }
                setTimeout(() => alert.style.display = 'none', 8000);
            }
        }
    });
}

window.openLeadDetails = function (id) {
    const lead = globalLeads.find(l => l.id === id);
    if (!lead) return;

    document.getElementById('m-client').innerText = lead.client;
    document.getElementById('m-phone').innerText = lead.phone; // Using mapped phone field
    document.getElementById('m-type').innerText = lead.type;
    document.getElementById('m-amount').innerText = "₹ " + (lead.displayAmount || lead.amount);
    document.getElementById('m-cibil').innerText = lead.cibil || 'N/A';

    const prioEl = document.getElementById('m-prio');
    prioEl.innerText = lead.priority;
    prioEl.style.color = lead.priority === 'URGENT' ? '#ef4444' : (lead.priority === 'HIGH_NET' ? '#f59e0b' : 'var(--text-gray)');

    document.getElementById('m-note').innerText = lead.note || "No notes provided.";

    const m = document.getElementById('leadModal');
    if (m) m.style.display = 'flex';
}

window.closeModal = function () {
    const m = document.getElementById('leadModal');
    if (m) m.style.display = 'none';
}

// --- CHARTS ---
function initCharts() {
    try {
        const vCtx = document.getElementById('volumeChart');
        if (vCtx) {
            charts.volume = new Chart(vCtx, {
                type: 'bar',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                    datasets: [{
                        label: 'Applications',
                        data: [5, 8, 12, 4, 6],
                        backgroundColor: '#1e293b',
                        borderRadius: 4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        const rCtx = document.getElementById('riskChart');
        if (rCtx) {
            charts.risk = new Chart(rCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Prime', 'Sub-Prime', 'High Risk'],
                    datasets: [{
                        data: [65, 25, 10],
                        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                        borderWidth: 0
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, cutout: '75%' }
            });
        }
    } catch (e) {
        logToAudit("Chart Init Error: " + e.message, "error");
    }
}