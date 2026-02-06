// ═══════════════════════════════════════════════════════════════════════════
// ALPHA PROFIN - PIPELINE DIAGNOSTICS & DEBUG UTILITY
// Run this in browser console to diagnose pipeline issues
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Comprehensive Pipeline Diagnostic
 * Run: await diagnosePipeline()
 */
async function diagnosePipeline() {
    console.log('🔍 ═══════════════════════════════════════════════════════════');
    console.log('🔍 PIPELINE DIAGNOSTIC STARTING...');
    console.log('🔍 ═══════════════════════════════════════════════════════════');

    // 1. Check CONFIG
    console.log('\n📋 STEP 1: Checking Configuration...');
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG is not defined!');
        return;
    }
    console.log('✅ CONFIG exists');
    console.log('   CLOUD_URL:', CONFIG.CLOUD_URL);

    // 2. Check syncPipelineFromCloud function
    console.log('\n📋 STEP 2: Checking sync function...');
    if (typeof syncPipelineFromCloud !== 'function') {
        console.error('❌ syncPipelineFromCloud is not defined!');
        return;
    }
    console.log('✅ syncPipelineFromCloud exists');

    // 3. Test Cloud Connection
    console.log('\n📋 STEP 3: Testing cloud connection...');
    try {
        const response = await fetch(CONFIG.CLOUD_URL);
        console.log('✅ Cloud responded with status:', response.status);

        const text = await response.text();
        console.log('✅ Response length:', text.length, 'characters');

        let data;
        try {
            data = JSON.parse(text);
            console.log('✅ Valid JSON response');
        } catch (e) {
            console.error('❌ Invalid JSON response');
            console.log('First 200 characters:', text.substring(0, 200));
            return;
        }

        const rawLeads = data.data || data.leads || data;
        console.log('✅ Raw data type:', Array.isArray(rawLeads) ? 'Array' : typeof rawLeads);
        console.log('✅ Raw leads count:', Array.isArray(rawLeads) ? rawLeads.length : 'N/A');

        if (Array.isArray(rawLeads) && rawLeads.length > 0) {
            console.log('\n📊 First lead structure:');
            console.log(rawLeads[0]);
        }

    } catch (e) {
        console.error('❌ Cloud connection failed:', e.message);
        return;
    }

    // 4. Call syncPipelineFromCloud
    console.log('\n📋 STEP 4: Calling syncPipelineFromCloud...');
    try {
        const allLeads = await syncPipelineFromCloud();
        console.log('✅ syncPipelineFromCloud returned:', allLeads.length, 'leads');

        if (allLeads.length > 0) {
            console.log('\n📊 First lead after mapping:');
            console.log(allLeads[0]);

            console.log('\n📊 All leads summary:');
            allLeads.forEach((lead, i) => {
                console.log(`   ${i + 1}. ${lead.client} - Agent: "${lead.agent}" - ID: ${lead.id}`);
            });
        } else {
            console.warn('⚠️ No leads returned from syncPipelineFromCloud');
        }

    } catch (e) {
        console.error('❌ syncPipelineFromCloud failed:', e.message);
        console.error(e);
        return;
    }

    // 5. Check Agent Name
    console.log('\n📋 STEP 5: Checking agent name...');
    const currentAgent = localStorage.getItem('activeAgentName');
    console.log('   Current agent name:', currentAgent);
    console.log('   Uppercase:', (currentAgent || '').trim().toUpperCase());

    // 6. Check Filtering
    console.log('\n📋 STEP 6: Testing lead filtering...');
    const allLeads = await syncPipelineFromCloud();
    const currentAgentUpper = (currentAgent || 'AGENT').trim().toUpperCase();

    const filtered = allLeads.filter(l => {
        const leadAgent = (l.agent || "").trim().toUpperCase();
        const matches = leadAgent === currentAgentUpper || leadAgent === 'SYSTEM' || leadAgent === '';

        console.log(`   Lead: ${l.client}`);
        console.log(`      Agent field: "${l.agent}" → "${leadAgent}"`);
        console.log(`      Current agent: "${currentAgentUpper}"`);
        console.log(`      Match: ${matches ? '✅ YES' : '❌ NO'}`);

        return matches;
    });

    console.log('\n✅ Filtered leads count:', filtered.length);

    // 7. Check DOM
    console.log('\n📋 STEP 7: Checking DOM elements...');
    const pipelineWrap = document.getElementById('pipelineTableWrap');
    if (!pipelineWrap) {
        console.error('❌ pipelineTableWrap element not found!');
    } else {
        console.log('✅ pipelineTableWrap exists');
        console.log('   Current HTML length:', pipelineWrap.innerHTML.length);
    }

    const pipelineWorkspace = document.getElementById('pipelineWorkspace');
    if (!pipelineWorkspace) {
        console.error('❌ pipelineWorkspace element not found!');
    } else {
        console.log('✅ pipelineWorkspace exists');
        console.log('   Display:', pipelineWorkspace.style.display);
    }

    // 8. Summary
    console.log('\n🔍 ═══════════════════════════════════════════════════════════');
    console.log('🔍 DIAGNOSTIC SUMMARY:');
    console.log('🔍 ═══════════════════════════════════════════════════════════');
    console.log('   Total leads from cloud:', allLeads.length);
    console.log('   Leads after filtering:', filtered.length);
    console.log('   Current agent:', currentAgent);
    console.log('   DOM element exists:', !!pipelineWrap);

    if (filtered.length === 0 && allLeads.length > 0) {
        console.warn('\n⚠️ ISSUE FOUND: Filtering is excluding all leads!');
        console.warn('   Possible fixes:');
        console.warn('   1. Update agent name to match leads');
        console.warn('   2. Update leads in Google Sheet to have agent name');
        console.warn('   3. Disable agent filtering temporarily');
    }

    console.log('\n🔍 ═══════════════════════════════════════════════════════════');
    console.log('✅ DIAGNOSTIC COMPLETE!');
    console.log('🔍 ═══════════════════════════════════════════════════════════');

    return {
        cloudUrl: CONFIG.CLOUD_URL,
        totalLeads: allLeads.length,
        filteredLeads: filtered.length,
        currentAgent: currentAgent,
        allLeads: allLeads,
        filteredLeads: filtered
    };
}

// Make it globally available
window.diagnosePipeline = diagnosePipeline;

console.log('✅ Pipeline Diagnostics Loaded');
console.log('💡 Run: await diagnosePipeline()');
