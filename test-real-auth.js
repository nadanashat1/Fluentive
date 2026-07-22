// Test script to verify real authentication flow
// Run this in browser console to test frontend auth

async function testRealAuth() {
  console.log('=== Testing Real Authentication Flow ===');
  
  // 1. Test login
  console.log('\n1. Testing login...');
  try {
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fluentive.com', password: 'admin123' }),
      credentials: 'include'
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful:', loginData.data.user);
      console.log('📝 Cookies set:', document.cookie);
    } else {
      console.error('❌ Login failed:', loginResponse.status);
      return;
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    return;
  }
  
  // 2. Test auth/me with cookies
  console.log('\n2. Testing /api/auth/me with cookies...');
  try {
    const meResponse = await fetch('/api/auth/me', {
      credentials: 'include'
    });
    
    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('✅ Auth me successful:', meData.data.user);
    } else {
      console.error('❌ Auth me failed:', meResponse.status);
    }
  } catch (error) {
    console.error('❌ Auth me error:', error);
  }
  
  // 3. Test dashboard with cookies
  console.log('\n3. Testing /api/dashboard/summary with cookies...');
  try {
    const dashboardResponse = await fetch('/api/dashboard/summary', {
      credentials: 'include'
    });
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard successful:', dashboardData.success);
      console.log('📊 Leads total:', dashboardData.data?.leads?.total);
    } else {
      console.error('❌ Dashboard failed:', dashboardResponse.status);
    }
  } catch (error) {
    console.error('❌ Dashboard error:', error);
  }
  
  // 4. Test cookie extraction manually
  console.log('\n4. Testing cookie extraction...');
  const cookies = document.cookie.split(';');
  const accessToken = cookies.find(c => c.trim().startsWith('accessToken='))?.split('=')[1];
  const refreshToken = cookies.find(c => c.trim().startsWith('refreshToken='))?.split('=')[1];
  
  console.log('🍪 Access token found:', !!accessToken);
  console.log('🍪 Refresh token found:', !!refreshToken);
  if (accessToken) {
    console.log('📝 Access token preview:', accessToken.substring(0, 20) + '...');
  }
  
  console.log('\n=== Test Complete ===');
}

// Auto-run the test
testRealAuth();
