#!/usr/bin/env node

/**
 * Enhanced Dashboard API Test Runner
 * 
 * This script provides comprehensive testing of dashboard APIs
 * including authentication, error handling, and performance testing.
 * 
 * Usage: node scripts/dashboard-api-test-runner.js
 */

const { testEndpoint, runTests, checkServer } = require('./test-dashboard-apis');

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logHeader(message) {
  log(`\n🔧 ${message}`, 'magenta');
  log('='.repeat(60), 'magenta');
}

// Authentication test
async function testAuth() {
  logHeader('Authentication Testing');
  
  try {
    // Test login endpoint
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      logSuccess('Login endpoint accessible');
      return loginData.token || null;
    } else {
      logWarning('Login endpoint returned error (expected for test credentials)');
      return null;
    }
  } catch (error) {
    logWarning(`Auth test failed: ${error.message}`);
    return null;
  }
}

// Performance testing
async function testPerformance(endpoint, token = null) {
  logHeader(`Performance Testing: ${endpoint.name}`);
  
  const iterations = 10;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      await response.json();
      const endTime = Date.now();
      times.push(endTime - startTime);
      
      process.stdout.write('.');
    } catch (error) {
      logError(`Request ${i + 1} failed: ${error.message}`);
    }
  }
  
  console.log(); // New line after progress dots
  
  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    logInfo(`Performance Results for ${endpoint.name}:`);
    log(`  Average: ${avgTime.toFixed(2)}ms`, 'cyan');
    log(`  Min: ${minTime}ms`, 'cyan');
    log(`  Max: ${maxTime}ms`, 'cyan');
    log(`  Success Rate: ${(times.length / iterations * 100).toFixed(1)}%`, 'cyan');
    
    // Performance recommendations
    if (avgTime > 1000) {
      logWarning('Average response time is > 1s - consider optimization');
    } else {
      logSuccess('Response times are acceptable');
    }
  }
}

// Error handling tests
async function testErrorHandling() {
  logHeader('Error Handling Tests');
  
  const errorTests = [
    {
      name: 'Invalid Endpoint',
      path: '/api/nonexistent',
      expectedStatus: 404
    },
    {
      name: 'Invalid Method',
      path: '/api/dashboard/summary',
      method: 'POST',
      expectedStatus: 405
    },
    {
      name: 'Malformed Request',
      path: '/api/leads',
      method: 'POST',
      body: 'invalid json',
      expectedStatus: 400
    }
  ];
  
  for (const test of errorTests) {
    try {
      const response = await fetch(`${BASE_URL}${test.path}`, {
        method: test.method || 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: test.body
      });
      
      const data = await response.json();
      
      if (response.status === test.expectedStatus) {
        logSuccess(`${test.name} - Correct status ${response.status}`);
      } else {
        logWarning(`${test.name} - Expected ${test.expectedStatus}, got ${response.status}`);
      }
      
      // Check if error response has proper structure
      if (data.success === false || data.error || data.message) {
        logSuccess(`${test.name} - Proper error response structure`);
      } else {
        logWarning(`${test.name} - Error response could be improved`);
      }
      
    } catch (error) {
      logError(`${test.name} - Network error: ${error.message}`);
    }
  }
}

// Data validation tests
async function testDataValidation() {
  logHeader('Data Validation Tests');
  
  const validationTests = [
    {
      name: 'Dashboard Summary Structure',
      path: '/api/dashboard/summary',
      validate: (data) => {
        if (!data.success) return false;
        if (!data.data) return false;
        
        const requiredFields = ['leads', 'engagement', 'timeTracking', 'users'];
        return requiredFields.every(field => field in data.data);
      }
    },
    {
      name: 'Analytics Overview Structure',
      path: '/api/analytics/overview',
      validate: (data) => {
        if (!data.success) return false;
        if (!data.data) return false;
        
        const requiredFields = ['users', 'sessions', 'leads', 'system'];
        return requiredFields.every(field => field in data.data);
      }
    },
    {
      name: 'Leads List Structure',
      path: '/api/leads',
      validate: (data) => {
        if (!data.success) return false;
        if (!Array.isArray(data.data)) return false;
        
        // Check if lead objects have required fields
        if (data.data.length > 0) {
          const lead = data.data[0];
          const requiredFields = ['id', 'name', 'email'];
          return requiredFields.some(field => field in lead);
        }
        
        return true; // Empty array is valid
      }
    }
  ];
  
  for (const test of validationTests) {
    try {
      const response = await fetch(`${BASE_URL}${test.path}`);
      const data = await response.json();
      
      if (response.ok && test.validate(data)) {
        logSuccess(`${test.name} - Data structure is valid`);
      } else {
        logWarning(`${test.name} - Data structure validation failed`);
        log(`Response: ${JSON.stringify(data, null, 2)}`, 'yellow');
      }
    } catch (error) {
      logError(`${test.name} - Validation error: ${error.message}`);
    }
  }
}

