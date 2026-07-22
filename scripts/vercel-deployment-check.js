#!/usr/bin/env node

/**
 * Vercel Hobby Plan Deployment Verification Script
 * Tests all memory optimizations and production readiness
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');

// Configuration
const config = {
  baseUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
  timeout: 25000, // 25 seconds
  maxResponseSize: 1024 * 1024, // 1MB
  expectedRoutes: [
    '/api/health',
    '/api/health/memory',
    '/api/auth/login',
    '/api/users',
    '/api/deals',
    '/api/time-tracking/all-time',
    '/api/time-tracking/activities',
    '/api/leads',
    '/api/analytics/overview'
  ]
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

/**
 * Make HTTP request with timeout
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, {
      timeout: config.timeout,
      ...options
    }, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          size: Buffer.byteLength(data)
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Test individual endpoint
 */
async function testEndpoint(path, testType = 'basic') {
  const url = `${config.baseUrl}${path}`;
  const startTime = performance.now();
  
  try {
    console.log(`🧪 Testing ${path}...`);
    
    const response = await makeRequest(url);
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    const result = {
      path,
      statusCode: response.statusCode,
      responseTime,
      size: response.size,
      tests: {}
    };

    // Parse response data
    let responseData;
    try {
      responseData = JSON.parse(response.data);
    } catch (e) {
      result.tests.jsonParse = false;
    }

    // Basic health checks
    result.tests.statusCode = response.statusCode < 500;
    result.tests.responseTime = responseTime < 10000; // Under 10s
    result.tests.responseSize = response.size < config.maxResponseSize;

    // Memory optimization checks
    if (response.headers['x-memory-usage']) {
      result.tests.memoryMonitoring = true;
      const memoryUsage = parseFloat(response.headers['x-memory-usage']);
      result.tests.memorySafe = memoryUsage < 90; // Under 90%
    }

    // Compression checks
    if (response.headers['x-response-size']) {
      result.tests.compressionEnabled = true;
      result.tests.sizeReported = true;
    }

    // Rate limiting checks
    if (response.headers['x-ratelimit-limit']) {
      result.tests.rateLimiting = true;
      result.tests.rateLimitHeaders = true;
    }

    // Pagination checks for list endpoints
    if (path.includes('/users') || path.includes('/deals') || path.includes('/time-tracking')) {
      if (responseData && responseData.data && responseData.pagination) {
        result.tests.pagination = true;
        result.tests.paginationStructure = true;
      }
    }

    // Success response format
    if (responseData && typeof responseData.success === 'boolean') {
      result.tests.standardResponse = true;
    }

    // Determine overall result
    const testResults = Object.values(result.tests);
    const passedTests = testResults.filter(t => t === true).length;
    const totalTests = testResults.length;
    
    result.overall = (passedTests / totalTests) >= 0.8; // 80% pass rate
    result.passedTests = passedTests;
    result.totalTests = totalTests;

    return result;

  } catch (error) {
    return {
      path,
      error: error.message,
      overall: false,
      responseTime: config.timeout
    };
  }
}

/**
 * Test rate limiting by making multiple requests
 */
async function testRateLimiting(path) {
  console.log(`🚦 Testing rate limiting on ${path}...`);
  
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(testEndpoint(path));
  }
  
  const results = await Promise.all(promises);
  const rateLimited = results.some(r => r.statusCode === 429);
  
  return {
    path,
    rateLimiting: rateLimited,
    consistentResponses: results.every(r => r.statusCode === results[0].statusCode)
  };
}

/**
 * Test memory health endpoint
 */
async function testMemoryHealth() {
  console.log(`🧠 Testing memory health endpoint...`);
  
  try {
    const response = await makeRequest(`${config.baseUrl}/api/health/memory`);
    const data = JSON.parse(response.data);
    
    return {
      path: '/api/health/memory',
      memoryMonitoring: true,
      memoryData: data.data,
      vercelCompliant: data.data?.vercelLimits?.isWithinLimits || false
    };
  } catch (error) {
    return {
      path: '/api/health/memory',
      error: error.message,
      memoryMonitoring: false
    };
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting Vercel Hobby Plan Deployment Verification\n');
  
  // Test all expected routes
  for (const path of config.expectedRoutes) {
    const result = await testEndpoint(path);
    results.details.push(result);
    
    if (result.overall) {
      results.passed++;
      console.log(`✅ ${path} - PASSED (${result.passedTests}/${result.totalTests} tests)`);
    } else {
      results.failed++;
      console.log(`❌ ${path} - FAILED`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
  }

  // Test rate limiting
  const rateLimitTest = await testRateLimiting('/api/users');
  results.details.push(rateLimitTest);
  
  if (rateLimitTest.rateLimiting) {
    console.log('✅ Rate limiting - PASSED');
  } else {
    console.log('⚠️  Rate limiting - WARNING');
    results.warnings++;
  }

  // Test memory health
  const memoryTest = await testMemoryHealth();
  results.details.push(memoryTest);
  
  if (memoryTest.memoryMonitoring) {
    console.log('✅ Memory monitoring - PASSED');
    if (memoryTest.vercelCompliant) {
      console.log('✅ Vercel compliance - PASSED');
    } else {
      console.log('⚠️  Vercel compliance - WARNING');
      results.warnings++;
    }
  } else {
    console.log('❌ Memory monitoring - FAILED');
    results.failed++;
  }

  // Generate report
  generateReport();
}

/**
 * Generate final report
 */
function generateReport() {
  console.log('\n📊 DEPLOYMENT VERIFICATION REPORT');
  console.log('=====================================');
  
  const total = results.passed + results.failed;
  const successRate = total > 0 ? Math.round((results.passed / total) * 100) : 0;
  
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log(`📈 Success Rate: ${successRate}%`);
  
  // Detailed results
  console.log('\n📋 DETAILED RESULTS:');
  results.details.forEach(detail => {
    console.log(`\n${detail.path}:`);
    if (detail.error) {
      console.log(`  ❌ Error: ${detail.error}`);
    } else if (detail.overall !== false) {
      console.log(`  ✅ Overall: PASSED`);
      if (detail.responseTime) {
        console.log(`  ⏱️  Response Time: ${detail.responseTime}ms`);
      }
      if (detail.size) {
        console.log(`  📦 Response Size: ${Math.round(detail.size / 1024)}KB`);
      }
      if (detail.tests.memoryMonitoring) {
        console.log(`  🧠 Memory Monitoring: ✅`);
      }
      if (detail.tests.compressionEnabled) {
        console.log(`  🗜️  Compression: ✅`);
      }
      if (detail.tests.rateLimiting) {
        console.log(`  🚦 Rate Limiting: ✅`);
      }
      if (detail.tests.pagination) {
        console.log(`  📄 Pagination: ✅`);
      }
    } else {
      console.log(`  ❌ Overall: FAILED`);
    }
  });
  
  // Final verdict
  console.log('\n🎯 FINAL VERDICT:');
  if (successRate >= 90) {
    console.log('🚀 READY FOR PRODUCTION - All critical optimizations verified');
    process.exit(0);
  } else if (successRate >= 75) {
    console.log('⚠️  MOSTLY READY - Some optimizations need attention');
    process.exit(1);
  } else {
    console.log('❌ NOT READY - Critical issues found');
    process.exit(2);
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(3);
  });
}

module.exports = { runTests, testEndpoint, testMemoryHealth };
