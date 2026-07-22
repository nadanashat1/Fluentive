const debugRegisterCompilation = async () => {
  console.log('🔧 DEBUGGING REGISTER ROUTE COMPILATION\n');
  
  const testEmail = `debug${Date.now()}@example.com`;
  
  try {
    console.log('1️⃣ Testing register route...');
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Debug Test User',
        email: testEmail,
        password: 'debug123'
      })
    });

    const contentType = response.headers.get('content-type');
    const status = response.status;
    
    console.log(`Status: ${status}`);
    console.log(`Content-Type: ${contentType}`);
    
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      console.log('✅ Register route returned JSON');
      console.log(`Success: ${data.success}`);
      console.log(`Has data: ${!!data.data}`);
      console.log(`Has user: ${!!data.data?.user}`);
    } else {
      const text = await response.text();
      console.log('❌ Register route returned HTML/ERROR');
      console.log(`Response preview: ${text.substring(0, 300)}...`);
      
      if (text.includes('<!DOCTYPE')) {
        console.log('🚨 CONFIRMED: Next.js is serving HTML error page');
        console.log('🔍 This indicates a TypeScript compilation error in the route');
      }
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    
    if (error.message.includes('Unexpected token')) {
      console.log('🚨 CONFIRMED: JSON parsing failed - server returned HTML');
    }
  }
};

debugRegisterCompilation();
