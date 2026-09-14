import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import TranslatePage from './pages/TranslatePage';
import HistoryPage from './pages/HistoryPage';
import TestCasesPage from './pages/TestCasesPage';
import ResultsPage from './pages/ResultsPage';
import SamplesPage from './pages/SamplesPage';
import SettingsPage from './pages/SettingsPage';
import AboutPage from './pages/AboutPage';
import { LoaderCircle } from 'lucide-react';

function Protected() {
  const { isSignedIn, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#0b1326] text-white"><LoaderCircle className="animate-spin-slow" /></div>;
  if (!isSignedIn) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/translate" element={<TranslatePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/test-cases" element={<TestCasesPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/samples" element={<SamplesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login/*" element={<LoginPage />} />
      <Route path="/signup/*" element={<SignupPage />} />
      <Route path="/*" element={<Protected />} />
    </Routes>
  );
}
