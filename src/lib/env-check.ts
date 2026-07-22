// Environment variable validation for production
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NEXT_PUBLIC_APP_URL'
];

export function validateEnv() {
  const missing: string[] = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required env vars: ${missing.join(', ')}`);
    }
  }
  
  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️ JWT_SECRET should be at least 32 characters for security');
  }
  
  return missing.length === 0;
}

// Call validation on import in production
if (process.env.NODE_ENV === 'production') {
  validateEnv();
}
