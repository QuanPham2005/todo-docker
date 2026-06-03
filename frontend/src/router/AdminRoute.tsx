import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

type Props = {
  children: ReactNode;
};

export default function AdminRoute({ children }: Props) {
  const user = useAuthStore((state) => state.user);
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
