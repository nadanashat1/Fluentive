async function testProductionAPIs() {
  console.log('🔥 PRODUCTION API VALIDATION TEST\n');

  const BASE_URL = 'http://localhost:3000';

  try {
    // 1. Login first
    console.log('1️⃣ Authenticating...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'Test123456!'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login Status:', loginResponse.ok ? '✅ Success' : '❌ Failed');
    
    if (!loginData.success) {
      console.log('Login error:', loginData.message);
      return;
    }

    const token = loginData.data.token;
    console.log('Token received:', token.substring(0, 20) + '...\n');

    // 2. Test critical APIs with Network validation
    const apiTests = [
      { name: 'Leads API', url: '/api/leads' },
      { name: 'Dashboard Summary', url: '/api/dashboard/summary' },
      { name: 'Time Tracking My Time', url: '/api/time-tracking/my-time' },
      { name: 'Active Users', url: '/api/time-tracking/active-users' },
      { name: 'Activities', url: '/api/time-tracking/activities?limit=20' }
    ];

    console.log('2️⃣ Testing Critical APIs (Network Validation):');
    console.log('=' .repeat(50));

    for (const apiTest of apiTests) {
      console.log(`\n📡 Testing: ${apiTest.name}`);
      console.log(`🔗 URL: ${apiTest.url}`);
      
      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}${apiTest.url}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const endTime = Date.now();
      
      console.log(`⏱️  Response Time: ${endTime - startTime}ms`);
      console.log(`📊 Status: ${response.status} ${response.ok ? '✅' : '❌'}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📦 Data Type: ${Array.isArray(data.data) ? 'Array' : typeof data.data}`);
        console.log(`📏 Data Size: ${Array.isArray(data.data) ? data.data.length : Object.keys(data || {}).length} items`);
        
        // Check for real data vs empty/null
        if (Array.isArray(data.data)) {
          console.log(`🔍 Real Data: ${data.data.length > 0 ? '✅' : '❌ Empty'}`);
          if (data.data.length > 0) {
            console.log(`📋 Sample: ${JSON.stringify(data.data[0]).substring(0, 100)}...`);
          }
        } else if (data.data && typeof data.data === 'object') {
          console.log(`🔍 Real Data: ${Object.keys(data.data).length > 0 ? '✅' : '❌ Empty'}`);
          console.log(`📋 Keys: ${Object.keys(data.data).join(', ')}`);
        } else {
          console.log(`🔍 Real Data: ${data.data !== null ? '✅' : '❌ Null'}`);
        }
        
        // Performance warnings
        if (endTime - startTime > 1000) {
          console.log(`⚠️  SLOW API: ${endTime - startTime}ms (> 1s)`);
        }
        if (endTime - startTime > 3000) {
          console.log(`🚨 VERY SLOW: ${endTime - startTime}ms (> 3s)`);
        }
        
      } else {
        const errorText = await response.text();
        console.log(`❌ Error: ${errorText}`);
      }
    }

    console.log('\n3️⃣ Testing Unauthenticated Access:');
    console.log('=' .repeat(50));
    
    // Test without token
    const unauthResponse = await fetch(`${BASE_URL}/api/leads`);
    console.log(`📡 Unauthenticated /api/leads: ${unauthResponse.status} ${unauthResponse.ok ? '❌ Should fail' : '✅ Correctly blocked'}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testProductionAPIs();
