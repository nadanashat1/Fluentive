#!/usr/bin/env node

/**
 * Database Connection Test Script
 * 
 * Tests various database connection formats and provides
 * detailed diagnostics for Supabase connectivity issues.
 */

const { PrismaClient } = require('@prisma/client');

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

// Test different database URL formats
const dbUrls = [
  {
    name: 'Current DATABASE_URL',
    url: process.env.DATABASE_URL
  },
  {
    name: 'Current DIRECT_URL', 
    url: process.env.DIRECT_URL
  },
  {
    name: 'Pooler Format (6543)',
    url: process.env.DATABASE_URL?.replace(':5432', ':6543')
  },
  {
    name: 'Pooler Format (pooler.supabase.com)',
    url: process.env.DATABASE_URL?.replace('aws-0-eu-west-1.supabase.co', 'aws-0-eu-west-1.pooler.supabase.com')
  }
];

async function testConnection(url, name) {
  if (!url) {
    logWarning(`${name}: No URL provided`);
    return { success: false, error: 'No URL' };
  }

  logInfo(`Testing ${name}...`);
  log(`URL: ${url.replace(/:[^:]*@/, ':***@')}`, 'cyan'); // Hide password

  const startTime = Date.now();
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: url
        }
      },
      log: ['error', 'warn']
    });

    // Test simple query
    await prisma.$queryRaw`SELECT 1 as test`;
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    logSuccess(`${name}: Connected (${responseTime}ms)`);
    
    await prisma.$disconnect();
    return { success: true, responseTime };
    
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    logError(`${name}: Failed (${responseTime}ms)`);
    log(`Error: ${error.message}`, 'red');
    
    return { success: false, error: error.message, responseTime };
  }
}

// Test with native PostgreSQL client
async function testNativeConnection(url) {
  if (!url) return { success: false, error: 'No URL' };
  
  logInfo('Testing with native PostgreSQL client...');
  
  try {
    const { Client } = require('pg');
    const client = new Client({ connectionString: url });
    
    await client.connect();
    const result = await client.query('SELECT 1 as test, NOW() as time');
    await client.end();
    
    logSuccess('Native PostgreSQL: Connected');
    log(`Server time: ${result.rows[0].time}`, 'cyan');
    
    return { success: true, data: result.rows[0] };
    
  } catch (error) {
    logError(`Native PostgreSQL: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// DNS resolution test
async function testDNS(hostname) {
  logInfo(`Testing DNS resolution for: ${hostname}`);
  
  try {
    const dns = require('dns').promises;
    const addresses = await dns.lookup(hostname, { all: true });
    
    logSuccess(`DNS resolved for ${hostname}:`);
    addresses.forEach(addr => {
      log(`  ${addr.address} (${addr.family})`, 'cyan');
    });
    
    return { success: true, addresses };
    
  } catch (error) {
    logError(`DNS failed for ${hostname}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main diagnostic function
async function runDiagnostics() {
  logHeader('Database Connection Diagnostics');
  
  // Extract hostname from current URL
  const currentUrl = process.env.DATABASE_URL;
  if (!currentUrl) {
    logError('DATABASE_URL not set');
    process.exit(1);
  }
  
  const urlMatch = currentUrl.match(/@([^:]+):/);
  if (!urlMatch) {
    logError('Could not extract hostname from DATABASE_URL');
    process.exit(1);
  }
  
  const hostname = urlMatch[1];
  
  // Test DNS resolution
  await testDNS(hostname);
  await testDNS('supabase.co');
  
  // Test different URL formats
  logHeader('Testing Database URL Formats');
  
  let workingConnection = null;
  
  for (const config of dbUrls) {
    const result = await testConnection(config.url, config.name);
    if (result.success) {
      workingConnection = config;
      break;
    }
    log(''); // Spacing
  }
  
  // Test native connection if Prisma failed
  if (!workingConnection) {
    logHeader('Testing Native PostgreSQL Connection');
    const nativeResult = await testNativeConnection(currentUrl);
    if (nativeResult.success) {
      logSuccess('Native connection works - Prisma configuration issue');
    }
  }
  
  // Generate recommendations
  logHeader('Recommendations');
  
  if (workingConnection) {
    logSuccess(`Working connection found: ${workingConnection.name}`);
    logInfo('Update your .env file:');
    log(`DATABASE_URL="${workingConnection.url}"`, 'cyan');
  } else {
    logError('No working connection found');
    logInfo('Check these items:');
    log('1. Supabase project is active (not paused)', 'yellow');
    log('2. Database credentials are correct', 'yellow');
    log('3. Network allows outbound connections to port 5432/6543', 'yellow');
    log('4. Try using DIRECT_URL instead of DATABASE_URL', 'yellow');
    log('5. Check if project region is correct', 'yellow');
    
    logInfo('Manual steps:');
    log('1. Go to https://app.supabase.com', 'cyan');
    log('2. Select your project', 'cyan');
    log('3. Settings → Database → Connection string', 'cyan');
    log('4. Copy "Direct connection string"', 'cyan');
    log('5. Replace password in .env', 'cyan');
  }
  
  // Test fallback to local SQLite for development
  if (!workingConnection) {
    logHeader('Fallback: Local SQLite Setup');
    logWarning('Since Supabase is not working, setting up local SQLite for testing...');
    
    const sqliteUrl = 'file:./dev.db';
    logInfo(`Using SQLite: ${sqliteUrl}`);
    
    try {
      const sqlitePrisma = new PrismaClient({
        datasources: {
          db: {
            url: sqliteUrl
          }
        }
      });
      
      await sqlitePrisma.$queryRaw`SELECT 1`;
      logSuccess('SQLite connection works - you can develop locally');
      
      await sqlitePrisma.$disconnect();
      
      logInfo('To use SQLite temporarily:');
      log('DATABASE_URL="file:./dev.db"', 'cyan');
      log('Then run: npx prisma migrate dev --name init', 'cyan');
      
    } catch (error) {
      logError(`SQLite setup failed: ${error.message}`);
    }
  }
}

if (require.main === module) {
  runDiagnostics().catch(console.error);
}

module.exports = { testConnection, testNativeConnection, testDNS };
