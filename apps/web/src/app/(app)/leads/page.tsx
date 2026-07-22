'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { SidebarNav } from '@/components/sidebar/SidebarNav';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarFooter } from '@/components/sidebar/SidebarFooter';
import { apiService } from '@/services/apiService';
import { authService } from '@/services/authService';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  value: number;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'lost';
  lastContact: string;
  score: number;
  createdAt: string;
  assignedTo: string;
}

export default function LeadsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Fetch leads from backend
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const response = await apiService.getLeads();
        if (response.success && response.data) {
          setLeads(response.data);
        }
      } catch (error) {
        console.error('Error fetching leads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [searchTerm]);

  const handleAddLead = async (leadData: any) => {
    try {
      const response = await apiService.createLead(leadData);
      if (response.success && response.data) {
        setLeads(prev => [...prev, response.data]);
      }
    } catch (error) {
      console.error('Error adding lead:', error);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await apiService.deleteLead(leadId);
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (selectedStatus === 'all') return true;
    return lead.status === selectedStatus;
  });

  const handleAddLead = async (leadData: any) => {
    try {
      const response = await apiService.createLead(leadData);
      if (response.success && response.data) {
        setLeads(prev => [...prev, response.data]);
      }
    } catch (error) {
      console.error('Error adding lead:', error);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await apiService.deleteLead(leadId);
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const handleAddLead = async (leadData: any) => {
    try {
      const response = await apiService.createLead(leadData);
      if (response.success && response.data) {
        setLeads(prev => [...prev, response.data]);
      }
    } catch (error) {
      console.error('Error adding lead:', error);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await apiService.deleteLead(leadId);
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const handleAddLead = async (leadData: any) => {
    try {
      const response = await apiService.createLead(leadData);
      if (response.success && response.data) {
        setLeads(prev => [...prev, response.data]);
      }
    } catch (error) {
      console.error('Error adding lead:', error);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await apiService.deleteLead(leadId);
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };
  
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
        <SidebarFooter 
          collapsed={false}
          isOnline={true}
          isNavigating={false}
          onLogout={async () => {}}
          onNavigationStart={async () => {}}
          onIndicatorChange={() => {}}
          containerRef={containerRef}
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
              <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
              <p className="mt-2 text-gray-600">
                Manage and track your sales leads through the entire pipeline
              </p>
            </div>

            {/* Leads Content */}
            <Suspense fallback={<div>Loading leads...</div>}>
              <div className="space-y-8">
                {/* Lead Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">{leads.length}</div>
                      <div className="text-sm text-gray-600">Total Leads</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">{leads.filter(l => l.status === 'qualified').length}</div>
                      <div className="text-sm text-gray-600">Qualified Leads</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">{leads.filter(l => l.status === 'new').length}</div>
                      <div className="text-sm text-gray-600">New This Month</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">{leads.length > 0 ? Math.round((leads.filter(l => l.status === 'qualified').length / leads.length) * 100) : 0}%</div>
                      <div className="text-sm text-gray-600">Conversion Rate</div>
                    </div>
                  </div>
                </div>

                {/* Lead Management */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Lead Management</h2>
                      <div className="flex space-x-3">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          Add New Lead
                        </button>
                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                          Import Leads
                        </button>
                        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                          Export Leads
                        </button>
                      </div>
                    </div>
                    
                    {/* Lead List */}
                    <div className="space-y-6">
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                      ) : filteredLeads.map((lead) => (
                        <div key={lead.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                                  lead.status === 'qualified' ? 'bg-green-100' : 
                                  lead.status === 'contacted' ? 'bg-yellow-100' : 
                                  lead.status === 'new' ? 'bg-blue-100' : 'bg-gray-100'
                                }`}>
                                  <svg className={`w-4 h-4 ${
                                    lead.status === 'qualified' ? 'text-green-600' : 
                                    lead.status === 'contacted' ? 'text-yellow-600' : 
                                    lead.status === 'new' ? 'text-blue-600' : 'text-gray-600'
                                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 00-4-4H4a4 4 0 00-4 4v8a4 4 0 004 4h2a4 4 0 004 4m0 0V9a4 4 0 012-4h2a4 4 0 012 4v10m-6 0a4 4 0 004 4h2a4 4 0 004 4m0 0V5a4 4 0 012-4h2a4 4 0 012 4v14a4 4 0 01-4 4h-2a4 4 0 01-4z" />
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="text-lg font-medium text-gray-900">{lead.name}</h3>
                                  <p className="text-sm text-gray-600">{lead.company}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  lead.status === 'qualified' ? 'bg-green-100 text-green-800' : 
                                  lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' : 
                                  lead.status === 'new' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                }`}>{lead.status}</span>
                                <span className="text-sm text-gray-500">⭐ {lead.score}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Email:</span> {lead.email}
                              </div>
                              <div>
                                <span className="font-medium">Phone:</span> {lead.phone}
                              </div>
                              <div>
                                <span className="font-medium">Value:</span> ${lead.value.toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium">Source:</span> {lead.source}
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-4">
                              <span className="text-xs text-gray-500">Last contact: {lead.lastContact}</span>
                              <button 
                                onClick={() => console.log('View lead details:', lead.id)}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                View Details →
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
    </div>
  );
}
