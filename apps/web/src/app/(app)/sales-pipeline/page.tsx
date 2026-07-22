'use client';

import { Suspense, useRef } from 'react';
import { SidebarNav } from '@/components/sidebar/SidebarNav';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarFooter } from '@/components/sidebar/SidebarFooter';

export default function SalesPipelinePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
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
              <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
              <p className="mt-2 text-gray-600">
                Track and manage your sales pipeline from lead to close
              </p>
            </div>

            {/* Sales Pipeline Content */}
            <Suspense fallback={<div>Loading sales pipeline...</div>}>
              <div className="space-y-8">
                {/* Pipeline Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">89</div>
                      <div className="text-sm text-gray-600">Total Deals</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">34</div>
                      <div className="text-sm text-gray-600">Active Deals</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">$2.1M</div>
                      <div className="text-sm text-gray-600">Pipeline Value</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">18.5%</div>
                      <div className="text-sm text-gray-600">Win Rate</div>
                    </div>
                  </div>
                </div>

                {/* Pipeline Stages */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Pipeline Stages</h2>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Add New Deal
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Stage 1: Lead */}
                      <div className="border-l-4 border-blue-500 pl-4 pb-6">
                        <div className="flex items-center mb-4">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-bold text-sm">1</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">Lead</h3>
                            <p className="text-sm text-gray-600">Initial contact made, lead qualified</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">5 deals • Avg $45K</div>
                      </div>

                      {/* Stage 2: Qualified */}
                      <div className="border-l-4 border-green-500 pl-4 pb-6">
                        <div className="flex items-center mb-4">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-green-600 font-bold text-sm">2</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">Qualified</h3>
                            <p className="text-sm text-gray-600">Needs analysis, budget approved</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">3 deals • Avg $125K</div>
                      </div>

                      {/* Stage 3: Proposal */}
                      <div className="border-l-4 border-yellow-500 pl-4 pb-6">
                        <div className="flex items-center mb-4">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-yellow-600 font-bold text-sm">3</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">Proposal</h3>
                            <p className="text-sm text-gray-600">Proposal sent, under review</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">2 deals • Avg $85K</div>
                      </div>

                      {/* Stage 4: Negotiation */}
                      <div className="border-l-4 border-orange-500 pl-4 pb-6">
                        <div className="flex items-center mb-4">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-orange-600 font-bold text-sm">4</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">Negotiation</h3>
                            <p className="text-sm text-gray-600">Terms being discussed</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">1 deal • Avg $150K</div>
                      </div>

                      {/* Stage 5: Closed Won */}
                      <div className="border-l-4 border-purple-500 pl-4 pb-6">
                        <div className="flex items-center mb-4">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-purple-600 font-bold text-sm">5</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">Closed Won</h3>
                            <p className="text-sm text-gray-600">Deal successfully closed</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">2 deals • Avg $200K</div>
                      </div>

                      {/* Stage 6: Closed Lost */}
                      <div className="border-l-4 border-red-500 pl-4 pb-6">
                        <div className="flex items-center mb-4">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-red-600 font-bold text-sm">6</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">Closed Lost</h3>
                            <p className="text-sm text-gray-600">Deal was lost to competitor</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">1 deal • Avg $0</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Deals */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Recent Deals</h2>
                      <div className="flex space-x-3">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          Create Deal
                        </button>
                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                          Export Pipeline
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Deal 1 */}
                      <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                              <span className="text-green-600 font-bold">W</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">Microsoft Corp</h3>
                              <p className="text-sm text-gray-600">Enterprise software license - $250,000</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Won</span>
                            <span className="text-sm text-gray-500">⭐ 4.9 Rating</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Stage:</span> Closed Won
                          </div>
                          <div>
                            <span className="font-medium">Value:</span> $250,000
                          </div>
                          <div>
                            <span className="font-medium">Close Date:</span> May 15, 2024
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-xs text-gray-500">Closed 2 weeks ago</span>
                          <button className="text-blue-600 hover:text-blue-800 font-medium">View Details →</button>
                        </div>
                      </div>
                      </div>

                      {/* Deal 2 */}
                      <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4">
                              <span className="text-red-600 font-bold">L</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">Tech Solutions Inc.</h3>
                              <p className="text-sm text-gray-600">IT infrastructure project - $180,000</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Lost</span>
                            <span className="text-sm text-gray-500">⭐ 3.2 Rating</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Stage:</span> Closed Lost
                          </div>
                          <div>
                            <span className="font-medium">Value:</span> $0
                          </div>
                          <div>
                            <span className="font-medium">Close Date:</span> May 10, 2024
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-xs text-gray-500">Closed 1 week ago</span>
                          <button className="text-blue-600 hover:text-blue-800 font-medium">View Details →</button>
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
