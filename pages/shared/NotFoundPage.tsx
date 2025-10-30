import React from 'react';
import { Link } from 'react-router-dom';
import { Car, AlertTriangle } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-lightbg dark:bg-darkbg flex flex-col justify-center items-center text-center py-12 sm:px-6 lg:px-8">
      <AlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
      <h1 className="text-6xl font-extrabold text-primary">404</h1>
      <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Page Not Found</h2>
      <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
        Sorry, we couldn’t find the page you’re looking for.
      </p>
      <div className="mt-6">
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-all duration-300"
        >
          <Car className="mr-2 -ml-1 h-5 w-5" />
          Go back home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;