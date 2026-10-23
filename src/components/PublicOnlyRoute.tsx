import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from './Loader';

export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <Loader size="lg" text="Carregando..." />
      </div>
    );
  }

  if (isAuthenticated) {
    // If user arrived from a protected route, redirect back there, else default to /inicio
    const fromLocation = location.state?.from?.pathname || '/inicio';
    return <Navigate to={fromLocation} replace />;
  }

  return <>{children}</>;
};
