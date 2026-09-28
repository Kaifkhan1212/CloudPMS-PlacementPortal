import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { rolePath } from '../../utils/helpers';

/**
 * ProtectedRoute — blocks access based on auth state and role.
 *
 * Usage:
 *   <Route element={<ProtectedRoute allowedRoles={['student']} />}>
 *     <Route path="/student/drives" element={<Drives />} />
 *   </Route>
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated → login
  if (!user) return <Navigate to="/login" replace />;

  // Wrong role → their own dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={rolePath(user.role)} replace />;
  }

  return <Outlet />;
}
