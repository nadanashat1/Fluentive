// Test authentication flow end-to-end
const BASE_URL = 'http://localhost:3000';

async function testAuth() {
  console.log('🧪 Testing Authentication Flow...\n');
  
  // Test 1: Health check
  console.log('1. Testing health endpoint...');
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const health = await healthRes.json();
    console.log('✅ Health:', health.status);
  } catch (error) {
    console.log('❌ Health failed:', error.message);
    return;
  }

  // Test 2: Register user
  console.log('\n2. Testing registration...');
  try {
    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123'
      })
    });
    
    const registerData = await registerRes.json();
    console.log('Register status:', registerRes.status);
    console.log('Register response:', registerData);
    
    if (registerData.success) {
      console.log('✅ Registration successful');
      console.log('Token received:', !!registerData.data.token);
      
      // Test 3: Login with same credentials
      console.log('\n3. Testing login...');
      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test123'
        })
      });
      
      const loginData = await loginRes.json();
      console.log('Login status:', loginRes.status);
      console.log('Login response:', loginData);
      
      if (loginData.success) {
        console.log('✅ Login successful');
        const token = loginData.data.token;
        
        // Test 4: Protected dashboard endpoint
        console.log('\n4. Testing protected dashboard...');
        const dashboardRes = await fetch(`${BASE_URL}/api/dashboard/summary`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const dashboardData = await dashboardRes.json();
        console.log('Dashboard status:', dashboardRes.status);
        console.log('Dashboard response:', dashboardData);
        
        if (dashboardData.success) {
          console.log('✅ Dashboard access successful');
          console.log('Dashboard data keys:', Object.keys(dashboardData.data || {}));
        } else {
          console.log('❌ Dashboard access failed:', dashboardData.message);
        }
      } else {
        console.log('❌ Login failed:', loginData.message);
      }
    } else {
      console.log('❌ Registration failed:', registerData.message);
    }
  } catch (error) {
    console.log('❌ Auth test failed:', error.message);
  }
}

testAuth();
