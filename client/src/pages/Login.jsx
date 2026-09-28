import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { getApiError, rolePath } from '../utils/helpers';
import { PageTitle } from '../components/common/UI';
import { ArrowRight, GraduationCap, Building2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const HIGHLIGHTS = [
  { icon: GraduationCap, label: 'Students', desc: 'Track all your applications in one place' },
  { icon: Building2,     label: 'Placement Cell', desc: 'Manage drives and shortlisting efficiently' },
  { icon: Shield,        label: 'Administrators', desc: 'Full analytics and user control' },
];

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(rolePath(user.role), { replace: true });
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGLoading(true);
      try {
        const user = await googleLogin(tokenResponse.access_token);
        toast.success(`Welcome, ${user.name}!`);
        navigate(rolePath(user.role), { replace: true });
      } catch (err) {
        toast.error(getApiError(err) || 'Google sign-in failed');
      } finally {
        setGLoading(false);
      }
    },
    onError: () => toast.error('Google sign-in was cancelled or failed'),
  });

  return (
    <div className="flex-1 min-h-[calc(100vh-3.5rem)] flex animate-fade-in">
      <PageTitle title="Sign In" />

      {/* ── Left: Brand Panel ──────────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-[42%] bg-navy-600 relative overflow-hidden">
        {/* Dot grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.07) 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
        {/* Decorative arc */}
        <div
          className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #F28C00 0%, transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-col h-full px-10 py-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 flex items-center justify-center" style={{ borderRadius: 1 }}>
              <span style={{ fontFamily: 'DM Mono', fontWeight: 400, fontSize: 12, color: '#fff', letterSpacing: '0.06em' }}>CP</span>
            </div>
            <span style={{ fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 18, color: '#fff', letterSpacing: '0.01em' }}>
              CloudPMS
            </span>
          </div>

          {/* Main heading */}
          <div className="mt-auto mb-12">
            <p className="font-sans text-xs font-semibold text-navy-300 uppercase tracking-widest mb-4">
              Campus Placement Management
            </p>
            <h1 className="font-serif text-4xl font-bold text-white leading-tight mb-4">
              Your campus career,<br />
              <span className="text-orange-400">managed centrally.</span>
            </h1>
            <p className="font-sans text-sm text-navy-200 leading-relaxed max-w-xs">
              A unified platform connecting students, placement officers, and administrators for seamless campus recruitment.
            </p>

            {/* Role list */}
            <div className="mt-10 space-y-4">
              {HIGHLIGHTS.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-sm bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-orange-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-sans text-xs font-semibold text-white">{label}</p>
                    <p className="font-sans text-2xs text-navy-300">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="font-sans text-2xs text-navy-400 mt-auto">
            CloudPMS © {new Date().getFullYear()} — Cloud-Based Campus Placement System
          </p>
        </div>
      </div>

      {/* ── Right: Auth Form ─────────────────────────────────────── */}
      <div className="flex-1 bg-cream flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md cpm-card p-8 sm:p-10 bg-white">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-7 h-7 bg-navy-600 flex items-center justify-center" style={{ borderRadius: 1 }}>
              <span style={{ fontFamily: 'DM Mono', fontSize: 10, color: '#fff' }}>CP</span>
            </div>
            <span style={{ fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 15, color: '#172B4D' }}>CloudPMS</span>
          </div>

          <div className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-navy-600">Welcome back</h2>
            <p className="font-sans text-sm text-muted mt-1">Sign in to your CloudPMS account</p>
          </div>

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            disabled={gLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-card text-ink font-sans font-medium text-sm border border-border rounded-sm hover:border-navy-300 hover:bg-warm transition-all duration-200 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {gLoading ? 'Signing in…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="divider-text my-6">
            <span className="font-sans text-2xs text-subtle font-medium uppercase tracking-widest">or sign in with email</span>
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Email address</label>
              <input
                type="email" className="form-input" placeholder="you@university.edu"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required autoFocus
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="form-label !mb-0">Password</label>
                <Link to="/forgot-password" className="font-sans text-2xs font-semibold text-navy-600 hover:text-orange-600 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password" className="form-input" placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? 'Signing in…' : (
                <>Sign in <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="font-sans text-sm text-muted mt-6 text-center">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-navy-600 hover:text-orange-600 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
