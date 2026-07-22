#!/usr/bin/env node

/**
 * Setup Test User for API Testing
 * 
 * This script creates a test user and returns authentication tokens
 * for testing dashboard APIs.
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

async function createTestUser() {
  const testUser = {
    name: 'Test Dashboard User',
    email: 'test@dashboard.com',
    password: 'testpassword123'
  };

  try {
    logInfo('Creating test user for dashboard API testing...');
    
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    const data = await response.json();
    
    if (response.ok) {
      logSuccess('Test user created successfully');
      logInfo(`User ID: ${data.user?.id || 'N/A'}`);
      logInfo(`Email: ${testUser.email}`);
      return { user: data.user, tokens: data.tokens };
    } else if (response.status === 400 && data.message?.includes('already exists')) {
      logInfo('Test user already exists, attempting login...');
      return await loginTestUser(testUser.email, testUser.password);
    } else {
      logError(`Failed to create test user: ${data.message || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    logError(`Network error creating test user: ${error.message}`);
    return null;
  }
}

async function loginTestUser(email, password) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (response.ok) {
      logSuccess('Test user login successful');
      return { user: data.user, tokens: data.tokens };
    } else {
      logError(`Failed to login test user: ${data.message || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    logError(`Network error logging in test user: ${error.message}`);
    return null;
  }
}

async function main() {
  log('\n🔧 Setting up test user for dashboard API testing', 'blue');
  log(`Base URL: ${BASE_URL}`, 'cyan');
  log('='.repeat(50), 'blue');

  const authData = await createTestUser();
  
  if (authData) {
    logSuccess('Test user setup complete!');
    logInfo('You can now use these credentials for API testing:');
    log(`Email: test@dashboard.com`, 'cyan');
    log(`Password: testpassword123`, 'cyan');
    
    if (authData.tokens) {
      logInfo('Authentication tokens:');
      log(`Access Token: ${authData.tokens.accessToken?.substring(0, 50)}...`, 'cyan');
      log(`Refresh Token: ${authData.tokens.refreshToken?.substring(0, 50)}...`, 'cyan');
      
      // Save tokens to environment file for testing
      const fs = require('fs');
      const envContent = `
# Dashboard API Testing Credentials
DASHBOARD_TEST_EMAIL=test@dashboard.com
DASHBOARD_TEST_PASSWORD=testpassword123
DASHBOARD_TEST_ACCESS_TOKEN=${authData.tokens.accessToken}
DASHBOARD_TEST_REFRESH_TOKEN=${authData.tokens.refreshToken}
`;
      
      try {
        fs.writeFileSync('.env.test', envContent.trim());
        logSuccess('Test credentials saved to .env.test');
      } catch (error) {
        logWarning('Could not save .env.test file');
      }
    }
    
    process.exit(0);
  } else {
    logError('Failed to set up test user');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createTestUser, loginTestUser };
