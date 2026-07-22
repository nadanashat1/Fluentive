// Test script to verify browser cookie storage after login
// Run this in browser console to test the fix

async function testBrowserCookies() {
  console.log('=== Testing Browser Cookie Storage ===');
  
  // 1. Clear existing cookies first
  console.log('\n1. Clearing existing cookies...');
  document.cookie.split(';').forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    if (name.includes('token') || name.includes('auth')) {
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      console.log(`Cleared cookie: ${name}`);
    }
  });
  
  // 2. Test login with credentials: 'include'
  console.log('\n2. Testing login with credentials: include...');
  try {
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fluentive.com', password: 'admin123' }),
      credentials: 'include' // 🔥 This is the fix
    });
    
    console.log('Login response status:', loginResponse.status);
    console.log('Login response headers:', [...loginResponse.headers.entries()]);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful:', loginData.data.user);
    } else {
      console.error('❌ Login failed:', loginResponse.status);
      return;
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    return;
  }
  
  // 3. Check cookies after login
  console.log('\n3. Checking cookies after login...');
  console.log('All cookies:', document.cookie);
  
  const cookies = document.cookie.split(';');
  const accessToken = cookies.find(c => c.trim().startsWith('accessToken='))?.split('=')[1];
  const refreshToken = cookies.find(c => c.trim().startsWith('refreshToken='))?.split('=')[1];
  
  console.log('🍪 Access token found:', !!accessToken);
  console.log('🍪 Refresh token found:', !!refreshToken);
  
  if (accessToken) {
    console.log('📝 Access token preview:', accessToken.substring(0, 20) + '...');
  } else {
    console.error('❌ NO ACCESS TOKEN FOUND - This is the problem!');
  }
  
  // 4. Test auth/me with cookies
  console.log('\n4. Testing /api/auth/me with cookies...');
  try {
    const meResponse = await fetch('/api/auth/me', {
      credentials: 'include'
    });
    
    console.log('Auth me response status:', meResponse.status);
    
    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('✅ Auth me successful:', meData.data.user);
    } else {
      console.error('❌ Auth me failed:', meResponse.status);
      const errorText = await meResponse.text();
      console.error('Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Auth me error:', error);
  }
  
  // 5. Test dashboard with cookies
  console.log('\n5. Testing /api/dashboard/summary with cookies...');
  try {
    const dashboardResponse = await fetch('/api/dashboard/summary', {
      credentials: 'include'
    });
    
    console.log('Dashboard response status:', dashboardResponse.status);
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard successful:', dashboardData.success);
      console.log('📊 Leads total:', dashboardData.data?.leads?.total);
    } else {
      console.error('❌ Dashboard failed:', dashboardResponse.status);
      const errorText = await dashboardResponse.text();
      console.error('Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Dashboard error:', error);
  }
  
  console.log('\n=== Test Complete ===');
  
  // 6. Final diagnosis
  if (accessToken && refreshToken) {
    console.log('🎉 SUCCESS: Cookies are being stored properly!');
    console.log('🔥 The fix worked: credentials: "include" was the solution');
  } else {
    console.log('💥 FAILURE: Cookies are still not being stored');
    console.log('🔍 Check the login API response headers for Set-Cookie');
  }
}

// Auto-run the test
testBrowserCookies();
