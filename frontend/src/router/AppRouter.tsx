import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import AdminLayout from '../components/layout/AdminLayout';
import AdminOverview from '../pages/admin/AdminOverview';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminTodos from '../pages/admin/AdminTodos';
import AdminStats from '../pages/admin/AdminStats';
import DashboardPage from '../pages/DashboardPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import TodosPage from '../pages/TodosPage';
import AdminRoute from './AdminRoute';
import ProtectedRoute from './ProtectedRoute';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="todos" element={<TodosPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="todos" element={<AdminTodos />} />
        <Route path="stats" element={<AdminStats />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
