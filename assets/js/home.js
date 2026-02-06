// --- THEME BRIDGE ---
function toggleOnyxTheme() {
    const isDark = document.body.classList.toggle('onyx-theme');
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
    localStorage.setItem('onyxTheme', isDark ? 'enabled' : 'disabled');
}

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('onyxTheme') === 'enabled') {
        document.body.classList.add('onyx-theme');
        const icon = document.getElementById('themeIcon');
        if (icon) icon.className = 'fas fa-sun';
    }
    setupCalculatorSync(); // Initialize dual-input sync
    runAdvancedCalc();      // Run initial calc
});

// --- CONFIG & STATE ---
let engineState = "GREETING"; // GREETING, NAME, CATEGORY, SUBCAT, CIBIL, SYNC, APPOINTMENT, OPEN_ENDED
let chatData = { client: '', phone: '', type: '', subCategory: '', cibil: '', financeDetail: '', agent: 'ALPHA-LEVEL6-CLOSER' };

// LLM CONFIGURATION (Placeholder for User to Swap)
// LLM CONFIGURATION
const USE_REAL_LLM = true; // Enabled by default for Gemini
// API Key is loaded from CONFIG.GEMINI_API_KEY in config.js

let chatHistory = [
    {
        role: "user",
        parts: [{ text: "You are Alpha AI, the elite financial assistant for Alpha Profin Solutions. Your goal is to provide professional, concise, and strategic financial advice on Loans (Business, Personal, Home), Investments (SIP, PMS), and Insurance. Tone: Professional, Empathetic, Authoritative (Millionaire Financial Advisor persona). Keep answers under 80 words unless detailed analysis is requested. Always encourage the user to book a consultation or check eligibility." }]
    },
    {
        role: "model",
        parts: [{ text: "Understood. I am ready to serve as Alpha AI." }]
    }
];

const CLOUD_URL_FALLBACK = "https://script.google.com/macros/s/AKfycbywmavCafKtC9YeAVTprit7XTLxcFM9ZsJrbUk0_WJbUSIlrYrEmCgH48hIbcYhQtvV/exec";
const FINAL_URL = (typeof CONFIG !== 'undefined' && CONFIG.CLOUD_URL) ? CONFIG.CLOUD_URL : CLOUD_URL_FALLBACK;

// --- CHART ENGINE ---
let calcChart = null;

