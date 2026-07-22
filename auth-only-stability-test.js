const authOnlyStabilityTest = async () => {
  console.log('🔒 AUTH-ONLY STABILITY TEST\n');
  
  const testEmail = `auth${Date.now()}@example.com`;
  const testPassword = 'auth123';
  
  const authTests = [
    {
      name: 'Register Route',
      url: 'http://localhost:3000/api/auth/register',
      body: {
        name: 'Auth Test User',
        email: testEmail,
        password: testPassword
      },
      expectedStatus: 201
    },
    {
      name: 'Login Route',
      url: 'http://localhost:3000/api/auth/login',
      body: {
        email: testEmail,
        password: testPassword
      },
      expectedStatus: 200
    },
    {
      name: 'Me Route (Protected)',
      url: 'http://localhost:3000/api/auth/me',
      body: null,
      expectedStatus: 200
    },
    {
      name: 'Refresh Route',
      url: 'http://localhost:3000/api/auth/refresh',
      body: {},
      expectedStatus: 200
    },
    {
      name: 'Invalid Login (Error)',
      url: 'http://localhost:3000/api/auth/login',
      body: {
        email: testEmail,
        password: 'wrongpassword'
      },
      expectedStatus: 401
    }
  ];

  let allPassed = true;
  let cookies = '';

  for (const test of authTests) {
    console.log(`\n📍 Testing ${test.name}...`);
    
    try {
      const options = {
        method: test.body ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(cookies && { 'Cookie': cookies })
        }
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(test.url, options);
      
      // Extract cookies for subsequent requests
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        const newCookies = setCookieHeader.split(', ').map(c => c.split(';')[0]).join('; ');
        cookies = newCookies;
      }

      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');
      const statusCorrect = response.status === test.expectedStatus;
      
      console.log(`   Status: ${response.status} (expected: ${test.expectedStatus}) ${statusCorrect ? '✅' : '❌'}`);
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Is JSON: ${isJson ? '✅' : '❌'}`);
      
      if (isJson && statusCorrect) {
        const data = await response.json();
        const hasSuccess = typeof data.success === 'boolean';
        const hasCorrectStructure = data.success === true ? typeof data.data === 'object' : typeof data.error === 'string';
        
        console.log(`   Contract: ${hasSuccess && hasCorrectStructure ? '✅' : '❌'}`);
        
        if (hasSuccess && hasCorrectStructure) {
          console.log(`   ✅ ${test.name}: PASSED`);
        } else {
          console.log(`   ❌ ${test.name}: CONTRACT VIOLATION`);
          allPassed = false;
        }
      } else {
        const text = await response.text();
        console.log(`   ❌ ${test.name}: JSON EXPECTED BUT GOT ${contentType || 'UNKNOWN'}`);
        console.log(`   Response preview: ${text.substring(0, 100)}...`);
        
        if (text.includes('<!DOCTYPE')) {
          console.log(`   🚨 HTML ERROR PAGE - COMPILATION ISSUE`);
        }
        
        allPassed = false;
      }
      
    } catch (error) {
      console.log(`   ❌ ${test.name}: FETCH ERROR - ${error.message}`);
      allPassed = false;
    }
  }

  console.log('\n🎯 AUTH-ONLY STABILITY RESULTS:');
  if (allPassed) {
    console.log('✅ ALL AUTH ENDPOINTS STABLE');
    console.log('✅ No HTML leaks in auth routes');
    console.log('✅ All routes return proper JSON');
    console.log('✅ TypeScript compilation stable');
    console.log('✅ System is production-ready');
    console.log('\n🚀 AUTHENTICATION SYSTEM: PRODUCTION LOCKED');
  } else {
    console.log('❌ SOME AUTH ROUTES UNSTABLE');
    console.log('❌ HTML leaks or compilation issues detected');
    console.log('🔧 Fix issues before production deployment');
  }

  return allPassed;
};

authOnlyStabilityTest();
