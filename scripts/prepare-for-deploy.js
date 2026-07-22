#!/usr/bin/env node

/**
 * Prepare for Deployment Script
 * 
 * This script helps prepare the project for Vercel deployment by:
 * 1. Checking environment variables
 * 2. Verifying Prisma schema
 * 3. Running type checks
 * 4. Building the project locally to catch errors
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const backendDir = path.resolve(rootDir, 'backend');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`  ✓ ${description}`, 'green');
  } else {
    log(`  ✗ ${description} (missing)`, 'red');
  }
  return exists;
}

function runCommand(command, description, cwd = rootDir) {
  log(`\n${description}...`, 'cyan');
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    log(`  ✓ ${description} completed`, 'green');
    return true;
  } catch (error) {
    log(`  ✗ ${description} failed`, 'red');
    return false;
  }
}

log('\n========================================', 'bright');
log('  D-FLUENCY CRM - DEPLOYMENT PREPARATION', 'bright');
log('========================================\n', 'bright');

// Check required files
log('Checking required configuration files...', 'cyan');
const requiredFiles = [
  { path: 'vercel.json', desc: 'Frontend Vercel config' },
  { path: 'backend/vercel.json', desc: 'Backend Vercel config' },
  { path: 'backend/api/index.ts', desc: 'Serverless handler' },
  { path: 'backend/prisma/schema.prisma', desc: 'Prisma schema' },
  { path: 'next.config.ts', desc: 'Next.js config' },
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const exists = checkFile(path.join(rootDir, file.path), file.desc);
  if (!exists) allFilesExist = false;
}

if (!allFilesExist) {
  log('\n✗ Some required files are missing!', 'red');
  process.exit(1);
}

// Check environment files
log('\nChecking environment files...', 'cyan');
checkFile(path.join(rootDir, '.env.local'), 'Frontend .env.local');
checkFile(path.join(backendDir, '.env'), 'Backend .env');
checkFile(path.join(rootDir, '.env.example'), 'Frontend .env.example');
checkFile(path.join(backendDir, '.env.example'), 'Backend .env.example');

log('\n⚠ Note: Make sure to set environment variables in Vercel Dashboard!', 'yellow');

// Run type check on backend
log('\n========================================', 'bright');
log('  RUNNING BACKEND TYPE CHECK', 'bright');
log('========================================', 'bright');
const backendTypeCheck = runCommand('npm run type-check', 'Backend TypeScript check', backendDir);

if (!backendTypeCheck) {
  log('\n✗ Backend type check failed! Fix errors before deploying.', 'red');
  process.exit(1);
}

// Build backend locally
log('\n========================================', 'bright');
log('  BUILDING BACKEND (LOCAL TEST)', 'bright');
log('========================================', 'bright');
const backendBuild = runCommand('npm run build', 'Backend build test', backendDir);

if (!backendBuild) {
  log('\n✗ Backend build failed! Fix errors before deploying.', 'red');
  process.exit(1);
}

// Summary
log('\n========================================', 'bright');
log('  DEPLOYMENT PREPARATION COMPLETE', 'bright');
log('========================================\n', 'bright');

log('Next steps:', 'bright');
log('1. Push your code to GitHub/GitLab/Bitbucket', 'cyan');
log('2. Go to https://vercel.com/dashboard', 'cyan');
log('3. Click "Add New Project"', 'cyan');
log('4. Import your repository', 'cyan');
log('5. Deploy backend first (set root directory to "backend")', 'cyan');
log('6. Copy backend URL and update NEXT_PUBLIC_API_URL', 'cyan');
log('7. Deploy frontend (root directory is project root)', 'cyan');

log('\nFor detailed instructions, see VERCEL_DEPLOYMENT.md', 'yellow');
