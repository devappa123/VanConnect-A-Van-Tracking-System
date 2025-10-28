import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import StudentDashboard from './pages/student/StudentDashboard';
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverMessagePage from './pages/driver/DriverMessagePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProfilePage from './pages/shared/ProfilePage';
import ComplaintsPage from './pages/shared/ComplaintsPage';
import NotFoundPage from './pages/shared/NotFoundPage';
import { UserRole } from './types';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
};

// ProtectedRoute component to handle role-based access
interface ProtectedRouteProps {
  // FIX: Cannot find namespace 'JSX'. Replaced `JSX.Element` with `React.ReactElement`.
  children: React.ReactElement;
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="w-16 h-16 border-4 border-t-4 border-t-primary-600 border-gray-200 rounded-full animate-spin"></div>
            </div>
        );
    }
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        // Redirect to a default dashboard if role doesn't match
        switch(user.role) {
            case UserRole.STUDENT: return <Navigate to="/student/dashboard" replace />;
            case UserRole.DRIVER: return <Navigate to="/driver/dashboard" replace />;
            case UserRole.ADMIN: return <Navigate to="/admin/dashboard" replace />;
            default: return <Navigate to="/login" replace />;
        }
    }

    return children;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        <Route path="/" element={!user ? <Navigate to="/login" /> : <Navigate to={`/${user.role}/dashboard`} />} />

        {/* Student Routes */}
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={[UserRole.STUDENT]}><StudentDashboard /></ProtectedRoute>} />
        
        {/* Driver Routes */}
        <Route path="/driver/dashboard" element={<ProtectedRoute allowedRoles={[UserRole.DRIVER]}><DriverDashboard /></ProtectedRoute>} />
        <Route path="/driver/message" element={<ProtectedRoute allowedRoles={[UserRole.DRIVER]}><DriverMessagePage /></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AdminDashboard /></ProtectedRoute>} />
        
        {/* Shared Routes */}
        <Route path="/profile" element={<ProtectedRoute allowedRoles={[UserRole.STUDENT, UserRole.DRIVER, UserRole.ADMIN]}><ProfilePage /></ProtectedRoute>} />
        <Route path="/complaints" element={<ProtectedRoute allowedRoles={[UserRole.STUDENT, UserRole.ADMIN]}><ComplaintsPage /></ProtectedRoute>} />
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </HashRouter>
  );
};

export default App;