import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-black p-3 sm:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 max-w-md w-full text-center">
        <h2 className="text-xl sm:text-2xl font-semibold text-red-600 dark:text-red-400 mb-3 sm:mb-4">Page Not Found</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-5 sm:mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <Link 
          href="/" 
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-block"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
} 