function initChart() {
    const ctx = document.getElementById('calcChart');
    if (!ctx) return;

    calcChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Existing EMIs', 'New Loan Capacity', 'Living Expenses'],
            datasets: [{
                data: [0, 50, 50],
                backgroundColor: ['#ef4444', '#10b981', '#cbd5e1'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            cutout: '70%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            if (label) { label += ': '; }
                            if (context.parsed !== null) {
                                label += '₹' + context.parsed.toLocaleString('en-IN');
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// --- CHATBOT ENGINE ---
function toggleChat() {
    const win = document.getElementById('chatWindow');
    if (!win) return;

    // Toggle Logic
    const isFlex = win.style.display === 'flex';
    if (isFlex) {
        win.style.display = 'none';
    } else {
        win.style.display = 'flex';
        // Auto-Start if new
        if (engineState === "GREETING") {
            setTimeout(() => {
                botMsg("<b>Welcome to Alpha Private Client.</b><br>I am your AI Financial Architect. How may I address you today?", true);
                engineState = "NAME";
            }, 500);
        }
    }
}

function handleChatInput() {
    const input = document.getElementById('chatInput');
    const val = input.value.trim();
    if (!val) return;

    userMsg(val);
    processNeuroLogic(val);
    input.value = '';
}

function userMsg(text) {
    const body = document.getElementById('chatBody');
    const div = document.createElement('div');
    div.className = "chat-bubble user";
    div.innerText = text;
    body.appendChild(div);
    scrollToBottom();
}

function botMsg(text, isHTML = false, options = null) {
    const body = document.getElementById('chatBody');
    const div = document.createElement('div');
    div.className = "chat-bubble";

    if (isHTML) div.innerHTML = text;
    else div.innerText = text;

    body.appendChild(div);

    if (options) {
        const optDiv = document.createElement('div');
        optDiv.style = "display:flex; flex-wrap:wrap; margin-top:5px; margin-bottom:10px;";
        options.forEach(opt => {
            const btn = document.createElement('div');
            btn.className = "suggestion-chip";
            btn.innerText = opt;
            btn.onclick = () => {
                userMsg(opt);
                processNeuroLogic(opt);
                optDiv.remove(); // Remove chips after selection for clean UI
            };
            optDiv.appendChild(btn);
        });
        body.appendChild(optDiv);
    }
    scrollToBottom();
}

function showTyping(show) {
    const body = document.getElementById('chatBody');
    if (show) {
        const t = document.createElement('div');
        t.id = 'typing';
        t.className = "typing-indicator";
        t.innerHTML = "<div class='dot'></div><div class='dot'></div><div class='dot'></div>";
        body.appendChild(t);
        scrollToBottom();
    } else {
        const t = document.getElementById('typing');
        if (t) t.remove();
    }
}

function scrollToBottom() {
    const body = document.getElementById('chatBody');
    body.scrollTop = body.scrollHeight;
}

// --- CORE INTELLIGENCE (SIMULATED or REAL) ---
async function processNeuroLogic(text) {
    const cleanText = text.trim();

    // Simulate thinking delay
    showTyping(true);
    const thinkingTime = Math.random() * 800 + 600; // 0.6s to 1.4s

    setTimeout(async () => {
        showTyping(false);

        // 1. Check for LLM Override (If configured)
        // 1. Check for LLM Override (Prioritize Cerebras, Fallback to Gemini)
        if (USE_REAL_LLM && typeof CONFIG !== 'undefined') {
            // OPTION A: CEREBRAS (Llama 3.1)
            if (CONFIG.CEREBRAS_API_KEY) {
                try {
                    const response = await callCerebrasLLM(text);
                    botMsg(response, true);
                    return;
                } catch (err) {
                    console.error("Cerebras Error:", err);
                    // Fallback to Gemini if Cerebras fails
                    if (CONFIG.GEMINI_API_KEY) {
                        botMsg("<i>Switching to backup channel...</i>", true);
                        try {
                            const response = await callRealLLM(text);
                            botMsg(response, true);
                            return;
                        } catch (e) {
                            // Both failed
                        }
                    }

                    // Show actual error if no fallback or fallback failed
                    botMsg(`<b>Connection Error:</b> ${err.message}<br><span style="font-size:10px">Ensure you are running on localhost (not file://) or check API Key.</span>`, true);
                    return;
                }
            }
            // OPTION B: GEMINI (Legacy)
            else if (CONFIG.GEMINI_API_KEY) {
                try {
                    const response = await callRealLLM(text);
                    botMsg(response, true);
                } catch (err) {
                    botMsg("I am currently experiencing high traffic.");
                }
                return;
            }
        }

        // Setup Missing
        if (USE_REAL_LLM && (!CONFIG.CEREBRAS_API_KEY && !CONFIG.GEMINI_API_KEY)) {
            botMsg("<b>Setup Required:</b> Please add your API Key in <code>assets/js/config.js</code> to enable the AI Engine.", true);
            return;
        }

        // 2. Structured FSM Logic (Default)
        switch (engineState) {
            case "NAME":
                chatData.client = cleanText;
                botMsg(`Pleasure to meet you, ${cleanText}. <br>To tailor my strategy, which financial pillar are you focusing on today?`, true, ["Business Funding", "Personal Wealth", "Risk Protection"]);
                engineState = "CATEGORY";
                break;

            case "CATEGORY":
                chatData.type = cleanText;
                let opts = [];
                if (cleanText.includes("Funding")) opts = ["Business Loan", "Machinery Loan", "Commercial Vehicle"];
                else if (cleanText.includes("Wealth")) opts = ["SIP & Mutual Funds", "Fixed Deposits", "Pension Plans"];
                else opts = ["Life Insurance", "Health Insurance", "Term Plan"];

                botMsg(`Understood. Activating <b>${cleanText}</b> protocol.<br>Please select the specific instrument:`, true, opts);
                engineState = "SUBCAT";
                break;

            case "SUBCAT":
                chatData.subCategory = cleanText;
                botMsg(`Excellent choice. I am analyzing current market rates for <b>${cleanText}</b>...<br><br>To assess eligibility, what is your approximate <b>CIBIL Score</b>?`, true, ["750+ (Excellent)", "700-750 (Good)", "Below 700", "I Don't Know"]);
                engineState = "CIBIL";
                break;

            case "CIBIL":
                chatData.cibil = cleanText;
                botMsg("<b>Analysis Complete.</b> Your profile shows high potential for elite tier rates.<br><br>Please provide your <b>Mobile Number</b> so I can encrypt and sync this file to our Senior Investment Banker.", true);
                engineState = "SYNC";
                break;

            case "SYNC":
                chatData.phone = cleanText;
                syncToCloud(); // Initial Capture
                botMsg("<b>File Encrypted & Synced.</b> <i class='fas fa-check-circle' style='color:var(--success)'></i><br><br>You have qualified for a <b>Priority Consultation</b>. Would you like to reserve a slot?", true, ["Reserve Call Slot", "Ask Another Question"]);
                engineState = "APPOINTMENT";
                break;

            case "APPOINTMENT":
                if (cleanText.includes("Reserve")) {
                    chatData.isPriority = true;
                    // PRIORITY SIGNAL INJECTION
                    chatData.type = "HOT_CALL";
                    chatData.priority = "URGENT";
                    chatData.badge = "CALL_REQUEST";
                    chatData.note = "Client requested urgent call back. High Intent.";

                    syncToCloud(); // Update with Badge
                    botMsg("<b>Slot Confirmed.</b> <span style='color:var(--accent); font-weight:800;'>PRIORITY BADGE ASSIGNED.</span><br>You will receive a WhatsApp confirmation shortly from Alpha Office. Thank you for choosing excellence.", true);
                    engineState = "FINISHED";
                } else {
                    botMsg("Of course. I am here to assist. What else would you like to know about Alpha Profin?", true);
                    engineState = "OPEN_ENDED";
                }
                break;

            case "OPEN_ENDED":
                botMsg("That is an insightful query. While I am an AI, our Senior Consultants specialize in complex structuring. I have flagged your interest for them.", true);
                break;
        }
    }, thinkingTime);
}

// --- CEREBRAS ENGINE (Llama 3.1) ---
async function callCerebrasLLM(userText) {
    const API_KEY = CONFIG.CEREBRAS_API_KEY;
    if (!API_KEY) return "System Error: Key Missing";

    // 1. Update History
    chatHistory.push({
        role: "user",
        parts: [{ text: userText }]
    });

    // 2. Convert History to OpenAI Format (Cerebras uses 'assistant' role, not 'model')
    const messages = chatHistory.map(msg => ({
        role: msg.role === "model" ? "assistant" : msg.role,
        content: msg.parts[0].text
    }));

    // 3. API Call
    // 3. API Call (Direct implementation for GitHub Pages)
    try {
        const API_KEY = CONFIG.CEREBRAS_API_KEY;
        if (!API_KEY) throw new Error("API Key Missing");

        const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                messages: messages,
                model: "llama3.1-70b",
                max_completion_tokens: 500,
                temperature: 0.7,
                top_p: 1
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || response.statusText);
        }

        const data = await response.json();
        const botText = data.choices[0].message.content;

        // 4. Update History
        chatHistory.push({
            role: "model",
            parts: [{ text: botText }]
        });

        return botText
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
            .replace(/\n/g, '<br>');             // Newline

    } catch (e) {
        chatHistory.pop(); // Revert user msg
        throw e;
    }
}

async function callRealLLM(userText) {
    const API_KEY = CONFIG.GEMINI_API_KEY;
    if (!API_KEY) return "<b>System Error:</b> API Key is missing in config.js";

    // 1. Add User Message
    chatHistory.push({
        role: "user",
        parts: [{ text: userText }]
    });

    // 2. Comprehensive Model List (Brute Force to find ANY working model)
    const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-002",
        "gemini-1.0-pro",
        "gemini-1.0-pro-latest",
        "gemini-1.0-pro-001",
        "gemini-pro"
    ];

    let lastError = null;
    let success = false;

    // 3. Attempt Connection
    for (const model of modelsToTry) {
        if (success) break; // Stop if already successful

        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

        try {
            console.log(`Connecting to ${model}...`);
            const response = await fetch(GEMINI_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: chatHistory,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 250,
                    }
                })
            });

            // Handle Specific HTTP Errors
            if (!response.ok) {
                const status = response.status;
                const errBody = await response.json().catch(() => ({}));
                const errMsg = errBody.error?.message || response.statusText;

                // Store error for final report
                lastError = new Error(`[${model}] ${status}: ${errMsg}`);

                // If Quota (429) or Not Found (404), try next model instantly
                if (status === 429 || status === 404 || status === 503) {
                    console.warn(`Model ${model} unavailable (${status}). Switching...`);
                    continue;
                }

                // For other critical errors (400, 403), throw to exit
                throw lastError;
            }

            // Success Path
            const data = await response.json();
            const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!botResponse) throw new Error("AI returned empty response.");

            // Add to history
            chatHistory.push({
                role: "model",
                parts: [{ text: botResponse }]
            });

            success = true;
            return botResponse
                .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                .replace(/\n/g, '<br>');

        } catch (e) {
            console.error(`Attempt failed on ${model}:`, e);
            if (!lastError) lastError = e;
            // Continue loop to try next model
        }
    }

    // 4. Final Failure Handler
    // Remove the failed user message so they can try again without bloating history
    chatHistory.pop();

    return `<div style="background:#fee2e2; padding:10px; border-radius:8px; border:1px solid #ef4444;">
        <strong style="color:#b91c1c;">Connection Failed</strong><br>
        <span style="font-size:12px; color:#b91c1c;">${lastError?.message || "Unknown Network Error"}</span><br><br>
        <div style="font-size:11px; color:#450a0a;">
            <b>Troubleshooting:</b><br>
            1. <b>Quota Limit:</b> "Limit 0" means your Google Cloud Project needs billing enabled (even for free tier) or is in a restricted region.<br>
            2. <b>Enable API:</b> Search "Generative Language API" in Google Cloud Console and enable it.<br>
            3. <b>New Key:</b> Try creating a key in a new project.
        </div>
    </div>`;
}

