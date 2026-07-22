/**
 * API Diagnostic Script
 * Run this to test API connectivity and identify issues
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

console.log('=================================');
console.log('🔧 API DIAGNOSTIC TOOL');
console.log('=================================');
console.log(`Testing against: ${BASE_URL}`);
console.log('=================================\n');

async function testEndpoint(name, method, endpoint, body = null, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  console.log(`\n📡 ${method} ${endpoint}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
      credentials: 'include'
    });

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log(`   ✅ SUCCESS`);
      if (data && typeof data === 'object') {
        console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 500));
      }
      return { success: true, data, status: response.status };
    } else {
      console.log(`   ❌ FAILED`);
      console.log(`   Response:`, typeof data === 'string' ? data.substring(0, 200) : JSON.stringify(data, null, 2).substring(0, 500));
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runDiagnostics() {
  let authToken = null;
  let testLeadId = null;
  let testDealId = null;
  
  const results = [];

  // Test 1: Health Check
  console.log('\n🏥 TEST 1: Health Check (no auth required)');
  const health = await testEndpoint('Health', 'GET', '/api/health');
  
  if (!health.success) {
    console.log('\n❌ CRITICAL: Server is not running or health endpoint is broken!');
    console.log('   Make sure to run: npm run dev');
    process.exit(1);
  }

  // Test 2: Login
  console.log('\n🔐 TEST 2: Authentication');
  console.log('   Testing with: admin@test.com / 123456');
  const login = await testEndpoint('Login', 'POST', '/api/auth/login', {
    email: 'admin@test.com',
    password: '123456'
  });

  if (login.success && login.data?.data?.token) {
    authToken = login.data.data.token;
    console.log(`   ✅ Login successful, token received`);
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    
    // Check if cookies were set
    console.log('   Note: Cookies should be set automatically');
  } else {
    console.log('\n❌ Login failed! Possible causes:');
    console.log('   1. User does not exist - run: npx prisma db seed');
    console.log('   2. Wrong password');
    console.log('   3. Database not connected');
    console.log('   4. JWT_SECRET not set in .env');
  }

  // Test 3: Get Me (with token)
  if (authToken) {
    console.log('\n👤 TEST 3: Get Current User');
    const me = await testEndpoint('Me', 'GET', '/api/auth/me', null, authToken);
    
    if (!me.success) {
      console.log('\n❌ Auth check failed! Possible causes:');
      console.log('   1. Token not being sent in Authorization header');
      console.log('   2. JWT_SECRET mismatch');
      console.log('   3. User was deleted from database');
    }
  }

  // Test 4: Get Leads (requires auth)
  if (authToken) {
    console.log('\n📊 TEST 4: Get Leads');
    const leads = await testEndpoint('Leads', 'GET', '/api/leads', null, authToken);
    
    if (!leads.success) {
      console.log('\n❌ Leads API failed! Possible causes:');
      console.log('   1. Auth middleware blocking request');
      console.log('   2. Database connection issue');
      console.log('   3. Prisma schema mismatch');
    }
  }

  // Test 5: Get Deals
  if (authToken) {
    console.log('\n💼 TEST 5: Get Deals');
    const deals = await testEndpoint('Deals', 'GET', '/api/deals', null, authToken);
    
    // Create a test deal
    console.log('\n💼 TEST 5b: Create Deal');
    const newDeal = await testEndpoint('Create Deal', 'POST', '/api/deals', {
      clientName: 'Test Client',
      clientEmail: `test${Date.now()}@example.com`,
      clientPhone: '+1234567890',
      company: 'Test Company',
      source: 'website',
      dealValue: '5000',
      stage: 'qualification',
      priority: 'hot'
    }, authToken);
    testDealId = newDeal.success ? newDeal.data?.data?.id : null;
    
    if (testDealId) {
      console.log('\n💼 TEST 5c: Get Deal by ID');
      await testEndpoint('Get Deal', 'GET', `/api/deals/${testDealId}`, null, authToken);
    }
  }

  // Test 6: Users
  if (authToken) {
    console.log('\n👥 TEST 6: Users');
    const users = await testEndpoint('Get Users', 'GET', '/api/users', null, authToken);
    
    if (users.success && users.data?.data?.length > 0) {
      const userId = users.data.data[0].id;
      console.log('\n👥 TEST 6b: Get User by ID');
      await testEndpoint('Get User', 'GET', `/api/users/${userId}`, null, authToken);
    }
  }

  // Test 7: Notifications
  if (authToken) {
    console.log('\n🔔 TEST 7: Notifications');
    await testEndpoint('Get Notifications', 'GET', '/api/notifications', null, authToken);
    
    console.log('\n🔔 TEST 7b: Mark All Read');
    await testEndpoint('Mark All Read', 'PATCH', '/api/notifications/read-all', null, authToken);
  }

  // Test 8: Time Tracking
  if (authToken) {
    console.log('\n⏱️ TEST 8: Time Tracking');
    await testEndpoint('My Time', 'GET', '/api/time-tracking/my-time', null, authToken);
    
    console.log('\n⏱️ TEST 8b: Active Users');
    await testEndpoint('Active Users', 'GET', '/api/time-tracking/active-users', null, authToken);
    
    console.log('\n⏱️ TEST 8c: Heartbeat');
    await testEndpoint('Heartbeat', 'POST', '/api/time-tracking/heartbeat', { action: 'test' }, authToken);
    
    console.log('\n⏱️ TEST 8d: My Stats');
    await testEndpoint('My Stats', 'GET', '/api/maintenance/my-stats', null, authToken);
  }

  // Test 9: V2 Leads
  if (authToken) {
    console.log('\n📊 TEST 9: V2 Leads');
    await testEndpoint('Get Leads V2', 'GET', '/api/v2/leads', null, authToken);
    
    console.log('\n📊 TEST 9b: Create Lead V2');
    await testEndpoint('Create Lead V2', 'POST', '/api/v2/leads', {
      name: 'V2 Test Lead',
      email: `v2test${Date.now()}@example.com`,
      phone: '+1234567890',
      course: 'V2 Test',
      status: 'new'
    }, authToken);
  }

  // Test 10: Logout
  if (authToken) {
    console.log('\n🚪 TEST 10: Logout');
    await testEndpoint('Logout', 'POST', '/api/auth/logout', null, authToken);
  }

  // Summary
  console.log('\n=================================');
  console.log('📋 DIAGNOSTIC SUMMARY');
  console.log('=================================');
  
  if (!authToken) {
    console.log('❌ Authentication is broken - fix this first!');
    console.log('   Check:');
    console.log('   - DATABASE_URL in .env');
    console.log('   - JWT_SECRET in .env');
    console.log('   - User exists in database');
    console.log('   - Run: npx prisma db seed');
  } else {
    console.log('✅ Authentication works!');
    console.log('   Next: Check browser console for API request errors');
  }

  console.log('\n🔍 Common fixes:');
  console.log('   1. DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"');
  console.log('   2. JWT_SECRET="your-secret-key-here"');
  console.log('   3. npx prisma db push');
  console.log('   4. npx prisma db seed');
  console.log('=================================\n');
}

runDiagnostics().catch(console.error);
