// Loading skeleton components for better UX
// Provides visual feedback during data loading

import React from 'react';

// Base skeleton component
const Skeleton = ({ 
  className = '', 
  children 
}: { 
  className?: string; 
  children?: React.ReactNode;
}) => (
  <div 
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    role="status"
    aria-label="Loading"
  >
    {children}
  </div>
);

// Text skeleton
export const SkeletonText = ({ 
  lines = 1, 
  className = '' 
}: { 
  lines?: number; 
  className?: string;
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton 
        key={i} 
        className="h-4 w-full" 
      />
    ))}
  </div>
);

// Card skeleton
export const SkeletonCard = ({ className = '' }: { className?: string }) => (
  <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
    <div className="space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <SkeletonText lines={2} />
    </div>
  </div>
);

// Table skeleton
export const SkeletonTable = ({ 
  rows = 5, 
  columns = 4 
}: { 
  rows?: number; 
  columns?: number;
}) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-3 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                  <Skeleton className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Dashboard stats skeleton
export const SkeletonDashboardStats = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-gray-200 rounded-full p-3">
            <Skeleton className="h-6 w-6" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Lead list skeleton
export const SkeletonLeadList = ({ count = 5 }: { count?: number }) => (
  <div className="bg-white shadow overflow-hidden rounded-lg">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: count }).map((_, i) => (
            <tr key={i}>
              <td className="px-6 py-4 whitespace-nowrap">
                <Skeleton className="h-5 w-32" />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Skeleton className="h-5 w-40" />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Skeleton className="h-6 w-20 rounded-full" />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Skeleton className="h-5 w-24" />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Skeleton className="h-8 w-20 ml-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Form skeleton
export const SkeletonForm = ({ fields = 5 }: { fields?: number }) => (
  <div className="bg-white shadow rounded-lg p-6">
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end space-x-3">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  </div>
);

// Loading spinner component
export const LoadingSpinner = ({ 
  size = 'md', 
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div 
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
};

// Page loading skeleton
export const SkeletonPage = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        {/* Dashboard stats skeleton */}
        <SkeletonDashboardStats />
        
        {/* Recent activity skeleton */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
