
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
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center">
        <button onClick={onMenuClick} className="text-gray-500 dark:text-gray-400 focus:outline-none lg:hidden">
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200 ml-2 md:ml-4">{title}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <button onClick={toggleTheme} className="text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400">
          {theme === 'light' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
        </button>
        <Link to="/profile" className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400">
          <UserCircle className="h-8 w-8" />
          <span className="hidden md:inline">{user?.name}</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;
