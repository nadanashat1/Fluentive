#!/usr/bin/env node

/**
 * Memory-optimized build script for Vercel Hobby Plan
 * Reduces memory usage during deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting memory-optimized build for Vercel Hobby Plan...');

// Set environment variables for memory optimization
process.env.NODE_OPTIONS = '--max-old-space-size=1024';
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NODE_ENV = 'production';

// Optimize package.json for production build
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Remove devDependencies for build
const devDeps = packageJson.devDependencies;
delete packageJson.devDependencies;

// Write optimized package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('📦 Optimized package.json for production build');

try {
  // Run Prisma generate first
  console.log('🔧 Running Prisma generate...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Run optimized build
  console.log('🏗️  Running optimized Next.js build...');
  execSync('npx next build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=1024',
      NEXT_TELEMETRY_DISABLED: '1'
    }
  });
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} finally {
  // Restore original package.json
  packageJson.devDependencies = devDeps;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('📦 Restored original package.json');
}