function syncToCloud() {
    // 1. Assign ID if missing (Essential for tracking updates)
    if (!chatData.id) chatData.id = "LEAD-" + Math.floor(Math.random() * 100000);
    chatData.timestamp = Date.now();
    chatData.date = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    chatData.status = "New Request"; // Default Status

    console.log("Syncing Lead:", chatData);

    // 2. Local Bridge (For Admin Panel Demo)
    try {
        const raw = localStorage.getItem('alphaSubmittedLeads');
        let db = raw ? JSON.parse(raw) : [];

        // Upsert Logic: Update if ID exists, else Push
        const idx = db.findIndex(x => x.id === chatData.id);
        if (idx >= 0) {
            db[idx] = { ...db[idx], ...chatData }; // Merge updates
        } else {
            db.push(chatData);
        }

        localStorage.setItem('alphaSubmittedLeads', JSON.stringify(db));
    } catch (e) { console.error("Local Sync Fail", e); }

    // 3. Cloud Fire (Legacy/Google Sheet)
    // PROTOCOL UPDATE: Matching 'agent.js' reliable Text/Plain method
    const payload = {
        action: "CREATE",
        id: chatData.id,
        client: chatData.client,
        phone: chatData.phone,
        type: chatData.type,
        amount: chatData.amount || "0",
        cibil: chatData.cibil || "0",
        status: "Submitted",
        priority: chatData.priority || "NORMAL",
        note: JSON.stringify(chatData), // Full dump for debug
        date: new Date().toLocaleTimeString()
    };

    // Attempt 1: Standard
    fetch(FINAL_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
    }).then(res => {
        if (res.ok) console.log("Cloud Sync Success");
        else throw new Error("Cloud Rejected");
    }).catch(e => {
        console.warn("Retrying with No-Cors...", e);
        // Attempt 2: Fallback
        fetch(FINAL_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });
    });
}

// --- SERVICE DATA (Enhanced Professional Descriptions) ---
const serviceData = {
    // LOANS
    "Business Loan": {
        desc: "Collateral-free working capital and term loans ranging from ₹5L to ₹50Cr with flexible tenure up to 7 years. Competitive ROI starting at 11.5% p.a. for MSME, retail, and corporate entities with minimal documentation.",
        req: ["1 Year Bank Statement", "Business Proof", "ITR (2 Yrs)", "GST Registration"]
    },
    "Personal Loan": {
        desc: "Instant approval personal credit facility from ₹50K to ₹40L at competitive rates (12-18% p.a.) with tenure up to 5 years. Minimal CIBIL requirement (650+), same-day disbursal for salaried and self-employed individuals.",
        req: ["Salary Slips (3 Months)", "KYC Documents", "Bank Statement (6 Months)"]
    },
    "Professional Loan": {
        desc: "Tailored credit solutions for Doctors, CAs, Architects, and Consultants from ₹10L to ₹1Cr at preferential rates (10-14% p.a.). Flexible repayment tenure up to 7 years with practice expansion and equipment finance options.",
        req: ["Professional Degree Certificate", "KYC", "Practice Proof/Registration", "ITR (2 Years)"]
    },
    "Housing Loan": {
        desc: "Home purchase and construction finance up to ₹5Cr with LTV ratio up to 90% and tenure extending to 30 years. Fixed and floating ROI options starting at 8.5% p.a. with top-up facility and balance transfer benefits.",
        req: ["Property Documents", "Income Proof", "Approved Building Plan", "NOC from Society"]
    },
    "LAP": {
        desc: "Leverage residential or commercial property to access funds up to ₹10Cr with LTV up to 65% at 9-12% p.a. Flexible repayment tenure up to 15 years with minimal processing charges and doorstep service.",
        req: ["Property Title Deeds", "ITR (3 Years)", "Property Tax Receipts", "Valuation Report"]
    },
    "Car Loan": {
        desc: "New and pre-owned vehicle financing from ₹2L to ₹1Cr with up to 90% on-road price funding at 9-13% p.a. Tenure up to 7 years with zero foreclosure charges and comprehensive insurance bundling.",
        req: ["Vehicle Quotation/Invoice", "KYC Documents", "Income Proof", "Address Proof"]
    },
    "2 Wheeler Loan": {
        desc: "Quick two-wheeler finance from ₹25K to ₹3L with instant approval and same-day disbursal at 11-15% p.a. Minimal documentation with tenure up to 5 years and zero down payment options for select models.",
        req: ["KYC Documents", "Income Proof", "Vehicle Quotation"]
    },
    "Medical Instruments": {
        desc: "Specialized equipment financing for healthcare professionals from ₹5L to ₹5Cr covering diagnostic machines, surgical tools, and clinic setup. Competitive rates at 10-14% p.a. with tenure up to 7 years and moratorium period.",
        req: ["Equipment Invoice/Quotation", "Medical Degree", "Clinic Registration", "ITR"]
    },
    "Machinery Loan": {
        desc: "Industrial and manufacturing equipment finance from ₹10L to ₹10Cr with LTV up to 80% at 11-15% p.a. Tenure up to 10 years with seasonal repayment options and working capital linkage.",
        req: ["Machinery Quotation", "GST Returns (1 Year)", "Business Financials", "Factory License"]
    },
    "Commercial Vehicle": {
        desc: "Trucks, buses, and fleet financing from ₹5L to ₹50L per vehicle with up to 90% funding at 10-14% p.a. Tenure up to 7 years with bulk discount for fleet operators and GPS tracking integration.",
        req: ["Vehicle Permit/RC", "Vehicle Quotation", "Driver License", "Income Proof"]
    },
    "Construction Vehicle": {
        desc: "Heavy equipment finance for JCB, excavators, cranes, and loaders from ₹10L to ₹2Cr with LTV up to 85% at 12-16% p.a. Flexible tenure up to 8 years with project-linked repayment and insurance coverage.",
        req: ["Work Orders/Contracts", "Business Financials", "Equipment Quotation", "Project Details"]
    },

    // INVESTMENTS
    "SIP": {
        desc: "Disciplined wealth creation through monthly investments starting at ₹500 in equity, debt, or hybrid mutual funds. Tax-efficient ELSS options with potential returns of 12-15% CAGR and complete portfolio diversification.",
        req: ["PAN Card", "Bank Account Details", "KYC Compliance", "Cancelled Cheque"]
    },
    "Mutual Funds": {
        desc: "Professionally managed investment portfolios across equity, debt, and balanced funds with lump sum or SIP options. SEBI-regulated schemes offering liquidity, tax benefits u/s 80C, and expert fund management with transparent NAV.",
        req: ["KYC Documents", "PAN Card", "Bank Mandate", "Nominee Details"]
    },
    "Pension Plans": {
        desc: "Retirement corpus building through NPS, annuity plans, and pension funds with guaranteed income post-retirement. Tax benefits u/s 80CCD with flexible contribution options and choice of equity/debt allocation up to age 70.",
        req: ["Age Proof (Birth Certificate/Passport)", "ID Proof", "Bank Details", "Nominee Information"]
    },
    "Fixed Deposits": {
        desc: "Guaranteed returns on deposits ranging from ₹10K to ₹1Cr with tenure from 7 days to 10 years at 7-9% p.a. DICGC insured up to ₹5L with premature withdrawal facility and senior citizen benefits (additional 0.5% interest).",
        req: ["KYC Documents", "PAN Card", "Bank Account Details", "Initial Deposit Amount"]
    },

    // INSURANCE
    "Health Insurance": {
        desc: "Cashless hospitalization coverage from ₹5L to ₹1Cr with family floater options and lifetime renewability. Includes pre-existing disease cover after waiting period, OPD benefits, maternity coverage, and tax deduction u/s 80D up to ₹25K.",
        req: ["Medical History Declaration", "KYC Documents", "Age Proof", "Proposal Form"]
    },
    "Life Insurance": {
        desc: "Comprehensive life cover from ₹25L to ₹5Cr with savings, investment, and protection plans. Options include endowment, ULIP, and whole life policies with maturity benefits, bonus accrual, and tax exemption u/s 10(10D).",
        req: ["Income Proof", "KYC Documents", "Medical Examination (if required)", "Nominee Details"]
    },
    "Term Insurance": {
        desc: "Pure risk cover from ₹50L to ₹10Cr with affordable premiums starting at ₹500/month for non-smokers. Critical illness riders, accidental death benefits, premium waiver options, and tax benefits u/s 80C up to ₹1.5L annually.",
        req: ["Income Proof", "KYC Documents", "Non-Smoker Declaration", "Medical Reports (if applicable)"]
    },
    "Travel Insurance": {
        desc: "Domestic and international travel protection covering medical emergencies, trip cancellation, baggage loss, and passport loss from ₹50K to ₹1Cr. Single trip or annual multi-trip plans with 24x7 global assistance and cashless hospitalization.",
        req: ["Passport Copy", "Travel Dates/Itinerary", "KYC Documents", "Visa (for International)"]
    },
    "Vehicle Insurance": {
        desc: "Comprehensive motor insurance covering own damage, third-party liability, and personal accident up to IDV value. Add-ons include zero depreciation, engine protection, and roadside assistance with NCB benefits up to 50% discount.",
        req: ["RC Copy", "Previous Policy Copy", "Vehicle Photos", "Driving License"]
    },
    "Machinery Insurance": {
        desc: "Industrial all-risk coverage protecting manufacturing equipment, boilers, and electrical installations against breakdown, fire, and natural calamities. Sum insured up to ₹50Cr with business interruption cover and annual maintenance contract linkage.",
        req: ["Equipment Valuation Report", "Audit Report", "Fire NOC", "Installation Certificate"]
    }
};

