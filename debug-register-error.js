const debugRegisterError = async () => {
  console.log('🔍 DEBUGGING REGISTRATION ERROR\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Debug Test User',
        email: `debug${Date.now()}@example.com`,
        password: 'debugpassword123'
      })
    });

    const result = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Body:', JSON.stringify(result, null, 2));
    
    if (!result.success) {
      console.log('Error Message:', result.error);
      console.log('Error Details:');
      
      if (result.error?.includes('already exists')) {
        console.log('  → Duplicate email error');
      } else if (result.error?.includes('Name') || result.error?.includes('name')) {
        console.log('  → Name validation error');
      } else if (result.error?.includes('Password') || result.error?.includes('password')) {
        console.log('  → Password validation error');
      } else if (result.error?.includes('Email') || result.error?.includes('email')) {
        console.log('  → Email validation error');
      } else {
        console.log('  → Unknown error type');
      }
    }
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
};

debugRegisterError();
