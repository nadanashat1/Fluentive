// Test script to verify race condition fix
// Run this in browser console to test the complete login flow

async function testRaceConditionFix() {
  console.log('=== Testing Race Condition Fix ===');
  
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
  
  // 2. Test the new login flow (with auth/me verification)
  console.log('\n2. Testing enhanced login flow...');
  const startTime = Date.now();
  
  try {
    // Step 1: Login
    console.log('Step 1: Performing login...');
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fluentive.com', password: 'admin123' }),
      credentials: 'include'
    });
    
    console.log('Login response status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginResponse.status);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful:', loginData.data.user);
    
    // Step 2: Check cookies immediately after login
    console.log('\nStep 2: Checking cookies immediately after login...');
    const cookies = document.cookie.split(';');
    const accessToken = cookies.find(c => c.trim().startsWith('accessToken='))?.split('=')[1];
    const refreshToken = cookies.find(c => c.trim().startsWith('refreshToken='))?.split('=')[1];
    
    console.log('🍪 Access token found:', !!accessToken);
    console.log('🍪 Refresh token found:', !!refreshToken);
    
    // Step 3: Test auth/me (should work immediately now)
    console.log('\nStep 3: Testing /api/auth/me immediately...');
    const meResponse = await fetch('/api/auth/me', {
      credentials: 'include'
    });
    
    console.log('Auth me response status:', meResponse.status);
    
    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('✅ Auth me successful immediately:', meData.data.user);
    } else {
      console.error('❌ Auth me failed immediately:', meResponse.status);
      const errorText = await meResponse.text();
      console.error('Error details:', errorText);
    }
    
    // Step 4: Test dashboard (should work immediately now)
    console.log('\nStep 4: Testing /api/dashboard/summary immediately...');
    const dashboardResponse = await fetch('/api/dashboard/summary', {
      credentials: 'include'
    });
    
    console.log('Dashboard response status:', dashboardResponse.status);
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard successful immediately:', dashboardData.success);
      console.log('📊 Leads total:', dashboardData.data?.leads?.total);
    } else {
      console.error('❌ Dashboard failed immediately:', dashboardResponse.status);
      const errorText = await dashboardResponse.text();
      console.error('Error details:', errorText);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`\n⏱️ Total time: ${totalTime}ms`);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
  
  console.log('\n=== Race Condition Test Complete ===');
  
  // 5. Final diagnosis
  console.log('\n📋 Expected Results:');
  console.log('✅ Login should complete with auth/me verification');
  console.log('✅ Cookies should be available immediately');
  console.log('✅ Auth me should work without 401');
  console.log('✅ Dashboard should work without 401');
  console.log('✅ No "Unknown user" flash');
  console.log('✅ Clean transition to authenticated state');
  
  console.log('\n🔍 If you still see 401 errors:');
  console.log('1. Check browser DevTools → Network tab');
  console.log('2. Look for "Set-Cookie" headers in login response');
  console.log('3. Verify cookies are stored in Application → Cookies');
  console.log('4. Check console for "[AuthKernel] Verifying auth after login..." logs');
}

// Auto-run the test
testRaceConditionFix();
