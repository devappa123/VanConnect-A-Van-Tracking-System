import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { UserRole } from '../../types';
import { LayoutDashboard, User, MessageSquareWarning, LogOut, Car, Users, MessageSquare, Link2, Settings, BarChart2, ChevronLeft, Moon, Sun, Search } from 'lucide-react';

interface SidebarProps {
  role: UserRole;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

const studentLinks = [
  { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/complaints', icon: MessageSquareWarning, label: 'Complaints' },
];

const driverLinks = [
  { to: '/driver/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/driver/message', icon: MessageSquare, label: 'Send Message' },
];

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/dashboard?tab=vans', icon: Car, label: 'Vans' },
  { to: '/admin/dashboard?tab=drivers', icon: User, label: 'Drivers' },
  { to: '/admin/dashboard?tab=students', icon: Users, label: 'Students' },
  { to: '/admin/dashboard?tab=complaints', icon: MessageSquareWarning, label: 'Complaints' },
  { to: '/admin/dashboard?tab=reports', icon: BarChart2, label: 'Reports' },
  { to: '/profile', icon: Settings, label: 'Settings' },
];

const getLinksByRole = (role: UserRole) => {
  switch (role) {
    case UserRole.STUDENT: return studentLinks;
    case UserRole.DRIVER: return driverLinks;
    case UserRole.ADMIN: return adminLinks;
    default: return [];
  }
};

const Sidebar: React.FC<SidebarProps> = ({ role, isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed }) => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const links = getLinksByRole(role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClasses = `flex items-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all duration-200`;
  const activeNavLinkClasses = `!text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md`;
  
  const linkPadding = isCollapsed ? "px-3 py-3 justify-center" : "px-4 py-3";
  const iconMargin = isCollapsed ? "mx-auto" : "mr-4";
  const labelOpacity = isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto";

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-60 z-40 lg:hidden transition-opacity ${
          isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileOpen(false)}
      ></div>
      <aside
        className={`fixed lg:relative inset-y-0 left-0 bg-white dark:bg-slate-800 flex flex-col z-50 transition-all duration-300 ease-in-out border-r border-slate-200 dark:border-slate-700
        ${isCollapsed ? 'w-20' : 'w-72'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className={`flex items-center border-b border-slate-200 dark:border-slate-700 transition-all duration-300 ${isCollapsed ? 'h-20 justify-center' : 'h-20 px-6'}`}>
          <Car className={`w-8 h-8 text-blue-600 dark:text-blue-500 transition-all duration-300 flex-shrink-0 ${isCollapsed ? 'scale-110' : ''}`} />
          <div className={`ml-3 overflow-hidden transition-all duration-200 ${isCollapsed ? 'w-0' : 'w-auto'}`}>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white whitespace-nowrap">VanConnect</h1>
            <p className="text-xs text-slate-500 whitespace-nowrap">EPCET</p>
          </div>
        </div>
        
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:flex items-center justify-center absolute -right-3 top-24 w-6 h-6 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all duration-300">
           <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed && 'rotate-180'}`}/>
        </button>

        <nav className="flex-1 p-3 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={!link.to.includes('?')}
              className={({ isActive }) => `${navLinkClasses} ${linkPadding} ${isActive ? activeNavLinkClasses : ''}`}
              onClick={() => isMobileOpen && setIsMobileOpen(false)}
              title={isCollapsed ? link.label : ''}
            >
              <link.icon className={`h-6 w-6 flex-shrink-0 ${iconMargin}`} />
              <span className={`whitespace-nowrap transition-opacity duration-200 ${labelOpacity}`}>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
           <div className={`relative flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
             <button onClick={toggleTheme} className={`flex items-center w-full rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${isCollapsed ? 'p-3' : 'p-3'}`}>
               <div className="flex-shrink-0">{theme === 'light' ? <Moon className="h-6 w-6 text-slate-600 dark:text-slate-300"/> : <Sun className="h-6 w-6 text-slate-600 dark:text-slate-300"/>}</div>
               <span className={`ml-4 whitespace-nowrap text-slate-600 dark:text-slate-300 transition-opacity duration-200 ${labelOpacity}`}>
                 {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
               </span>
               <div className={`absolute right-4 w-10 h-5 rounded-full transition-colors duration-300 ${theme === 'light' ? 'bg-slate-300' : 'bg-blue-600'} ${isCollapsed ? 'hidden' : ''}`}>
                 <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-300 ${theme === 'dark' ? 'translate-x-5' : ''}`}></div>
               </div>
            </button>
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center text-slate-600 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors duration-200 ${linkPadding}`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut className={`h-6 w-6 flex-shrink-0 ${iconMargin}`} />
            <span className={`whitespace-nowrap transition-opacity duration-200 ${labelOpacity}`}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;