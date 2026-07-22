#!/usr/bin/env node

/**
 * Dashboard API Testing Script
 * 
 * This script tests all dashboard-related API endpoints
 * to verify they're working correctly.
 * 
 * Usage: node scripts/test-dashboard-apis.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Test endpoints
const ENDPOINTS = [
  {
    name: 'Dashboard Summary',
    path: '/api/dashboard/summary',
    method: 'GET',
    expectedFields: ['leads', 'engagement', 'timeTracking', 'users']
  },
  {
    name: 'Analytics Overview',
    path: '/api/analytics/overview',
    method: 'GET',
    expectedFields: ['users', 'sessions', 'leads', 'system']
  },
  {
    name: 'Leads List',
    path: '/api/leads',
    method: 'GET',
    expectedFields: ['success', 'data', 'count', 'total']
  },
  {
    name: 'Leads Stats',
    path: '/api/leads/stats',
    method: 'GET',
    expectedFields: ['success', 'data']
  },
  {
    name: 'Analytics Timeseries',
    path: '/api/analytics/timeseries',
    method: 'GET',
    expectedFields: ['success', 'data']
  }
];

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

async function testEndpoint(endpoint) {
  try {
    logInfo(`Testing ${endpoint.name}: ${endpoint.method} ${endpoint.path}`);
    
    const response = await fetch(`${BASE_URL}${endpoint.path}`, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        // Note: You may need to add auth headers for protected endpoints
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });

    const responseTime = response.headers.get('x-response-time') || 'N/A';
    const data = await response.json();

    if (response.ok) {
      logSuccess(`${endpoint.name} - Status: ${response.status} (${responseTime})`);
      
      // Validate expected fields
      if (endpoint.expectedFields) {
        const missingFields = endpoint.expectedFields.filter(field => 
          !data.data || !(field in data.data)
        );
        
        if (missingFields.length > 0) {
          logWarning(`Missing fields in ${endpoint.name}: ${missingFields.join(', ')}`);
        } else {
          logSuccess(`${endpoint.name} - All expected fields present`);
        }
      }

      // Log response structure
      log(`${endpoint.name} Response:`, 'cyan');
      log(JSON.stringify(data, null, 2), 'cyan');
      
      return { success: true, data, status: response.status };
    } else {
      logError(`${endpoint.name} - Status: ${response.status}`);
      log(`Error Response: ${JSON.stringify(data, null, 2)}`, 'red');
      return { success: false, error: data, status: response.status };
    }
  } catch (error) {
    logError(`${endpoint.name} - Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n🚀 Starting Dashboard API Tests', 'blue');
  log(`Base URL: ${BASE_URL}`, 'cyan');
  log('='.repeat(50), 'blue');

  const results = [];
  
  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push({ ...endpoint, ...result });
    log(''); // Add spacing between tests
  }

  // Summary
  log('='.repeat(50), 'blue');
  log('📊 Test Summary', 'blue');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  logSuccess(`Passed: ${passed}/${results.length}`);
  if (failed > 0) {
    logError(`Failed: ${failed}/${results.length}`);
  }

  // Show failed tests
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    log('\n❌ Failed Tests:', 'red');
    failedTests.forEach(test => {
      log(`  - ${test.name}: ${test.error || 'Unknown error'}`, 'red');
    });
  }

  // Performance summary
  log('\n⚡ Performance Summary:', 'yellow');
  results.forEach(result => {
    if (result.success) {
      log(`  ${result.name}: ✅ Working`, 'green');
    } else {
      log(`  ${result.name}: ❌ Failed (${result.status || 'Network Error'})`, 'red');
    }
  });

  process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      logSuccess('Server is running and healthy');
      return true;
    } else {
      logWarning('Server responded but may not be healthy');
      return true; // Still proceed
    }
  } catch (error) {
    logError(`Cannot connect to server at ${BASE_URL}`);
    logError('Please make sure your Next.js development server is running:');
    logError('  npm run dev');
    logError('Or set NEXT_PUBLIC_API_URL environment variable if using a different server');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    process.exit(1);
  }

  await runTests();
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection at:', promise);
  logError('Reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = { testEndpoint, runTests, checkServer };
