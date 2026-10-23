import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from './Loader';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <Loader size="lg" text="Carregando sessão do RallyNaVila..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/entrar" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
