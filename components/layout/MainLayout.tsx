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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans">
      <Sidebar 
        role={role} 
        isMobileOpen={isMobileSidebarOpen} 
        setIsMobileOpen={setIsMobileSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        <Header title={title} onMenuClick={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4 md:p-6 lg:p-8">
          {children}
        </main>
        <footer className="p-3 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          © {new Date().getFullYear()} VanConnect | East Point College of Engineering and Technology (EPCET)
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;