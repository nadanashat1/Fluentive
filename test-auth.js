// Test API with authentication
const testAPI = async () => {
  // First, login to get a token
  const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    })
  });

  if (loginResponse.ok) {
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...');
    
    // Now test dashboard with token
    const dashboardResponse = await fetch('http://localhost:3000/api/dashboard/summary', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('📊 Dashboard response:', dashboardResponse.status);
    const dashboardData = await dashboardResponse.json();
    console.log('📊 Dashboard data:', dashboardData);
    
  } else {
    console.log('❌ Login failed:', await loginResponse.text());
  }
};

testAPI();
