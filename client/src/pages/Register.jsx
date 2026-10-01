import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiError, rolePath } from '../utils/helpers';
import { PageTitle } from '../components/common/UI';
import {
  GraduationCap,
  Building2,
  Shield,
  ArrowRight,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  {
    value: 'student',
    label: 'Student',
    desc: 'Browse & apply to placement drives',
    icon: GraduationCap,
  },
  {
    value: 'placement_cell',
    label: 'Placement Cell',
    desc: 'Manage drives & applicants',
    icon: Building2,
  },
  {
    value: 'admin',
    label: 'Administrator',
    desc: 'Full system access & analytics',
    icon: Shield,
  },
];

const FEATURES = [
  'Apply to curated company drives',
  'Track application status live',
  'Get shortlisted & scheduled',
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
  });

  const [loading, setLoading] = useState(false);

  const set = (key) => (event) => {
    setForm((current) => ({
      ...current,
      [key]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.role) {
      toast.error('Please select your role to continue');
      return;
    }

    setLoading(true);

    try {
      const user = await register(form);

      toast.success(`Welcome to CloudPMS, ${user.name}!`);
      navigate(rolePath(user.role), { replace: true });
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex-1 min-h-[calc(100vh-3.5rem)] flex animate-fade-in"
      style={{
        background: 'var(--bg-page)',
        color: 'var(--text)',
      }}
    >
      <PageTitle title="Create Account" />

      {/* =========================================================
          LEFT — BRAND PANEL
      ========================================================= */}
      <aside
        className="hidden lg:flex flex-col w-[42%] relative overflow-hidden border-r"
        style={{
          background:
            'linear-gradient(145deg, var(--bg-surface-2), var(--bg-surface))',
          borderColor: 'var(--border)',
        }}
      >
        {/* Decorative dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1.5px 1.5px, color-mix(in srgb, var(--text) 7%, transparent) 1px, transparent 0)',
            backgroundSize: '22px 22px',
            opacity: 0.9,
          }}
        />

        {/* Accent glow */}
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 68%)',
          }}
        />

        {/* Top edge accent */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background:
              'linear-gradient(90deg, var(--accent), transparent)',
          }}
        />

        <div className="relative z-10 flex flex-col h-full px-10 py-12">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center rounded-sm"
              style={{
                background: 'var(--accent)',
                boxShadow:
                  '0 10px 24px color-mix(in srgb, var(--accent) 20%, transparent)',
              }}
            >
              <span
                className="font-mono text-xs tracking-wider"
                style={{
                  color: '#ffffff',
                  fontWeight: 600,
                }}
              >
                CP
              </span>
            </div>

            <span
              className="font-serif text-lg font-bold"
              style={{ color: 'var(--text)' }}
            >
              CloudPMS
            </span>
          </div>

          {/* Main brand content */}
          <div className="mt-auto mb-12 max-w-lg">
            <p
              className="font-sans text-xs font-semibold uppercase tracking-[0.2em] mb-4"
              style={{ color: 'var(--accent)' }}
            >
              Join the Platform
            </p>

            <h1
              className="font-serif text-4xl xl:text-5xl font-bold leading-[1.05] mb-5"
              style={{ color: 'var(--text)' }}
            >
              Start your
              <br />
              <span style={{ color: 'var(--accent)' }}>
                placement journey.
              </span>
            </h1>

            <p
              className="font-sans text-sm leading-7 max-w-md"
              style={{ color: 'var(--text-muted)' }}
            >
              Create your account and connect with your institution&apos;s
              placement ecosystem through a centralized recruitment platform.
            </p>

            {/* Feature list */}
            <div className="mt-9 space-y-3">
              {FEATURES.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-sm flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        'color-mix(in srgb, var(--accent) 14%, transparent)',
                      border:
                        '1px solid color-mix(in srgb, var(--accent) 26%, transparent)',
                    }}
                  >
                    <Check
                      className="w-3 h-3"
                      strokeWidth={3}
                      style={{ color: 'var(--accent)' }}
                    />
                  </div>

                  <p
                    className="font-sans text-sm"
                    style={{ color: 'var(--text)' }}
                  >
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p
            className="font-sans text-[11px]"
            style={{ color: 'var(--text-muted)' }}
          >
            CloudPMS © {new Date().getFullYear()} — Campus Placement
            Management System
          </p>
        </div>
      </aside>

      {/* =========================================================
          RIGHT — REGISTER FORM
      ========================================================= */}
      <main
        className="flex-1 flex items-center justify-center p-6 sm:p-10"
        style={{ background: 'var(--bg-page)' }}
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div
              className="w-8 h-8 rounded-sm flex items-center justify-center"
              style={{ background: 'var(--accent)' }}
            >
              <span
                className="font-mono text-[10px] font-semibold"
                style={{ color: '#ffffff' }}
              >
                CP
              </span>
            </div>

            <span
              className="font-serif text-base font-bold"
              style={{ color: 'var(--text)' }}
            >
              CloudPMS
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-2"
              style={{ color: 'var(--accent)' }}
            >
              Get started
            </p>

            <h2
              className="font-serif text-3xl font-bold"
              style={{ color: 'var(--text)' }}
            >
              Create your account
            </h2>

            <p
              className="font-sans text-sm mt-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Choose your role to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* =====================================================
                ROLE SELECTOR
            ====================================================== */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: 'var(--text)' }}
              >
                I am joining as
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const isSelected = form.role === role.value;

                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          role: role.value,
                        }))
                      }
                      className="relative text-left p-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        background: isSelected
                          ? 'color-mix(in srgb, var(--accent) 10%, var(--bg-surface))'
                          : 'var(--bg-surface)',
                        border: `1px solid ${
                          isSelected
                            ? 'var(--accent)'
                            : 'var(--border)'
                        }`,
                        boxShadow: isSelected
                          ? '0 8px 24px color-mix(in srgb, var(--accent) 12%, transparent)'
                          : 'none',
                      }}
                    >
                      {/* Selected check */}
                      {isSelected && (
                        <div
                          className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: 'var(--accent)' }}
                        >
                          <Check
                            className="w-2.5 h-2.5"
                            strokeWidth={3}
                            style={{ color: '#ffffff' }}
                          />
                        </div>
                      )}

                      {/* Icon */}
                      <div
                        className="w-8 h-8 rounded-md flex items-center justify-center mb-3"
                        style={{
                          background: isSelected
                            ? 'color-mix(in srgb, var(--accent) 14%, transparent)'
                            : 'var(--bg-surface-2)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <Icon
                          className="w-4 h-4"
                          strokeWidth={2}
                          style={{
                            color: isSelected
                              ? 'var(--accent)'
                              : 'var(--text-muted)',
                          }}
                        />
                      </div>

                      <div
                        className="font-sans text-xs font-semibold"
                        style={{ color: 'var(--text)' }}
                      >
                        {role.label}
                      </div>

                      <div
                        className="font-sans text-[10px] mt-1 leading-relaxed"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {role.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* =====================================================
                NAME
            ====================================================== */}
            <div>
              <label
                htmlFor="register-name"
                className="block text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: 'var(--text)' }}
              >
                Full name
              </label>

              <input
                id="register-name"
                type="text"
                className="form-input w-full"
                placeholder="Rahul Sharma"
                value={form.name}
                onChange={set('name')}
                required
              />
            </div>

            {/* =====================================================
                EMAIL
            ====================================================== */}
            <div>
              <label
                htmlFor="register-email"
                className="block text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: 'var(--text)' }}
              >
                Email address
              </label>

              <input
                id="register-email"
                type="email"
                className="form-input w-full"
                placeholder="you@university.edu"
                value={form.email}
                onChange={set('email')}
                required
              />
            </div>

            {/* =====================================================
                PASSWORD
            ====================================================== */}
            <div>
              <label
                htmlFor="register-password"
                className="block text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: 'var(--text)' }}
              >
                Password
              </label>

              <input
                id="register-password"
                type="password"
                className="form-input w-full"
                placeholder="Min. 8 chars, 1 uppercase, 1 digit"
                value={form.password}
                onChange={set('password')}
                required
              />
            </div>

            {/* =====================================================
                SUBMIT
            ====================================================== */}
            <button
              type="submit"
              className="btn-primary w-full justify-center"
              disabled={loading}
            >
              {loading ? (
                'Creating account…'
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Sign in */}
          <p
            className="font-sans text-sm mt-6 text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold transition-colors"
              style={{ color: 'var(--text)' }}
              onMouseEnter={(event) => {
                event.currentTarget.style.color = 'var(--accent)';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.color = 'var(--text)';
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
