async function testAPIResponses() {
  console.log('🧪 Testing Real API Responses...\n');

  const BASE_URL = 'http://localhost:3000';

  try {
    // 1. Register test user
    console.log('1️⃣ Registering test user...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'testuser@example.com',
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

    // 3. Test /api/leads with real authentication
    console.log('3️⃣ Testing /api/leads endpoint...');
    const leadsResponse = await fetch(`${BASE_URL}/api/leads?page=1&limit=10`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const leadsData = await leadsResponse.json();
    console.log('Leads API Status:', leadsResponse.status);
    console.log('Leads Response:', JSON.stringify(leadsData, null, 2));
    
    // 4. Test pagination with page 2
    console.log('\n4️⃣ Testing pagination (page 2)...');
    const leadsPage2Response = await fetch(`${BASE_URL}/api/leads?page=2&limit=10`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const leadsPage2Data = await leadsPage2Response.json();
    console.log('Page 2 Response:', JSON.stringify(leadsPage2Data, null, 2));
    
    // 5. Test /api/dashboard/summary
    console.log('\n5️⃣ Testing /api/dashboard/summary...');
    const dashboardResponse = await fetch(`${BASE_URL}/api/dashboard/summary`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const dashboardData = await dashboardResponse.json();
    console.log('Dashboard API Status:', dashboardResponse.status);
    console.log('Dashboard Response:', JSON.stringify(dashboardData, null, 2));
    
    // 6. Test creating a lead
    console.log('\n6️⃣ Testing lead creation...');
    const createLeadResponse = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test Lead',
        phone: '+1234567890',
        email: 'testlead@example.com',
        course: 'Test Course',
        source: 'website',
        status: 'new'
      })
    });
    
    const createLeadData = await createLeadResponse.json();
    console.log('Create Lead Response:', JSON.stringify(createLeadData, null, 2));

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAPIResponses();
