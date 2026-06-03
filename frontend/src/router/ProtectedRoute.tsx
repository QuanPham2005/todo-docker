import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

type Props = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const accessToken = useAuthStore((state) => state.accessToken);
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
