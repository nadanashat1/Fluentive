'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { SidebarNav } from '@/components/sidebar/SidebarNav';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarFooter } from '@/components/sidebar/SidebarFooter';
import { apiService } from '@/services/apiService';
import { authService } from '@/services/authService';

export default function UsersPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    isActive: boolean;
    createdAt: string;
    lastActive?: string;
    status?: 'active' | 'inactive' | 'pending';
    rating?: string;
  }

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await apiService.getUsers(1, 10, searchTerm);
        if (response.success && response.data) {
          setUsers(response.data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [searchTerm]);

  const handleAddUser = async (userData: any) => {
    try {
      const response = await apiService.createUser(userData);
      if (response.success && response.data) {
        setUsers(prev => [...prev, response.data]);
        setShowAddUserModal(false);
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleViewProfile = async (userId: string) => {
    try {
      const response = await apiService.getUserById(userId);
      if (response.success && response.data) {
        // Navigate to user profile
        console.log('User profile:', response.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiService.deleteUser(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiService.deleteUser(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiService.deleteUser(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiService.deleteUser(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiService.deleteUser(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiService.deleteUser(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiService.deleteUser(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleAddUser = async (userData: any) => {
    try {
      const response = await apiService.createUser(userData);
      if (response.success && response.data) {
        setUsers(prev => [...prev, response.data]);
        setShowAddUserModal(false);
  const filteredUsers = users.filter(user => {
    if (selectedRole === 'all') return true;
    return user.role?.toLowerCase() === selectedRole.toLowerCase();
  });
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <SidebarHeader 
          collapsed={false}
          isOnline={true}
          notificationCount={0}
          onToggleCollapse={async () => {}}
          onRefreshNotifications={async () => {}}
        />
        <nav className="mt-8">
          <SidebarNav 
            collapsed={false}
            isTransitioning={false}
            isNavigating={false}
            indicatorY={0}
            onNavigationStart={async () => {}}
            onIndicatorChange={() => {}}
            containerRef={containerRef}
          />
        </nav>
        <SidebarFooter 
          collapsed={false}
          isOnline={true}
          isNavigating={false}
          onLogout={async () => {}}
          onNavigationStart={async () => {}}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Users</h1>
              <p className="mt-2 text-gray-600">
                Manage user accounts, roles, and permissions
              </p>
            </div>

            {/* Users Content */}
            <Suspense fallback={<div>Loading users...</div>}>
              <div className="space-y-8">
                {/* User Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">{users.length}</div>
                      <div className="text-sm text-gray-600">Total Users</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">{users.filter(u => u.isActive).length}</div>
                      <div className="text-sm text-gray-600">Active Users</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">{users.filter(u => {
                        const createdDate = new Date(u.createdAt);
                        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                        return createdDate >= thirtyDaysAgo;
                      }).length}</div>
                      <div className="text-sm text-gray-600">New This Month</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">{users.filter(u => u.status === 'pending').length}</div>
                      <div className="text-sm text-gray-600">Pending Approval</div>
                    </div>
                  </div>
                </div>

                {/* User Management */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
                      <div className="flex space-x-3">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          Add New User
                        </button>
                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                          Export Users
                        </button>
                        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                          User Roles
                        </button>
                      </div>
                    </div>
                    
                    {/* User List */}
                    <div className="space-y-4">
                      {filteredUsers.map((user) => (
                        <div key={user.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                <span className="text-blue-600 font-bold">{user.name.split(' ').map(n => n[0]).toUpperCase()}</span>
                              </div>
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                                <p className="text-sm text-gray-600">{user.role}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                user.status === 'active' ? 'bg-green-100 text-green-800' : 
                                user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.status || 'Active'}
                              </span>
                              <span className="text-sm text-gray-500">⭐ {user.rating || '4.8'} Rating</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Email:</span> {user.email}
                            </div>
                            <div>
                              <span className="font-medium">Role:</span> {user.role}
                            </div>
                            <div>
                              <span className="font-medium">Join Date:</span> {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <span className="text-xs text-gray-500">Last active: {user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never'}</span>
                            <button 
                              onClick={() => handleViewProfile(user.id)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View Profile →
                            </button>
                          </div>
                        </div>
                      ))}
                      </div>

                      {/* User 2 */}
                      <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                              <span className="text-green-600 font-bold">SM</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">Sarah Mitchell</h3>
                              <p className="text-sm text-gray-600">Sales Representative</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                            <span className="text-sm text-gray-500">⭐ 4.7 Rating</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Email:</span> sarah.mitchell@example.com
                          </div>
                          <div>
                            <span className="font-medium">Role:</span> Sales Representative
                          </div>
                          <div>
                            <span className="font-medium">Join Date:</span> Feb 22, 2023
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-xs text-gray-500">Last active: 30 minutes ago</span>
                          <button className="text-blue-600 hover:text-blue-800 font-medium">View Profile →</button>
                        </div>
                      </div>
                      </div>

                      {/* User 3 */}
                      <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                              <span className="text-purple-600 font-bold">MC</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">Michael Chen</h3>
                              <p className="text-sm text-gray-600">CRM Administrator</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                            <span className="text-sm text-gray-500">⭐ 4.8 Rating</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Email:</span> michael.chen@example.com
                          </div>
                          <div>
                            <span className="font-medium">Role:</span> CRM Administrator
                          </div>
                          <div>
                            <span className="font-medium">Join Date:</span> Mar 10, 2023
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-xs text-gray-500">Last active: 1 day ago</span>
                          <button className="text-blue-600 hover:text-blue-800 font-medium">View Profile →</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Suspense>
          </div>
      </div>
    </div>
  );
}
