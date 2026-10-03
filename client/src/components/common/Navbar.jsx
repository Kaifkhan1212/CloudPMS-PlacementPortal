import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Briefcase, FileText, User, LayoutDashboard, Users, BarChart2,
  LogOut, Mail, Calendar, Menu, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import ThemeToggle from './ThemeToggle';
import { Avatar } from './UI';

const NAV_LINKS = {
  student: [
    { to: '/student/drives',       label: 'Browse Drives',   icon: Briefcase },
    { to: '/student/applications', label: 'My Applications', icon: FileText },
    { to: '/student/profile',      label: 'Profile',         icon: User },
  ],
  placement_cell: [
    { to: '/placement/drives',        label: 'Manage Drives',  icon: Briefcase },
    { to: '/placement/interviews',    label: 'Interviews',     icon: Calendar },
    { to: '/placement/communication', label: 'Communication',  icon: Mail },
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
  admin:          'Admin',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    toast.success('You have been signed out.');
    navigate('/login');
  };

  const links = user ? NAV_LINKS[user.role] || [] : [];

  return (
    <>
      <nav className="topnav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">

          {/* Wordmark */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <span
              style={{
                width: 28, height: 28, borderRadius: 5,
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ fontFamily: 'DM Mono', fontWeight: 500, fontSize: 10, color: '#fff', letterSpacing: '0.06em' }}>
                CP
              </span>
            </span>
            <span style={{ fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 15, color: 'var(--text)', letterSpacing: '0.01em' }}>
              CloudPMS
            </span>
          </Link>

          {/* Center nav links — desktop */}
          {user && (
            <div className="hidden sm:flex items-end h-14 gap-0.5">
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
                      className="w-3.5 h-3.5"
                      style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {l.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right side */}
          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />

              {/* Role badge — md+ */}
              <span
                className="hidden md:inline-flex items-center px-2 py-0.5 text-2xs font-semibold rounded"
                style={{
                  background: 'var(--bg-surface-2)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  letterSpacing: '0.03em',
                }}
              >
                {ROLE_LABELS[user.role]}
              </span>

              {/* Avatar + name — sm+ */}
              <div className="hidden sm:flex items-center gap-2">
                <Avatar name={user.name} size="sm" />
                <div className="flex flex-col leading-none">
                  <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                    {user.name}
                  </span>
                  <span style={{ fontFamily: 'Inter', fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>
                    {user.email}
                  </span>
                </div>
              </div>

              {/* Sign out — desktop */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 transition-colors duration-150 text-xs font-sans"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Sign out</span>
              </button>

              {/* Hamburger — mobile only */}
              <button
                className="sm:hidden flex items-center justify-center w-9 h-9 rounded-md transition-colors"
                style={{ color: 'var(--text-muted)', background: mobileOpen ? 'var(--bg-surface-2)' : 'transparent' }}
                onClick={() => setMobileOpen(o => !o)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Drawer */}
      {user && mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 sm:hidden"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="fixed top-14 left-0 right-0 z-50 sm:hidden animate-fade-rise"
            style={{
              background: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }}
          >
            {/* User identity */}
            <div className="px-4 py-4 flex items-center gap-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <Avatar name={user.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-sans font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
                  {user.name}
                </p>
                <p className="font-sans text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {user.email}
                </p>
              </div>
              <span
                className="inline-flex items-center px-2 py-0.5 text-2xs font-semibold rounded flex-shrink-0"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              >
                {ROLE_LABELS[user.role]}
              </span>
            </div>

            {/* Nav links */}
            <nav className="py-2">
              {links.map((l) => {
                const isActive = location.pathname.startsWith(l.to);
                const Icon = l.icon;
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-5 py-3.5 text-sm font-sans font-medium transition-colors"
                    style={{
                      color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                      background: isActive ? 'var(--accent-soft)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                    }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                    {l.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-sans font-semibold"
                style={{ color: 'var(--error-text)', background: 'var(--error-bg)', border: '1px solid var(--error-border)' }}
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