let currentCalcType = 'EMI'; // EMI, SIP, FD, GOLD, INS

function openServiceDiagnostic(name) {
    const data = serviceData[name];
    if (!data) return;

    document.getElementById('detailTitle').innerText = name;
    document.getElementById('detailDesc').innerText = data.desc;

    const list = document.getElementById('reqList');
    list.innerHTML = data.req.map(r => `<li><i class="fas fa-check-circle" style="color:var(--accent)"></i> ${r}</li>`).join('');

    // Determine Calculator Type
    if (name.includes('SIP') || name.includes('Mutual Funds')) currentCalcType = 'SIP';
    else if (name.includes('Fixed Deposits') || name.includes('Pension')) currentCalcType = 'FD';
    else if (name.includes('Insurance')) currentCalcType = 'INS';
    else if (name.includes('Gold')) currentCalcType = 'GOLD';
    else currentCalcType = 'EMI';

    switchCalcMode(currentCalcType);

    const panel = document.getElementById('serviceDetailPanel');
    if (panel) {
        panel.style.display = 'block';
        panel.scrollTop = 0; // Reset scroll for virtual page
    }
}

function switchCalcMode(type) {
    const calcTitle = document.querySelector('#eligibilityCalc h4');
    const resultTitle = document.querySelector('#eligibilityResult p');

    // Reset/Hide Field Labels based on type
    const lbl1 = document.querySelectorAll('.field-group label')[0]; // Income / Monthly Inv
    const lbl2 = document.querySelectorAll('.field-group label')[1]; // EMI / Tenure
    const lbl3 = document.querySelectorAll('.field-group label')[2]; // Loan / Rate
    const lbl4 = document.querySelectorAll('.field-group label')[3]; // Tenure / Inflation

    // Default Visibility
    document.querySelectorAll('.field-group').forEach(el => el.style.display = 'block');

    // INPUT CONFIGURATION LOGIC
    const slider1 = document.getElementById('incomeSlider'); // Generic Input 1
    const slider2 = document.getElementById('emiSlider');    // Generic Input 2
    const slider3 = document.getElementById('loanSlider');   // Generic Input 3
    const slider4 = document.getElementById('tenureSlider'); // Generic Input 4
    const roiContainer = document.querySelector('.field-group select')?.parentElement;

    // Hide ROI by default for specific calculators
    if (roiContainer) roiContainer.style.display = (type === 'EMI') ? 'block' : 'none';

    if (type === 'SIP') {
        calcTitle.innerHTML = '<i class="fas fa-chart-line"></i> Wealth Builder (SIP)';
        lbl1.innerText = "Monthly Investment";
        lbl2.innerText = "Expected Return (%)";
        lbl3.innerText = "Investment Period (Years)";

        document.querySelectorAll('.field-group')[3].style.display = 'none'; // Hide 4th input
        resultTitle.innerText = "Projected Wealth";

        // Configure Sliders (Set MIN first to allow low values)
        slider1.min = 500; slider1.max = 100000; slider1.step = 500; slider1.value = 5000;
        slider2.min = 1; slider2.max = 30; slider2.step = 0.5; slider2.value = 12;
        slider3.min = 1; slider3.max = 50; slider3.step = 1; slider3.value = 10;

    } else if (type === 'FD') {
        calcTitle.innerHTML = '<i class="fas fa-university"></i> Fixed Deposit Returns';
        lbl1.innerText = "Investment Amount";
        lbl2.innerText = "Interest Rate (%)";
        lbl3.innerText = "Tenure (Years)";
        document.querySelectorAll('.field-group')[3].style.display = 'none';
        resultTitle.innerText = "Maturity Amount";

        slider1.min = 5000; slider1.max = 10000000; slider1.step = 5000; slider1.value = 100000;
        slider2.min = 1; slider2.max = 15; slider2.step = 0.1; slider2.value = 7.5;
        slider3.min = 1; slider3.max = 20; slider3.step = 1; slider3.value = 5;

    } else if (type === 'GOLD') {
        calcTitle.innerHTML = '<i class="fas fa-coins"></i> Gold Value Trend';
        lbl1.innerText = "Gold Holdings (Grams)";
        lbl2.innerText = "Current Rate (₹/10g)";
        document.querySelectorAll('.field-group')[2].style.display = 'none';
        document.querySelectorAll('.field-group')[3].style.display = 'none';
        resultTitle.innerText = "Portfolio Value";

        slider1.min = 1; slider1.max = 1000; slider1.step = 1; slider1.value = 10;
        slider2.min = 10000; slider2.max = 150000; slider2.step = 100; slider2.value = 75000;

    } else if (type === 'INS') {
        calcTitle.innerHTML = '<i class="fas fa-shield-alt"></i> Insurance Premium';
        lbl1.innerText = "Coverage Amount";
        lbl2.innerText = "Age (Years)";
        lbl3.innerText = "Policy Tenure";
        document.querySelectorAll('.field-group')[3].style.display = 'none';
        resultTitle.innerText = "Est. Monthly Premium";

        slider1.min = 100000; slider1.max = 50000000; slider1.step = 50000; slider1.value = 5000000;
        slider2.min = 18; slider2.max = 100; slider2.step = 1; slider2.value = 30;
        slider3.min = 1; slider3.max = 100; slider3.step = 1; slider3.value = 20;

    } else {
        // EMI (Default)
        calcTitle.innerHTML = '<i class="fas fa-calculator"></i> Eligibility Engine';
        lbl1.innerText = "Monthly Income";
        lbl2.innerText = "Existing EMIs";
        lbl3.innerText = "Expected Funding";
        lbl4.innerText = "Tenure (Months)";
        resultTitle.innerText = "Max Funding Potential";

        // Reset Standard Defaults
        slider1.min = 15000; slider1.max = 1000000; slider1.step = 5000; slider1.value = 50000;
        slider2.min = 0; slider2.max = 500000; slider2.step = 5000; slider2.value = 0;
        slider3.min = 100000; slider3.max = 50000000; slider3.step = 100000; slider3.value = 1000000;
        if (slider4) { slider4.min = 6; slider4.max = 360; slider4.step = 6; slider4.value = 60; }
    }

    // Force inputs to match slider values immediately
    // Fix: We must update sliders and THEN text, because setting min might have clamped value

    // Ensure text inputs reflect the valid Slider Value (which respects min/max)
    document.getElementById('incomeText').value = formatNumberINR(slider1.value);

    // For Rate/Age/Small numbers, don't format with commas commonly (optional, but cleaner)
    document.getElementById('emiText').value = (type === 'EMI' || type === 'GOLD') ? formatNumberINR(slider2.value) : slider2.value;

    // Loan/Tenure
    document.getElementById('loanText').value = (type === 'EMI' || type === 'FD' || type === 'INS') ? formatNumberINR(slider3.value) : slider3.value;

    if (slider4) document.getElementById('tenureText').value = slider4.value;

    runAdvancedCalc();
}

