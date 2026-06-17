import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="kb-loader-wrap">
        <div className="kb-spinner" />
        <p className="kb-loader-text">Loading…</p>
      </div>
    );
  }
  return user ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
}
