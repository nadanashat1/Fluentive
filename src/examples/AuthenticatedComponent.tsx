// === EXAMPLE: Production-Grade Authenticated Component ===
// Shows how to use the new auth system to prevent race conditions

"use client";

import { useEffect, useState } from 'react';
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi';
import { apiGet, apiPost } from '@/lib/auth-api-client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface UserData {
  id: string;
  name: string;
  email: string;
}

export function AuthenticatedComponent() {
  const { isReady, isAuthenticated, shouldDelay, executeIfAuthenticated, executeWhenAuthenticated } = useAuthenticatedApi();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);

  // === GOOD: Delay API calls until authenticated ===
  useEffect(() => {
    if (shouldDelay) {
      console.log('[Example] Auth not ready, delaying API call');
      return;
    }

    const fetchUserData = async () => {
      if (!isAuthenticated) return;

      setLoading(true);
      try {
        // Option 1: Execute only if authenticated (returns null if not)
        const data = await executeIfAuthenticated(() => apiGet<UserData>('/users/me'));
        setUserData(data);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated, shouldDelay, executeIfAuthenticated]);

  // === ALTERNATIVE: Wait for auth before making API call ===
  const handleCreateItem = async () => {
    try {
      const newItem = await executeWhenAuthenticated(() => 
        apiPost('/items', { name: 'New Item' })
      );
      console.log('Item created:', newItem);
    } catch (error) {
      console.error('Failed to create item:', error);
    }
  };

  // === NEVER DO THIS: Make API calls without checking auth state ===
  // const badExample = () => {
  //   apiGet('/users/me'); // This could cause 401 errors during hydration
  // };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
        <span>Preparing...</span>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Authenticated Dashboard</h2>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>Loading user data...</p>
          </div>
        ) : userData ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <h3 className="text-lg font-semibold mb-2">Welcome, {userData.name}!</h3>
            <p className="text-gray-600 dark:text-gray-400">Email: {userData.email}</p>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No user data available
          </div>
        )}

        <button
          onClick={handleCreateItem}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Create New Item
        </button>
      </div>
    </ProtectedRoute>
  );
}
