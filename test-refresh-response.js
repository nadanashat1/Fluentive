const testRefreshResponse = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'dummy' })
    });

    const result = await response.json();
    console.log('REFRESH RESPONSE ANALYSIS:');
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

testRefreshResponse();
