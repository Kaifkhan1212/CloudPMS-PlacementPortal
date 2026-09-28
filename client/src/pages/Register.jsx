import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiError, rolePath } from '../utils/helpers';
import { PageTitle } from '../components/common/UI';
import { GraduationCap, Building2, Shield, ArrowRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  {
    value: 'student',
    label: 'Student',
    desc: 'Browse & apply to placement drives',
    icon: GraduationCap,
    color: 'text-info-700',
    bg: 'bg-info-50',
  },
  {
    value: 'placement_cell',
    label: 'Placement Cell',
    desc: 'Manage drives & applicants',
    icon: Building2,
    color: 'text-orange-700',
    bg: 'bg-orange-50',
  },
  {
    value: 'admin',
    label: 'Administrator',
    desc: 'Full system access & analytics',
    icon: Shield,
    color: 'text-navy-700',
    bg: 'bg-navy-50',
  },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '' });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.role) { toast.error('Please select your role to continue'); return; }
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`Welcome to CloudPMS, ${user.name}!`);
      navigate(rolePath(user.role), { replace: true });
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-[calc(100vh-3.5rem)] flex animate-fade-in">
      <PageTitle title="Create Account" />

      {/* ── Left: Brand Panel (same as login) ──────────────────── */}
      <div className="hidden lg:flex flex-col w-[42%] bg-navy-600 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.07) 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
        <div
          className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #F28C00 0%, transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-col h-full px-10 py-12">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 flex items-center justify-center" style={{ borderRadius: 1 }}>
              <span style={{ fontFamily: 'DM Mono', fontWeight: 400, fontSize: 12, color: '#fff', letterSpacing: '0.06em' }}>CP</span>
            </div>
            <span style={{ fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 18, color: '#fff' }}>CloudPMS</span>
          </div>

          <div className="mt-auto mb-12">
            <p className="font-sans text-xs font-semibold text-navy-300 uppercase tracking-widest mb-4">
              Join the Platform
            </p>
            <h1 className="font-serif text-4xl font-bold text-white leading-tight mb-4">
              Start your<br />
              <span className="text-orange-400">placement journey.</span>
            </h1>
            <p className="font-sans text-sm text-navy-200 leading-relaxed max-w-xs">
              Create your account and connect with top recruiters through your institution's official placement portal.
            </p>

            <div className="mt-10 space-y-3">
              {['Apply to curated company drives', 'Track application status live', 'Get shortlisted & scheduled'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-sm bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-orange-400" strokeWidth={3} />
                  </div>
                  <p className="font-sans text-sm text-navy-200">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="font-sans text-2xs text-navy-400">
            CloudPMS © {new Date().getFullYear()} — Campus Placement Management System
          </p>
        </div>
      </div>

      {/* ── Right: Register Form ─────────────────────────────────── */}
      <div className="flex-1 bg-cream flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-7 h-7 bg-navy-600 flex items-center justify-center" style={{ borderRadius: 1 }}>
              <span style={{ fontFamily: 'DM Mono', fontSize: 10, color: '#fff' }}>CP</span>
            </div>
            <span style={{ fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 15, color: '#172B4D' }}>CloudPMS</span>
          </div>

          <div className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-navy-600">Create your account</h2>
            <p className="font-sans text-sm text-muted mt-1">Choose your role to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector */}
            <div>
              <label className="form-label">I am joining as</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = form.role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                      className={`relative p-3 text-left border rounded-sm transition-all duration-200 ${
                        isSelected
                          ? 'border-navy-600 bg-navy-50 shadow-glow'
                          : 'border-border bg-card hover:border-navy-300 hover:bg-warm'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-sm bg-navy-600 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                        </div>
                      )}
                      <div className={`w-7 h-7 rounded-sm ${r.bg} ${r.color} flex items-center justify-center mb-2`}>
                        <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                      </div>
                      <div className="font-sans text-xs font-semibold text-ink">{r.label}</div>
                      <div className="font-sans text-2xs text-muted mt-0.5 leading-tight">{r.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="form-label">Full name</label>
              <input
                type="text" className="form-input" placeholder="Rahul Sharma"
                value={form.name} onChange={set('name')} required
              />
            </div>

            <div>
              <label className="form-label">Email address</label>
              <input
                type="email" className="form-input" placeholder="you@university.edu"
                value={form.email} onChange={set('email')} required
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <input
                type="password" className="form-input" placeholder="Min. 8 chars, 1 uppercase, 1 digit"
                value={form.password} onChange={set('password')} required
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Creating account…' : (
                <>Create account <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </form>

          <p className="font-sans text-sm text-muted mt-6 text-center">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-navy-600 hover:text-orange-600 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
