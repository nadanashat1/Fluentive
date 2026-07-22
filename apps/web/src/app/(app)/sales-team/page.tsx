'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { SidebarNav } from '@/components/sidebar/SidebarNav';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarFooter } from '@/components/sidebar/SidebarFooter';
import { apiService } from '@/services/apiService';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'sales_rep' | 'sales_manager' | 'team_lead' | 'sales_director';
  department: string;
  status: 'active' | 'inactive' | 'on_leave';
  performance: {
    leadsConverted: number;
    dealsClosed: number;
    revenue: number;
    conversionRate: number;
  };
  contact: {
    phone: string;
    extension?: string;
  };
  manager?: string;
  teamMembers?: string[];
}

export default function SalesTeamPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  // Fetch sales team members from backend
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        const response = await apiService.getSalesTeam();
        if (response.success && response.data) {
          setTeamMembers(response.data);
        }
      } catch (error) {
        console.error('Error fetching sales team:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, [searchTerm]);

  const handleAddTeamMember = async (memberData: any) => {
    try {
      const response = await apiService.createTeamMember(memberData);
      if (response.success && response.data) {
        setTeamMembers(prev => [...prev, response.data]);
      }
    } catch (error) {
      console.error('Error adding team member:', error);
    }
  };

  const handleDeleteTeamMember = async (memberId: string) => {
    try {
      await apiService.deleteTeamMember(memberId);
      setTeamMembers(prev => prev.filter(member => member.id !== memberId));
    } catch (error) {
      console.error('Error deleting team member:', error);
    }
  };

  const filteredTeamMembers = teamMembers.filter(member => {
    if (selectedRole === 'all') return true;
    return member.role === selectedRole;
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
              <h1 className="text-3xl font-bold text-gray-900">Sales Team</h1>
              <p className="mt-2 text-gray-600">
                Manage your sales team members and track their performance
              </p>
            </div>

            {/* Sales Team Content */}
            <Suspense fallback={<div>Loading sales team...</div>}>
              <div className="space-y-8">
                {/* Team Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">{teamMembers.length}</div>
                      <div className="text-sm text-gray-600">Team Members</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">${teamMembers.length > 0 ? (teamMembers.reduce((sum, m) => sum + m.performance.revenue, 0) / 1000000).toFixed(1) + 'M' : '0M'}</div>
                      <div className="text-sm text-gray-600">Monthly Revenue</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">{teamMembers.reduce((sum, m) => sum + m.performance.dealsClosed, 0)}</div>
                      <div className="text-sm text-gray-600">Deals Closed</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">{teamMembers.length > 0 ? (teamMembers.reduce((sum, m) => sum + m.performance.conversionRate, 0) / teamMembers.length).toFixed(0) : '0'}%</div>
                      <div className="text-sm text-gray-600">Avg Conversion Rate</div>
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
                      <div className="flex space-x-3">
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Roles</option>
                          <option value="sales_rep">Sales Rep</option>
                          <option value="sales_manager">Sales Manager</option>
                          <option value="team_lead">Team Lead</option>
                          <option value="sales_director">Sales Director</option>
                        </select>
                        <button 
                          onClick={handleAddTeamMember}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Add Team Member
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                      ) : filteredTeamMembers.map((member) => (
                        <div key={member.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                                member.status === 'active' ? 'bg-green-100' : 
                                member.status === 'inactive' ? 'bg-gray-100' : 'bg-yellow-100'
                              }`}>
                                <span className={`font-bold ${
                                  member.status === 'active' ? 'text-green-600' : 
                                  member.status === 'inactive' ? 'text-gray-600' : 'text-yellow-600'
                                }`}>
                                  {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">{member.name}</h3>
                                <p className="text-sm text-gray-600">{member.role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                member.status === 'active' ? 'bg-green-100 text-green-800' : 
                                member.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>{member.status.replace('_', ' ')}</span>
                              <span className="text-sm text-gray-500">⭐ {member.performance ? member.performance.conversionRate.toFixed(1) : '0.0'}%</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Deals:</span> {member.performance ? `${member.performance.dealsClosed} Closed, ${member.performance.leadsConverted} Active` : '0 Closed, 0 Active'}
                            </div>
                            <div>
                              <span className="font-medium">Revenue:</span> ${member.performance ? `$${(member.performance.revenue / 1000).toFixed(1)}K` : '$0K'}
                            </div>
                            <div>
                              <span className="font-medium">Department:</span> {member.department}
                            </div>
                            <div>
                              <span className="font-medium">Contact:</span> {member.contact.phone}
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <span className="text-xs text-gray-500">Manager: {member.manager || 'N/A'}</span>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => console.log('Edit team member:', member.id)}
                                className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteTeamMember(member.id)}
                                className="text-red-600 hover:text-red-800 font-medium text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
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
