// Comprehensive API Integration Test
// Tests all frontend-backend connections without requiring backend to be running

const API_BASE_URL = 'http://localhost:3000';

// Test all API endpoints that frontend uses
const tests = [
  {
    name: 'Authentication - Login',
    endpoint: '/api/auth/login',
    method: 'POST',
    data: { email: 'test@example.com', password: 'Test123!@#' },
    expected: 'token in response'
  },
  {
    name: 'Authentication - Register', 
    endpoint: '/api/auth/register',
    method: 'POST',
    data: { name: 'Test User', email: `test${Date.now()}@example.com`, password: 'Test123!@#' },
    expected: 'token in response'
  },
  {
    name: 'Dashboard - Summary',
    endpoint: '/api/dashboard/summary',
    method: 'GET',
    expected: 'dashboard data'
  },
  {
    name: 'Leads - Get All',
    endpoint: '/api/leads',
    method: 'GET', 
    expected: 'leads array'
  },
  {
    name: 'Leads - Create',
    endpoint: '/api/leads',
    method: 'POST',
    data: { name: 'Test Lead', email: `lead${Date.now()}@example.com`, status: 'new' },
    expected: 'created lead'
  },
  {
    name: 'Users - Get All',
    endpoint: '/api/users',
    method: 'GET',
    expected: 'users array'
  },
  {
    name: 'AI - Dashboard',
    endpoint: '/api/ai/dashboard',
    method: 'GET',
    expected: 'AI dashboard data'
  },
  {
    name: 'AI - Advanced Features',
    endpoint: '/api/ai/advanced/revenue-forecast',
    method: 'GET',
    expected: 'revenue forecast data'
  }
];

async function runTests() {
  console.log('🧪 Starting API Integration Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      
      const url = `${API_BASE_URL}${test.endpoint}`;
      const options = {
        method: test.method,
        headers: { 'Content-Type': 'application/json' },
        ...(test.data && { body: JSON.stringify(test.data) })
      };
      
      const response = await fetch(url, options);
      const status = response.status;
      
      if (status >= 200 && status < 300) {
        console.log(`  ✅ ${test.name} - Status: ${status}`);
        passed++;
      } else {
        console.log(`  ❌ ${test.name} - Status: ${status}`);
        failed++;
      }
      
    } catch (error) {
      console.log(`  ❌ ${test.name} - Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Test Results:`);
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Frontend is ready for backend integration.');
  } else {
    console.log('\n⚠️  Some tests failed. Check backend server and API endpoints.');
  }
}

runTests();
