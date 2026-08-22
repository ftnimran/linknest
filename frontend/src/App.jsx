import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import SkeletonProfile from './components/SkeletonProfile';

function App() {
  const { isAuth, username, isAppLoading } = useAuth();

  // Show Skeleton UI Structure instead of a blank page spinner during auth check
  if (isAppLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center py-6 px-4 sm:px-6 md:px-8 w-full">
        <SkeletonProfile />
      </div>
    );
  }

  const defaultHomeRedirect = () => {
    if (isAuth && username && username !== 'undefined') {
      return <Navigate to={`/${username}`} replace />;
    }
    return <Navigate to="/login" replace />;
  };

  return (
    <div className="min-h-screen flex justify-center items-center py-6 px-4 sm:px-6 md:px-8 w-full">
      <Routes>
        <Route path="/" element={defaultHomeRedirect()} />
        
        {/* FIX: Prevent already logged-in users from accessing the login page */}
        <Route path="/login" element={isAuth ? <Navigate to="/admin" replace /> : <LoginPage />} />
        
        <Route path="/admin" element={isAuth ? <AdminDashboard /> : <Navigate to="/login" replace />} />
        <Route path="/:username" element={<ProfilePage />} />
        
        {/* Wildcard catch-all route redirects unmatched paths safely */}
        <Route path="*" element={defaultHomeRedirect()} />
      </Routes>
    </div>
  );
}

export default App;