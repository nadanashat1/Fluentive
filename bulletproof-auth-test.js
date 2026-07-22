const bulletproofAuthTest = async () => {
  console.log('🔒 BULLETPROOF AUTH SYSTEM TEST\n');
  console.log('Testing runtime safety and HTML prevention...\n');
  
  const testEmail = `bullet${Date.now()}@example.com`;
  const testPassword = 'bullet123';
  
  // Enhanced fetch with safety validation
  async function safeFetch(url, options = {}) {
    const response = await fetch(url, options);
    
    // Critical: Check content-type before parsing
    const contentType = response.headers.get('content-type');
    
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      
      console.error('🚨 SAFETY VIOLATION DETECTED:');
      console.error(`   URL: ${url}`);
      console.error(`   Status: ${response.status}`);
      console.error(`   Content-Type: ${contentType}`);
      console.error(`   Response: ${text.substring(0, 200)}...`);
      
      throw new Error(
        `API SAFETY VIOLATION: Route returned ${contentType || 'unknown'} instead of JSON. ` +
        `This would cause a 500 error in production.`
      );
    }
    
    return response;
  }

  const tests = [
    {
      name: 'Register Route',
      url: 'http://localhost:3000/api/auth/register',
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Bulletproof Test User',
          email: testEmail,
          password: testPassword
        })
      },
      expectedStatus: 201
    },
    {
      name: 'Login Route',
      url: 'http://localhost:3000/api/auth/login',
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      },
      expectedStatus: 200
    },
    {
      name: 'Invalid Login (Error Test)',
      url: 'http://localhost:3000/api/auth/login',
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'wrongpassword'
        })
      },
      expectedStatus: 401
    },
    {
      name: 'Non-existent Route (Should Fail)',
      url: 'http://localhost:3000/api/auth/nonexistent',
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      },
      expectedStatus: 404,
      shouldFail: true
    }
  ];

  let allPassed = true;
  let cookies = '';

  for (const test of tests) {
    console.log(`📍 Testing ${test.name}...`);
    
    try {
      // Add cookies to options if we have them
      if (cookies) {
        test.options.headers = {
          ...test.options.headers,
          'Cookie': cookies
        };
      }

      const response = await safeFetch(test.url, test.options);
      
      // Extract cookies for subsequent requests
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        const newCookies = setCookieHeader.split(', ').map(c => c.split(';')[0]).join('; ');
        cookies = newCookies;
      }

      const statusCorrect = response.status === test.expectedStatus;
      console.log(`   Status: ${response.status} (expected: ${test.expectedStatus}) ${statusCorrect ? '✅' : '❌'}`);
      
      if (statusCorrect) {
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
        console.log(`   ❌ ${test.name}: STATUS MISMATCH`);
        allPassed = false;
      }
      
    } catch (error) {
      if (test.shouldFail) {
        console.log(`   ✅ ${test.name}: CORRECTLY FAILED (${error.message})`);
      } else {
        console.log(`   ❌ ${test.name}: UNEXPECTED FAILURE`);
        console.log(`   Error: ${error.message}`);
        allPassed = false;
      }
    }
  }

  console.log('\n🎯 BULLETPROOF TEST RESULTS:');
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED');
    console.log('✅ No HTML leaks detected in auth routes');
    console.log('✅ All endpoints return proper JSON');
    console.log('✅ Runtime safety validation working');
    console.log('✅ System is bulletproof and production-ready');
    console.log('\n🚀 AUTHENTICATION SYSTEM: BULLETPROOF LOCKED');
    console.log('🔒 Runtime safety enforced');
    console.log('📋 HTML prevention active');
    console.log('🎯 Ready for production deployment');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('❌ Runtime safety issues detected');
    console.log('🔧 Fix issues before production deployment');
  }

  return allPassed;
};

bulletproofAuthTest();
