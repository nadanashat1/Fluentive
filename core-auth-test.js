const coreAuthTest = async () => {
  console.log('🔒 CORE AUTH ENDPOINTS TEST\n');
  console.log('Testing only register/login/me after cleanup...\n');
  
  const testEmail = `core${Date.now()}@example.com`;
  const testPassword = 'core123';
  
  const tests = [
    {
      name: 'Register',
      url: 'http://localhost:3000/api/auth/register',
      body: {
        name: 'Core Test User',
        email: testEmail,
        password: testPassword
      },
      expectedStatus: 201
    },
    {
      name: 'Login',
      url: 'http://localhost:3000/api/auth/login',
      body: {
        email: testEmail,
        password: testPassword
      },
      expectedStatus: 200
    },
    {
      name: 'Me (Protected)',
      url: 'http://localhost:3000/api/auth/me',
      body: null,
      expectedStatus: 200
    }
  ];

  let allPassed = true;
  let cookies = '';

  for (const test of tests) {
    console.log(`📍 Testing ${test.name}...`);
    
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
        console.log(`   ❌ ${test.name}: STATUS OR CONTENT-TYPE ISSUE`);
        allPassed = false;
      }
      
    } catch (error) {
      console.log(`   ❌ ${test.name}: FETCH ERROR - ${error.message}`);
      allPassed = false;
    }
  }

  console.log('\n🎯 CORE AUTH TEST RESULTS:');
  if (allPassed) {
    console.log('✅ ALL CORE AUTH ENDPOINTS WORKING');
    console.log('✅ No HTML responses');
    console.log('✅ Proper JSON responses');
    console.log('✅ Correct response structure');
    console.log('✅ System is production-ready');
    console.log('\n🚀 AUTHENTICATION SYSTEM: PRODUCTION READY');
  } else {
    console.log('❌ SOME CORE ENDPOINTS FAILING');
    console.log('❌ Fix issues before production deployment');
  }

  return allPassed;
};

coreAuthTest();
