import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  bodyClassName?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, bodyClassName }) => {
  return (
    <div className={`bg-lightcard dark:bg-darkcard rounded-2xl shadow-light dark:shadow-dark overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-1 ${className}`}>
      {title && (
        <div className="p-4 border-b border-slate-200 dark:border-white/10">
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