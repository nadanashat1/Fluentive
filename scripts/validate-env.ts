#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Ensures all required environment variables are present before deployment
 */

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  validator?: (value: string) => boolean;
}

const REQUIRED_ENV_VARS: EnvVar[] = [
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL database connection string',
    validator: (value) => value.startsWith('postgresql://')
  },
  {
    name: 'JWT_SECRET',
    required: true,
    description: 'JWT authentication secret (min 32 characters)',
    validator: (value) => value.length >= 32
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: true,
    description: 'Public application URL',
    validator: (value) => value.startsWith('https://')
  }
];

const OPTIONAL_ENV_VARS: EnvVar[] = [
  {
    name: 'REDIS_URL',
    required: false,
    description: 'Redis connection string for caching'
  },
  {
    name: 'OPENAI_API_KEY',
    required: false,
    description: 'OpenAI API key for AI features'
  },
  {
    name: 'SENTRY_DSN',
    required: false,
    description: 'Sentry error tracking DSN'
  },
  {
    name: 'LOG_LEVEL',
    required: false,
    description: 'Application log level (debug, info, warn, error)'
  }
];

function validateEnvVar(envVar: EnvVar, value: string | undefined): { valid: boolean; error?: string } {
  if (!value && envVar.required) {
    return { valid: false, error: `Missing required environment variable: ${envVar.name}` };
  }

  if (envVar.validator && !envVar.validator(value || '')) {
    return { valid: false, error: `Invalid format for ${envVar.name}: ${envVar.description}` };
  }

  return { valid: true };
}

function main() {
  console.log('🔍 Validating environment variables...\n');

  let hasErrors = false;

  // Check required variables
  console.log('📋 Required Variables:');
  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar.name];
    const validation = validateEnvVar(envVar, value);
    
    if (validation.valid) {
      console.log(`✅ ${envVar.name}: Present`);
    } else {
      console.log(`❌ ${envVar.name}: ${validation.error}`);
      hasErrors = true;
    }
  }

  // Check optional variables
  console.log('\n📋 Optional Variables:');
  for (const envVar of OPTIONAL_ENV_VARS) {
    const value = process.env[envVar.name];
    const validation = validateEnvVar(envVar, value);
    
    if (value) {
      if (validation.valid) {
        console.log(`✅ ${envVar.name}: Present`);
      } else {
        console.log(`❌ ${envVar.name}: ${validation.error}`);
        hasErrors = true;
      }
    } else {
      console.log(`⚪ ${envVar.name}: Not set (optional)`);
    }
  }

  // Security checks
  console.log('\n🔒 Security Checks:');
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    console.log('❌ JWT_SECRET must be at least 32 characters');
    hasErrors = true;
  } else if (jwtSecret) {
    console.log('✅ JWT_SECRET: Secure length');
  }

  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production' && process.env.LOG_LEVEL === 'debug') {
    console.log('⚠️  WARNING: Debug logging enabled in production');
  }

  console.log('\n' + '='.repeat(50));
  
  if (hasErrors) {
    console.log('❌ Environment validation failed!');
    console.log('Please fix the issues above before deploying to production.');
    process.exit(1);
  } else {
    console.log('✅ Environment validation passed!');
    console.log('Ready for production deployment.');
  }
}

if (require.main === module) {
  main();
}
