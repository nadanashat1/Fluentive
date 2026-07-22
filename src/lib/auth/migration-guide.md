# Production-Grade Auth System Migration Guide

## Overview
This guide covers migrating from the basic auth system to the production-grade auth runtime with state machine, API interceptor, and proper race condition prevention.

## Files to Replace

### 1. AuthContext
```typescript
// OLD
import { AuthProvider } from '@/contexts/AuthContext';

// NEW
import { AuthProvider } from '@/contexts/AuthContext-final';
```

### 2. API Calls
```typescript
// OLD
const response = await fetch('/api/data');

// NEW - Controlled client
import { apiFetch } from '@/lib/auth/api-interceptor-v3';
const response = await apiFetch('/api/data');

// OR convenience methods
import { apiGet, apiPost } from '@/lib/auth/api-interceptor-v3';
const response = await apiGet('/api/data');
const response = await apiPost('/api/users', userData);
```

## Key Changes

### 1. No More Global Fetch Patching
- ❌ Removed: `window.fetch = function(...)`
- ✅ Added: Controlled `apiFetch` client
- ✅ Added: `apiGet`, `apiPost`, `apiPut`, `apiDelete` convenience methods

### 2. Request Identity-Based Retry Locking
- ❌ Removed: Simple retry counter
- ✅ Added: `WeakSet<Request>` for per-request retry tracking
- ✅ Benefit: Prevents duplicate retries on same request object

### 3. Stale Response Rejection
- ❌ Removed: Basic session versioning
- ✅ Added: Session version validation in responses
- ✅ Benefit: Prevents old responses from overwriting new state

### 4. Request Coalescing
- ❌ Removed: Multiple identical requests allowed
- ✅ Added: `Map<string, Promise<Response>>` for request deduplication
- ✅ Benefit: Reduces backend load by sharing identical requests

### 5. Explicit Auth State Machine
- ❌ Removed: Boolean flags for auth state
- ✅ Added: `AuthState` enum with explicit states
- ✅ Benefit: Prevents UI flicker and race conditions

### 6. Pure useSyncExternalStore
- ❌ Removed: Manual state synchronization
- ✅ Added: Pure snapshot functions
- ✅ Benefit: React concurrent rendering compatibility

## Lint Rules

Add to your `.eslintrc.js`:

```javascript
module.exports = {
  rules: {
    // Enforce apiFetch usage instead of raw fetch
    'no-restricted-syntax': [
      'error',
      {
        'selector': "CallExpression[callee.name='fetch']",
        'message': 'Use apiFetch instead of fetch for API calls'
      }
    ],
    
    // Enforce auth state machine usage
    'no-restricted-properties': [
      'error',
      {
        'object': 'authStateMachine',
        'property': 'currentState',
        'message': 'Use getState() or subscribe() instead of direct state access'
      }
    ]
  }
};
```

## Usage Examples

### Basic API Calls
```typescript
import { apiGet, apiPost } from '@/lib/auth/api-interceptor-v3';

// GET request
const users = await apiGet('/api/users');

// POST request
const newUser = await apiPost('/api/users', { name: 'John', email: 'john@example.com' });

// Skip auth for public endpoints
const publicData = await apiGet('/api/public/data', { skipAuth: true });
```

### Auth State Monitoring
```typescript
import { useAuth } from '@/contexts/AuthContext-final';
import { AuthState } from '@/lib/auth/auth-state-machine';

function MyComponent() {
  const { user, authState, isRefreshing } = useAuth();

  if (authState === AuthState.HYDRATING) {
    return <div>Loading session...</div>;
  }

  if (authState === AuthState.REFRESHING) {
    return <div>Refreshing tokens...</div>;
  }

  if (authState === AuthState.ERROR) {
    return <div>Authentication error</div>;
  }

  return <div>Welcome, {user?.name}</div>;
}
```

### Version-Aware API Calls
```typescript
import { versionedFetch } from '@/lib/auth/api-interceptor-v3';

// Request will be rejected if session version changes during execution
const data = await versionedFetch('/api/sensitive-data');
```

## Testing

### Mock API Interceptor
```typescript
import { apiInterceptor } from '@/lib/auth/api-interceptor-v3';

// Clear inflight requests between tests
afterEach(() => {
  apiInterceptor.clearInflightRequests();
});

// Monitor request count
expect(apiInterceptor.getInflightRequestCount()).toBe(0);
```

### Auth State Machine Testing
```typescript
import { authStateMachine, AuthState, AuthEvent } from '@/lib/auth/auth-state-machine';

// Test state transitions
expect(authStateMachine.getCurrentState()).toBe(AuthState.ANONYMOUS);
expect(authStateMachine.canTransition(AuthState.ANONYMOUS, AuthEvent.BOOTSTRAP)).toBe(true);

await authStateMachine.transition(AuthEvent.BOOTSTRAP);
expect(authStateMachine.getCurrentState()).toBe(AuthState.HYDRATING);
```

## Performance Benefits

1. **Reduced API Load**: Request coalescing prevents duplicate calls
2. **Fewer Re-renders**: Pure useSyncExternalStore with stable snapshots
3. **No Memory Leaks**: Deterministic cleanup functions
4. **Race Condition Free**: Request identity locking and session versioning

## Production Safety

1. **No Global Mutations**: Controlled API client
2. **Predictable Behavior**: Explicit state machine
3. **Error Isolation**: Proper error boundaries and recovery
4. **Cross-Tab Safety**: Session versioning prevents race conditions

## Migration Checklist

- [ ] Replace AuthContext import
- [ ] Replace fetch calls with apiFetch/apiGet/apiPost
- [ ] Add lint rules for enforcement
- [ ] Update tests to use new APIs
- [ ] Verify no global fetch usage
- [ ] Test cross-tab scenarios
- [ ] Monitor request coalescing in production

## Troubleshooting

### "fetch is not defined" errors
- Ensure you're using `apiFetch` instead of `fetch`
- Check lint rules are catching raw fetch usage

### Race conditions in tests
- Clear inflight requests between tests
- Use deterministic session versions

### UI flicker during auth
- Check auth state machine transitions
- Ensure proper loading states are used
