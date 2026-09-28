import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Briefcase, FileText, User, LayoutDashboard, Users, BarChart2,
  LogOut, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const NAV_LINKS = {
  student: [
    { to: '/student/drives',       label: 'Browse Drives',   icon: Briefcase },
    { to: '/student/applications', label: 'My Applications', icon: FileText },
    { to: '/student/profile',      label: 'Profile',         icon: User },
  ],
  placement_cell: [
    { to: '/placement/drives', label: 'Manage Drives', icon: Briefcase },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users',     label: 'Users',     icon: Users },
    { to: '/admin/reports',   label: 'Reports',   icon: BarChart2 },
  ],
};

const ROLE_LABELS = {
  student:        'Student',
  placement_cell: 'Placement Cell',
  admin:          'Administrator',
};

const ROLE_COLORS = {
  student:        'bg-info-50 text-info-700',
  placement_cell: 'bg-orange-50 text-orange-700',
  admin:          'bg-navy-50 text-navy-700',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  const handleLogout = async () => {
    await logout();
    toast.success('You have been signed out.');
    navigate('/login');
  };

  const links = user ? NAV_LINKS[user.role] || [] : [];

  return (
    <nav className="topnav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">

        {/* Wordmark */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          {/* CP Institutional mark */}
          <span
            className="flex items-center justify-center bg-orange-500 flex-shrink-0"
            style={{ width: 28, height: 28, borderRadius: 1 }}
          >
            <span style={{
              fontFamily: 'DM Mono', fontWeight: 400,
              fontSize: 10.5, color: '#fff', letterSpacing: '0.06em'
            }}>
              CP
            </span>
          </span>
          <span style={{
            fontFamily: 'Playfair Display', fontWeight: 700,
            fontSize: 15, color: '#fff', letterSpacing: '0.01em'
          }}>
            CloudPMS
          </span>
        </Link>

        {/* Center nav links */}
        {user && (
          <div className="hidden sm:flex items-end h-14 gap-1">
            {links.map((l) => {
              const isActive = location.pathname.startsWith(l.to);
              const Icon = l.icon;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`topnav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${isActive ? 'text-orange-400' : 'text-navy-300'}`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {l.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right side — user identity + sign out */}
        {user && (
          <div className="flex items-center gap-4">
            {/* Role badge (desktop) */}
            <span
              className="hidden md:inline-flex items-center px-2.5 py-1 text-2xs font-semibold rounded-sm bg-white/10 text-navy-100 border border-white/10"
              style={{ letterSpacing: '0.04em' }}
            >
              {ROLE_LABELS[user.role]}
            </span>

            {/* User name */}
            <div className="hidden sm:flex flex-col items-end leading-none">
              <span style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13, color: '#fff' }}>
                {user.name}
              </span>
              <span style={{ fontFamily: 'DM Sans', fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                {user.email}
              </span>
            </div>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-navy-300 hover:text-white transition-colors duration-150 text-xs font-sans"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Sign out</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
