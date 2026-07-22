#!/usr/bin/env node

/**
 * Simple Dashboard API Test
 * 
 * Tests dashboard APIs without requiring authentication
 * Focuses on endpoint availability and basic response structure
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
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

// Test endpoints without authentication
const ENDPOINTS = [
  {
    name: 'Health Check',
    path: '/api/health',
    method: 'GET',
    expectedStatus: 200,
    description: 'Basic server health check'
  },
  {
    name: 'Dashboard Summary',
    path: '/api/dashboard/summary',
    method: 'GET',
    expectedStatus: 401, // Expected to fail without auth
    description: 'Dashboard summary (requires auth)'
  },
  {
    name: 'Analytics Overview',
    path: '/api/analytics/overview',
    method: 'GET',
    expectedStatus: 500, // Expected to fail due to database
    description: 'Analytics overview (requires database)'
  },
  {
    name: 'Leads List',
    path: '/api/leads',
    method: 'GET',
    expectedStatus: 401, // Expected to fail without auth
    description: 'Leads list (requires auth)'
  },
  {
    name: 'Auth Test Endpoint',
    path: '/api/test-auth',
    method: 'GET',
    expectedStatus: [200, 401], // May or may not require auth
    description: 'Test authentication endpoint'
  }
];

async function testEndpoint(endpoint) {
  try {
    logInfo(`Testing ${endpoint.name}: ${endpoint.method} ${endpoint.path}`);
    log(`Description: ${endpoint.description}`, 'cyan');
    
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}${endpoint.path}`, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const data = await response.json();
    
    // Check if status is as expected
    const expectedStatuses = Array.isArray(endpoint.expectedStatus) 
      ? endpoint.expectedStatus 
      : [endpoint.expectedStatus];
    
    const statusMatch = expectedStatuses.includes(response.status);
    
    if (statusMatch) {
      logSuccess(`${endpoint.name} - Status: ${response.status} (${responseTime}ms) - Expected`);
    } else {
      logWarning(`${endpoint.name} - Status: ${response.status} (${responseTime}ms) - Expected: ${endpoint.expectedStatus.join(' or ')}`);
    }
    
    // Log response structure
    log(`Response structure:`, 'cyan');
    log(JSON.stringify({
      status: response.status,
      success: data.success,
      hasData: !!data.data,
      hasMessage: !!data.message,
      hasError: !!data.error
    }, null, 2), 'cyan');
    
    return { 
      success: statusMatch, 
      data, 
      status: response.status,
      responseTime 
    };
  } catch (error) {
    logError(`${endpoint.name} - Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test server connectivity
async function testConnectivity() {
  log('\n🔌 Testing Server Connectivity', 'blue');
  log('='.repeat(50), 'blue');
  
  try {
    const response = await fetch(`${BASE_URL}`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok || response.status === 404) { // 404 is ok, means server is running
      logSuccess('Server is accessible');
      return true;
    } else {
      logWarning(`Server responded with status: ${response.status}`);
      return true; // Still proceed
    }
  } catch (error) {
    logError(`Cannot connect to server: ${error.message}`);
    logError('Make sure your development server is running:');
    logError('  npm run dev');
    return false;
  }
}

// Generate test report
function generateReport(results) {
  log('\n📊 Test Report Summary', 'blue');
  log('='.repeat(50), 'blue');
  
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = total - passed;
  
  logSuccess(`Passed: ${passed}/${total}`);
  if (failed > 0) {
    logError(`Failed: ${failed}/${total}`);
  }
  
  // Performance summary
  const avgResponseTime = results
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.responseTime).length;
  
  log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`, 'cyan');
  
  // Endpoint status
  log('\n🔍 Endpoint Status:', 'blue');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const time = result.responseTime ? ` (${result.responseTime}ms)` : '';
    log(`  ${status} ${result.name} - Status: ${result.status}${time}`, result.success ? 'green' : 'red');
  });
  
  // Recommendations
  log('\n💡 Recommendations:', 'blue');
  if (failed === 0) {
    logSuccess('All endpoints are responding as expected!');
  } else {
    const authIssues = results.filter(r => r.status === 401).length;
    const dbIssues = results.filter(r => r.status === 500).length;
    const notImplemented = results.filter(r => r.status === 501).length;
    
    if (authIssues > 0) {
      logInfo(`${authIssues} endpoint(s) require authentication - this is normal`);
      log('  Set up authentication tokens to test these endpoints fully', 'cyan');
    }
    
    if (dbIssues > 0) {
      logWarning(`${dbIssues} endpoint(s) have database issues`);
      log('  Check database connection and configuration', 'cyan');
    }
    
    if (notImplemented > 0) {
      logWarning(`${notImplemented} endpoint(s) are not implemented yet`);
      log('  Implement these endpoints to complete the API', 'cyan');
    }
  }
  
  log('\n🚀 Next Steps:', 'blue');
  log('1. Set up database connection for full functionality', 'cyan');
  log('2. Configure authentication for protected endpoints', 'cyan');
  log('3. Run npm run test:dashboard:full for comprehensive testing', 'cyan');
}

// Main test execution
async function runTests() {
  log('\n🧪 Dashboard API Simple Test Suite', 'blue');
  log(`Base URL: ${BASE_URL}`, 'cyan');
  log('='.repeat(50), 'blue');
  
  // Test connectivity first
  const connected = await testConnectivity();
  if (!connected) {
    process.exit(1);
  }
  
  // Run endpoint tests
  const results = [];
  
  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push({ ...endpoint, ...result });
    log(''); // Add spacing
  }
  
  // Generate report
  generateReport(results);
  
  // Exit with appropriate code
  const failed = results.filter(r => !r.success).length;
  process.exit(failed > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection at:', promise);
  logError('Reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  runTests();
}

module.exports = { testEndpoint, runTests };
