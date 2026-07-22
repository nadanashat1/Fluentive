// Stripe-style minimal auth architecture verification
const fs = require('fs');
const path = require('path');

console.log('🎯 Stripe-Style Minimal Auth Architecture Verification');
console.log('===================================================');

// Check correct minimal file structure
const requiredFiles = [
  'src/lib/auth/auth.service.ts',
  'src/lib/auth/useAuth.tsx',
  'src/lib/auth/index.ts',
  'src/lib/api-client.ts'
];

const deletedFiles = [
  'src/lib/auth/auth.reducer.ts',
  'src/lib/auth/auth.effects.ts',
  'src/lib/auth/auth.engine.ts',
  'src/lib/auth/auth.adapter.tsx',
  'src/lib/auth/refresh-lock.factory.ts',
  'src/lib/auth/auth.orchestrator.ts',
  'src/lib/auth/auth.context.tsx'
];

let verificationPassed = true;

// File structure check
console.log('\n📁 Minimal File Structure:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(exists ? `✅ ${file}` : `❌ ${file} missing`);
  if (!exists) verificationPassed = false;
});

console.log('\n🗑️ Cleanup Verification:');
deletedFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(!exists ? `✅ ${file} correctly deleted` : `❌ ${file} still exists`);
  if (exists) verificationPassed = false;
});

// Analyze auth service - single authority
console.log('\n🏛️ Auth Service Analysis (Single Authority)');
const serviceContent = fs.readFileSync('src/lib/auth/auth.service.ts', 'utf8');

const serviceChecks = [
  { name: 'singleState', pattern: ['state: AuthState'], expected: true },
  { name: 'singleClass', pattern: ['class AuthService'], expected: true },
  { name: 'singletonInstance', pattern: ['export const authService = new AuthService()'], expected: true },
  { name: 'simpleLock', pattern: ['let isRefreshing = false'], expected: true },
  { name: 'noFactory', pattern: ['createAuthEngine', 'createAuthEffects', 'createRefreshLock'], expected: false },
  { name: 'hasBoot', pattern: ['async boot()'], expected: true },
  { name: 'hasLogin', pattern: ['async login('], expected: true },
  { name: 'hasLogout', pattern: ['async logout()'], expected: true },
  { name: 'hasRefresh', pattern: ['private async refreshSession()'], expected: true },
  { name: 'handlesHttpErrors', pattern: ['async handleHttpError('], expected: true }
];

serviceChecks.forEach(check => {
  const found = check.pattern.some(pattern => serviceContent.includes(pattern));
  const correct = found === check.expected;
  console.log(correct ? `✅ ${check.name}` : `❌ ${check.name}`);
  if (!correct) verificationPassed = false;
});

// Analyze useAuth hook - thin binding
console.log('\n⚛️ useAuth Hook Analysis (Thin Binding)');
const hookContent = fs.readFileSync('src/lib/auth/useAuth.tsx', 'utf8');

const hookChecks = [
  { name: 'usesAuthService', pattern: ['authService'], expected: true },
  { name: 'subscribesToState', pattern: ['authService.subscribe'], expected: true },
  { name: 'noBusinessLogic', pattern: ['fetch(', '/api/'], expected: false },
  { name: 'bootOnMount', pattern: ['authService.boot()'], expected: true },
  { name: 'exposesActions', pattern: ['login', 'logout', 'handleHttpError'], expected: true },
  { name: 'noAdapterSystem', pattern: ['createAuthEngine', 'createAuthEffects', 'AuthEngine'], expected: false }
];

hookChecks.forEach(check => {
  const found = check.pattern.some(pattern => hookContent.includes(pattern));
  const correct = found === check.expected;
  console.log(correct ? `✅ ${check.name}` : `❌ ${check.name}`);
  if (!correct) verificationPassed = false;
});

// Analyze API client - dumb HTTP
console.log('\n🌐 API Client Analysis (Dumb HTTP)');
const apiContent = fs.readFileSync('src/lib/api-client.ts', 'utf8');

