// ═══════════════════════════════════════════════════════════════════════════
// PIPELINE QUICK TEST - RUN THIS IN CONSOLE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Quick Pipeline Test
 * Run: testPipeline()
 */
async function testPipeline() {
    console.log('🧪 ═══════════════════════════════════════════════════════════');
    console.log('🧪 QUICK PIPELINE TEST');
    console.log('🧪 ═══════════════════════════════════════════════════════════');

    // Test 1: Check CONFIG
    console.log('\n✅ TEST 1: CONFIG');
    console.log('   CONFIG exists:', typeof CONFIG !== 'undefined');
    console.log('   CLOUD_URL:', CONFIG?.CLOUD_URL?.substring(0, 50) + '...');

    // Test 2: Check Functions
    console.log('\n✅ TEST 2: FUNCTIONS');
    console.log('   syncPipelineFromCloud:', typeof syncPipelineFromCloud);
    console.log('   renderPipelineToTab:', typeof renderPipelineToTab);
    console.log('   renderTrackerCard:', typeof renderTrackerCard);

    // Test 3: Check DOM
    console.log('\n✅ TEST 3: DOM ELEMENTS');
    const wrap = document.getElementById('pipelineTableWrap');
    const workspace = document.getElementById('pipelineWorkspace');
    console.log('   pipelineTableWrap:', wrap ? 'EXISTS ✅' : 'MISSING ❌');
    console.log('   pipelineWorkspace:', workspace ? 'EXISTS ✅' : 'MISSING ❌');
    if (workspace) {
        console.log('   workspace display:', workspace.style.display);
    }

    // Test 4: Test Cloud Sync
    console.log('\n✅ TEST 4: CLOUD SYNC');
    try {
        const response = await fetch(CONFIG.CLOUD_URL);
        console.log('   Cloud status:', response.status, response.ok ? '✅' : '❌');

        const text = await response.text();
        console.log('   Response length:', text.length, 'characters');

        const data = JSON.parse(text);
        const leads = data.data || data.leads || data;
        console.log('   Leads count:', leads.length);

        if (leads.length > 0) {
            console.log('   First lead:', leads[0].client || leads[0].CLIENT);
        }
    } catch (e) {
        console.error('   ❌ Cloud test failed:', e.message);
    }

    // Test 5: Call renderPipelineToTab
    console.log('\n✅ TEST 5: RENDER PIPELINE');
    console.log('   Calling renderPipelineToTab()...');
    try {
        await renderPipelineToTab();
        console.log('   ✅ Render completed');
    } catch (e) {
        console.error('   ❌ Render failed:', e.message);
    }

    console.log('\n🧪 ═══════════════════════════════════════════════════════════');
    console.log('🧪 TEST COMPLETE - Check pipeline tab!');
    console.log('🧪 ═══════════════════════════════════════════════════════════');
}

// Make globally available
window.testPipeline = testPipeline;

console.log('✅ Pipeline Quick Test Loaded');
console.log('💡 Run: testPipeline()');
