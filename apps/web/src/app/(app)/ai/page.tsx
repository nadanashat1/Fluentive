'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { SidebarNav } from '@/components/sidebar/SidebarNav';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarFooter } from '@/components/sidebar/SidebarFooter';
import { apiService } from '@/services/apiService';

interface AIModel {
  id: string;
  name: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'multimodal';
  status: 'active' | 'training' | 'error' | 'inactive';
  accuracy: number;
  lastTrained: string;
  description: string;
  parameters: {
    layers: number;
    neurons: number;
    trainingTime: string;
  };
}

export default function AIPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Fetch AI models from backend
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const response = await apiService.getAIModels();
        if (response.success && response.data) {
          setModels(response.data);
        }
      } catch (error) {
        console.error('Error fetching AI models:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [searchTerm]);

  const handleTrainModel = async (modelId: string) => {
    try {
      const response = await apiService.trainAIModel(modelId);
      if (response.success) {
        // Update model status
        setModels(prev => prev.map(model => 
          model.id === modelId ? {...model, status: 'training'} : model
        ));
      }
    } catch (error) {
      console.error('Error training model:', error);
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    try {
      await apiService.deleteAIModel(modelId);
      setModels(prev => prev.filter(model => model.id !== modelId));
    } catch (error) {
      console.error('Error deleting model:', error);
    }
  };

  const filteredModels = models.filter(model => {
    if (selectedType === 'all') return true;
    return model.type === selectedType;
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
              <h1 className="text-3xl font-bold text-gray-900">AI & Machine Learning</h1>
              <p className="mt-2 text-gray-600">
                Manage and monitor your AI models and machine learning workflows
              </p>
            </div>

            {/* AI Features */}
            <Suspense fallback={<div>Loading AI features...</div>}>
              <div className="space-y-8">
                {/* AI Model Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">{models.length}</div>
                      <div className="text-sm text-gray-600">Total Models</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">{models.filter(m => m.status === 'active').length}</div>
                      <div className="text-sm text-gray-600">Active Models</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">{models.filter(m => m.status === 'training').length}</div>
                      <div className="text-sm text-gray-600">Training</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">{models.length > 0 ? Math.round((models.filter(m => m.status === 'active').length / models.length) * 100) : 0}%</div>
                      <div className="text-sm text-gray-600">Success Rate</div>
                    </div>
                  </div>
                </div>

                {/* AI Model Management */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">AI Model Management</h2>
                      <div className="flex space-x-3">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          Create Model
                        </button>
                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                          Import Model
                        </button>
                        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                          Export Models
                        </button>
                      </div>
                    </div>
                    
                    {/* Model List */}
                    <div className="space-y-6">
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                      ) : filteredModels.map((model) => (
                        <div key={model.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                                  model.status === 'active' ? 'bg-green-100' : 
                                  model.status === 'training' ? 'bg-blue-100' : 
                                  model.status === 'error' ? 'bg-red-100' : 'bg-gray-100'
                                }`}>
                                  <svg className={`w-4 h-4 ${
                                    model.status === 'active' ? 'text-green-600' : 
                                    model.status === 'training' ? 'text-blue-600' : 
                                    model.status === 'error' ? 'text-red-600' : 'text-gray-600'
                                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="text-lg font-medium text-gray-900">{model.name}</h3>
                                  <p className="text-sm text-gray-600">{model.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  model.status === 'active' ? 'bg-green-100 text-green-800' : 
                                  model.status === 'training' ? 'bg-blue-100 text-blue-800' : 
                                  model.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                }`}>{model.status}</span>
                                <span className="text-sm text-gray-500">🎯 {model.accuracy}% Accuracy</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Type:</span> {model.type}
                              </div>
                              <div>
                                <span className="font-medium">Layers:</span> {model.parameters.layers}
                              </div>
                              <div>
                                <span className="font-medium">Neurons:</span> {model.parameters.neurons}
                              </div>
                              <div>
                                <span className="font-medium">Last Trained:</span> {model.lastTrained}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <span className="text-xs text-gray-500">Training time: {model.parameters.trainingTime}</span>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleTrainModel(model.id)}
                                disabled={model.status === 'training'}
                                className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                              >
                                {model.status === 'training' ? 'Training...' : 'Train'}
                              </button>
                              <button 
                                onClick={() => console.log('View model details:', model.id)}
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
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
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Lead Scoring</h2>
                      <p className="text-sm text-gray-600">AI-powered lead qualification</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Leads Analyzed Today</span>
                      <span className="text-2xl font-bold text-blue-600">247</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">High-Value Leads</span>
                      <span className="text-2xl font-bold text-green-600">89</span>
                    </div>
                    <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      View Lead Analysis
                    </button>
                  </div>
                </div>

                {/* Email Assistant */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Email Assistant</h2>
                      <p className="text-sm text-gray-600">AI-generated email templates</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Emails Sent</span>
                      <span className="text-2xl font-bold text-green-600">156</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Open Rate</span>
                      <span className="text-2xl font-bold text-purple-600">34%</span>
                    </div>
                    <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                      Create Email Template
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">AI Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">87%</div>
                    <div className="text-sm text-gray-600">Lead Conversion Prediction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">$45.2K</div>
                    <div className="text-sm text-gray-600">Estimated Deal Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">2.3x</div>
                    <div className="text-sm text-gray-600">ROI Improvement</div>
                  </div>
                </div>
              </div>

              {/* Recent AI Activities */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent AI Activities</h2>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          <span className="text-sm font-medium text-gray-900">Lead Analysis Completed</span>
                          <span className="text-xs text-gray-500 ml-2">5 minutes ago</span>
                        </div>
                        <p className="text-sm text-gray-600">AI analyzed 15 new leads and identified 8 high-priority prospects</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-sm font-medium text-gray-900">Email Template Generated</span>
                          <span className="text-xs text-gray-500 ml-2">1 hour ago</span>
                        </div>
                        <p className="text-sm text-gray-600">AI created personalized follow-up email for Microsoft Corp opportunity</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                          <span className="text-sm font-medium text-gray-900">Sales Forecast Updated</span>
                          <span className="text-xs text-gray-500 ml-2">3 hours ago</span>
                        </div>
                        <p className="text-sm text-gray-600">AI models predict 23% increase in Q3 sales based on current pipeline</p>
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
  );
}
