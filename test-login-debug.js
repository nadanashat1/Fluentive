const testRegister = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'New Test User',
        email: 'test@example.com', // This should trigger duplicate email error
        password: 'newpassword123'
      })
    });

    const result = await response.json();
    console.log('REGISTER Response status:', response.status);
    console.log('REGISTER Response body:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};

const testLogin = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: '123456'
      })
    });

    const result = await response.json();
    console.log('LOGIN Response status:', response.status);
    console.log('LOGIN Response body:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};

testRegister();
setTimeout(testLogin, 1000);