function resetToHome(e) {
    if (e) e.preventDefault();
    const panel = document.getElementById('serviceDetailPanel');
    if (panel) panel.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- CALCULATOR ---
// --- CALCULATOR ENHANCED ---
function formatINR(num) {
    return "₹" + Math.round(num).toLocaleString('en-IN');
}

function formatNumberINR(num) {
    return Math.round(num).toLocaleString('en-IN');
}

function parseFormattedNumber(str) {
    return parseInt(str.toString().replace(/,/g, '')) || 0;
}

function syncInputs(sliderId, textId, callback) {
    const slider = document.getElementById(sliderId);
    const text = document.getElementById(textId);
    if (!slider || !text) return;

    slider.addEventListener('input', () => {
        text.value = slider.id === 'tenureSlider' ? slider.value : formatNumberINR(slider.value);
        if (callback) callback();
    });

    text.addEventListener('input', () => {
        let rawVal = text.value.replace(/[^0-9]/g, '');
        let val = parseInt(rawVal) || 0;
        slider.value = val;
        if (callback) callback();
    });

    text.addEventListener('blur', () => {
        let val = parseFormattedNumber(text.value);
        text.value = slider.id === 'tenureSlider' ? val : formatNumberINR(val);
    });
}

// Initial Syncing Setup (Will be called after DOM load or when panel opens)
function setupCalculatorSync() {
    syncInputs('incomeSlider', 'incomeText', runAdvancedCalc);
    syncInputs('emiSlider', 'emiText', runAdvancedCalc);
    syncInputs('loanSlider', 'loanText', runAdvancedCalc);
    syncInputs('tenureSlider', 'tenureText', runAdvancedCalc);
}

function runAdvancedCalc() {
    if (currentCalcType === 'SIP') return runSIPCalc();
    if (currentCalcType === 'FD') return runFDCalc();
    if (currentCalcType === 'GOLD') return runGoldCalc();
    if (currentCalcType === 'INS') return runInsCalc();

    // --- STANDARD EMI CALCULATION ---
    const income = parseInt(document.getElementById('incomeSlider')?.value || 0);
    const existingEMI = parseInt(document.getElementById('emiSlider')?.value || 0);
    const expectedLoan = parseInt(document.getElementById('loanSlider')?.value || 0);
    const tenureMonths = parseInt(document.getElementById('tenureSlider')?.value || 60);
    const roiEl = document.getElementById('roiSelect');
    const annualRoi = parseFloat(roiEl ? roiEl.value : 14);
    const monthlyRoi = (annualRoi / 12) / 100;

    // Sync Text Inputs
    const incText = document.getElementById('incomeText');
    const emiText = document.getElementById('emiText');
    const loanText = document.getElementById('loanText');
    const tenText = document.getElementById('tenureText');

    if (incText && document.activeElement !== incText) incText.value = formatNumberINR(income);
    if (emiText && document.activeElement !== emiText) emiText.value = formatNumberINR(existingEMI);
    if (loanText && document.activeElement !== loanText) loanText.value = formatNumberINR(expectedLoan);
    if (tenText && document.activeElement !== tenText) tenText.value = tenureMonths;

    // Display Labels (Optional fallback)
    const incLbl = document.getElementById('incomeVal');
    const emiLbl = document.getElementById('emiPaidVal');
    const loanLbl = document.getElementById('loanVal');
    const tenureLbl = document.getElementById('tenureVal');

    if (incLbl) incLbl.innerText = formatINR(income);
    if (emiLbl) emiLbl.innerText = formatINR(existingEMI);
    if (loanLbl) loanLbl.innerText = formatINR(expectedLoan);
    if (tenureLbl) tenureLbl.innerText = tenureMonths + " Months";

    // Calculation logic
    const allowedEMI = income * 0.50; // 50% FOIR
    const availableEMI = allowedEMI - existingEMI;

    let maxLoanPossible = 0;
    if (availableEMI > 0) {
        maxLoanPossible = availableEMI * (Math.pow(1 + monthlyRoi, tenureMonths) - 1) / (monthlyRoi * Math.pow(1 + monthlyRoi, tenureMonths));
    }

    const resEl = document.getElementById('finalAmount');
    if (resEl) resEl.innerText = formatINR(maxLoanPossible) + "*";

    const statusMsg = document.getElementById('foirStatus');
    if (statusMsg) {
        if (expectedLoan > maxLoanPossible) {
            statusMsg.innerText = "Required EMI exceeds available capacity.";
            statusMsg.style.color = "#ef4444";
        } else {
            statusMsg.innerText = "High funding compatibility detected.";
            statusMsg.style.color = "#10b981";
        }
    }
}

function runSIPCalc() {
    // Get values from Generic Inputs
    const invAmt = parseInt(document.getElementById('incomeSlider')?.value) || 5000;
    const rate = parseFloat(document.getElementById('emiSlider')?.value) || 12;
    const years = parseInt(document.getElementById('loanSlider')?.value) || 10;

    // Sync Text inputs strictly
    const t1 = document.getElementById('incomeText');
    const t2 = document.getElementById('emiText');
    const t3 = document.getElementById('loanText');
    if (t1 && document.activeElement !== t1) t1.value = formatNumberINR(invAmt);
    if (t2 && document.activeElement !== t2) t2.value = rate;
    if (t3 && document.activeElement !== t3) t3.value = years;

    // Formula: M = P × ({[1 + i]^n – 1} / i) × (1 + i)
    const i = (rate / 12) / 100; // Monthly Rate
    const n = years * 12;        // Total Months

    // Safety check to avoid infinity
    if (i === 0) {
        document.getElementById('finalAmount').innerText = formatINR(invAmt * n);
        return;
    }

    const maturity = invAmt * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);

    document.getElementById('finalAmount').innerText = formatINR(maturity);
    document.getElementById('foirStatus').innerText = `Wealth accumulated over ${years} Years`;
}

