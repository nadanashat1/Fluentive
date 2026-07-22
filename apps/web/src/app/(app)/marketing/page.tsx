'use client';

import { Suspense, useState, useEffect } from 'react';
import { SidebarNav } from '@/components/sidebar/SidebarNav';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarFooter } from '@/components/sidebar/SidebarFooter';
import { apiService } from '@/services/apiService';

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'social' | 'content' | 'paid' | 'display';
  status: 'active' | 'paused' | 'completed' | 'draft';
  budget: number;
  spent: number;
  roi: number;
  startDate: string;
  endDate: string;
  targetAudience: string;
  description: string;
}

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Fetch campaigns from backend
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const response = await apiService.getCampaigns();
        if (response.success && response.data) {
          setCampaigns(response.data);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [searchTerm]);

  const handleAddCampaign = async (campaignData: any) => {
    try {
      const response = await apiService.createCampaign(campaignData);
      if (response.success && response.data) {
        setCampaigns(prev => [...prev, response.data]);
      }
    } catch (error) {
      console.error('Error adding campaign:', error);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await apiService.deleteCampaign(campaignId);
      setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (selectedType === 'all') return true;
    return campaign.type === selectedType;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <SidebarHeader />
        <nav className="mt-8">
          <SidebarNav />
        </nav>
        <SidebarFooter />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Marketing</h1>
              <p className="mt-2 text-gray-600">
                Manage your marketing campaigns and analytics
              </p>
            </div>

            {/* Marketing Content */}
            <Suspense fallback={<div>Loading campaigns...</div>}>
              <div className="space-y-8">
                {/* Campaign Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">{campaigns.length}</div>
                      <div className="text-sm text-gray-600">Total Campaigns</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">{campaigns.filter(c => c.status === 'active').length}</div>
                      <div className="text-sm text-gray-600">Active Campaigns</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">{campaigns.filter(c => c.status === 'completed').length}</div>
                      <div className="text-sm text-gray-600">Completed Campaigns</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">{campaigns.length > 0 ? Math.round((campaigns.filter(c => c.status === 'active').length / campaigns.length) * 100) : 0}%</div>
                      <div className="text-sm text-gray-600">Success Rate</div>
                    </div>
                  </div>
                </div>

                {/* Campaign Management */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Campaign Management</h2>
                      <div className="flex space-x-3">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          Create Campaign
                        </button>
                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                          Import Campaigns
                        </button>
                        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                          Export Campaigns
                        </button>
                      </div>
                    </div>
                    
                    {/* Campaign List */}
                    <div className="space-y-6">
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                      ) : filteredCampaigns.map((campaign) => (
                        <div key={campaign.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                                  campaign.status === 'active' ? 'bg-green-100' : 
                                  campaign.status === 'completed' ? 'bg-blue-100' : 
                                  campaign.status === 'paused' ? 'bg-yellow-100' : 'bg-gray-100'
                                }`}>
                                  <svg className={`w-4 h-4 ${
                                    campaign.status === 'active' ? 'text-green-600' : 
                                    campaign.status === 'completed' ? 'text-blue-600' : 
                                    campaign.status === 'paused' ? 'text-yellow-600' : 'text-gray-600'
                                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 00-4-4H4a4 4 0 00-4 4v8a4 4 0 004 4h2a4 4 0 004 4m0 0V9a4 4 0 012-4h2a4 4 0 012 4v10m-6 0a4 4 0 004 4h2a4 4 0 004 4m0 0V5a4 4 0 012-4h2a4 4 0 012 4v14a4 4 0 01-4 4h-2a4 4 0 01-4z" />
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="text-lg font-medium text-gray-900">{campaign.name}</h3>
                                  <p className="text-sm text-gray-600">{campaign.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  campaign.status === 'active' ? 'bg-green-100 text-green-800' : 
                                  campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                                  campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                }`}>{campaign.status}</span>
                                <span className="text-sm text-gray-500">📊 {campaign.roi}% ROI</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Type:</span> {campaign.type}
                              </div>
                              <div>
                                <span className="font-medium">Budget:</span> ${campaign.budget.toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium">Spent:</span> ${campaign.spent.toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium">Duration:</span> {campaign.startDate} - {campaign.endDate}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <span className="text-xs text-gray-500">Created: {campaign.startDate}</span>
                            <button 
                              onClick={() => console.log('View campaign details:', campaign.id)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View Details →
                            </button>
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

            {/* Marketing Dashboard */}
            <Suspense fallback={<div>Loading marketing dashboard...</div>}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Campaign Stats Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Campaigns</span>
                      <span className="text-2xl font-bold text-blue-600">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Leads</span>
                      <span className="text-2xl font-bold text-green-600">847</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Conversion Rate</span>
                      <span className="text-2xl font-bold text-purple-600">3.2%</span>
                    </div>
                  </div>
                </div>

                {/* Recent Campaigns Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Campaigns</h2>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900">Summer Sale 2024</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Active</span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        Promote summer collection with 25% discount campaign
                      </p>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Started: June 1, 2024</span>
                        <span>Leads: 234</span>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900">Email Newsletter</h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Completed</span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        Monthly newsletter to existing subscribers
                      </p>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Started: May 15, 2024</span>
                        <span>Leads: 156</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Create New Campaign
                    </button>
                    <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                      View Analytics
                    </button>
                    <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                      Email Templates
                    </button>
                  </div>
                </div>
              </div>

              {/* Marketing Analytics */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Marketing Analytics</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Traffic Sources</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Organic Search</span>
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{width: '65%'}}></div>
                          </div>
                          <span className="ml-2 text-sm font-medium">65%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Social Media</span>
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{width: '25%'}}></div>
                          </div>
                          <span className="ml-2 text-sm font-medium">25%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Email Marketing</span>
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full" style={{width: '10%'}}></div>
                          </div>
                          <span className="ml-2 text-sm font-medium">10%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Performance</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-3xl font-bold text-blue-600">24.5%</div>
                          <div className="text-sm text-gray-600">Open Rate</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-green-600">18.2%</div>
                          <div className="text-sm text-gray-600">Click-Through Rate</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-3xl font-bold text-purple-600">2.3%</div>
                          <div className="text-sm text-gray-600">Conversion Rate</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-orange-600">$45.20</div>
                          <div className="text-sm text-gray-600">Cost Per Lead</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
