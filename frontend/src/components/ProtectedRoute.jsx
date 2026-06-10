import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ color: 'var(--color-danger)' }}>403 — Access Denied</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>You don't have permission to view this page.</p>
      </div>
    );
  }

  return children;
}
