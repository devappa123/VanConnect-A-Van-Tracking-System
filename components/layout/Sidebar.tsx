import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { LayoutDashboard, User, MessageSquareWarning, LogOut, Car, Users, BarChart, MessageSquare } from 'lucide-react';

interface SidebarProps {
  role: UserRole;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
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
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/complaints', icon: MessageSquareWarning, label: 'Complaints' },
];

const getLinksByRole = (role: UserRole) => {
  switch (role) {
    case UserRole.STUDENT:
      return studentLinks;
    case UserRole.DRIVER:
      return driverLinks;
    case UserRole.ADMIN:
      return adminLinks;
    default:
      return [];
  }
};

const Sidebar: React.FC<SidebarProps> = ({ role, isOpen, setIsOpen }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const links = getLinksByRole(role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClasses = "flex items-center px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200";
  const activeNavLinkClasses = "bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 font-semibold";

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      ></div>
      <aside
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col z-30 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-center h-20 border-b dark:border-gray-700">
          <Car className="w-8 h-8 text-primary-500" />
          <h1 className="text-2xl font-bold ml-2 text-gray-800 dark:text-white">Van Connect</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <link.icon className="h-5 w-5 mr-3" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors duration-200"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;