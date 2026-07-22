const testRegisterResponse = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'newuser123@example.com',
        password: 'password123'
      })
    });

    const result = await response.json();
    console.log('REGISTER RESPONSE ANALYSIS:');
    console.log('Status:', response.status);
    console.log('Full response:', JSON.stringify(result, null, 2));
    console.log('Has success field:', 'success' in result);
    console.log('Success value:', result.success);
    console.log('Has data field:', 'data' in result);
    console.log('Data value:', result.data ? 'present' : 'missing');
    console.log('Has token in data:', result.data?.token ? 'yes' : 'no');
    console.log('Has user in data:', result.data?.user ? 'yes' : 'no');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testRegisterResponse();
