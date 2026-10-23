import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BottomNav } from './components/BottomNav';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicOnlyRoute } from './components/PublicOnlyRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { GamesPage } from './pages/GamesPage';
import { GameDetailPage } from './pages/GameDetailPage';
import { ScoreboardPage } from './pages/ScoreboardPage';
import { RulesPage } from './pages/RulesPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AdminPage } from './pages/AdminPage';
import { AdminGamesPage } from './pages/AdminGamesPage';
import { AdminLevelsPage } from './pages/AdminLevelsPage';
import { AdminMatchSetupPage } from './pages/AdminMatchSetupPage';
import { LiveScoreboardPage } from './pages/LiveScoreboardPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-900 text-slate-900 antialiased font-sans selection:bg-[#E63946] selection:text-white">
            {/* Mobile Shell Wrapper for Desktop Centering */}
            <div className="max-w-md mx-auto min-h-screen bg-slate-100 relative shadow-2xl border-x border-slate-800/20">
              <Routes>
                {/* Public Landing */}
                <Route path="/" element={<LandingPage />} />

                {/* Public Only Auth Routes */}
                <Route
                  path="/entrar"
                  element={
                    <PublicOnlyRoute>
                      <LoginPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/cadastro"
                  element={
                    <PublicOnlyRoute>
                      <RegisterPage />
                    </PublicOnlyRoute>
                  }
                />

                {/* Protected App Routes */}
                <Route
                  path="/inicio"
                  element={
                    <ProtectedRoute>
                      <HomePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/jogos"
                  element={
                    <ProtectedRoute>
                      <GamesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/jogos/:id"
                  element={
                    <ProtectedRoute>
                      <GameDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/placar"
                  element={
                    <ProtectedRoute>
                      <ScoreboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/regras"
                  element={
                    <ProtectedRoute>
                      <RulesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/avisos"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/perfil"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/jogos"
                  element={
                    <ProtectedRoute>
                      <AdminGamesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/niveis"
                  element={
                    <ProtectedRoute>
                      <AdminLevelsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/jogos/:gameId/partida"
                  element={
                    <ProtectedRoute>
                      <AdminMatchSetupPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/partidas/:matchId"
                  element={
                    <ProtectedRoute>
                      <LiveScoreboardPage />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFoundPage />} />
              </Routes>

              {/* Bottom Mobile Navigation */}
              <BottomNav />
            </div>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
