import { type ReactNode, memo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface AdminRouteProps {
  children: ReactNode;
}

export default memo(function AdminRoute({ children }: AdminRouteProps) {
  const user = useAuthStore((state) => state.user);
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
);