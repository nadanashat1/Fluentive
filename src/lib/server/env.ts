// Production Environment Handler
// Prevents deployment failures due to missing environment variables
// Ensures all required env vars are present before app starts

// Required environment variables for production
type EnvVar = string | undefined;

interface EnvConfig {
  DATABASE_URL: string;
  JWT_SECRET: string;
  NEXT_PUBLIC_APP_URL: string;
  FRONTEND_URL: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  REDIS_URL?: string;
  SENTRY_DSN?: string;
  OPENAI_API_KEY?: string;
}

// Validate required environment variable
function required(name: string, value: EnvVar): string {
  if (!value || value.trim() === '') {
    const error = new Error(`❌ Missing required environment variable: ${name}`);
    
    // In production, throw immediately to prevent silent failures
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    
    // In development, warn but don't crash
    console.warn(`⚠️  Warning: ${name} is not set`);
    return '';
  }
  
  return value;
}

// Validate optional environment variable
function optional(value: EnvVar): string | undefined {
  return value || undefined;
}

// Safe environment getter with validation
export const env: EnvConfig = {
  DATABASE_URL: required('DATABASE_URL', process.env.DATABASE_URL),
  JWT_SECRET: required('JWT_SECRET', process.env.JWT_SECRET),
  NEXT_PUBLIC_APP_URL: required('NEXT_PUBLIC_APP_URL', process.env.NEXT_PUBLIC_APP_URL),
  FRONTEND_URL: required('FRONTEND_URL', process.env.FRONTEND_URL),
  STRIPE_SECRET_KEY: optional(process.env.STRIPE_SECRET_KEY),
  STRIPE_WEBHOOK_SECRET: optional(process.env.STRIPE_WEBHOOK_SECRET),
  REDIS_URL: optional(process.env.REDIS_URL),
  SENTRY_DSN: optional(process.env.SENTRY_DSN),
  OPENAI_API_KEY: optional(process.env.OPENAI_API_KEY),
};

// Environment validation function
export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const required = ['DATABASE_URL', 'JWT_SECRET', 'NEXT_PUBLIC_APP_URL', 'FRONTEND_URL'];
  
  for (const key of required) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      errors.push(`Missing: ${key}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Preflight check - run this before build
export function preflightCheck(): void {
  console.log('🔍 Running preflight checks...\n');
  
  const { valid, errors } = validateEnv();
  
  if (!valid) {
    console.error('❌ Preflight failed. Missing environment variables:');
    errors.forEach(err => console.error(`   - ${err}`));
    console.error('\n💡 Fix: Copy .env.production to .env.local and fill in values');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables present\n');
  
  // Additional checks
  checkNodeVersion();
  checkDatabaseUrl();
  
  console.log('✅ Preflight checks passed!\n');
}

function checkNodeVersion(): void {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  
  if (major < 18) {
    console.warn(`⚠️  Node version ${version} detected. Recommended: 18+`);
  } else {
    console.log(`✅ Node version: ${version}`);
  }
}

function checkDatabaseUrl(): void {
  const url = process.env.DATABASE_URL || '';
  
  if (!url.includes('postgresql://')) {
    console.warn('⚠️  DATABASE_URL does not look like a PostgreSQL URL');
  } else {
    // Mask password in logs
    const masked = url.replace(/:([^@]+)@/, ':****@');
    console.log(`✅ Database URL configured: ${masked}`);
  }
}

// Safe env getter with fallback
export function getEnv(key: keyof EnvConfig, fallback?: string): string {
  const value = env[key];
  if (value === undefined && fallback === undefined) {
    throw new Error(`Environment variable ${key} is not set and no fallback provided`);
  }
  return value || fallback || '';
}

// Check if running in production
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';

// Safe public env (NEXT_PUBLIC_*) - only these are available in browser
export const publicEnv = {
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};

// Fail-fast environment check on startup
import { assertEnv } from './env-validator';
assertEnv();
