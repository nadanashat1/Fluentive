/**
 * Test Backend API Direct Connection
 */

async function testBackendAPI() {
  console.log('🔥 Testing Backend API Direct Connection');
  console.log('=' .repeat(50));

  const BASE_URL = 'http://localhost:5000';

  try {
    // Test health endpoint
    console.log('\n🧪 Testing Health Endpoint');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health:', healthData.server);
    console.log('✅ Database:', healthData.database);

    // Test login endpoint
    console.log('\n🧪 Testing Login Endpoint');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'Test123456!'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful');
      console.log('📋 Token:', loginData.data?.token ? 'Received' : 'Missing');
      console.log('📋 User:', loginData.data?.user?.email || 'Unknown');
    } else {
      const errorData = await loginResponse.json();
      console.log('❌ Login failed:', errorData.error || 'Unknown error');
    }

    // Test leads endpoint
    console.log('\n🧪 Testing Leads Endpoint');
    const leadsResponse = await fetch(`${BASE_URL}/api/leads`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (leadsResponse.ok) {
      const leadsData = await leadsResponse.json();
      console.log('✅ Leads endpoint working');
      console.log('📊 Total leads:', leadsData.total || 0);
    } else {
      const errorData = await leadsResponse.json();
      console.log('❌ Leads failed:', errorData.error || 'Unknown error');
    }

  } catch (error) {
    console.log('❌ Backend API test failed:', error.message);
  }
}

testBackendAPI();