// Load testing
async function testLoad(endpoint, concurrency = 5, duration = 5000) {
  logHeader(`Load Testing: ${endpoint.name} (${concurrency} concurrent, ${duration}ms)`);
  
  const startTime = Date.now();
  const endTime = startTime + duration;
  let totalRequests = 0;
  let successfulRequests = 0;
  let errors = [];
  
  const makeRequest = async () => {
    while (Date.now() < endTime) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint.path}`, {
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' }
        });
        
        totalRequests++;
        if (response.ok) {
          successfulRequests++;
        } else {
          errors.push(`HTTP ${response.status}`);
        }
      } catch (error) {
        totalRequests++;
        errors.push(error.message);
      }
    }
  };
  
  // Start concurrent requests
  const promises = Array.from({ length: concurrency }, makeRequest);
  await Promise.all(promises);
  
  const actualDuration = Date.now() - startTime;
  const successRate = (successfulRequests / totalRequests * 100).toFixed(1);
  const requestsPerSecond = (totalRequests / (actualDuration / 1000)).toFixed(1);
  
  logInfo(`Load Test Results:`);
  log(`  Total Requests: ${totalRequests}`, 'cyan');
  log(`  Successful: ${successfulRequests}`, 'cyan');
  log(`  Success Rate: ${successRate}%`, 'cyan');
  log(`  Requests/Second: ${requestsPerSecond}`, 'cyan');
  log(`  Duration: ${actualDuration}ms`, 'cyan');
  
  if (errors.length > 0) {
    logWarning(`Errors encountered: ${errors.slice(0, 5).join(', ')}${errors.length > 5 ? '...' : ''}`);
  }
  
  if (parseFloat(successRate) >= 95) {
    logSuccess('Load test passed - System handled concurrent requests well');
  } else {
    logWarning('Load test showed issues - System may need optimization');
  }
}

// Main enhanced test runner
async function runEnhancedTests() {
  log('\n🚀 Enhanced Dashboard API Test Suite', 'blue');
  log(`Base URL: ${BASE_URL}`, 'cyan');
  log('='.repeat(60), 'blue');

  // Check server
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }

  // Test authentication
  const token = await testAuth();

  // Run basic tests
  log('\n📋 Running Basic API Tests...', 'blue');
  await runTests();

  // Run error handling tests
  await testErrorHandling();

  // Run data validation tests
  await testDataValidation();

  // Run performance tests on key endpoints
  const keyEndpoints = [
    { name: 'Dashboard Summary', path: '/api/dashboard/summary', method: 'GET' },
    { name: 'Analytics Overview', path: '/api/analytics/overview', method: 'GET' },
    { name: 'Leads List', path: '/api/leads', method: 'GET' }
  ];

  for (const endpoint of keyEndpoints) {
    await testPerformance(endpoint, token);
  }

  // Run load test on dashboard summary
  await testLoad(keyEndpoints[0], 3, 3000);

  log('\n🎉 Enhanced Testing Complete!', 'green');
  log('\n📝 Recommendations:', 'blue');
  log('1. Fix any failed tests before deploying to production', 'yellow');
  log('2. Monitor performance metrics regularly', 'yellow');
  log('3. Set up automated testing in CI/CD pipeline', 'yellow');
  log('4. Consider implementing API rate limiting for production', 'yellow');
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection at:', promise);
  logError('Reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  runEnhancedTests();
}

module.exports = { 
  testAuth, 
  testPerformance, 
  testErrorHandling, 
  testDataValidation, 
  testLoad,
  runEnhancedTests 
};
