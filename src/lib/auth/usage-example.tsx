/**
 * Usage Examples for Production-Grade Auth System
 * Shows how to use the new session manager + API interceptor
 */

import React from 'react';
import { getErrorMessage } from '@/lib/utils/error';
import { useAuth } from '@/contexts/AuthContext-production';
import { authenticatedFetch, apiInterceptor } from '@/lib/auth/api-interceptor';

// === COMPONENT USAGE ===
function UserProfile() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please login</div>;

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <p>Email: {user?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// === API CALLS WITH AUTO REFRESH ===
function DashboardComponent() {
  const { user } = useAuth();
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Auto handles 401 refresh automatically
        const response = await authenticatedFetch('/api/dashboard/data');
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>Loading...</div>;

  return <div>Dashboard data loaded</div>;
}

// === GLOBAL FETCH INTERCEPTOR (OPTIONAL) ===
// Install once in your app initialization
if (typeof window !== 'undefined') {
  // This makes ALL fetch calls use the interceptor
  apiInterceptor.installGlobalFetch();
}

// === CUSTOM API CLIENT ===
class ApiClient {
  // Using authenticatedFetch directly
  async getUserProfile() {
    const response = await authenticatedFetch('/api/user/profile');
    return response.json();
  }

  // Using the interceptor instance
  async getDashboardData() {
    const response = await apiInterceptor.fetch('/api/dashboard/data');
    return response.json();
  }

  // Skipping auth for public endpoints
  async getPublicData() {
    const response = await authenticatedFetch('/api/public/data', { skipAuth: true });
    return response.json();
  }
}

// === LOGIN FORM EXAMPLE ===
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

// === SESSION MONITORING (ADVANCED) ===
function SessionMonitor() {
  const { user, isRefreshing } = useAuth();

  React.useEffect(() => {
    if (user) {
      console.log('User session active:', user.email);
    }
  }, [user]);

  React.useEffect(() => {
    if (isRefreshing) {
      console.log('Session refreshing...');
    }
  }, [isRefreshing]);

  return null; // Invisible component
}

export {
  UserProfile,
  DashboardComponent,
  ApiClient,
  LoginForm,
  SessionMonitor
};
