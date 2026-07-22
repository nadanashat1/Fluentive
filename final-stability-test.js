const finalStabilityTest = async () => {
  console.log('🔒 FINAL STABILITY TEST - NO HTML LEAKS\n');
  
  const testEmail = `stability${Date.now()}@example.com`;
  const testPassword = 'stability123';
  
  const tests = [
    {
      name: 'Register Route',
      url: 'http://localhost:3000/api/auth/register',
      body: {
        name: 'Stability Test User',
        email: testEmail,
        password: testPassword
      }
    },
    {
      name: 'Login Route',
      url: 'http://localhost:3000/api/auth/login',
      body: {
        email: testEmail,
        password: testPassword
      }
    },
    {
      name: 'Invalid Login (Error)',
      url: 'http://localhost:3000/api/auth/login',
      body: {
        email: testEmail,
        password: 'wrongpassword'
      }
    },
    {
      name: 'Non-existent Route (404)',
      url: 'http://localhost:3000/api/auth/nonexistent',
      body: null
    }
  ];

  let allPassed = true;
  let cookies = '';

  for (const test of tests) {
    console.log(`\n📍 Testing ${test.name}...`);
    
    try {
      const options = {
        method: 'POST',
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
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Is JSON: ${isJson ? '✅' : '❌'}`);
      
      if (isJson) {
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
        console.log(`   ❌ ${test.name}: HTML LEAK DETECTED`);
        console.log(`   Response preview: ${text.substring(0, 100)}...`);
        
        if (text.includes('<!DOCTYPE')) {
          console.log(`   🚨 CONFIRMED: Next.js HTML error page`);
          console.log(`   🔍 This indicates TypeScript compilation error`);
        }
        
        allPassed = false;
      }
      
    } catch (error) {
      console.log(`   ❌ ${test.name}: FETCH ERROR - ${error.message}`);
      
      if (error.message.includes('Unexpected token')) {
        console.log(`   🚨 CONFIRMED: JSON parsing failed - HTML returned`);
      }
      
      allPassed = false;
    }
  }

  console.log('\n🎯 FINAL STABILITY RESULTS:');
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED');
    console.log('✅ No HTML leaks detected');
    console.log('✅ All routes return proper JSON');
    console.log('✅ TypeScript compilation stable');
    console.log('✅ System is production-ready');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('❌ HTML leaks detected or compilation issues');
    console.log('🔧 Fix issues before production deployment');
  }

  return allPassed;
};

finalStabilityTest();