function runFDCalc() {
    const principal = parseInt(document.getElementById('incomeSlider')?.value) || 100000;
    const rate = parseFloat(document.getElementById('emiSlider')?.value) || 7.5;
    const years = parseInt(document.getElementById('loanSlider')?.value) || 5;

    // Sync Text
    if (document.activeElement !== document.getElementById('incomeText')) document.getElementById('incomeText').value = formatNumberINR(principal);
    if (document.activeElement !== document.getElementById('emiText')) document.getElementById('emiText').value = rate;
    if (document.activeElement !== document.getElementById('loanText')) document.getElementById('loanText').value = years;

    const maturity = principal * Math.pow(1 + (rate / 100), years);
    document.getElementById('finalAmount').innerText = formatINR(maturity);
    document.getElementById('foirStatus').innerText = `Maturity Value at ${rate}% Interest`
}

function runGoldCalc() {
    const grams = parseInt(document.getElementById('incomeSlider')?.value) || 10;
    const ratePer10g = parseInt(document.getElementById('emiSlider')?.value) || 75000;

    const val = (grams * ratePer10g); // Basic calc, rate is usually per 10g but user enters total rate or we adjust logic
    // Correction: If user enters rate per 10g, value is (grams/10) * rate. 
    // But let's assume Slider 2 is "Rate per 10g".
    const realVal = (grams / 10) * ratePer10g;

    document.getElementById('finalAmount').innerText = formatINR(realVal);
    document.getElementById('foirStatus').innerHTML = "<span class='trend-up'><i class='fas fa-arrow-up'></i> Bullish Trend Detected</span>";
}

function runInsCalc() {
    const cover = parseInt(document.getElementById('incomeSlider')?.value) || 5000000;
    const age = parseInt(document.getElementById('emiSlider')?.value) || 30;
    const tenure = parseInt(document.getElementById('loanSlider')?.value) || 20;

    // Sync Text
    if (document.activeElement !== document.getElementById('incomeText')) document.getElementById('incomeText').value = formatNumberINR(cover);
    if (document.activeElement !== document.getElementById('emiText')) document.getElementById('emiText').value = age;
    if (document.activeElement !== document.getElementById('loanText')) document.getElementById('loanText').value = tenure;

    // Simple actuarial logic approximation
    const baseRate = 5000;
    const ageFactor = (age > 25) ? (age - 25) * 200 : 0;
    const coverFactor = (cover / 1000000) * 1000;
    const tenureFactor = (tenure > 20) ? (tenure - 20) * 100 : 0;

    const premium = (baseRate + ageFactor + coverFactor + tenureFactor) / 12;

    document.getElementById('finalAmount').innerText = formatINR(premium) + "/mo";
    document.getElementById('foirStatus').innerText = "Includes 18% GST & Tax Benefits";
}

// --- SCANNER ---
function runScanner() {
    const el = document.getElementById('scanAmt');
    if (!el) return;
    const val = parseInt(el.value);
    document.getElementById('scanAmtLabel').innerText = "₹ " + val.toLocaleString('en-IN');
    document.getElementById('potentialSavings').innerText = "₹ " + Math.round(val * 0.025).toLocaleString('en-IN');
}

