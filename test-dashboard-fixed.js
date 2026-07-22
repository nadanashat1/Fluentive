async function testDashboardFixed() {
  console.log('🧪 Testing Dashboard API with Fixed Credentials...\n');

  const BASE_URL = 'http://localhost:3000';

  try {
    // 1. Register a new user first
    console.log('1️⃣ Registering new test user...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dashboard Test User',
        email: 'dashboardtest@example.com',
        password: 'Test123456!',
        role: 'admin'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('Register response:', registerData.success ? '✅ Success' : '❌ Failed (user may already exist)');
    
    // 2. Login
    console.log('2️⃣ Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dashboardtest@example.com',
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
      console.log('Users online:', dashboardData.data?.users?.active || 0);
      console.log('Total leads:', dashboardData.data?.leads?.total || 0);
      console.log('Activity breakdown count:', dashboardData.data?.engagement?.activities?.breakdown?.length || 0);
      console.log('Recent activities count:', dashboardData.data?.engagement?.recent?.length || 0);
    } else {
      const errorText = await dashboardResponse.text();
      console.log('❌ Dashboard Error:', errorText);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDashboardFixed();
