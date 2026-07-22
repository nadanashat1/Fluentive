// Load environment variables
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

// API Base URL
const BASE_URL = 'http://localhost:3000';

class APITester {
  constructor() {
    this.session = null;
    this.userToken = null;
    this.testResults = [];
  }

  async login() {
    console.log('=== AUTHENTICATION TEST ===');
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'yassin.mahmoud12367@gmail.com',
          password: '123456'
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ LOGIN SUCCESS');
        console.log('User:', data.data.user.name, '(', data.data.user.email, ')');
        console.log('Role:', data.data.user.role);
        this.userToken = data.data.token;
        this.testResults.push({ endpoint: '/api/auth/login', status: 'SUCCESS', method: 'POST' });
        return true;
      } else {
        console.log('❌ LOGIN FAILED:', data.error);
        this.testResults.push({ endpoint: '/api/auth/login', status: 'FAILED', error: data.error, method: 'POST' });
        return false;
      }
    } catch (error) {
      console.log('❌ LOGIN ERROR:', error.message);
      this.testResults.push({ endpoint: '/api/auth/login', status: 'ERROR', error: error.message, method: 'POST' });
      return false;
    }
  }

  async testAuthMe() {
    console.log('\n=== AUTH ME TEST ===');
    try {
      const response = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.userToken}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ AUTH ME SUCCESS');
        console.log('User:', data.data.user.name, 'Role:', data.data.user.role);
        this.testResults.push({ endpoint: '/api/auth/me', status: 'SUCCESS', method: 'GET' });
        return true;
      } else {
        console.log('❌ AUTH ME FAILED:', data.error);
        this.testResults.push({ endpoint: '/api/auth/me', status: 'FAILED', error: data.error, method: 'GET' });
        return false;
      }
    } catch (error) {
      console.log('❌ AUTH ME ERROR:', error.message);
      this.testResults.push({ endpoint: '/api/auth/me', status: 'ERROR', error: error.message, method: 'GET' });
      return false;
    }
  }

  async testDashboardAPIs() {
    console.log('\n=== DASHBOARD APIS TEST ===');
    
    const dashboardEndpoints = [
      '/api/dashboard/summary',
      '/api/admin/dashboard',
      '/api/ai/dashboard',
      '/api/analytics/overview',
      '/api/analytics/timeseries'
    ];

    for (const endpoint of dashboardEndpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.userToken}`,
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          console.log(`✅ ${endpoint} - SUCCESS`);
          this.testResults.push({ endpoint, status: 'SUCCESS', method: 'GET' });
        } else {
          console.log(`❌ ${endpoint} - FAILED:`, data.error || 'Unknown error');
          this.testResults.push({ endpoint, status: 'FAILED', error: data.error || 'Unknown error', method: 'GET' });
        }
      } catch (error) {
        console.log(`❌ ${endpoint} - ERROR:`, error.message);
        this.testResults.push({ endpoint, status: 'ERROR', error: error.message, method: 'GET' });
      }
    }
  }

  async testSalesPipelineAPIs() {
    console.log('\n=== SALES PIPELINE APIS TEST ===');
    
    const pipelineEndpoints = [
      '/api/deals',
      '/api/leads',
      '/api/leads/stats'
    ];

    for (const endpoint of pipelineEndpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.userToken}`,
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          console.log(`✅ ${endpoint} - SUCCESS`);
          if (data.data && Array.isArray(data.data)) {
            console.log(`   Found ${data.data.length} records`);
          }
          this.testResults.push({ endpoint, status: 'SUCCESS', method: 'GET' });
        } else {
          console.log(`❌ ${endpoint} - FAILED:`, data.error || 'Unknown error');
          this.testResults.push({ endpoint, status: 'FAILED', error: data.error || 'Unknown error', method: 'GET' });
        }
      } catch (error) {
        console.log(`❌ ${endpoint} - ERROR:`, error.message);
        this.testResults.push({ endpoint, status: 'ERROR', error: error.message, method: 'GET' });
      }
    }
  }

  async testTimeTrackingAPIs() {
    console.log('\n=== TIME TRACKING APIS TEST ===');
    
    const timeTrackingEndpoints = [
      '/api/time-tracking/heartbeat',
      '/api/time-tracking/my-time',
      '/api/time-tracking/activities',
      '/api/time-tracking/active-users'
    ];

    // Test heartbeat (POST)
    try {
      const response = await fetch(`${BASE_URL}/api/time-tracking/heartbeat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isIdle: false })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ /api/time-tracking/heartbeat - SUCCESS');
        console.log('   Productivity Score:', data.data.productivityScore);
        this.testResults.push({ endpoint: '/api/time-tracking/heartbeat', status: 'SUCCESS', method: 'POST' });
      } else {
        console.log('❌ /api/time-tracking/heartbeat - FAILED:', data.error);
        this.testResults.push({ endpoint: '/api/time-tracking/heartbeat', status: 'FAILED', error: data.error, method: 'POST' });
      }
    } catch (error) {
      console.log('❌ /api/time-tracking/heartbeat - ERROR:', error.message);
      this.testResults.push({ endpoint: '/api/time-tracking/heartbeat', status: 'ERROR', error: error.message, method: 'POST' });
    }

    // Test other time tracking endpoints (GET)
    for (const endpoint of timeTrackingEndpoints.slice(1)) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.userToken}`,
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          console.log(`✅ ${endpoint} - SUCCESS`);
          this.testResults.push({ endpoint, status: 'SUCCESS', method: 'GET' });
        } else {
          console.log(`❌ ${endpoint} - FAILED:`, data.error || 'Unknown error');
          this.testResults.push({ endpoint, status: 'FAILED', error: data.error || 'Unknown error', method: 'GET' });
        }
      } catch (error) {
        console.log(`❌ ${endpoint} - ERROR:`, error.message);
        this.testResults.push({ endpoint, status: 'ERROR', error: error.message, method: 'GET' });
      }
    }
  }

  async testNotificationsAPIs() {
    console.log('\n=== NOTIFICATIONS APIS TEST ===');
    
    const notificationEndpoints = [
      '/api/notifications',
      '/api/notifications/realtime'
    ];

    for (const endpoint of notificationEndpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.userToken}`,
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          console.log(`✅ ${endpoint} - SUCCESS`);
          if (data.data && Array.isArray(data.data)) {
            console.log(`   Found ${data.data.length} notifications`);
          }
          this.testResults.push({ endpoint, status: 'SUCCESS', method: 'GET' });
        } else {
          console.log(`❌ ${endpoint} - FAILED:`, data.error || 'Unknown error');
          this.testResults.push({ endpoint, status: 'FAILED', error: data.error || 'Unknown error', method: 'GET' });
        }
      } catch (error) {
        console.log(`❌ ${endpoint} - ERROR:`, error.message);
        this.testResults.push({ endpoint, status: 'ERROR', error: error.message, method: 'GET' });
      }
    }
  }

  async testHealthAPIs() {
    console.log('\n=== HEALTH APIS TEST ===');
    
    const healthEndpoints = [
      '/api/health',
      '/api/health/memory'
    ];

    for (const endpoint of healthEndpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        
        if (response.ok) {
          console.log(`✅ ${endpoint} - SUCCESS`);
          this.testResults.push({ endpoint, status: 'SUCCESS', method: 'GET' });
        } else {
          console.log(`❌ ${endpoint} - FAILED:`, data.error || 'Unknown error');
          this.testResults.push({ endpoint, status: 'FAILED', error: data.error || 'Unknown error', method: 'GET' });
        }
      } catch (error) {
        console.log(`❌ ${endpoint} - ERROR:`, error.message);
        this.testResults.push({ endpoint, status: 'ERROR', error: error.message, method: 'GET' });
      }
    }
  }

  async testDatabaseConnectivity() {
    console.log('\n=== DATABASE CONNECTIVITY TEST ===');
    try {
      // Test user count
      const userCount = await prisma.user.count();
      console.log(`✅ Database connected - ${userCount} users found`);

      // Test deals count
      const dealCount = await prisma.deal.count();
      console.log(`✅ ${dealCount} deals found`);

      // Test leads count
      const leadCount = await prisma.lead.count();
      console.log(`✅ ${leadCount} leads found`);

      // Test activities count
      const activityCount = await prisma.activity.count();
      console.log(`✅ ${activityCount} activities found`);

      this.testResults.push({ endpoint: 'DATABASE', status: 'SUCCESS', details: `${userCount} users, ${dealCount} deals, ${leadCount} leads, ${activityCount} activities` });
      return true;
    } catch (error) {
      console.log('❌ DATABASE ERROR:', error.message);
      this.testResults.push({ endpoint: 'DATABASE', status: 'ERROR', error: error.message });
      return false;
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('COMPREHENSIVE API TEST REPORT');
    console.log('='.repeat(60));

    const success = this.testResults.filter(r => r.status === 'SUCCESS').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const errors = this.testResults.filter(r => r.status === 'ERROR').length;
    const total = this.testResults.length;

    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Tests: ${total}`);
    console.log(`   ✅ Success: ${success}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   🚫 Errors: ${errors}`);
    console.log(`   📈 Success Rate: ${((success / total) * 100).toFixed(1)}%`);

    console.log(`\n📋 DETAILED RESULTS:`);
    this.testResults.forEach(result => {
      const icon = result.status === 'SUCCESS' ? '✅' : result.status === 'FAILED' ? '❌' : '🚫';
      console.log(`   ${icon} ${result.method || 'GET'} ${result.endpoint} - ${result.status}`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
      if (result.details) {
        console.log(`      Details: ${result.details}`);
      }
    });

    console.log('\n' + '='.repeat(60));
  }

  async runAllTests() {
    console.log('🚀 STARTING COMPREHENSIVE API TESTING...\n');

    // Test database connectivity first
    await this.testDatabaseConnectivity();

    // Test authentication
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ LOGIN FAILED - Cannot proceed with authenticated tests');
      this.generateReport();
      return;
    }

    // Test authenticated endpoints
    await this.testAuthMe();
    await this.testDashboardAPIs();
    await this.testSalesPipelineAPIs();
    await this.testTimeTrackingAPIs();
    await this.testNotificationsAPIs();
    await this.testHealthAPIs();

    this.generateReport();
  }
}

// Run the comprehensive test
const tester = new APITester();
tester.runAllTests().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
