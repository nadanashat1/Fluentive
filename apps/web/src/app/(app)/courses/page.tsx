'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { SidebarNav } from '@/components/sidebar/SidebarNav';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarFooter } from '@/components/sidebar/SidebarFooter';
import { apiService } from '@/services/apiService';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived';
  enrolledCount: number;
  rating: number;
  price: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export default function CoursesPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');

  // Fetch courses from backend
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await apiService.getCourses();
        if (response.success && response.data) {
          setCourses(response.data);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [searchTerm]);

  const handleAddCourse = async (courseData: any) => {
    try {
      const response = await apiService.createCourse(courseData);
      if (response.success && response.data) {
        setCourses(prev => [...prev, response.data]);
      }
    } catch (error) {
      console.error('Error adding course:', error);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await apiService.deleteCourse(courseId);
      setCourses(prev => prev.filter(course => course.id !== courseId));
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  const filteredCourses = courses.filter(course => {
    if (selectedLevel === 'all') return true;
    return course.level === selectedLevel;
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
              <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
              <p className="mt-2 text-gray-600">
                Manage and deliver educational content to your users
              </p>
            </div>

            {/* Courses Content */}
            <Suspense fallback={<div>Loading courses...</div>}>
              <div className="space-y-8">
                {/* Course Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">{courses.length}</div>
                      <div className="text-sm text-gray-600">Total Courses</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">{courses.filter(c => c.status === 'published').length}</div>
                      <div className="text-sm text-gray-600">Published</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">{courses.reduce((sum, c) => sum + c.enrolledCount, 0)}</div>
                      <div className="text-sm text-gray-600">Total Students</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">{courses.length > 0 ? (courses.reduce((sum, c) => sum + c.rating, 0) / courses.length).toFixed(1) : 0}</div>
                      <div className="text-sm text-gray-600">Avg Rating</div>
                    </div>
                  </div>
                </div>

                {/* Course List */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Course Management</h2>
                      <div className="flex space-x-3">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          Create Course
                        </button>
                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                          Import Courses
                        </button>
                        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                          Export Courses
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                      ) : filteredCourses.map((course) => (
                        <div key={course.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                                  course.status === 'published' ? 'bg-green-100' : 
                                  course.status === 'draft' ? 'bg-yellow-100' : 'bg-gray-100'
                                }`}>
                                  <svg className={`w-4 h-4 ${
                                    course.status === 'published' ? 'text-green-600' : 
                                    course.status === 'draft' ? 'text-yellow-600' : 'text-gray-600'
                                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="text-lg font-medium text-gray-900">{course.title}</h3>
                                  <div className="flex items-center text-sm text-gray-600">
                                    <span className="mr-4">Duration: {course.duration}</span>
                                    <span className="mr-4">Level: {course.level}</span>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      course.status === 'published' ? 'bg-green-100 text-green-800' : 
                                      course.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                    }`}>{course.status}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 mb-3">
                                {course.description}
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-4">
                                  <span className="text-gray-500">{course.enrolledCount} students enrolled</span>
                                  <span className="text-gray-500">⭐ {course.rating}</span>
                                  <span className="text-gray-500">${course.price}</span>
                                </div>
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={() => console.log('Edit course:', course.id)}
                                    className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => console.log('View course details:', course.id)}
                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                  >
                                    View Details →
                                  </button>
                                </div>
                              </div>
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
