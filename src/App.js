import React from 'react';
import AdminMultiplayer from './pages/admin/AdminMultiplayer';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

// User Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import TopicPage from './pages/TopicPage';
import PracticePage from './pages/PracticePage';
import CodingPage from './pages/CodingPage';
import ProblemsPage from './pages/ProblemsPage';
import ProblemDetail from './pages/ProblemDetail';
import MultiplayerMatch from './pages/MultiplayerMatch';
import QuizRoom from './pages/QuizRoom';
import Leaderboard from './pages/Leaderboard';
import BuyCoins from './pages/BuyCoins';

// Admin Pages
import AdminProblems from './pages/admin/AdminProblems';
import AdminQuiz from './pages/admin/AdminQuiz';
import AdminLeaderboard from './pages/admin/AdminLeaderboard';
import AdminRoom from './pages/admin/AdminRoom';

import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-page">
      <div className="loading-spinner-lg">🐝</div>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-page">
      <div className="loading-spinner-lg">🐝</div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (!user.isAdmin) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <div className="app-wrapper">
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/leaderboard" element={<Leaderboard />} />

          {/* User Routes */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/topic/:topicId" element={<ProtectedRoute><TopicPage /></ProtectedRoute>} />
          <Route path="/practice/:topicId" element={<ProtectedRoute><PracticePage /></ProtectedRoute>} />
          <Route path="/coding/:topicId" element={<ProtectedRoute><CodingPage /></ProtectedRoute>} />
          <Route path="/problems" element={<ProtectedRoute><ProblemsPage /></ProtectedRoute>} />
          <Route path="/problem/:slug" element={<ProtectedRoute><ProblemDetail /></ProtectedRoute>} />
          <Route path="/multiplayer" element={<ProtectedRoute><MultiplayerMatch /></ProtectedRoute>} />
          <Route path="/room" element={<ProtectedRoute><QuizRoom /></ProtectedRoute>} />
          <Route path="/buy-coins" element={<ProtectedRoute><BuyCoins /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/problems" element={<AdminRoute><AdminProblems /></AdminRoute>} />
          <Route path="/admin/quiz" element={<AdminRoute><AdminQuiz /></AdminRoute>} />
          <Route path="/admin/leaderboard" element={<AdminRoute><AdminLeaderboard /></AdminRoute>} />
          <Route path="/admin/room" element={<AdminRoute><AdminRoom /></AdminRoute>} />
          <Route path="/admin/multiplayer" element={<AdminRoute><AdminMultiplayer /></AdminRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}