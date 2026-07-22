async function testDashboardNewUser() {
  console.log('🧪 Testing Dashboard API with New User Creation...\n');

  const BASE_URL = 'http://localhost:3000';

  try {
    // 1. Register a new user
    console.log('1️⃣ Registering new user...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'V1 Test User',
        email: 'v1test@example.com',
        password: 'Test123456!',
        role: 'admin'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('Register response:', registerData.success ? '✅ Success' : '❌ Failed');
    
    // 2. Login with the new user
    console.log('2️⃣ Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'v1test@example.com',
        password: 'Test123456!'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData.success ? '✅ Success' : '❌ Failed');
    
    if (!loginData.success) {
      console.log('Login error:', loginData.message);
      return;
    }

    const token = loginData.data.token;
    console.log('Token received:', token.substring(0, 20) + '...\n');

    // 3. Test dashboard API
    console.log('3️⃣ Testing /api/dashboard/summary...');
    const dashboardResponse = await fetch(`${BASE_URL}/api/dashboard/summary`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Dashboard API Status:', dashboardResponse.status);
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard API Working!');
      console.log('📊 Dashboard Summary:');
      console.log('  - Total users:', dashboardData.data?.users?.total || 0);
      console.log('  - Active users:', dashboardData.data?.users?.active || 0);
      console.log('  - Online users:', dashboardData.data?.users?.online?.length || 0);
      console.log('  - Total leads:', dashboardData.data?.leads?.total || 0);
      console.log('  - Converted leads:', dashboardData.data?.leads?.converted || 0);
      console.log('  - Conversion rate:', dashboardData.data?.leads?.conversionRate || 0);
      console.log('  - Time tracking today:', dashboardData.data?.timeTracking?.today?.totalHours || '0h');
      console.log('  - Activity breakdown count:', dashboardData.data?.engagement?.activities?.breakdown?.length || 0);
      console.log('  - Recent activities count:', dashboardData.data?.engagement?.recent?.length || 0);
      console.log('  - Page views:', dashboardData.data?.engagement?.pageViews || 0);
      
      // Check if V1 behavior is working
      console.log('\n🔍 V1 Behavior Analysis:');
      const hasRealOnlineUsers = (dashboardData.data?.users?.active || 0) > 0;
      const hasRealActivityBreakdown = (dashboardData.data?.engagement?.activities?.breakdown?.length || 0) > 0;
      const hasRealTimeTracking = dashboardData.data?.timeTracking?.today?.trackedUsers > 0;
      
      console.log('  - Real online users detection:', hasRealOnlineUsers ? '✅ Working' : '❌ Missing');
      console.log('  - Activity breakdown:', hasRealActivityBreakdown ? '✅ Working' : '❌ Empty');
      console.log('  - Time tracking:', hasRealTimeTracking ? '✅ Working' : '❌ Static');
      
      // Test heartbeat to generate activity
      console.log('\n4️⃣ Testing heartbeat to generate activity...');
      const heartbeatResponse = await fetch(`${BASE_URL}/api/time-tracking/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isIdle: false })
      });
      
      if (heartbeatResponse.ok) {
        console.log('✅ Heartbeat sent successfully');
        
        // Test dashboard again after heartbeat
        console.log('\n5️⃣ Testing dashboard after heartbeat...');
        const dashboardResponse2 = await fetch(`${BASE_URL}/api/dashboard/summary`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (dashboardResponse2.ok) {
          const dashboardData2 = await dashboardResponse2.json();
          console.log('📊 Updated Dashboard:');
          console.log('  - Active users after heartbeat:', dashboardData2.data?.users?.active || 0);
          console.log('  - Activity breakdown after heartbeat:', dashboardData2.data?.engagement?.activities?.breakdown?.length || 0);
          console.log('  - Recent activities after heartbeat:', dashboardData2.data?.engagement?.recent?.length || 0);
        }
      }
      
    } else {
      const errorText = await dashboardResponse.text();
      console.log('❌ Dashboard Error:', errorText);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDashboardNewUser();
