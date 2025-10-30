
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  bodyClassName?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, bodyClassName }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-lg ${className}`}>
      {title && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        </div>
      )}
      <div className={bodyClassName || "p-4 md:p-6"}>
        {children}
      </div>
    </div>
  );
};

export default Card;