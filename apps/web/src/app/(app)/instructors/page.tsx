'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { SidebarNav } from '@/components/sidebar/SidebarNav';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarFooter } from '@/components/sidebar/SidebarFooter';
import { apiService } from '@/services/apiService';

interface Instructor {
  id: string;
  name: string;
  email: string;
  bio: string;
  expertise: string[];
  rating: number;
  coursesCount: number;
  studentsCount: number;
  status: 'active' | 'inactive' | 'on_leave';
  joinedAt: string;
  avatar?: string;
}

export default function InstructorsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch instructors from backend
  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        setLoading(true);
        const response = await apiService.getInstructors();
        if (response.success && response.data) {
          setInstructors(response.data);
        }
      } catch (error) {
        console.error('Error fetching instructors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructors();
  }, [searchTerm]);

  const handleAddInstructor = async (instructorData: any) => {
    try {
      const response = await apiService.createInstructor(instructorData);
      if (response.success && response.data) {
        setInstructors(prev => [...prev, response.data]);
      }
    } catch (error) {
      console.error('Error adding instructor:', error);
    }
  };

  const handleDeleteInstructor = async (instructorId: string) => {
    try {
      await apiService.deleteInstructor(instructorId);
      setInstructors(prev => prev.filter(instructor => instructor.id !== instructorId));
    } catch (error) {
      console.error('Error deleting instructor:', error);
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
              <h1 className="text-3xl font-bold text-gray-900">Instructors</h1>
              <p className="mt-2 text-gray-600">
                Manage your course instructors and their teaching assignments
              </p>
            </div>

            {/* Instructors Content */}
            <Suspense fallback={<div>Loading instructors...</div>}>
              <div className="space-y-8">
                {/* Instructor Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">{instructors.length}</div>
                      <div className="text-sm text-gray-600">Total Instructors</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">{instructors.filter(i => i.status === 'active').length}</div>
                      <div className="text-sm text-gray-600">Active Instructors</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">{instructors.reduce((sum, i) => sum + i.coursesCount, 0)}</div>
                      <div className="text-sm text-gray-600">Courses Assigned</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">{instructors.length > 0 ? (instructors.reduce((sum, i) => sum + i.rating, 0) / instructors.length).toFixed(1) : 0}</div>
                      <div className="text-sm text-gray-600">Avg. Rating</div>
                    </div>
                  </div>
                </div>

                {/* Instructors List */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Instructor Management</h2>
                      <div className="flex space-x-3">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          Add Instructor
                        </button>
                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                          Assign Course
                        </button>
                        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                          Export Data
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                      ) : instructors.map((instructor) => (
                        <div key={instructor.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                                instructor.status === 'active' ? 'bg-green-100' : 
                                instructor.status === 'inactive' ? 'bg-gray-100' : 'bg-yellow-100'
                              }`}>
                                <span className={`font-bold ${
                                  instructor.status === 'active' ? 'text-green-600' : 
                                  instructor.status === 'inactive' ? 'text-gray-600' : 'text-yellow-600'
                                }`}>
                                  {instructor.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">{instructor.name}</h3>
                                <p className="text-sm text-gray-600">{instructor.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                instructor.status === 'active' ? 'bg-green-100 text-green-800' : 
                                instructor.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>{instructor.status}</span>
                              <span className="text-sm text-gray-500">⭐ {instructor.rating}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Expertise:</span> {instructor.expertise.join(', ')}
                            </div>
                            <div>
                              <span className="font-medium">Courses:</span> {instructor.coursesCount} Active
                            </div>
                            <div>
                              <span className="font-medium">Students:</span> {instructor.studentsCount} Enrolled
                            </div>
                            <div>
                              <span className="font-medium">Joined:</span> {instructor.joinedAt}
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <span className="text-xs text-gray-500">Bio: {instructor.bio}</span>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => console.log('Edit instructor:', instructor.id)}
                                className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => console.log('View instructor profile:', instructor.id)}
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                              >
                                View Profile →
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
