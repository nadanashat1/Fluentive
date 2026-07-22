const testCircuitBreaker = async () => {
  console.log('Testing circuit breaker with multiple failed registrations...');
  
  for (let i = 1; i <= 6; i++) {
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Test User ${i}`,
          email: 'test@example.com', // This will always fail (duplicate)
          password: 'password123'
        })
      });

      const result = await response.json();
      console.log(`Attempt ${i}: Status ${response.status}, Success: ${result.success}, Error: ${result.error || 'None'}`);
    } catch (error) {
      console.error(`Attempt ${i}: Error -`, error.message);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('Now testing if login still works after multiple auth failures...');
  
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
    console.log(`Login after failures: Status ${response.status}, Success: ${result.success}`);
  } catch (error) {
    console.error(`Login after failures: Error -`, error.message);
  }
};

testCircuitBreaker();
