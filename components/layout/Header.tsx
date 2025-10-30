
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, Menu, UserCircle } from 'lucide-react';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center">
        <button onClick={onMenuClick} className="text-slate-500 dark:text-slate-400 focus:outline-none lg:hidden">
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-slate-100 ml-2 md:ml-4">{title}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <button onClick={toggleTheme} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-500">
          {theme === 'light' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
        </button>
        <Link to="/profile" className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-500">
          <UserCircle className="h-8 w-8" />
          <span className="hidden md:inline">{user?.name}</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;