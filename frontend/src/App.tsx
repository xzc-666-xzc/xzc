import { Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from '@/stores';
import MainLayout from '@/components/Layout';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import InterviewSetup from '@/pages/InterviewSetup';
import InterviewRoom from '@/pages/InterviewRoom';
import InterviewReport from '@/pages/InterviewReport';
import InterviewHistory from '@/pages/InterviewHistory';
import WrongBook from '@/pages/WrongBook';
import Profile from '@/pages/Profile';

// 路由守卫
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useUserStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="setup" element={<InterviewSetup />} />
        <Route path="interview/:id" element={<InterviewRoom />} />
        <Route path="report/:id" element={<InterviewReport />} />
        <Route path="history" element={<InterviewHistory />} />
        <Route path="wrong-book" element={<WrongBook />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
