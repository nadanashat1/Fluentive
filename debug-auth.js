// Load environment variables
require('dotenv').config({ path: '.env' });

const jwt = require('jsonwebtoken');

// Test the token we got from login
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjdkN2EzN2E2LTdkMDUtNDdmYi1hODVjLTMzMmVmZTRlN2U4MSIsImVtYWlsIjoieWFzc2luLm1haG1vdWQxMjM2N0BnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Nzg1ODA4MTQsImV4cCI6MTc3ODU4MTcxNH0.wdCKNZbuEgmFBwEvEDV-pryHRKP_LiXvkWEQtQiPt7c';

console.log('=== AUTHENTICATION DEBUG ===');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('Token length:', testToken.length);

try {
  const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
  console.log('✅ Token verification SUCCESS');
  console.log('Decoded payload:', decoded);
  
  // Check if token is expired
  const now = Date.now();
  const expTime = decoded.exp * 1000;
  console.log('Current time:', new Date(now));
  console.log('Token expires:', new Date(expTime));
  console.log('Token expired:', now >= expTime);
  
} catch (error) {
  console.log('❌ Token verification FAILED:', error.message);
  
  // Try to decode without verification to see the payload
  try {
    const decoded = jwt.decode(testToken, { complete: true });
    console.log('Token header:', decoded.header);
    console.log('Token payload:', decoded.payload);
  } catch (decodeError) {
    console.log('❌ Token decode FAILED:', decodeError.message);
  }
}
