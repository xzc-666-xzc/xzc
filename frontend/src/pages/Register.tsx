import { Navigate } from 'react-router-dom';

/** 注册已合并到 Login 页面（Tab 切换），此路由重定向 */
export default function RegisterPage() {
  return <Navigate to="/login" replace />;
}
