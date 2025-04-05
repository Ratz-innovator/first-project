'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Link from 'next/link';
import { saveApp, getAppById } from '@/utils/storage';

export default function Home() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [updatePrompt, setUpdatePrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isRemixed, setIsRemixed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const promptInputRef = useRef<HTMLInputElement>(null);
  const updateInputRef = useRef<HTMLInputElement>(null);

  // Check for id parameter on load for remixing
  useEffect(() => {
    const id = searchParams?.get('id');
    if (id) {
      const app = getAppById(id);
      if (app) {
        setPrompt(app.prompt);
        setIsRemixed(true);
        // Focus input for editing
        promptInputRef.current?.focus();
      }
    }
  }, [searchParams]);

  // Clean up the blob URL when component unmounts or when code changes
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  // Create a blob URL when code is generated
  useEffect(() => {
    if (generatedCode) {
      // Revoke previous blob URL if it exists
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      
      // Create a new blob with the generated code
      const blob = new Blob([generatedCode], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
    }
  }, [generatedCode]);

  const handleGenerateApp = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setGeneratedCode(null);
    setBlobUrl(null);
    setError(null);
    setIsSaved(false);
    setIsRemixed(false);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate code');
      }
      
      setGeneratedCode(data.code);
      
      // Auto-save to localStorage
      saveApp(prompt, data.code);
      setIsSaved(true);
    } catch (err: unknown) {
      console.error('Error generating app:', err);
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateApp = async () => {
    if (!updatePrompt.trim() || !generatedCode) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          updatePrompt,
          currentCode: generatedCode
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update code');
      }
      
      setGeneratedCode(data.code);
      
      // Auto-save updated version to localStorage
      saveApp(`${prompt} (Updated: ${updatePrompt})`, data.code);
      setIsSaved(true);
      
      // Clear update prompt field
      setUpdatePrompt('');
    } catch (err: unknown) {
      console.error('Error updating app:', err);
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong while updating. Please try again.';
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadCode = async () => {
    if (!generatedCode) return;
    
    setIsDownloading(true);
    
    try {
      // Extract HTML, CSS, and JavaScript from the generated code
      let htmlContent = generatedCode;
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

  const handleRemix = () => {
    // Scroll to the input field
    promptInputRef.current?.focus();
    // Input is already populated with current prompt
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-3 sm:p-6 bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-black">
      <header className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-8 gap-3">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Prompt2App</h1>
        <Link 
          href="/gallery" 
          className="w-full sm:w-auto px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-800 dark:text-gray-200 text-center"
        >
          View Gallery
        </Link>
      </header>
      
      <main className="w-full max-w-5xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4 text-gray-800 dark:text-gray-100">
          Turn Your Prompt into a Web App
        </h1>
        
        <p className="text-lg sm:text-xl md:text-2xl mb-4 sm:mb-8 text-gray-600 dark:text-gray-300">
          Describe what you want, get code instantly
        </p>
        
        {isRemixed && (
          <div className="mb-4 sm:mb-6 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            You&apos;re remixing an existing app! Edit the prompt to make changes.
          </div>
        )}
        
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-8">
          <input
            ref={promptInputRef}
            type="text"
            placeholder="Describe your app idea..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
          />
          
          <button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105 disabled:opacity-70 disabled:hover:scale-100 disabled:hover:bg-blue-600"
            onClick={handleGenerateApp}
            disabled={isLoading || !prompt.trim()}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </div>
            ) : (
              isRemixed ? 'Regenerate App' : 'Generate App'
            )}
          </button>
        </div>
        
        {error && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {isSaved && (
          <div className="mt-3 sm:mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 text-green-600 dark:text-green-400 rounded-lg">
            App saved to gallery successfully!
          </div>
        )}
        
        {blobUrl && (
          <div className="mt-6 sm:mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden w-full">
            <div className="p-3 sm:p-4 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
              <h3 className="font-medium text-gray-700 dark:text-gray-200">Preview</h3>
              <div className="flex items-center w-full sm:w-auto justify-between sm:justify-normal space-x-4">
                <button
                  onClick={handleDownloadCode}
                  disabled={isDownloading || !generatedCode}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:hover:bg-green-600 w-full sm:w-auto justify-center"
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
                
                <button
                  onClick={handleRemix}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors w-full sm:w-auto justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Remix
                </button>
              </div>
            </div>
            
            <iframe
              src={blobUrl}
              className="w-full h-[500px] border-0"
              title="Generated App Preview"
              sandbox="allow-scripts"
            />
            
            {/* New chat-style update interface */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="mb-2 text-left">
                <h4 className="font-medium text-gray-700 dark:text-gray-200">Want to change something?</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Just describe what you want to change, and we&apos;ll update the app.
                </p>
              </div>
              
              <div className="flex gap-2">
                <input
                  ref={updateInputRef}
                  type="text"
                  placeholder="Add pastel colors, make the header larger, etc..."
                  className="flex-grow px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                  value={updatePrompt}
                  onChange={(e) => setUpdatePrompt(e.target.value)}
                  disabled={isUpdating || !generatedCode}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && updatePrompt.trim() && !isUpdating) {
                      handleUpdateApp();
                    }
                  }}
                />
                
                <button
                  onClick={handleUpdateApp}
                  disabled={isUpdating || !updatePrompt.trim() || !generatedCode}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center"
                >
                  {isUpdating ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    "Update"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="mt-8 sm:mt-12 text-center text-gray-600 dark:text-gray-400 text-sm">
        <p>Create and share web apps instantly with AI</p>
      </footer>
    </div>
  );
}