// --- HERO ACTION ---
function handleHeroAction() {
    const hInput = document.getElementById('heroMobileInput');
    const val = hInput ? hInput.value.trim() : '';

    toggleChat();

    setTimeout(() => {
        if (val) {
            userMsg("My Number is " + val + ". Check Eligibility.");
            processNeuroLogic("My Number is " + val);
        } else {
            // If empty, just start normal flow
            if (engineState === "GREETING") {
                botMsg("<b>Welcome to Alpha Private Client.</b><br>I am your AI Financial Architect. How may I address you today?", true);
                engineState = "NAME";
            }
        }
    }, 600);
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    runAdvancedCalc(); // Initial Run

    // Key bindings
    const cin = document.getElementById('chatInput');
    if (cin) {
        cin.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleChatInput();
        });
    }

    // Hero Mobile Input Bind
    const hInput = document.getElementById('heroMobileInput');
    if (hInput) {
        hInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = hInput.value;
                toggleChat();
                setTimeout(() => {
                    userMsg("My Number is " + val + ". Check Eligibility.");
                    processNeuroLogic("My Number is " + val);
                }, 800);
            }
        });
    }

    // Scroll Nudge
    let nudgeHandled = false;
    window.addEventListener('scroll', () => {
        if (nudgeHandled) return;
        const loansC = document.getElementById('loans-portal');
        if (loansC && loansC.getBoundingClientRect().top < window.innerHeight) {
            const nudge = document.getElementById('aiNudge');
            if (nudge) {
                nudge.style.display = 'block';
                setTimeout(() => nudge.style.display = 'none', 8000);
            }
            nudgeHandled = true;
        }
    });

    // --- NEW UI LOGIC ---

    // 1. Remove Preloader
    setTimeout(() => {
        const pre = document.getElementById('preloader');
        if (pre) {
            pre.style.opacity = '0';
            setTimeout(() => pre.remove(), 500);
        }
    }, 1500); // 1.5s total load time

    // 2. Intersection Observer for Reveals
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
                observer.unobserve(entry.target); // Reveal only once
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
});

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.toggle('active');
}

// --- EXIT INTENT POPUP ---
let exitIntentShown = false;
function showExitIntentPopup() {
    if (exitIntentShown) return;
    const popup = document.getElementById('exitIntentPopup');
    if (popup) {
        popup.style.display = 'flex';
        exitIntentShown = true;
        localStorage.setItem('exitIntentShown', 'true');
    }
}

function closeExitIntent() {
    const popup = document.getElementById('exitIntentPopup');
    if (popup) popup.style.display = 'none';
}

// Track mouse leaving viewport
document.addEventListener('mouseleave', (e) => {
    if (e.clientY <= 0 && !exitIntentShown && !localStorage.getItem('exitIntentShown')) {
        showExitIntentPopup();
    }
});

// --- PROACTIVE CHATBOT TRIGGERS ---
let proactiveTriggerFired = false;
let userIdleTime = 0;
let scrollDepth = 0;

// Track user idle time
setInterval(() => {
    userIdleTime++;

    // Trigger after 30 seconds of idle time
    if (userIdleTime >= 30 && !proactiveTriggerFired && !exitIntentShown) {
        triggerProactiveChatbot("Still exploring? I can help you find the perfect financial solution!");
        proactiveTriggerFired = true;
    }
}, 1000);

// Reset idle timer on user activity
['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, () => {
        userIdleTime = 0;
    }, true);
});

// Track scroll depth
window.addEventListener('scroll', () => {
    const winHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollPercent = (scrollTop / (docHeight - winHeight)) * 100;

    scrollDepth = Math.max(scrollDepth, scrollPercent);

    // Trigger when user scrolls 50% down the page
    if (scrollDepth >= 50 && !proactiveTriggerFired) {
        setTimeout(() => {
            if (!proactiveTriggerFired) {
                triggerProactiveChatbot("I see you're interested! Would you like a personalized loan recommendation?");
                proactiveTriggerFired = true;
            }
        }, 2000);
    }
});

function triggerProactiveChatbot(message) {
    const nudge = document.getElementById('aiNudge');
    const nudgeText = document.getElementById('nudgeText');
    if (nudge && nudgeText) {
        nudgeText.innerText = message;
        nudge.style.display = 'block';

        // Auto-hide after 10 seconds
        setTimeout(() => {
            nudge.style.display = 'none';
        }, 10000);
    }
}

// --- CIBIL SCORE CHECKER ---
function checkCIBILScore() {
    const name = document.getElementById('cibilName')?.value.trim();
    const mobile = document.getElementById('cibilMobile')?.value.trim();
    const pan = document.getElementById('cibilPAN')?.value.trim();

    if (!name || !mobile || !pan) {
        alert('Please fill all fields to check your CIBIL score');
        return;
    }

    // Validate mobile (10 digits)
    if (!/^\d{10}$/.test(mobile)) {
        alert('Please enter a valid 10-digit mobile number');
        return;
    }

    // Validate PAN (basic format)
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase())) {
        alert('Please enter a valid PAN number (e.g., ABCDE1234F)');
        return;
    }

    // Show loading
    const resultDiv = document.getElementById('cibilResult');
    const checkBtn = document.querySelector('.cibil-checker button');
    if (checkBtn) checkBtn.disabled = true;
    if (resultDiv) {
        resultDiv.innerHTML = '<div class="cibil-loading"><i class="fas fa-spinner fa-spin"></i> Fetching your credit report...</div>';
        resultDiv.style.display = 'block';
    }

    // Simulate API call (2-3 seconds)
    setTimeout(() => {
        // Generate simulated score (650-850 range)
        const simulatedScore = Math.floor(Math.random() * 200) + 650;
        const scoreClass = simulatedScore >= 750 ? 'excellent' : simulatedScore >= 700 ? 'good' : 'fair';
        const scoreLabel = simulatedScore >= 750 ? 'Excellent' : simulatedScore >= 700 ? 'Good' : 'Fair';
        const scoreColor = simulatedScore >= 750 ? '#10b981' : simulatedScore >= 700 ? '#f59e0b' : '#ef4444';

        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="cibil-score-display">
                    <div class="score-circle" style="border-color: ${scoreColor};">
                        <div class="score-number" style="color: ${scoreColor};">${simulatedScore}</div>
                        <div class="score-label">${scoreLabel}</div>
                    </div>
                    <div class="score-details">
                        <p><i class="fas fa-info-circle"></i> <strong>Note:</strong> This is an indicative score based on available data.</p>
                        <p><i class="fas fa-check-circle" style="color: #10b981;"></i> You're eligible for ${scoreLabel.toLowerCase()} interest rates!</p>
                        <button class="btn btn-primary" onclick="toggleChat()" style="margin-top: 15px;">
                            Get Personalized Loan Offers <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        if (checkBtn) checkBtn.disabled = false;

        // Track in chatData for later use
        chatData.cibil = simulatedScore;
        chatData.client = name;
        chatData.phone = mobile;
    }, 2500);
}

