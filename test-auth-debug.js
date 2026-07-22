// Test authentication endpoint directly
require('dotenv').config({ path: '.env' });

const jwt = require('jsonwebtoken');

// Test the complete authentication flow
async function testAuthFlow() {
  console.log('=== AUTHENTICATION FLOW TEST ===');
  
  // Step 1: Login to get token
  console.log('\n1. Testing login...');
  try {
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'yassin.mahmoud12367@gmail.com',
        password: '123456'
      })
    });

    const loginData = await loginResponse.json();
    
    if (loginResponse.ok && loginData.success) {
      console.log('✅ Login successful');
      const token = loginData.data.token;
      console.log('Token received:', token.substring(0, 50) + '...');
      
      // Step 2: Test /api/auth/me
      console.log('\n2. Testing /api/auth/me...');
      const meResponse = await fetch('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const meData = await meResponse.json();
      
      if (meResponse.ok && meData.success) {
        console.log('✅ /api/auth/me successful');
        console.log('User:', meData.data.user.name, 'Role:', meData.data.user.role);
        
        // Step 3: Test dashboard API
        console.log('\n3. Testing /api/dashboard/summary...');
        const dashboardResponse = await fetch('http://localhost:3000/api/dashboard/summary', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        const dashboardData = await dashboardResponse.json();
        
        if (dashboardResponse.ok && dashboardData.success) {
          console.log('✅ /api/dashboard/summary successful');
          console.log('Dashboard data keys:', Object.keys(dashboardData.data || {}));
        } else {
          console.log('❌ /api/dashboard/summary failed');
          console.log('Status:', dashboardResponse.status);
          console.log('Response:', dashboardData);
        }
        
      } else {
        console.log('❌ /api/auth/me failed');
        console.log('Status:', meResponse.status);
        console.log('Response:', meData);
      }
      
    } else {
      console.log('❌ Login failed');
      console.log('Response:', loginData);
    }
    
  } catch (error) {
    console.log('❌ Error during authentication test:', error.message);
  }
}

testAuthFlow();
