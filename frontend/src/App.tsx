import { Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from '@/stores';
import MainLayout from '@/components/Layout';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import InterviewSetup from '@/pages/InterviewSetup';
import InterviewRoom from '@/pages/InterviewRoom';
import InterviewReport from '@/pages/InterviewReport';
import InterviewReportHub from '@/pages/InterviewReportHub';
import InterviewHistory from '@/pages/InterviewHistory';
import WrongBook from '@/pages/WrongBook';
import Profile from '@/pages/Profile';
import AdminPanel from '@/pages/admin/AdminPanel';

// 需要登录才能访问
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useUserStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// 已登录则跳回首页（用于登录/注册页）
function GuestRoute({ children }: { children: React.ReactNode }) {
  const token = useUserStore((s) => s.token);
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* 未登录默认进入登录页 */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      {/* 主界面需登录 */}
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
        <Route path="reports" element={<InterviewReportHub />} />
        <Route path="history" element={<Navigate to="/reports" replace />} />
        <Route path="wrong-book" element={<Navigate to="/reports" replace />} />
        <Route path="profile" element={<Profile />} />
        <Route path="admin" element={<AdminPanel />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
