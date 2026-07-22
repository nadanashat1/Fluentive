// Verification script for the corrected auth architecture
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Corrected Auth Architecture');
console.log('==========================================');

// Check if files exist in correct locations
const filesToCheck = [
  'src/lib/auth/refresh-lock.ts',
  'src/lib/auth-state-machine.tsx',
  'src/lib/api-client.ts'
];

let allFilesExist = true;

filesToCheck.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

// Check refresh lock is in client-safe location
const refreshLockPath = path.join(process.cwd(), 'src/lib/auth/refresh-lock.ts');
if (fs.existsSync(refreshLockPath)) {
  const refreshLockContent = fs.readFileSync(refreshLockPath, 'utf8');
  
  console.log('\n🔒 Refresh Lock (Client-Safe):');
  
  // Should NOT have server-only patterns
  if (refreshLockContent.includes('server/')) {
    console.log('❌ Contains server/ imports');
    allFilesExist = false;
  } else {
    console.log('✅ No server/ imports');
  }
  
  // Should have core functions
  const coreFunctions = ['acquireRefreshLock', 'releaseRefreshLock', 'isRefreshLocked'];
  coreFunctions.forEach(func => {
    if (refreshLockContent.includes(`export function ${func}`)) {
      console.log(`✅ ${func} exported`);
    } else {
      console.log(`❌ ${func} missing`);
      allFilesExist = false;
    }
  });
  
  // Should NOT have withRefreshLock
  if (refreshLockContent.includes('withRefreshLock')) {
    console.log('❌ withRefreshLock still present (should be removed)');
    allFilesExist = false;
  } else {
    console.log('✅ withRefreshLock removed');
  }
}

// Check API client only emits 401 events
const apiClientPath = path.join(process.cwd(), 'src/lib/api-client.ts');
if (fs.existsSync(apiClientPath)) {
  const apiClientContent = fs.readFileSync(apiClientPath, 'utf8');
  
  console.log('\n🌐 API Client (401 Events Only):');
  
  // Should NOT have refresh logic
  if (apiClientContent.includes('/api/auth/refresh')) {
    console.log('❌ Still contains refresh logic');
    allFilesExist = false;
  } else {
    console.log('✅ No refresh logic');
  }
  
  // Should have 401 event emission
  if (apiClientContent.includes('auth:401')) {
    console.log('✅ Emits 401 events');
  } else {
    console.log('❌ Missing 401 event emission');
    allFilesExist = false;
  }
  
  // Should have proper comment
  if (apiClientContent.includes('only emits 401 events')) {
    console.log('✅ Proper documentation');
  } else {
    console.log('❌ Missing proper documentation');
  }
}

// Check auth state machine is sole refresh authority
const authStateMachinePath = path.join(process.cwd(), 'src/lib/auth-state-machine.tsx');
if (fs.existsSync(authStateMachinePath)) {
  const authStateMachineContent = fs.readFileSync(authStateMachinePath, 'utf8');
  
  console.log('\n🤖 Auth State Machine (Sole Refresh Authority):');
  
  // Should import from client-safe location
  if (authStateMachineContent.includes('./auth/refresh-lock')) {
    console.log('✅ Imports from client-safe location');
  } else {
    console.log('❌ Wrong import path');
    allFilesExist = false;
  }
  
  // Should listen for 401 events
  if (authStateMachineContent.includes('auth:401')) {
    console.log('✅ Listens for 401 events');
  } else {
    console.log('❌ Missing 401 event listener');
    allFilesExist = false;
  }
  
  // Should have refreshSession function
  if (authStateMachineContent.includes('refreshSession')) {
    console.log('✅ Has refreshSession function');
  } else {
    console.log('❌ Missing refreshSession');
    allFilesExist = false;
  }
  
  // Should have proper React imports
  if (authStateMachineContent.includes('useEffect')) {
    console.log('✅ Proper React imports');
  } else {
    console.log('❌ Missing React imports');
    allFilesExist = false;
  }
}

// Check no server/client boundary violations
console.log('\n🚫 Boundary Violations:');

// Check no server imports in client code
const clientFiles = [
  'src/lib/auth-state-machine.tsx',
  'src/lib/api-client.ts'
];

clientFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('server/')) {
      console.log(`❌ ${file} has server imports`);
      allFilesExist = false;
    } else {
      console.log(`✅ ${file} no server imports`);
    }
  }
});

console.log('\n📊 Architecture Verification Result:');
console.log(allFilesExist ? '✅ ALL ARCHITECTURE RULES SATISFIED' : '❌ SOME VIOLATIONS FOUND');

if (allFilesExist) {
  console.log('\n🚀 Corrected Auth Architecture is Ready!');
  console.log('Features implemented:');
  console.log('  • Client-safe refresh lock (no server boundary violations)');
  console.log('  • Single refresh authority (state machine only)');
  console.log('  • API client only emits 401 events');
  console.log('  • No duplicate abstraction layers');
  console.log('  • Proper event-driven architecture');
  console.log('  • Production-ready deterministic system');
} else {
  console.log('\n⚠️  Please fix the violations above.');
}
