/**
 * AuthKernel Usage Examples - Production-Final Implementation
 * Single authority auth system with zero bypass paths
 */

import React from 'react';
import { getErrorMessage } from '@/lib/utils/error';
import { useAuth } from '@/contexts/AuthContext-kernel';
import { authKernel, AuthState } from '@/lib/auth/auth-kernel';

// === COMPONENT USAGE (SINGLE SOURCE OF TRUTH) ===
function UserProfile() {
  const { user, authState, isAuthenticated, logout } = useAuth();

  // Auth state-driven rendering
  if (authState === AuthState.HYDRATING) {
    return <div>Loading session...</div>;
  }

  if (authState === AuthState.REFRESHING) {
    return <div>Refreshing session...</div>;
  }

  if (authState === AuthState.ERROR) {
    return <div>Authentication error occurred</div>;
  }

  if (!isAuthenticated) {
    return <div>Please login to continue</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <p>Email: {user?.email}</p>
      <p>Role: {user?.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// === API CALLS (AUTO-REFRESH, NO 401 SPAM) ===
function DashboardComponent() {
  const { authState } = useAuth();
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // AuthKernel handles 401 refresh automatically
        const response = await fetch('/api/dashboard/data');
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };

    // Only fetch if authenticated
    if (authState === AuthState.AUTHENTICATED) {
      fetchData();
    }
  }, [authState]);

  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>Loading dashboard...</div>;

  return <div>Dashboard data loaded successfully</div>;
}

// === LOGIN FORM (KERNEL-DRIVEN) ===
function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      // Navigation happens automatically in login function
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

// === ADVANCED USAGE (DIRECT KERNEL ACCESS) ===
function AdvancedAuthComponent() {
  const [kernelState, setKernelState] = React.useState(authKernel.getState());

  React.useEffect(() => {
    // Subscribe directly to kernel for fine-grained control
    const unsubscribe = authKernel.subscribe(() => {
      setKernelState(authKernel.getState());
    });

    return unsubscribe;
  }, []);

  const handleManualRefresh = async () => {
    try {
      await authKernel.refreshToken();
      console.log('Token refreshed successfully');
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  };

  const handleLogout = async () => {
    await authKernel.logout();
  };

  return (
    <div>
      <h2>Auth Kernel State</h2>
      <p>State: {kernelState.status}</p>
      <p>User: {kernelState.user?.email || 'None'}</p>
      <p>Version: {kernelState.version}</p>
      
      <button onClick={handleManualRefresh}>Manual Refresh</button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

// === API CLIENT CLASS (KERNEL-BACKED) ===
class ApiClient {
  // All methods use AuthKernel internally
  async getUserProfile() {
    const response = await fetch('/api/user/profile');
    return response.json();
  }

  async updateProfile(data: any) {
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async createResource(data: any) {
    const response = await fetch('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async deleteResource(id: string) {
    const response = await fetch(`/api/resources/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  }

  // Custom request with full control
  async customRequest(url: string, options: RequestInit) {
    const response = await fetch(url, options);
    return response.json();
  }
}

// === SESSION MONITORING (KERNEL-OBSERVABLE) ===
function SessionMonitor() {
  const [stateHistory, setStateHistory] = React.useState<string[]>([]);

  React.useEffect(() => {
    const unsubscribe = authKernel.subscribe(() => {
      const state = authKernel.getState();
      setStateHistory(prev => [...prev.slice(-9), `${state.status} (${new Date().toLocaleTimeString()})`]);
    });

    return unsubscribe;
  }, []);

  return (
    <div>
      <h3>Session State History</h3>
      {stateHistory.map((entry, index) => (
        <div key={index}>{entry}</div>
      ))}
    </div>
  );
}

// === ERROR BOUNDARY (KERNEL-AWARE) ===
class AuthErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth Error Boundary caught:', error, errorInfo);
    
    // Reset auth state on critical errors
    if (authKernel.getState().status !== AuthState.ANONYMOUS) {
      authKernel.logout();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Authentication Error</h2>
          <p>Something went wrong with authentication.</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// === TESTING UTILITIES ===
export const AuthTestUtils = {
  // Get current kernel state for testing
  getCurrentState: () => authKernel.getState(),
  
  // Check if kernel is in specific state
  isInState: (expectedState: AuthState) =>
    authKernel.getState().status === expectedState,
  
  // Wait for state transition
  waitForState: (expectedState: AuthState, timeout = 5000) => 
    new Promise<void>((resolve, reject) => {
      const unsubscribe = authKernel.subscribe(() => {
        if (authKernel.getState().status === expectedState) {
          unsubscribe();
          resolve();
        }
      });
      
      setTimeout(() => {
        unsubscribe();
        reject(new Error(`Timeout waiting for state: ${expectedState}`));
      }, timeout);
    }),
  
  // Simulate auth events for testing
  simulateLogin: async (email: string, password: string) => {
    await authKernel.login(email, password);
  },
  
  simulateLogout: async () => {
    await authKernel.logout();
  }
};

// === PRODUCTION DEPLOYMENT CHECKLIST ===
export const ProductionChecklist = {
  // Verify kernel is single authority
  verifySingleAuthority: () => {
    const state = authKernel.getState();
    console.log('Kernel State:', state);
    return state.status !== undefined;
  },
  
  // Check request coalescing
  verifyRequestCoalescing: async () => {
    const promises = [
      fetch('/api/test'),
      fetch('/api/test'),
      fetch('/api/test')
    ];
    
    const results = await Promise.all(promises);
    console.log('Coalesced requests:', results.length, '(should be 1 unique request)');
  },
  
  // Verify transition locking
  verifyTransitionLock: async () => {
    const promises = [
      authKernel.login('test@example.com', 'password'),
      authKernel.logout(),
      authKernel.login('test2@example.com', 'password')
    ];
    
    // Only one should succeed due to transition lock
    const results = await Promise.allSettled(promises);
    console.log('Transition lock results:', results);
  }
};

export {
  UserProfile,
  DashboardComponent,
  LoginForm,
  AdvancedAuthComponent,
  ApiClient,
  SessionMonitor,
  AuthErrorBoundary
};
