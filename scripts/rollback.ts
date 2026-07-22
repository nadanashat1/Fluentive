#!/usr/bin/env ts-node
/**
 * Emergency Rollback Script
 * Reverts main branch to production-stable state
 * 
 * Usage: npx ts-node scripts/rollback.ts --confirm
 */

import { execSync } from 'child_process';
import * as readline from 'readline';

interface RollbackOptions {
  confirm: boolean;
  verbose: boolean;
}

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function rollbackToProductionStable(options: RollbackOptions): Promise<void> {
  if (options.verbose) {
    console.log('🔙 Starting rollback process...\n');
  }

  // 1. Verify production-stable exists
  try {
    execSync('git show-ref --verify --quiet refs/heads/production-stable', {
      stdio: options.verbose ? 'inherit' : 'pipe'
    });
  } catch {
    console.error('❌ production-stable branch not found!');
    console.error('   Create it first: git checkout -b production-stable');
    process.exit(1);
  }

  // 2. Get current state
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
    encoding: 'utf-8'
  }).trim();

  if (options.verbose) {
    console.log(`Current branch: ${currentBranch}\n`);
  }

  // 3. Confirm with user (if not --confirm)
  if (!options.confirm) {
    console.log('⚠️  WARNING: This will DESTROY all changes since production-stable');
    console.log('   This action cannot be undone!\n');
    
    const answer = await askQuestion('Do you want to proceed with rollback? (yes/no): ');
    
    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('❌ Rollback cancelled');
      process.exit(0);
    }
  }

  // 4. Create backup of current state
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupBranch = `rollback-backup-${timestamp}`;
  
  console.log(`  → Creating backup branch: ${backupBranch}`);
  try {
    execSync(`git branch ${backupBranch}`, { stdio: options.verbose ? 'inherit' : 'pipe' });
  } catch (error) {
    console.warn('⚠️  Could not create backup branch, continuing...');
  }

  // 5. Reset to production-stable
  console.log('  → Resetting to production-stable...');
  try {
    execSync('git reset --hard production-stable', { stdio: options.verbose ? 'inherit' : 'pipe' });
  } catch (error) {
    console.error('❌ Failed to reset:', error);
    process.exit(1);
  }

  // 6. Push to origin with force-with-lease
  console.log('  → Pushing to origin (with lease protection)...');
  try {
    execSync('git push origin HEAD --force-with-lease', { stdio: options.verbose ? 'inherit' : 'pipe' });
  } catch (error) {
    console.error('❌ Failed to push:', error);
    console.error('   You may need to pull first or check permissions');
    process.exit(1);
  }

  console.log('\n✅ Rollback complete!');
  console.log(`📋 Backup created: ${backupBranch}`);
  console.log('📝 Lost work (if any) is in the backup branch');
}

// Parse CLI arguments
const args = process.argv.slice(2);
const options: RollbackOptions = {
  confirm: args.includes('--confirm'),
  verbose: args.includes('--verbose') || args.includes('-v')
};

// Run rollback
rollbackToProductionStable(options)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  });
