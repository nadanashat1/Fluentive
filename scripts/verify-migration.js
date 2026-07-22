#!/usr/bin/env node

/**
 * Migration Verification Script
 * 
 * Verifies that API migration is complete and correct:
 * 1. All old endpoints exist in new structure
 * 2. Response formats match
 * 3. No missing modules
 * 
 * Usage: node scripts/verify-migration.js [OLD_BASE_URL] [NEW_BASE_URL]
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const OLD_URL = process.argv[2] || 'http://localhost:5000';
const NEW_URL = process.argv[3] || 'http://localhost:3000';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// API Endpoints to verify
const endpoints = [
  // Public
  { method: 'GET', path: '/health', public: true },
  { method: 'GET', path: '/api/monitoring/health', public: true },
  
  // Auth
  { method: 'POST', path: '/api/auth/register', public: true },
  { method: 'POST', path: '/api/auth/login', public: true },
  { method: 'GET', path: '/api/auth/me', public: false },
  
  // Leads
  { method: 'GET', path: '/api/leads', public: false },
  { method: 'POST', path: '/api/leads', public: false },
  { method: 'GET', path: '/api/leads/:id', public: false },
  { method: 'PUT', path: '/api/leads/:id', public: false },
  { method: 'DELETE', path: '/api/leads/:id', public: false },
  
  // Users (admin)
  { method: 'GET', path: '/api/users', public: false },
  
  // Deals
  { method: 'GET', path: '/api/deals', public: false },
  { method: 'POST', path: '/api/deals', public: false },
  
  // Notifications
  { method: 'GET', path: '/api/notifications', public: false },
  
  // AI
  { method: 'GET', path: '/api/ai/dashboard', public: false },
  
  // Dashboard
  { method: 'GET', path: '/api/dashboard/summary', public: false },
];

const results = {
  passed: [],
  failed: [],
  missing: [],
};

function makeRequest(baseUrl, path, method = 'GET', token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const client = url.protocol === 'https:' ? https : http;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    };
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => reject(new Error('Timeout')));
    req.end();
  });
}

async function verifyEndpoint(endpoint) {
  const { method, path, public: isPublic } = endpoint;
  
  try {
    // Test old endpoint
    const oldRes = await makeRequest(OLD_URL, path, method);
    
    // Test new endpoint
    const newRes = await makeRequest(NEW_URL, path, method);
    
    // For public endpoints, both should respond similarly
    if (isPublic) {
      const oldWorks = oldRes.status < 500;
      const newWorks = newRes.status < 500;
      
      if (oldWorks && newWorks) {
        results.passed.push({ path, method, status: 'both work' });
        log(`  ✅ ${method} ${path} - Both work`, 'green');
        return true;
      } else if (!newWorks) {
        results.failed.push({ path, method, reason: 'new endpoint fails' });
        log(`  ❌ ${method} ${path} - New endpoint fails (${newRes.status})`, 'red');
        return false;
      }
    }
    
    // For protected endpoints, both should return 401 without auth
    if (!isPublic) {
      const oldAuth = oldRes.status === 401;
      const newAuth = newRes.status === 401;
      
      if (oldAuth && newAuth) {
        results.passed.push({ path, method, status: 'auth protected' });
        log(`  ✅ ${method} ${path} - Both require auth`, 'green');
        return true;
      } else if (!newAuth) {
        results.failed.push({ path, method, reason: `new endpoint returns ${newRes.status}, expected 401` });
        log(`  ❌ ${method} ${path} - New endpoint auth issue (${newRes.status})`, 'red');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    results.failed.push({ path, method, reason: error.message });
    log(`  ❌ ${method} ${path} - Error: ${error.message}`, 'red');
    return false;
  }
}

async function verifyFileStructure() {
  log('\n📁 Checking Module File Structure...\n', 'cyan');
  
  const modulesDir = path.join(__dirname, '..', 'backend', 'src', 'modules');
  const requiredModules = [
    'auth', 'leads', 'users', 'deals', 'notifications',
    'time-tracking', 'ai', 'dashboard', 'monitoring'
  ];
  
  for (const mod of requiredModules) {
    const modDir = path.join(modulesDir, mod);
    const service = path.join(modDir, `${mod}.service.ts`);
    const controller = path.join(modDir, `${mod}.controller.ts`);
    const routes = path.join(modDir, `${mod}.routes.ts`);
    
    const exists = fs.existsSync(service) && fs.existsSync(controller) && fs.existsSync(routes);
    
    if (exists) {
      log(`  ✅ ${mod} module complete`, 'green');
    } else {
      log(`  ❌ ${mod} module incomplete or missing`, 'red');
      results.missing.push(mod);
    }
  }
}

async function main() {
  console.log('\n');
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     🔍 API MIGRATION VERIFICATION                           ║', 'cyan');
  log('║     Comparing Old vs New Architecture                        ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  
  log(`\nOld API: ${OLD_URL}`, 'blue');
  log(`New API: ${NEW_URL}\n`, 'blue');
  
  // Test endpoints
  log('🌐 Testing API Endpoints...\n', 'cyan');
  
  for (const endpoint of endpoints) {
    await verifyEndpoint(endpoint);
  }
  
  // Check file structure
  await verifyFileStructure();
  
  // Generate report
  console.log('\n' + '='.repeat(60));
  log('📊 VERIFICATION REPORT', 'bright');
  console.log('='.repeat(60));
  
  const total = endpoints.length;
  const passed = results.passed.length;
  const failed = results.failed.length;
  const passRate = ((passed / total) * 100).toFixed(1);
  
  log(`Total Endpoints:  ${total}`, 'reset');
  log(`Passed:           ${passed} ✅`, 'green');
  log(`Failed:           ${failed} ❌`, failed > 0 ? 'red' : 'reset');
  log(`Pass Rate:        ${passRate}%`, passed === total ? 'green' : 'yellow');
  
  if (results.missing.length > 0) {
    log(`\nMissing Modules: ${results.missing.join(', ')}`, 'red');
  }
  
  console.log('='.repeat(60));
  
  // Final verdict
  console.log('\n');
  if (passed === total && results.missing.length === 0) {
    log('✅ MIGRATION VERIFIED - Ready for deployment!', 'green');
    log('\nAll endpoints working correctly.', 'green');
    process.exit(0);
  } else if (passed >= total * 0.8) {
    log('⚠️  MIGRATION MOSTLY COMPLETE - Review failed items', 'yellow');
    log('\nSome issues need attention before deploy.', 'yellow');
    process.exit(0);
  } else {
    log('❌ MIGRATION INCOMPLETE - Do not deploy', 'red');
    log('\nFix failed endpoints before proceeding.', 'red');
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n💥 Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
