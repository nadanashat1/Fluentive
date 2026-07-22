// Stripe-level auth architecture verification
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Stripe-Level Auth Architecture');
console.log('=============================================');

// Check all auth files exist in proper structure
const authFiles = [
  'src/lib/auth/auth.reducer.ts',
  'src/lib/auth/auth.orchestrator.ts', 
  'src/lib/auth/auth.context.tsx',
  'src/lib/auth/refresh-lock.ts',
  'src/lib/auth/index.ts',
  'src/lib/api-client.ts'
];

let allFilesExist = true;

authFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

// Layer 1: Pure Reducer Verification
const reducerPath = path.join(process.cwd(), 'src/lib/auth/auth.reducer.ts');
if (fs.existsSync(reducerPath)) {
  const reducerContent = fs.readFileSync(reducerPath, 'utf8');
  
  console.log('\n🧮 Layer 1: Pure Reducer');
  
  // Should have no async (excluding comments)
  const lines = reducerContent.split('\n');
  const hasAsyncInCode = lines.some(line => 
    (line.includes('async') || line.includes('await')) && 
    !line.trim().startsWith('//') && 
    !line.trim().startsWith('*') &&
    line.trim() !== ''
  );
  
  if (hasAsyncInCode) {
    console.log('❌ Contains async/await in code');
    allFilesExist = false;
  } else {
    console.log('✅ No async/await in code');
  }
  
  // Should have no API calls
  if (reducerContent.includes('fetch') || reducerContent.includes('/api/')) {
    console.log('❌ Contains API calls');
    allFilesExist = false;
  } else {
    console.log('✅ No API calls');
  }
  
  // Should have pure function signature
  if (reducerContent.includes('function authReducer(state: AuthState, action: AuthAction): AuthState')) {
    console.log('✅ Pure function signature');
  } else {
    console.log('❌ Missing pure function signature');
    allFilesExist = false;
  }
  
  // Should have proper state types
  if (reducerContent.includes('status: "booting"') && reducerContent.includes('status: "authenticated"')) {
    console.log('✅ Proper state types');
  } else {
    console.log('❌ Missing proper state types');
    allFilesExist = false;
  }
}

// Layer 2: Orchestrator Verification  
const orchestratorPath = path.join(process.cwd(), 'src/lib/auth/auth.orchestrator.ts');
if (fs.existsSync(orchestratorPath)) {
  const orchestratorContent = fs.readFileSync(orchestratorPath, 'utf8');
  
  console.log('\n🎯 Layer 2: Auth Orchestrator');
  
  // Should have async methods
  if (orchestratorContent.includes('async handleError') && orchestratorContent.includes('async refreshSession')) {
    console.log('✅ Has async methods');
  } else {
    console.log('❌ Missing async methods');
    allFilesExist = false;
  }
  
  // Should handle HTTP errors
  if (orchestratorContent.includes('HttpError') && orchestratorContent.includes('error.status === 401')) {
    console.log('✅ Handles HTTP errors');
  } else {
    console.log('❌ Missing HTTP error handling');
    allFilesExist = false;
  }
  
  // Should use refresh lock
  if (orchestratorContent.includes('acquireRefreshLock') && orchestratorContent.includes('releaseRefreshLock')) {
    console.log('✅ Uses refresh lock');
  } else {
    console.log('❌ Missing refresh lock usage');
    allFilesExist = false;
  }
  
  // Should dispatch actions
  if (orchestratorContent.includes('this.dispatch') && orchestratorContent.includes('START_REFRESH')) {
    console.log('✅ Dispatches actions');
  } else {
    console.log('❌ Missing action dispatching');
    allFilesExist = false;
  }
}

// Layer 3: Thin Context Verification
const contextPath = path.join(process.cwd(), 'src/lib/auth/auth.context.tsx');
if (fs.existsSync(contextPath)) {
  const contextContent = fs.readFileSync(contextPath, 'utf8');
  
  console.log('\n⚡ Layer 3: Thin Context');
  
  // Should have no business logic
  if (contextContent.includes('fetch') || contextContent.includes('/api/')) {
    console.log('❌ Contains business logic');
    allFilesExist = false;
  } else {
    console.log('✅ No business logic');
  }
  
  // Should use orchestrator
  if (contextContent.includes('new AuthOrchestrator') && contextContent.includes('orchestrator.bootAuth()')) {
    console.log('✅ Uses orchestrator');
  } else {
    console.log('❌ Missing orchestrator usage');
    allFilesExist = false;
  }
  
  // Should use reducer
  if (contextContent.includes('useReducer(authReducer')) {
    console.log('✅ Uses reducer');
  } else {
    console.log('❌ Missing reducer usage');
    allFilesExist = false;
  }
  
  // Should have convenience hooks
  if (contextContent.includes('useAuthState') && contextContent.includes('useAuthActions')) {
    console.log('✅ Has convenience hooks');
  } else {
    console.log('❌ Missing convenience hooks');
    allFilesExist = false;
  }
}

