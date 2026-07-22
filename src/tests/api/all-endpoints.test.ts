/**
 * Comprehensive API Test Suite
 * Tests all endpoints and functionality
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Test user credentials
const TEST_USER = {
  email: 'admin@test.com',
  password: '123456'
};

let authToken: string | null = null;
let testUserId: string | null = null;
let testLeadId: string | null = null;
let testDealId: string | null = null;

// Helper functions
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    const data = await response.json().catch(() => null);
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

// ==========================================
// AUTH TESTS
// ==========================================

async function testAuthEndpoints() {
  console.log('\n🔐 Testing AUTH Endpoints...\n');
  
  const results = {
    login: false,
    me: false,
    register: false,
    logout: false,
    changePassword: false,
    '2faVerify': false,
    '2faDisable': false
  };

  // 1. Login
  console.log('POST /api/auth/login - Testing login...');
  const loginRes = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(TEST_USER)
  });
  
  if (loginRes.ok && loginRes.data?.success) {
    console.log('  ✅ Login successful');
    authToken = loginRes.data.data?.token || null;
    results.login = true;
  } else {
    console.log('  ❌ Login failed:', loginRes.data?.message || `Status ${loginRes.status}`);
  }

  // 2. Get Me (requires auth)
  if (authToken) {
    console.log('GET /api/auth/me - Testing get current user...');
    const meRes = await apiRequest('/api/auth/me');
    
    if (meRes.ok && meRes.data?.success) {
      console.log('  ✅ Get user successful');
      testUserId = meRes.data.data?.id;
      results.me = true;
    } else {
      console.log('  ❌ Get user failed:', meRes.data?.message || `Status ${meRes.status}`);
    }
  }

  // 3. Register (test with new email)
  console.log('POST /api/auth/register - Testing registration...');
  const newUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'test123456'
  };
  const registerRes = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(newUser)
  });
  
  if (registerRes.ok && registerRes.data?.success) {
    console.log('  ✅ Registration successful');
    results.register = true;
  } else {
    console.log('  ❌ Registration failed:', registerRes.data?.message || `Status ${registerRes.status}`);
  }

  // 4. Logout
  if (authToken) {
    console.log('POST /api/auth/logout - Testing logout...');
    const logoutRes = await apiRequest('/api/auth/logout', {
      method: 'POST'
    });
    
    if (logoutRes.ok) {
      console.log('  ✅ Logout successful');
      results.logout = true;
    } else {
      console.log('  ❌ Logout failed:', logoutRes.data?.message || `Status ${logoutRes.status}`);
    }
    
    // Re-login for other tests
    const reLoginRes = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(TEST_USER)
    });
    if (reLoginRes.ok) {
      authToken = reLoginRes.data?.data?.token || null;
    }
  }

  // 5. Change Password
  if (authToken) {
    console.log('POST /api/auth/change-password - Testing change password...');
    const changePwRes = await apiRequest('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: TEST_USER.password,
        newPassword: 'newpassword123'
      })
    });
    
    if (changePwRes.ok) {
      console.log('  ✅ Change password successful');
      results.changePassword = true;
    } else {
      console.log('  ❌ Change password failed:', changePwRes.data?.message || `Status ${changePwRes.status}`);
    }
  }

  return results;
}

// ==========================================
// LEADS TESTS
// ==========================================

async function testLeadsEndpoints() {
  console.log('\n📊 Testing LEADS Endpoints...\n');
  
  const results = {
    getAll: false,
    create: false,
    getById: false,
    update: false,
    delete: false,
    notes: false,
    attachments: false
  };

  // 1. Get all leads
  console.log('GET /api/leads - Testing get all leads...');
  const leadsRes = await apiRequest('/api/leads');
  
  if (leadsRes.ok && leadsRes.data?.success) {
    console.log(`  ✅ Get leads successful (${leadsRes.data.count || 0} leads)`);
    results.getAll = true;
  } else {
    console.log('  ❌ Get leads failed:', leadsRes.data?.message || `Status ${leadsRes.status}`);
  }

  // 2. Create lead
  console.log('POST /api/leads - Testing create lead...');
  const newLead = {
    name: 'Test Lead',
    email: `lead${Date.now()}@example.com`,
    phone: '+1234567890',
    course: 'Test Course',
    status: 'new'
  };
  const createLeadRes = await apiRequest('/api/leads', {
    method: 'POST',
    body: JSON.stringify(newLead)
  });
  
  if (createLeadRes.ok && createLeadRes.data?.success) {
    console.log('  ✅ Create lead successful');
    testLeadId = createLeadRes.data.data?.id;
    results.create = true;
  } else {
    console.log('  ❌ Create lead failed:', createLeadRes.data?.message || `Status ${createLeadRes.status}`);
  }

  // 3. Get lead by ID
  if (testLeadId) {
    console.log(`GET /api/leads/${testLeadId} - Testing get lead by ID...`);
    const leadRes = await apiRequest(`/api/leads/${testLeadId}`);
    
    if (leadRes.ok && leadRes.data?.success) {
      console.log('  ✅ Get lead by ID successful');
      results.getById = true;
    } else {
      console.log('  ❌ Get lead by ID failed:', leadRes.data?.message || `Status ${leadRes.status}`);
    }

    // 4. Update lead
    console.log(`PATCH /api/leads/${testLeadId} - Testing update lead...`);
    const updateLeadRes = await apiRequest(`/api/leads/${testLeadId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'contacted' })
    });
    
    if (updateLeadRes.ok && updateLeadRes.data?.success) {
      console.log('  ✅ Update lead successful');
      results.update = true;
    } else {
      console.log('  ❌ Update lead failed:', updateLeadRes.data?.message || `Status ${updateLeadRes.status}`);
    }

    // 5. Get lead notes
    console.log(`GET /api/leads/${testLeadId}/notes - Testing get lead notes...`);
    const notesRes = await apiRequest(`/api/leads/${testLeadId}/notes`);
    
    if (notesRes.ok) {
      console.log('  ✅ Get lead notes successful');
      results.notes = true;
    } else {
      console.log('  ❌ Get lead notes failed:', notesRes.data?.message || `Status ${notesRes.status}`);
    }
  }

  return results;
}

// ==========================================
// DEALS TESTS
// ==========================================

async function testDealsEndpoints() {
  console.log('\n💼 Testing DEALS Endpoints...\n');
  
  const results = {
    getAll: false,
    create: false,
    getById: false
  };

  // 1. Get all deals
  console.log('GET /api/deals - Testing get all deals...');
  const dealsRes = await apiRequest('/api/deals');
  
  if (dealsRes.ok && dealsRes.data?.success) {
    console.log(`  ✅ Get deals successful (${dealsRes.data.count || 0} deals)`);
    results.getAll = true;
  } else {
    console.log('  ❌ Get deals failed:', dealsRes.data?.message || `Status ${dealsRes.status}`);
  }

  // 2. Create deal
  console.log('POST /api/deals - Testing create deal...');
  const newDeal = {
    clientName: 'Test Client',
    clientEmail: `client${Date.now()}@example.com`,
    clientPhone: '+1234567890',
    company: 'Test Company',
    source: 'website',
    dealValue: '5000',
    stage: 'OPEN',
    priority: 'hot'
  };
  const createDealRes = await apiRequest('/api/deals', {
    method: 'POST',
    body: JSON.stringify(newDeal)
  });
  
  if (createDealRes.ok && createDealRes.data?.success) {
    console.log('  ✅ Create deal successful');
    testDealId = createDealRes.data.data?.id;
    results.create = true;
  } else {
    console.log('  ❌ Create deal failed:', createDealRes.data?.message || `Status ${createDealRes.status}`);
  }

  // 3. Get deal by ID
  if (testDealId) {
    console.log(`GET /api/deals/${testDealId} - Testing get deal by ID...`);
    const dealRes = await apiRequest(`/api/deals/${testDealId}`);
    
    if (dealRes.ok && dealRes.data?.success) {
      console.log('  ✅ Get deal by ID successful');
      results.getById = true;
    } else {
      console.log('  ❌ Get deal by ID failed:', dealRes.data?.message || `Status ${dealRes.status}`);
    }
  }

  return results;
}

// ==========================================
// USERS TESTS
// ==========================================

async function testUsersEndpoints() {
  console.log('\n👥 Testing USERS Endpoints...\n');
  
  const results = {
    getAll: false,
    getById: false,
    update: false,
    unlock: false
  };

  // 1. Get all users
  console.log('GET /api/users - Testing get all users...');
  const usersRes = await apiRequest('/api/users');
  
  if (usersRes.ok && usersRes.data?.success) {
    console.log(`  ✅ Get users successful (${usersRes.data.count || 0} users)`);
    results.getAll = true;
  } else {
    console.log('  ❌ Get users failed:', usersRes.data?.message || `Status ${usersRes.status}`);
  }

  // 2. Get user by ID
  if (testUserId) {
    console.log(`GET /api/users/${testUserId} - Testing get user by ID...`);
    const userRes = await apiRequest(`/api/users/${testUserId}`);
    
    if (userRes.ok && userRes.data?.success) {
      console.log('  ✅ Get user by ID successful');
      results.getById = true;
    } else {
      console.log('  ❌ Get user by ID failed:', userRes.data?.message || `Status ${userRes.status}`);
    }
  }

  return results;
}

// ==========================================
// NOTIFICATIONS TESTS
// ==========================================

async function testNotificationsEndpoints() {
  console.log('\n🔔 Testing NOTIFICATIONS Endpoints...\n');
  
  const results = {
    getAll: false,
    markAsRead: false,
    markAllAsRead: false,
    delete: false
  };

  // 1. Get all notifications
  console.log('GET /api/notifications - Testing get all notifications...');
  const notifsRes = await apiRequest('/api/notifications');
  
  if (notifsRes.ok && notifsRes.data?.success) {
    console.log(`  ✅ Get notifications successful (${notifsRes.data.unreadCount || 0} unread)`);
    results.getAll = true;
  } else {
    console.log('  ❌ Get notifications failed:', notifsRes.data?.message || `Status ${notifsRes.status}`);
  }

  // 2. Mark all as read
  console.log('PATCH /api/notifications/read-all - Testing mark all as read...');
  const markAllRes = await apiRequest('/api/notifications/read-all', {
    method: 'PATCH'
  });
  
  if (markAllRes.ok) {
    console.log('  ✅ Mark all as read successful');
    results.markAllAsRead = true;
  } else {
    console.log('  ❌ Mark all as read failed:', markAllRes.data?.message || `Status ${markAllRes.status}`);
  }

  return results;
}

// ==========================================
// TIME TRACKING TESTS
// ==========================================

async function testTimeTrackingEndpoints() {
  console.log('\n⏱️ Testing TIME TRACKING Endpoints...\n');
  
  const results = {
    getMyTime: false,
    getActiveUsers: false,
    heartbeat: false,
    getActivities: false,
    getMyStats: false
  };

  // 1. Get my time
  console.log('GET /api/time-tracking/my-time - Testing get my time...');
  const myTimeRes = await apiRequest('/api/time-tracking/my-time');
  
  if (myTimeRes.ok && myTimeRes.data?.success) {
    console.log('  ✅ Get my time successful');
    results.getMyTime = true;
  } else {
    console.log('  ❌ Get my time failed:', myTimeRes.data?.message || `Status ${myTimeRes.status}`);
  }

  // 2. Get active users
  console.log('GET /api/time-tracking/active-users - Testing get active users...');
  const activeUsersRes = await apiRequest('/api/time-tracking/active-users');
  
  if (activeUsersRes.ok && activeUsersRes.data?.success) {
    console.log(`  ✅ Get active users successful (${activeUsersRes.data.data?.length || 0} users)`);
    results.getActiveUsers = true;
  } else {
    console.log('  ❌ Get active users failed:', activeUsersRes.data?.message || `Status ${activeUsersRes.status}`);
  }

  // 3. Send heartbeat
  console.log('POST /api/time-tracking/heartbeat - Testing heartbeat...');
  const heartbeatRes = await apiRequest('/api/time-tracking/heartbeat', {
    method: 'POST',
    body: JSON.stringify({ action: 'page_view' })
  });
  
  if (heartbeatRes.ok && heartbeatRes.data?.success) {
    console.log('  ✅ Heartbeat successful');
    results.heartbeat = true;
  } else {
    console.log('  ❌ Heartbeat failed:', heartbeatRes.data?.message || `Status ${heartbeatRes.status}`);
  }

  // 4. Get activities
  console.log('GET /api/time-tracking/activities - Testing get activities...');
  const activitiesRes = await apiRequest('/api/time-tracking/activities');
  
  if (activitiesRes.ok) {
    console.log('  ✅ Get activities successful');
    results.getActivities = true;
  } else {
    console.log('  ❌ Get activities failed:', activitiesRes.data?.message || `Status ${activitiesRes.status}`);
  }

  // 5. Get my stats
  console.log('GET /api/maintenance/my-stats - Testing get my stats...');
  const statsRes = await apiRequest('/api/maintenance/my-stats');
  
  if (statsRes.ok && statsRes.data?.success) {
    console.log('  ✅ Get my stats successful');
    results.getMyStats = true;
  } else {
    console.log('  ❌ Get my stats failed:', statsRes.data?.message || `Status ${statsRes.status}`);
  }

  return results;
}

// ==========================================
// HEALTH TESTS
// ==========================================

async function testHealthEndpoint() {
  console.log('\n🏥 Testing HEALTH Endpoint...\n');
  
  console.log('GET /api/health - Testing health check...');
  const healthRes = await apiRequest('/api/health');
  
  if (healthRes.ok && healthRes.data?.status === 'healthy') {
    console.log('  ✅ Health check passed');
    return { health: true };
  } else {
    console.log('  ❌ Health check failed:', healthRes.data?.message || `Status ${healthRes.status}`);
    return { health: false };
  }
}

// ==========================================
// V2 LEADS TESTS
// ==========================================

async function testV2LeadsEndpoints() {
  console.log('\n📊 Testing V2 LEADS Endpoints...\n');
  
  const results = {
    getAll: false,
    create: false
  };

  // 1. Get all leads (v2)
  console.log('GET /api/v2/leads - Testing get all leads v2...');
  const leadsV2Res = await apiRequest('/api/v2/leads');
  
  if (leadsV2Res.ok && leadsV2Res.data?.success) {
    console.log(`  ✅ Get leads v2 successful`);
    results.getAll = true;
  } else {
    console.log('  ❌ Get leads v2 failed:', leadsV2Res.data?.message || `Status ${leadsV2Res.status}`);
  }

  // 2. Create lead (v2)
  console.log('POST /api/v2/leads - Testing create lead v2...');
  const newLead = {
    name: 'V2 Test Lead',
    email: `v2lead${Date.now()}@example.com`,
    phone: '+1234567890',
    course: 'V2 Test Course',
    status: 'new'
  };
  const createLeadV2Res = await apiRequest('/api/v2/leads', {
    method: 'POST',
    body: JSON.stringify(newLead)
  });
  
  if (createLeadV2Res.ok && createLeadV2Res.data?.success) {
    console.log('  ✅ Create lead v2 successful');
    results.create = true;
  } else {
    console.log('  ❌ Create lead v2 failed:', createLeadV2Res.data?.message || `Status ${createLeadV2Res.status}`);
  }

  return results;
}

// ==========================================
// MAIN TEST RUNNER
// ==========================================

export async function runAllTests() {
  console.log('=================================');
  console.log('🧪 FLUENTIVE API TEST SUITE');
  console.log('=================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test User: ${TEST_USER.email}`);
  console.log('=================================\n');

  const startTime = Date.now();

  const results = {
    auth: await testAuthEndpoints(),
    health: await testHealthEndpoint(),
    leads: await testLeadsEndpoints(),
    deals: await testDealsEndpoints(),
    users: await testUsersEndpoints(),
    notifications: await testNotificationsEndpoints(),
    timeTracking: await testTimeTrackingEndpoints(),
    v2Leads: await testV2LeadsEndpoints()
  };

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Summary
  console.log('\n=================================');
  console.log('📊 TEST SUMMARY');
  console.log('=================================');

  let totalTests = 0;
  let passedTests = 0;

  Object.entries(results).forEach(([category, tests]) => {
    console.log(`\n${category.toUpperCase()}:`);
    Object.entries(tests as Record<string, boolean>).forEach(([test, passed]) => {
      totalTests++;
      if (passed) passedTests++;
      console.log(`  ${passed ? '✅' : '❌'} ${test}`);
    });
  });

  console.log('\n=================================');
  console.log(`✅ PASSED: ${passedTests}/${totalTests}`);
  console.log(`❌ FAILED: ${totalTests - passedTests}/${totalTests}`);
  console.log(`⏱️  DURATION: ${duration}s`);
  console.log('=================================');

  return {
    success: passedTests === totalTests,
    passed: passedTests,
    total: totalTests,
    duration: parseFloat(duration),
    results
  };
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runAllTests().then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}
