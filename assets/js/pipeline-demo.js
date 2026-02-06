// ═══════════════════════════════════════════════════════════════════════════
// ALPHA PROFIN - PIPELINE CLOUD SYNC & JOURNEY INTEGRATION
// Prioritizes cloud data, only uses demo data as fallback
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Show Journey Timeline for a lead
 */
function showLeadJourney(leadId) {
    if (typeof JourneyTimeline !== 'undefined') {
        JourneyTimeline.showModal(leadId);
    } else {
        console.error('Journey Timeline not loaded!');
        alert('Journey Timeline feature is loading... Please try again in a moment.');
    }
}

/**
 * Add demo leads to pipeline (FALLBACK ONLY)
 */
function addDemoLeadsToPipeline() {
    const demoLeads = [
        {
            id: 'DEMO001',
            client: 'Rajesh Kumar (Demo)',
            amount: '50,00,000',
            displayAmount: '50L',
            agent: localStorage.getItem('activeAgentName') || 'AGENT',
            status: 'Credit_Review',
            cibil: '780',
            type: 'BL',
            phone: '+91 98765 43210',
            note: 'Demo lead - High-value business loan',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString()
        },
        {
            id: 'DEMO002',
            client: 'Priya Sharma (Demo)',
            amount: '25,00,000',
            displayAmount: '25L',
            agent: localStorage.getItem('activeAgentName') || 'AGENT',
            status: 'Sanctioned',
            cibil: '750',
            type: 'PL',
            phone: '+91 98765 43211',
            note: 'Demo lead - Personal loan',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString()
        },
        {
            id: 'DEMO003',
            client: 'Amit Patel (Demo)',
            amount: '75,00,000',
            displayAmount: '75L',
            agent: localStorage.getItem('activeAgentName') || 'AGENT',
            status: 'Login_Done',
            cibil: '720',
            type: 'HL',
            phone: '+91 98765 43212',
            note: 'Demo lead - Home loan',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
        }
    ];

    // Save to localStorage
    localStorage.setItem('alphaSubmittedLeads', JSON.stringify(demoLeads));

    console.log('⚠️ Added 3 DEMO leads (cloud sync failed)');

    // Show notification
    if (typeof NotificationEngine !== 'undefined') {
        NotificationEngine.add({
            type: 'SYSTEM_UPDATE',
            message: 'Cloud sync unavailable. Showing 3 demo leads. Check your internet connection.',
            actions: [
                { label: 'Retry Sync', action: 'retry_sync' }
            ]
        });
    }

    return demoLeads;
}

/**
 * Initialize pipeline - CLOUD FIRST!
 * Only adds demo data if cloud sync completely fails
 */
async function initializePipelineWithCloudSync() {
    console.log('🔄 Initializing Pipeline (Cloud First)...');

    // PRIORITY 1: Try cloud sync
    if (typeof syncPipelineFromCloud === 'function') {
        try {
            console.log('☁️ Syncing from cloud...');
            const cloudLeads = await syncPipelineFromCloud();

            if (cloudLeads && cloudLeads.length > 0) {
                console.log(`✅ SUCCESS! Synced ${cloudLeads.length} leads from cloud`);

                // Show success notification
                if (typeof NotificationEngine !== 'undefined') {
                    NotificationEngine.add({
                        type: 'SYSTEM_UPDATE',
                        message: `✅ Synced ${cloudLeads.length} leads from cloud! Click PIPELINE to view.`,
                        actions: [
                            { label: 'View Pipeline', action: 'view_pipeline' }
                        ]
                    });
                }

                return cloudLeads; // SUCCESS - Cloud data loaded!
            } else {
                console.warn('⚠️ Cloud returned 0 leads');
            }
        } catch (e) {
            console.error('❌ Cloud sync error:', e);
        }
    } else {
        console.warn('⚠️ syncPipelineFromCloud function not found');
    }

    // PRIORITY 2: Check local storage
    const localLeads = JSON.parse(localStorage.getItem('alphaSubmittedLeads') || '[]');

    if (localLeads.length > 0) {
        console.log(`📦 Using ${localLeads.length} cached leads from localStorage`);
        return localLeads;
    }

    // PRIORITY 3: Last resort - demo data
    console.warn('⚠️ No cloud data, no local data - adding demo leads');
    return addDemoLeadsToPipeline();
}

// Make functions globally available
window.showLeadJourney = showLeadJourney;
window.addDemoLeadsToPipeline = addDemoLeadsToPipeline;
window.initializePipelineWithCloudSync = initializePipelineWithCloudSync;

console.log('✅ Pipeline Cloud Sync Integration Loaded');