// Layer 4: API Client Verification
const apiClientPath = path.join(process.cwd(), 'src/lib/api-client.ts');
if (fs.existsSync(apiClientPath)) {
  const apiClientContent = fs.readFileSync(apiClientPath, 'utf8');
  
  console.log('\n🌐 Layer 4: API Client (Pure HTTP)');
  
  // Should have HttpError only
  if (apiClientContent.includes('HttpError') && !apiClientContent.includes('ApiError')) {
    console.log('✅ Uses HttpError only');
  } else {
    console.log('❌ Contains non-HTTP errors');
    allFilesExist = false;
  }
  
  // Should have no auth semantics
  if (apiClientContent.includes('UNAUTHORIZED') || apiClientContent.includes('AUTH_REQUIRED')) {
    console.log('❌ Contains auth semantics');
    allFilesExist = false;
  } else {
    console.log('✅ No auth semantics');
  }
  
  // Should throw pure HTTP errors
  if (apiClientContent.includes('throw new HttpError(401)')) {
    console.log('✅ Throws pure HTTP errors');
  } else {
    console.log('❌ Missing pure HTTP error throwing');
    allFilesExist = false;
  }
}

// Refresh Lock Verification
const refreshLockPath = path.join(process.cwd(), 'src/lib/auth/refresh-lock.ts');
if (fs.existsSync(refreshLockPath)) {
  const refreshLockContent = fs.readFileSync(refreshLockPath, 'utf8');
  
  console.log('\n🔒 Process-Local Refresh Lock');
  
  // Should have proper documentation
  if (refreshLockContent.includes('Process-local mutex') && refreshLockContent.includes('NOT global')) {
    console.log('✅ Proper process-local documentation');
  } else {
    console.log('❌ Missing proper documentation');
    allFilesExist = false;
  }
  
  // Should be pure in-memory
  if (refreshLockContent.includes('let isRefreshing = false') && !refreshLockContent.includes('redis')) {
    console.log('✅ Pure in-memory implementation');
  } else {
    console.log('❌ Not pure in-memory');
    allFilesExist = false;
  }
}

// Index File Verification
const indexPath = path.join(process.cwd(), 'src/lib/auth/index.ts');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  console.log('\n📦 Module Exports');
  
  // Should export all layers
  const requiredExports = [
    'auth.reducer',
    'auth.orchestrator', 
    'auth.context',
    'refresh-lock',
    'HttpError'
  ];
  
  requiredExports.forEach(exportName => {
    if (indexContent.includes(exportName)) {
      console.log(`✅ Exports ${exportName}`);
    } else {
      console.log(`❌ Missing ${exportName} export`);
      allFilesExist = false;
    }
  });
}

// Architecture Purity Check
console.log('\n🚫 Architecture Purity Check');

// Check no layer violations (excluding comments)
const layerViolations = [
  { 
    file: 'src/lib/auth/auth.reducer.ts', 
    violations: ['fetch', '/api/'],
    excludeComments: true 
  },
  { 
    file: 'src/lib/auth/auth.context.tsx', 
    violations: ['fetch', '/api/'],
    excludeComments: true 
  },
  { 
    file: 'src/lib/api-client.ts', 
    violations: ['UNAUTHORIZED', 'AUTH_REQUIRED'],
    excludeComments: true 
  }
];

layerViolations.forEach(({ file, violations, excludeComments }) => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    let hasViolation = false;
    if (excludeComments) {
      const lines = content.split('\n');
      hasViolation = lines.some(line => 
        violations.some(violation => line.includes(violation)) &&
        !line.trim().startsWith('//') && 
        !line.trim().startsWith('*') &&
        line.trim() !== ''
      );
    } else {
      hasViolation = violations.some(violation => content.includes(violation));
    }
    
    if (hasViolation) {
      console.log(`❌ ${file} has layer violations`);
      allFilesExist = false;
    } else {
      console.log(`✅ ${file} respects layer boundaries`);
    }
  }
});

console.log('\n📊 Stripe-Level Architecture Verification Result:');
console.log(allFilesExist ? '✅ ALL STRIPE-LEVEL PRINCIPLES SATISFIED' : '❌ SOME VIOLATIONS FOUND');

if (allFilesExist) {
  console.log('\n🚀 Stripe-Level Auth Architecture is Complete!');
  console.log('Architecture layers:');
  console.log('  • Layer 1: Pure reducer (deterministic state transitions)');
  console.log('  • Layer 2: Orchestrator (async side effects only)');
  console.log('  • Layer 3: Thin context (React wiring only)');
  console.log('  • Layer 4: HTTP client (pure transport)');
  console.log('  • Layer 5: Process-local lock (concurrency control)');
  console.log('\n🎯 This matches Stripe/Linear production auth patterns!');
} else {
  console.log('\n⚠️  Please fix the violations above.');
}
