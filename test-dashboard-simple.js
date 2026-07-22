async function testDashboardAPI() {
  console.log('🧪 Testing Dashboard API Only...\n');

  const BASE_URL = 'http://localhost:3000';

  try {
    // 1. Login first
    console.log('1️⃣ Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
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

    // 2. Test dashboard API only
    console.log('2️⃣ Testing /api/dashboard/summary...');
    const dashboardResponse = await fetch(`${BASE_URL}/api/dashboard/summary`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Dashboard API Status:', dashboardResponse.status);
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('Dashboard Response:', JSON.stringify(dashboardData, null, 2));
    } else {
      const errorText = await dashboardResponse.text();
      console.log('Dashboard Error Response:', errorText);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDashboardAPI();
