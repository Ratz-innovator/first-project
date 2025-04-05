'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSavedApps, deleteApp, SavedApp } from '@/utils/storage';

export default function Gallery() {
  const [apps, setApps] = useState<SavedApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load apps from localStorage
    const loadApps = () => {
      const savedApps = getSavedApps();
      setApps(savedApps);
      setLoading(false);
    };

    loadApps();
  }, []);

  const handleDelete = (id: string) => {
    deleteApp(id);
    setApps(apps.filter(app => app.id !== id));
  };

  // Create blob URL for preview
  const createPreviewUrl = (code: string) => {
    const blob = new Blob([code], { type: 'text/html' });
    return URL.createObjectURL(blob);
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-black p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-10 gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">App Gallery</h1>
          <Link 
            href="/" 
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center"
          >
            Create New App
          </Link>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : apps.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-3 sm:mb-4">No apps yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-5 sm:mb-6">Generate your first app to see it here!</p>
            <Link 
              href="/" 
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-block"
            >
              Create Your First App
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {apps.map(app => (
              <div 
                key={app.id} 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col"
              >
                <div className="p-3 sm:p-4 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
                  <h3 className="font-medium text-gray-700 dark:text-gray-200 truncate max-w-[150px] sm:max-w-[200px]" title={app.prompt}>
                    {app.prompt.length > 30 ? `${app.prompt.substring(0, 30)}...` : app.prompt}
                  </h3>
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                
                <div className="relative h-36 sm:h-40 w-full overflow-hidden border-b border-gray-200 dark:border-gray-600">
                  <iframe
                    srcDoc={app.code}
                    className="w-full h-full scale-[0.7] origin-top-left"
                    sandbox="allow-scripts"
                    title={`Preview of ${app.prompt}`}
                  />
                </div>
                
                <div className="p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 flex-grow">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Created: {formatDate(app.createdAt)}
                  </p>
                  
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {app.prompt}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-2 mt-auto pt-2 sm:pt-3">
                    <Link 
                      href={`/view/${app.id}`}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors text-center"
                    >
                      Open
                    </Link>
                    <Link 
                      href={`/?id=${app.id}`}
                      className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded transition-colors text-center"
                    >
                      Remix
                    </Link>
                    <button 
                      onClick={() => handleDelete(app.id)}
                      className="sm:flex-none px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 