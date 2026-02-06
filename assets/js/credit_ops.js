// --- CREDIT OPS MODULE (LOS LEVEL 2) ---
let activeCreditCaseId = null;

function renderCreditQueue(leads) {
    // Updated Filter to catch all Pre-Sanction Stages
    const queue = leads.filter(l => ['Submitted', 'Docs_Pending', 'Login_Done', 'Credit_Review', 'PD_Scheduled', 'Login', 'Credit', 'Pending'].includes(l.status));
    const container = document.getElementById('creditQueue');
    if (!container) return;

    if (queue.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px; color:var(--text-gray); font-size:12px;">
                <i class="fas fa-check-circle" style="font-size:24px; margin-bottom:8px; opacity:0.5;"></i><br>
                Queue Cleared
            </div>`;
        return;
    }

    container.innerHTML = queue.map(l => {
        const isActive = activeCreditCaseId === l.id;
        const color = l.priority === 'URGENT' ? 'var(--danger)' : 'var(--primary)';
        const bg = isActive ? '#eff6ff' : 'white';
        const border = isActive ? 'var(--accent)' : 'transparent';

        return `
            <div onclick="loadCreditCase('${l.id}')"
                style="padding:16px; margin-bottom:8px; background:${bg}; border:1px solid ${border}; border-radius:8px; cursor:pointer; transition:all 0.2s; position:relative; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="font-weight:700; font-size:13px; color:${color}">${l.client}</span>
                    <span style="font-size:10px; font-weight:700; opacity:0.6;">${l.cibil || 'N/A'}</span>
                </div>
                <div style="font-size:11px; color:var(--text-gray); display:flex; justify-content:space-between;">
                    <span>${l.type} • ₹ ${l.displayAmount || l.amount}</span>
                    <span>${l.date}</span>
                </div>
                ${l.priority === 'URGENT' ? '<div style="position:absolute; top:8px; right:8px; width:8px; height:8px; background:var(--danger); border-radius:50%;"></div>' : ''}
            </div>
        `;
    }).join('');
}

function loadCreditCase(id) {
    activeCreditCaseId = id;
    renderCreditQueue(globalLeads); // Re-render to show active state

    const lead = globalLeads.find(l => l.id === id);
    if (!lead) return;

    // Switch Views
    document.getElementById('creditEmpty').style.display = 'none';
    document.getElementById('creditWorkspace').style.display = 'flex';

    // Populate Headers
    document.getElementById('cw-client').innerText = lead.client;
    document.getElementById('cw-amount').innerText = "₹ " + (lead.displayAmount || lead.amount);
    document.getElementById('cw-type').innerText = lead.type;

    // --- ALPHA SCORE ENGINE (SIMULATION) ---
    // In a real LOS, this hits an API. Here we simulate "Deep Analysis".
    let score = 50; // Base

    // 1. CIBIL Impact
    const cibil = lead.cibil || 0;
    if (cibil > 750) score += 30;
    else if (cibil > 700) score += 20;
    else if (cibil > 650) score += 10;
    else score -= 20;

    // 2. Loan Amount Risk
    const amt = lead.amount || 0;
    if (amt > 5000000) score -= 10; // High exposure risk
    else score += 10;

    // 3. Document Stability (Mocked based on Note length/content)
    if (lead.note && lead.note.length > 20) score += 10;

    // Cap
    score = Math.max(0, Math.min(100, score));

    // Render Score
    const badge = document.getElementById('cw-score-badge');
    badge.querySelector('div:last-child').innerText = score + "/100";
    badge.style.background = score > 70 ? 'var(--success)' : (score > 50 ? 'var(--warning)' : 'var(--danger)');

    // Render Radar Chart
    renderRadar(score, cibil);

    // Render KRIs
    const kriList = document.getElementById('kri-list');
    let kris = [];
    if (cibil < 700) kris.push({ txt: "Low Bureau Score", col: "var(--danger)" });
    if (amt > 5000000) kris.push({ txt: "High Ticket Exposure", col: "var(--warning)" });
    if (!lead.note) kris.push({ txt: "Incomplete Field Notes", col: "var(--warning)" });
    if (score > 75) kris.push({ txt: "Strong Profile Strength", col: "var(--success)" });

    kriList.innerHTML = kris.map(k => `
        <div style="padding:8px; border-left:3px solid ${k.col}; background:#f8fafc; font-size:11px; font-weight:600;">
            ${k.txt}
        </div>
    `).join('');
}

function renderRadar(score, cibil) {
    const ctx = document.getElementById('riskRadarChart');
    if (!ctx) return;

    // Destroy old if exists mock-style (Chart.js doesn't allow easy re-use of canvas context without destroy)
    // For simplicity in this environment, we assume the canvas is fresh or we treat it simply.
    // Ideally we track the chart instance.
    if (charts.radar) charts.radar.destroy();

    charts.radar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Credit History', 'Repayment Capacity', 'Stability', 'Collateral', 'Banking'],
            datasets: [{
                label: 'Applicant Profile',
                data: [
                    Math.min(100, (cibil / 900) * 100), // Normalized CIBIL
                    score, // Calculated Score
                    score - 10, // Stability Mock
                    score + 5, // Collateral Mock
                    score - 5  // Banking Mock
                ],
                fill: true,
                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                borderColor: 'rgba(79, 70, 229, 1)',
                pointBackgroundColor: 'rgba(79, 70, 229, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(79, 70, 229, 1)'
            }]
        },
        options: {
            elements: { line: { borderWidth: 3 } },
            scales: { r: { angleLines: { display: false }, suggestedMin: 0, suggestedMax: 100 } },
            plugins: { legend: { display: false } }
        }
    });
}

async function submitDecision(verdict) {
    if (!activeCreditCaseId) return;

    const remarks = document.getElementById('cw-remarks').value;
    if (verdict === 'Rejected' && remarks.length < 5) {
        alert("Please enter rejection remarks.");
        return;
    }

    // Update Status
    // If Admin selects "PD Check", we move to PD_Scheduled
    let finalStatus = verdict;
    if (finalStatus === 'PD_Trigger') {
        finalStatus = 'PD_Scheduled';
        remarks = "[PD TRIGGERED] " + remarks;
    }

    updateLeadStatus(activeCreditCaseId, finalStatus); // Existing function

    // Add Note simulation
    const packet = {
        action: 'CHAT', // Piggyback on chat to log remarks
        type: 'CHAT',
        client: 'SYSTEM',
        note: `[DECISION: ${verdict}] ${remarks}`,
        amount: '0',
        cibil: '0',
        status: 'Audit',
        timestamp: Date.now()
    };

    // Optimistic UI
    document.getElementById('creditWorkspace').innerHTML = `
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; animation:fadeIn 0.5s;">
            <i class="fas fa-stamp" style="font-size:64px; color:var(--text-gray); margin-bottom:24px;"></i>
            <h2 style="color:var(--primary);">Decision Recorded</h2>
            <div style="margin-top:8px; font-weight:700; color:var(--text-gray);">${verdict.toUpperCase()}</div>
        </div>
    `;

    setTimeout(() => {
        activeCreditCaseId = null;
        document.getElementById('creditWorkspace').innerHTML = ''; // Reset
        document.getElementById('creditWorkspace').style.display = 'none';
        document.getElementById('creditEmpty').style.display = 'flex';
        renderCreditQueue(globalLeads);
    }, 2000);
}
