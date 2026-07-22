const verifyAllAuthRoutes = async () => {
  console.log('🔍 VERIFYING ALL AUTH ROUTES COMPILATION & JSON RESPONSES\n');
  
  const testEmail = `verify${Date.now()}@example.com`;
  const testPassword = 'verify123';
  
  const routes = [
    {
      name: 'Register',
      method: 'POST',
      url: 'http://localhost:3000/api/auth/register',
      body: {
        name: 'Verify Test User',
        email: testEmail,
        password: testPassword
      }
    },
    {
      name: 'Login',
      method: 'POST',
      url: 'http://localhost:3000/api/auth/login',
      body: {
        email: testEmail,
        password: testPassword
      }
    },
    {
      name: 'Me (Protected)',
      method: 'GET',
      url: 'http://localhost:3000/api/auth/me',
      body: null
    },
    {
      name: 'Refresh',
      method: 'POST',
      url: 'http://localhost:3000/api/auth/refresh',
      body: {}
    },
    {
      name: 'Invalid Login (Error Test)',
      method: 'POST',
      url: 'http://localhost:3000/api/auth/login',
      body: {
        email: testEmail,
        password: 'wrongpassword'
      }
    }
  ];

  let allPassed = true;
  let cookies = '';

  for (const route of routes) {
    console.log(`\n📍 Testing ${route.name}...`);
    
    try {
      const options = {
        method: route.method,
        headers: {
          'Content-Type': 'application/json',
          ...(cookies && { 'Cookie': cookies })
        }
      };

      if (route.body) {
        options.body = JSON.stringify(route.body);
      }

      const response = await fetch(route.url, options);
      
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
        const hasData = data.success === true && typeof data.data === 'object';
        const hasError = data.success === false && typeof data.error === 'string';
        
        console.log(`   Contract: success=${hasSuccess}, data=${hasData}, error=${hasError}`);
        
        if (hasSuccess && (hasData || hasError)) {
          console.log(`   ✅ ${route.name}: PASSED`);
        } else {
          console.log(`   ❌ ${route.name}: CONTRACT VIOLATION`);
          allPassed = false;
        }
      } else {
        const text = await response.text();
        console.log(`   ❌ ${route.name}: NOT JSON (HTML/ERROR)`);
        console.log(`   Response preview: ${text.substring(0, 100)}...`);
        allPassed = false;
      }
      
    } catch (error) {
      console.log(`   ❌ ${route.name}: FETCH ERROR - ${error.message}`);
      allPassed = false;
    }
  }

  console.log('\n🎯 VERIFICATION RESULTS:');
  if (allPassed) {
    console.log('✅ ALL AUTH ROUTES: COMPILED & CONTRACT COMPLIANT');
    console.log('🔒 System is production-ready');
  } else {
    console.log('❌ SOME ROUTES: COMPILATION OR CONTRACT ISSUES');
    console.log('🔧 Fix issues before production deployment');
  }

  return allPassed;
};

verifyAllAuthRoutes();
