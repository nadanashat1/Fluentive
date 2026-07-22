#!/usr/bin/env ts-node
/**
 * Preflight Check Script
 * Run before deployment to catch issues early
 * Usage: npx ts-node scripts/preflight-check.ts
 */

import { validateEnv, preflightCheck } from '../src/lib/server/env';

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║       FLUENTIVE CRM - PREFLIGHT CHECK                  ║');
console.log('║       Production Deployment Validation               ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// Run preflight checks
try {
  preflightCheck();
  console.log('✅ All checks passed! Ready for deployment.\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Preflight check failed!\n');
  console.error('Fix the issues above before deploying.\n');
  process.exit(1);
}
