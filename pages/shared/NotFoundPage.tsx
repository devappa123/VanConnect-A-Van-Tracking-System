
import React from 'react';
import { Link } from 'react-router-dom';
import { Car, AlertTriangle } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center text-center py-12 sm:px-6 lg:px-8">
      <AlertTriangle className="w-16 h-16 text-yellow-400 mb-4" />
      <h1 className="text-6xl font-extrabold text-blue-600">404</h1>
      <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Page Not Found</h2>
      <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
        Sorry, we couldn’t find the page you’re looking for.
      </p>
      <div className="mt-6">
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
        >
          <Car className="mr-2 -ml-1 h-5 w-5" />
          Go back home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;