'use client';

import Link from 'next/link';
import { FiHome, FiAlertTriangle } from 'react-icons/fi';

export default function NotFound() {
  console.log('NotFound page rendered');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-4 rounded-full">
            <FiAlertTriangle className="h-12 w-12 text-red-600" />
          </div>
        </div>
        <h1 className="text-6xl font-extrabold text-primary-600 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-flex items-center justify-center w-full px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-lg"
          >
            <FiHome className="mr-2 -ml-1 h-5 w-5" />
            Return Home
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center w-full px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