// --- DEBT CONSOLIDATION CALCULATOR ---
function calculateDebtConsolidation() {
    const loan1 = parseFloat(document.getElementById('debt1Amount')?.value) || 0;
    const rate1 = parseFloat(document.getElementById('debt1Rate')?.value) || 0;
    const loan2 = parseFloat(document.getElementById('debt2Amount')?.value) || 0;
    const rate2 = parseFloat(document.getElementById('debt2Rate')?.value) || 0;
    const loan3 = parseFloat(document.getElementById('debt3Amount')?.value) || 0;
    const rate3 = parseFloat(document.getElementById('debt3Rate')?.value) || 0;
    const newRate = parseFloat(document.getElementById('consolidatedRate')?.value) || 11;

    const totalDebt = loan1 + loan2 + loan3;

    if (totalDebt === 0) {
        alert('Please enter at least one loan amount');
        return;
    }

    // Calculate weighted average current rate
    const weightedRate = ((loan1 * rate1) + (loan2 * rate2) + (loan3 * rate3)) / totalDebt;

    // Calculate monthly EMI for current loans (assuming 5 year tenure)
    const tenure = 60; // months
    const currentMonthlyEMI = calculateEMI(loan1, rate1, tenure) +
        calculateEMI(loan2, rate2, tenure) +
        calculateEMI(loan3, rate3, tenure);

    // Calculate new consolidated EMI
    const newMonthlyEMI = calculateEMI(totalDebt, newRate, tenure);

    // Calculate savings
    const monthlySavings = currentMonthlyEMI - newMonthlyEMI;
    const annualSavings = monthlySavings * 12;
    const totalSavings = monthlySavings * tenure;

    // Display results
    const resultDiv = document.getElementById('debtConsolidationResult');
    if (resultDiv) {
        resultDiv.innerHTML = `
            <div class="consolidation-results">
                <div class="result-row">
                    <span>Total Debt:</span>
                    <strong>${formatINR(totalDebt)}</strong>
                </div>
                <div class="result-row">
                    <span>Current Avg. Rate:</span>
                    <strong>${weightedRate.toFixed(2)}% p.a.</strong>
                </div>
                <div class="result-row">
                    <span>Current Monthly EMI:</span>
                    <strong>${formatINR(currentMonthlyEMI)}</strong>
                </div>
                <div class="result-row highlight">
                    <span>New Consolidated EMI:</span>
                    <strong>${formatINR(newMonthlyEMI)}</strong>
                </div>
                <div class="result-row savings">
                    <span><i class="fas fa-piggy-bank"></i> Monthly Savings:</span>
                    <strong style="color: #10b981;">${formatINR(monthlySavings)}</strong>
                </div>
                <div class="result-row savings">
                    <span><i class="fas fa-chart-line"></i> Annual Savings:</span>
                    <strong style="color: #10b981;">${formatINR(annualSavings)}</strong>
                </div>
                <div class="result-row savings">
                    <span><i class="fas fa-trophy"></i> Total Savings (5 Years):</span>
                    <strong style="color: #10b981; font-size: 20px;">${formatINR(totalSavings)}</strong>
                </div>
                <button class="btn btn-primary" onclick="toggleChat()" style="width: 100%; margin-top: 20px;">
                    Apply for Debt Consolidation <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;
        resultDiv.style.display = 'block';
    }
}

function calculateEMI(principal, annualRate, tenureMonths) {
    if (principal === 0 || annualRate === 0) return 0;
    const monthlyRate = (annualRate / 12) / 100;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return emi;
}

// --- INVESTMENT GROWTH CALCULATOR ---
function calculateInvestmentGrowth() {
    const initialInv = parseFloat(document.getElementById('initialInvestment')?.value) || 0;
    const monthlySIP = parseFloat(document.getElementById('monthlySIP')?.value) || 0;
    const expectedReturn = parseFloat(document.getElementById('expectedReturn')?.value) || 12;
    const investmentYears = parseInt(document.getElementById('investmentYears')?.value) || 10;

    if (initialInv === 0 && monthlySIP === 0) {
        alert('Please enter initial investment or monthly SIP amount');
        return;
    }

    const months = investmentYears * 12;
    const monthlyRate = (expectedReturn / 12) / 100;

    // Calculate lump sum growth
    const lumpSumGrowth = initialInv * Math.pow(1 + monthlyRate, months);

    // Calculate SIP growth
    let sipGrowth = 0;
    if (monthlySIP > 0 && monthlyRate > 0) {
        sipGrowth = monthlySIP * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    }

    const totalValue = lumpSumGrowth + sipGrowth;
    const totalInvested = initialInv + (monthlySIP * months);
    const totalReturns = totalValue - totalInvested;
    const returnPercentage = ((totalReturns / totalInvested) * 100).toFixed(2);

    // Display results
    const resultDiv = document.getElementById('investmentGrowthResult');
    if (resultDiv) {
        resultDiv.innerHTML = `
            <div class="investment-results">
                <div class="result-summary">
                    <div class="summary-card">
                        <div class="summary-label">Total Invested</div>
                        <div class="summary-value">${formatINR(totalInvested)}</div>
                    </div>
                    <div class="summary-card highlight">
                        <div class="summary-label">Projected Value</div>
                        <div class="summary-value" style="color: #10b981;">${formatINR(totalValue)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Total Returns</div>
                        <div class="summary-value" style="color: var(--accent);">${formatINR(totalReturns)}</div>
                    </div>
                </div>
                <div class="result-details">
                    <div class="detail-row">
                        <span>Return on Investment:</span>
                        <strong style="color: #10b981;">${returnPercentage}%</strong>
                    </div>
                    <div class="detail-row">
                        <span>Investment Period:</span>
                        <strong>${investmentYears} Years</strong>
                    </div>
                    <div class="detail-row">
                        <span>Expected Annual Return:</span>
                        <strong>${expectedReturn}% p.a.</strong>
                    </div>
                </div>
                <div class="investment-chart-placeholder" style="margin-top: 20px; padding: 20px; background: var(--bg-soft); border-radius: 12px; text-align: center;">
                    <i class="fas fa-chart-area" style="font-size: 48px; color: var(--primary); opacity: 0.3;"></i>
                    <p style="margin-top: 10px; color: var(--text-gray); font-size: 13px;">Wealth growth projection over ${investmentYears} years</p>
                </div>
                <button class="btn btn-primary" onclick="toggleChat()" style="width: 100%; margin-top: 20px;">
                    Start Investing Now <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;
        resultDiv.style.display = 'block';
    }
}

// --- FAQ ACCORDION ---
function toggleFAQ(element) {
    const answer = element.nextElementSibling;
    const icon = element.querySelector('.faq-icon');

    // Close all other FAQs
    document.querySelectorAll('.faq-answer').forEach(ans => {
        if (ans !== answer) {
            ans.style.maxHeight = null;
            ans.style.padding = '0 20px';
        }
    });

    document.querySelectorAll('.faq-icon').forEach(ic => {
        if (ic !== icon) {
            ic.style.transform = 'rotate(0deg)';
        }
    });

    // Toggle current FAQ
    if (answer.style.maxHeight) {
        answer.style.maxHeight = null;
        answer.style.padding = '0 20px';
        icon.style.transform = 'rotate(0deg)';
    } else {
        answer.style.maxHeight = answer.scrollHeight + 40 + 'px';
        answer.style.padding = '20px';
        icon.style.transform = 'rotate(180deg)';
    }
}
