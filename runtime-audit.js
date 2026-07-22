/**
 * 🔥 RUNTIME AUDIT - Production System Testing
 * This is the critical phase that separates a project from a real SaaS system
 */

async function runRuntimeAudit() {
  console.log('🔥 RUNTIME AUDIT - Production System Testing');
  console.log('=' .repeat(60));

  const BASE_URL = 'http://localhost:3000';
  const API_BASE = 'http://localhost:3000';

  // 🧪 TEST 1: Auth Flow - Unauthenticated Access
  console.log('\n🧪 TEST 1: Auth Flow - Unauthenticated Access');
  console.log('-'.repeat(40));
  
  try {
    // Test direct dashboard access without login
    const dashboardResponse = await fetch(`${API_BASE}/api/dashboard/summary`);
    console.log(`📊 Dashboard API (unauthenticated): ${dashboardResponse.status} ${dashboardResponse.ok ? '❌ Should fail' : '✅ Correctly blocked'}`);
    
    const leadsResponse = await fetch(`${API_BASE}/api/leads`);
    console.log(`📋 Leads API (unauthenticated): ${leadsResponse.status} ${leadsResponse.ok ? '❌ Should fail' : '✅ Correctly blocked'}`);
    
    // Test frontend redirect (would need browser automation, but we can check API behavior)
    console.log('🔍 Frontend redirect test: Requires browser - check if /dashboard redirects to /login');
    
  } catch (error) {
    console.log(`❌ Auth flow test failed: ${error.message}`);
  }

  // 🧪 TEST 2: API Coverage - All Critical Endpoints
  console.log('\n🧪 TEST 2: API Coverage - Critical Endpoints');
  console.log('-'.repeat(40));
  
  // First, login to get token
  let authToken = '';
  try {
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'Test123456!'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      authToken = loginData.data?.token || '';
      console.log('✅ Login successful - token obtained');
    } else {
      console.log('❌ Login failed - using unauthenticated tests');
    }
  } catch (error) {
    console.log(`❌ Login error: ${error.message}`);
  }

  // Test critical APIs
  const apiTests = [
    { name: 'Dashboard Summary', url: '/api/dashboard/summary', critical: true },
    { name: 'Leads List', url: '/api/leads', critical: true },
    { name: 'Time Tracking My Time', url: '/api/time-tracking/my-time', critical: true },
    { name: 'Active Users', url: '/api/time-tracking/active-users', critical: false },
    { name: 'Activities', url: '/api/time-tracking/activities?limit=20', critical: false }
  ];

  const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};

  for (const apiTest of apiTests) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${API_BASE}${apiTest.url}`, { headers });
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`\n📡 ${apiTest.name}:`);
      console.log(`   Status: ${response.status} ${response.ok ? '✅' : '❌'}`);
      console.log(`   Response Time: ${responseTime}ms ${responseTime > 1000 ? '⚠️ Slow' : ''}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   Data Type: ${Array.isArray(data.data) ? 'Array' : typeof data.data}`);
        console.log(`   Real Data: ${data.data && (Array.isArray(data.data) ? data.data.length > 0 : Object.keys(data.data || {}).length > 0) ? '✅' : '❌ Empty/Null'}`);
        
        // Performance warning
        if (responseTime > 3000) {
          console.log(`   🚨 VERY SLOW: ${responseTime}ms (> 3s)`);
        }
      } else {
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`❌ ${apiTest.name} failed: ${error.message}`);
    }
  }

  // 🧪 TEST 3: Performance Audit - Dashboard API
  console.log('\n🧪 TEST 3: Performance Audit - Dashboard API');
  console.log('-'.repeat(40));
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${API_BASE}/api/dashboard/summary`, { headers });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`⏱️ Dashboard API Response Time: ${responseTime}ms`);
    
    if (responseTime < 1000) {
      console.log('✅ Performance: Excellent (< 1s)');
    } else if (responseTime < 3000) {
      console.log('⚠️ Performance: Acceptable (1-3s)');
    } else {
      console.log('❌ Performance: Too slow (> 3s) - needs optimization');
    }
    
    if (response.ok) {
      const data = await response.json();
      console.log(`📊 Data Structure: ${Object.keys(data.data || {}).length} main sections`);
    }
  } catch (error) {
    console.log(`❌ Performance test failed: ${error.message}`);
  }

  // 🧪 TEST 4: Data Integrity Check
  console.log('\n🧪 TEST 4: Data Integrity Check');
  console.log('-'.repeat(40));
  
  try {
    const response = await fetch(`${API_BASE}/api/leads`, { headers });
    if (response.ok) {
      const data = await response.json();
      
      console.log(`📋 Leads API Data Check:`);
      console.log(`   Total Count: ${data.total || 'N/A'}`);
      console.log(`   Array Length: ${Array.isArray(data.data) ? data.data.length : 'Not an array'}`);
      console.log(`   Has Real Data: ${data.data && data.data.length > 0 ? '✅' : '❌'}`);
      
      if (data.data && data.data.length > 0) {
        const sample = data.data[0];
        console.log(`   Sample Fields: ${Object.keys(sample).join(', ')}`);
        console.log(`   Data Quality: ${sample.id && sample.name ? '✅ Complete' : '❌ Missing fields'}`);
      }
    }
  } catch (error) {
    console.log(`❌ Data integrity test failed: ${error.message}`);
  }

  // 🧪 TEST 5: Console Error Simulation
  console.log('\n🧪 TEST 5: Console Error Simulation');
  console.log('-'.repeat(40));
  console.log('🔍 Console errors require browser - check manually for:');
  console.log('   - Hydration errors');
  console.log('   - "undefined is not a function"');
  console.log('   - "cannot read property"');
  console.log('   - Warning spam');

  console.log('\n🎯 RUNTIME AUDIT SUMMARY');
  console.log('=' .repeat(60));
  console.log('✅ Auth Flow: Tested unauthenticated access');
  console.log('✅ API Coverage: All critical endpoints tested');
  console.log('✅ Performance: Dashboard response time measured');
  console.log('✅ Data Integrity: Real data vs empty/null checked');
  console.log('🔍 Console: Requires manual browser check');
  
  console.log('\n🚀 NEXT STEPS:');
  console.log('1. Fix any failed APIs');
  console.log('2. Optimize slow endpoints');
  console.log('3. Test refresh behavior in browser');
  console.log('4. Check console for runtime errors');
  console.log('5. Verify auth persistence');
}

// Run the audit
runRuntimeAudit().catch(console.error);
