
import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { UserRole } from '../../types';

interface MainLayoutProps {
  children: React.ReactNode;
  role: UserRole;
  title: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, role, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Sidebar role={role} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