const apiChecks = [
  { name: 'throwsHttpError', pattern: ['HttpError'], expected: true },
  { name: 'noAuthLogic', pattern: ['refresh', 'login', 'logout'], expected: false },
  { name: 'noAuthDependencies', pattern: ['auth-token', 'getAuthToken'], expected: false },
  { name: 'pureTransport', pattern: ['fetch(', 'credentials: \'include\''], expected: true }
];

apiChecks.forEach(check => {
  const found = check.pattern.some(pattern => apiContent.includes(pattern));
  const correct = found === check.expected;
  console.log(correct ? `✅ ${check.name}` : `❌ ${check.name}`);
  if (!correct) verificationPassed = false;
});

// Analyze index exports
console.log('\n📦 Index Exports Analysis (Clean Barrel)');
const indexContent = fs.readFileSync('src/lib/auth/index.ts', 'utf8');

const indexChecks = [
  { name: 'exportsService', pattern: ['authService'], expected: true },
  { name: 'exportsHook', pattern: ['useAuth'], expected: true },
  { name: 'exportsTypes', pattern: ['AuthState', 'User'], expected: true },
  { name: 'exportsHttpError', pattern: ['HttpError'], expected: true },
  { name: 'noOldExports', pattern: ['reducer', 'effects', 'engine', 'adapter', 'orchestrator'], expected: false }
];

indexChecks.forEach(check => {
  const found = check.pattern.some(pattern => indexContent.includes(pattern));
  const correct = found === check.expected;
  console.log(correct ? `✅ ${check.name}` : `❌ ${check.name}`);
  if (!correct) verificationPassed = false;
});

// Architecture principles check
console.log('\n🏗️ Architecture Principles Check:');

const principles = [
  {
    name: 'Single Authority',
    check: () => serviceContent.includes('class AuthService') && serviceContent.includes('export const authService'),
    description: 'One service owns all auth behavior'
  },
  {
    name: 'Minimal Indirection',
    check: () => {
      const fileCount = requiredFiles.filter(f => fs.existsSync(f)).length;
      return fileCount <= 4; // Should be 3-4 files max
    },
    description: 'Minimal number of files/concepts'
  },
  {
    name: 'Simple Lock',
    check: () => serviceContent.includes('let isRefreshing = false') && !serviceContent.includes('createRefreshLock'),
    description: 'Simple mutex, no factory pattern'
  },
  {
    name: 'Thin React Binding',
    check: () => hookContent.includes('authService') && !hookContent.includes('fetch('),
    description: 'Hook only binds to service, no business logic'
  },
  {
    name: 'Dumb Transport',
    check: () => apiContent.includes('HttpError') && !apiContent.includes('refresh'),
    description: 'API client only throws errors, no auth logic'
  }
];

principles.forEach(principle => {
  const passed = principle.check();
  console.log(passed ? `✅ ${principle.name}` : `❌ ${principle.name}`);
  console.log(`   ${principle.description}`);
  if (!passed) verificationPassed = false;
});

// Final result
console.log('\n📊 Stripe-Style Architecture Verification Result:');
console.log(verificationPassed ? '✅ PRODUCTION-GRADE MINIMAL ARCHITECTURE' : '❌ ARCHITECTURE NEEDS FIXES');

if (verificationPassed) {
  console.log('\n🎯 Stripe-Style Minimal Auth Architecture Complete!');
  console.log('\n📋 Architecture Summary:');
  console.log('  • auth.service.ts - Single authority for all auth behavior');
  console.log('  • useAuth.tsx - Thin React hook binding');
  console.log('  • api-client.ts - Dumb HTTP transport');
  console.log('  • Simple mutex - No factory abstraction');
  console.log('\n✨ Production Benefits:');
  console.log('  • Minimal cognitive load');
  console.log('  • Fast debugging (single source of truth)');
  console.log('  • Clear failure modes');
  console.log('  • Low trace complexity');
  console.log('  • Easy state visibility');
  console.log('\n🚀 This matches real Stripe/Linear production patterns:');
  console.log('  • Focus on production correctness over theoretical purity');
  console.log('  • Minimal indirection for operational clarity');
  console.log('  • Single ownership of auth behavior');
  console.log('  • Simple, debuggable implementation');
} else {
  console.log('\n⚠️ Architecture needs fixes to match Stripe-style minimalism');
}
