import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { rolePath } from './utils/helpers';

// Common
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Student Pages
import StudentDrives from './pages/student/Drives';
import StudentApplications from './pages/student/Applications';
import StudentProfile from './pages/student/Profile';

// Placement Cell Pages
import PlacementDrives from './pages/placement/ManageDrives';
import DriveApplicants from './pages/placement/DriveApplicants';
import CommunicationCenter from './pages/placement/CommunicationCenter';
import Interviews from './pages/placement/Interviews';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import Users from './pages/admin/Users';
import Reports from './pages/admin/Reports';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={rolePath(user.role)} replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={rolePath(user.role)} replace />;
  return children;
}

function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-cream py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs font-sans font-medium text-subtle">
          CloudPMS © {new Date().getFullYear()} — Campus Placement Management System
        </div>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Routes>
            {/* Public auth routes (No Navbar/Footer) */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Layout with Navbar & Footer */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<RootRedirect />} />
              
              {/* Student Routes */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/student/drives" element={<StudentDrives />} />
                <Route path="/student/applications" element={<StudentApplications />} />
                <Route path="/student/profile" element={<StudentProfile />} />
              </Route>

              {/* Placement Cell Routes */}
              <Route element={<ProtectedRoute allowedRoles={['placement_cell']} />}>
                <Route path="/placement/drives" element={<PlacementDrives />} />
                <Route path="/placement/drives/:driveId/applicants" element={<DriveApplicants />} />
                <Route path="/placement/interviews" element={<Interviews />} />
                <Route path="/placement/communication" element={<CommunicationCenter />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<Users />} />
                <Route path="/admin/reports" element={<Reports />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </div>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
