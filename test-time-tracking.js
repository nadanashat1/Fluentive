async function testTimeTracking() {
  console.log('🧪 Testing Time Tracking System...\n');

  // 1. Register a test user first
  console.log('1️⃣ Registering test user...');
  const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'testuser@dfluency.com',
      password: 'Test123456!',
      role: 'admin'
    })
  });
  
  const registerData = await registerResponse.json();
  console.log('Register response:', registerData.success ? '✅ Success' : '❌ Failed (user may already exist)');
  
  // 2. Login
  console.log('2️⃣ Logging in...');
  const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'testuser@dfluency.com',
      password: 'Test123456!'
    })
  });
  
  const loginData = await loginResponse.json();
  console.log('Login response:', loginData.success ? '✅ Success' : '❌ Failed');
  
  if (!loginData.success) {
    console.log('Error:', loginData.message);
    return;
  }

  const token = loginData.data.token;
  console.log('Token received:', token.substring(0, 20) + '...\n');

  // 3. Test heartbeat
  console.log('3️⃣ Testing heartbeat endpoint...');
  const heartbeatResponse = await fetch('http://localhost:5000/api/time-tracking/heartbeat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ isIdle: false })
  });
  
  const heartbeatData = await heartbeatResponse.json();
  console.log('Heartbeat response:', heartbeatData.success ? '✅ Success' : '❌ Failed');
  if (heartbeatData.success) {
    console.log('Data:', JSON.stringify(heartbeatData.data, null, 2));
  } else {
    console.log('Error:', heartbeatData.message || heartbeatData.error);
  }
  console.log();

  // 4. Test my-time endpoint
  console.log('4️⃣ Testing my-time endpoint...');
  const myTimeResponse = await fetch('http://localhost:5000/api/time-tracking/my-time', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const myTimeData = await myTimeResponse.json();
  console.log('My-time response:', myTimeData.success ? '✅ Success' : '❌ Failed');
  if (myTimeData.success) {
    console.log('Data:', JSON.stringify(myTimeData.data, null, 2));
  }
  console.log();

  // 5. Test active users
  console.log('5️⃣ Testing active-users endpoint...');
  const activeUsersResponse = await fetch('http://localhost:5000/api/time-tracking/active-users', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const activeUsersData = await activeUsersResponse.json();
  console.log('Active-users response:', activeUsersData.success ? '✅ Success' : '❌ Failed');
  if (activeUsersData.success) {
    console.log('Data:', JSON.stringify(activeUsersData.data, null, 2));
  }
  console.log();

  // 6. Test my-stats endpoint
  console.log('6️⃣ Testing my-stats endpoint...');
  const myStatsResponse = await fetch('http://localhost:5000/api/maintenance/my-stats', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const myStatsData = await myStatsResponse.json();
  console.log('My-stats response:', myStatsData.success ? '✅ Success' : '❌ Failed');
  if (myStatsData.success) {
    console.log('Data:', JSON.stringify(myStatsData.data, null, 2));
  }
  console.log();

  // 7. Test aggregation endpoint (admin only)
  console.log('7️⃣ Testing aggregation endpoint...');
  const aggregationResponse = await fetch('http://localhost:5000/api/maintenance/aggregate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const aggregationData = await aggregationResponse.json();
  console.log('Aggregation response:', aggregationData.success ? '✅ Success' : '❌ Failed');
  if (aggregationData.success) {
    console.log('Data:', JSON.stringify(aggregationData.data, null, 2));
  } else {
    console.log('Error:', aggregationData.message || aggregationData.error);
  }
  console.log();

  console.log('✅ All tests completed!');
}

testTimeTracking().catch(console.error);
