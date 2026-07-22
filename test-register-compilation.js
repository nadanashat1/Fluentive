const testRegisterCompilation = async () => {
  console.log('🔧 Testing Register Route Compilation...\n');
  
  const testEmail = `test${Date.now()}@example.com`;
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Compilation Test User',
        email: testEmail,
        password: 'test123'
      })
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${contentType}`);
    console.log(`Is JSON: ${isJson ? '✅' : '❌'}`);
    
    if (isJson) {
      const data = await response.json();
      console.log(`Response: ${JSON.stringify(data, null, 2)}`);
      console.log('\n✅ Register route compiled successfully!');
    } else {
      const text = await response.text();
      console.log(`Response (first 200 chars): ${text.substring(0, 200)}...`);
      console.log('\n❌ Register route compilation failed - returning HTML');
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
};

testRegisterCompilation();
