// src/components/RedirectIfAuth.jsx
// Inverse of RequireAuth: keeps already-authenticated users off the public
// auth pages (/login, /signup) by sending them to the dashboard.
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RedirectIfAuth() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
