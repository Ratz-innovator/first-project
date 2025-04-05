'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAppById } from '@/utils/storage';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function ViewApp({ params }: { params: { id: string } }) {
  const [app, setApp] = useState<{
    id: string;
    prompt: string;
    code: string;
    createdAt: number;
  } | null>(null);
  
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get app from localStorage
    const appData = getAppById(params.id);
    
    if (appData) {
      setApp(appData);
      // Create blob URL for iframe
      const blob = new Blob([appData.code], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
    } else {
      setError('App not found');
    }

    return () => {
      // Cleanup blob URL
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [params.id, blobUrl]);

  const handleDownloadCode = async () => {
    if (!app) return;
    
    setIsDownloading(true);
    
    try {
      // Extract HTML, CSS, and JavaScript from the generated code
      let htmlContent = app.code;
      let cssContent = '';
      let jsContent = '';
      
      // Extract CSS
      const cssMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      if (cssMatch && cssMatch[1]) {
        cssContent = cssMatch[1].trim();
        // Replace the style tag with a link to the CSS file
        htmlContent = htmlContent.replace(/<style[^>]*>[\s\S]*?<\/style>/i, 
          '<link rel="stylesheet" href="style.css">');
      }
      
      // Extract JavaScript
      const jsMatch = htmlContent.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      if (jsMatch && jsMatch[1]) {
        jsContent = jsMatch[1].trim();
        // Replace the script tag with a reference to the JS file
        htmlContent = htmlContent.replace(/<script[^>]*>[\s\S]*?<\/script>/i, 
          '<script src="script.js"></script>');
      }
      
      // Create a zip file
      const zip = new JSZip();
      
      // Add files to the zip
      zip.file("index.html", htmlContent);
      if (cssContent) zip.file("style.css", cssContent);
      if (jsContent) zip.file("script.js", jsContent);
      
      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });
      
      // Download the zip file
      saveAs(zipBlob, "web-app.zip");
    } catch (err) {
      console.error("Error creating zip file:", err);
      setError("Failed to create download file");
    } finally {
      setIsDownloading(false);
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-black p-3 sm:p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 max-w-md w-full text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-red-600 dark:text-red-400 mb-3 sm:mb-4">Error</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-5 sm:mb-6">{error}</p>
          <Link 
            href="/gallery" 
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-block"
          >
            Return to Gallery
          </Link>
        </div>
      </div>
    );
  }

  if (!app || !blobUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-black">
        <div className="animate-spin h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-black">
      <header className="bg-white dark:bg-gray-800 shadow-md px-3 sm:px-6 py-3 z-10">
        <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center">
            <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-1 sm:mb-0 line-clamp-1">
              {app.prompt}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Created: {formatDate(app.createdAt)}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleDownloadCode}
              disabled={isDownloading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70"
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download ZIP
                </>
              )}
            </button>
            <Link 
              href={`/?id=${app.id}`}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Remix
            </Link>
            <Link 
              href="/gallery"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors"
            >
              Back to Gallery
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        <iframe
          src={blobUrl}
          title={`Preview of ${app.prompt}`}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-forms allow-same-origin"
          loading="lazy"
        />
      </main>
    </div>
  );
} 