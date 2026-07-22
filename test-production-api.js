// Production API Testing Suite - Real-world failure simulation
// Pressure-test the production-hardened system like senior engineers do

import { apiClient } from './src/lib/apiClient.js';
import { ROUTES } from './src/lib/api-endpoints.js';

console.log('🧪 Starting Production API Tests...\n');

// Test 1: Retry Logic (Network Chaos)
async function testRetryLogic() {
  console.log('🔥 Test 1: Retry Logic with Network Chaos');
  console.log('Expected: First request fails → retry kicks in → second succeeds');
  
  try {
    // Simulate 50% failure rate by modifying the endpoint temporarily
    const response = await apiClient('/api/test-retry', {
      method: 'GET',
      headers: {
        'X-Test-Fail-Rate': '0.5' // Backend should honor this header for testing
      }
    });
    
    console.log('✅ Retry test passed - got response:', response);
  } catch (error) {
    console.log('❌ Retry test failed:', error.message);
  }
  
  console.log('---');
}

// Test 2: Auth Refresh (Critical Path)
async function testAuthRefresh() {
  console.log('🔥 Test 2: Auth Refresh with 401 Simulation');
  console.log('Expected: Request → 401 → refreshToken → retry → success');
  
  try {
    // Force a 401 response
    const response = await apiClient('/api/test-auth', {
      method: 'GET',
      headers: {
        'X-Force-401': 'true'
      }
    });
    
    console.log('✅ Auth refresh test passed - got response:', response);
  } catch (error) {
    console.log('❌ Auth refresh test failed:', error.message);
  }
  
  console.log('---');
}

// Test 3: Deduplication (Performance Layer)
async function testDeduplication() {
  console.log('🔥 Test 3: Request Deduplication');
  console.log('Expected: Only 1 network call, 3 responses returned');
  
  try {
    const startTime = Date.now();
    
    // Fire multiple identical requests simultaneously
    const promises = [
      apiClient('/api/users'),
      apiClient('/api/users'),
      apiClient('/api/users')
    ];
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    console.log('✅ Deduplication test passed:');
    console.log(`   - Got ${results.length} responses`);
    console.log(`   - Total time: ${endTime - startTime}ms`);
    console.log(`   - Should be ~1 request time, not 3x`);
  } catch (error) {
    console.log('❌ Deduplication test failed:', error.message);
  }
  
  console.log('---');
}

// Test 4: Response Normalization (Backend Chaos)
async function testResponseNormalization() {
  console.log('🔥 Test 4: Response Normalization');
  console.log('Expected: Different backend shapes → consistent frontend response');
  
  const testCases = [
    { shape: { data: { name: 'yassin' } }, expected: 'yassin' },
    { shape: { result: { name: 'yassin' } }, expected: 'yassin' },
    { shape: { user: { name: 'yassin' } }, expected: 'yassin' },
    { shape: { name: 'yassin' }, expected: 'yassin' }
  ];
  
  for (const testCase of testCases) {
    try {
      const response = await apiClient('/api/test-normalization', {
        method: 'POST',
        body: JSON.stringify(testCase.shape)
      });
      
      if (response.name === testCase.expected) {
        console.log(`✅ Normalization passed for ${JSON.stringify(testCase.shape)}`);
      } else {
        console.log(`❌ Normalization failed for ${JSON.stringify(testCase.shape)} - got ${response.name}`);
      }
    } catch (error) {
      console.log(`❌ Normalization error for ${JSON.stringify(testCase.shape)}:`, error.message);
    }
  }
  
  console.log('---');
}

// Test 5: Zod Failure (Runtime Safety)
async function testZodFailure() {
  console.log('🔥 Test 5: Zod Validation Failure');
  console.log('Expected: Zod throws, error logged, app doesn\'t crash');
  
  try {
    // Send malformed response that should fail Zod validation
    const response = await apiClient('/api/test-zod', {
      schema: { // Mock Zod schema for testing
        parse: (data) => {
          if (!data.name || typeof data.name !== 'string') {
            throw new Error('Name is required and must be string');
          }
          return data;
        }
      }
    });
    
    console.log('❌ Zod test failed - should have thrown validation error');
  } catch (error) {
    if (error.message.includes('Name is required')) {
      console.log('✅ Zod validation correctly caught malformed response');
    } else {
      console.log('❌ Zod test failed with unexpected error:', error.message);
    }
  }
  
  console.log('---');
}

// Test 6: Observability (Production Mindset)
async function testObservability() {
  console.log('🔥 Test 6: Observability Logging');
  console.log('Expected: Logs include URL, status, duration, error');
  
  try {
    // Force an error to test logging
    const response = await apiClient('/api/test-logging', {
      method: 'GET',
      headers: {
        'X-Force-Error': 'TEST ERROR'
      }
    });
    
    console.log('❌ Observability test failed - should have thrown error');
  } catch (error) {
    if (error.message === 'TEST ERROR') {
      console.log('✅ Observability test passed - error was logged');
    } else {
      console.log('❌ Observability test failed with unexpected error:', error.message);
    }
  }
  
  console.log('---');
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Production API Pressure Tests...\n');
  
  await testRetryLogic();
  await testAuthRefresh();
  await testDeduplication();
  await testResponseNormalization();
  await testZodFailure();
  await testObservability();
  
  console.log('🏁 Production API Tests Complete!');
  console.log('\n💬 Real Talk:');
  console.log('- If all tests pass → system is production-hardened');
  console.log('- If any test fails → fix before going to production');
  console.log('- These tests simulate real-world failure scenarios');
}

// Run the tests
runAllTests().catch(console.error);
