import { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';
import { useAuth } from '../../context/AuthContext';
import { getApiError, extractResumeFilename } from '../../utils/helpers';
import { PageLoader, Alert, Avatar, StatusBadge } from '../../components/common/UI';
import PageTitle from '../../components/common/PageTitle';
import PageHero from '../../components/common/PageHero';
import { FileText, Upload, BookOpen, Edit2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const BRANCHES = ['MCA','BCA','BBA','BSc IT','BCom'];

export default function StudentProfile() {
  const { user } = useAuth();
  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewingResume, setViewingResume] = useState(false);
  const [editMode, setEditMode]   = useState(false);
  const [form, setForm] = useState({
    rollNumber: '', branch: 'MCA', cgpa: '', backlogCount: 0,
    tenthPercent: '', twelfthPercent: '', skills: '',
  });

  useEffect(() => {
    studentApi.getProfile()
      .then((r) => {
        const p = r.data.data.profile;
        setProfile(p);
        setForm({
          rollNumber:    p.rollNumber || '',
          branch:        p.branch || 'MCA',
          cgpa:          p.cgpa ?? '',
          backlogCount:  p.backlogCount ?? 0,
          tenthPercent:  p.tenthPercent ?? '',
          twelfthPercent:p.twelfthPercent ?? '',
          skills:        (p.skills || []).join(', '),
        });
      })
      .catch(() => setEditMode(true))
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        cgpa:          parseFloat(form.cgpa),
        backlogCount:  parseInt(form.backlogCount, 10),
        tenthPercent:  form.tenthPercent  ? parseFloat(form.tenthPercent)  : undefined,
        twelfthPercent:form.twelfthPercent ? parseFloat(form.twelfthPercent) : undefined,
        skills:        form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      const r = await studentApi.upsertProfile(payload);
      setProfile(r.data.data.profile);
      setEditMode(false);
      toast.success('Academic profile saved successfully!');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('resume', file);
    setUploading(true);
    try {
      const r = await studentApi.uploadResume(fd);
      setProfile((p) => ({ ...p, resumePath: r.data.data.resumeUrl }));
      toast.success('Resume uploaded securely to AWS S3.');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setUploading(false);
    }
  };

  const handleViewResume = async () => {
    setViewingResume(true);
    try {
      const res = await studentApi.getMyResumeView();
      window.open(res.data.data.url, '_blank');
    } catch (err) {
      toast.error(getApiError(err) || 'Failed to open resume');
    } finally {
      setViewingResume(false);
    }
  };

  if (loading) return <PageLoader />;

  let completeness = 30;
  if (profile)            completeness += 40;
  if (profile?.resumePath) completeness += 30;

  return (
    <div className="animate-fade-rise">
      <PageTitle title="My Profile" />
      <PageHero
        title="Candidate Profile"
        subtitle="Manage your academic records, skills, and resume to apply for placement drives."
      />

      <div className="page-container max-w-5xl flex flex-col lg:flex-row gap-8">

        {/* ── Left Column ──────────────────────────────────────── */}
        <div className="w-full lg:w-72 space-y-5 flex-shrink-0">

          {/* Identity Card */}
          <div className="cpm-card overflow-hidden">
            <div className="h-16 relative" style={{ background: 'var(--accent)' }}>
              <div
                className="absolute inset-0"
                style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.12) 1px, transparent 0)', backgroundSize: '16px 16px' }}
              />
            </div>
            <div className="px-5 pb-5 relative">
              <div
                className="absolute -top-8 left-5 rounded-full p-1.5"
                style={{ background: 'var(--bg-surface)' }}
              >
                <Avatar name={user?.name} size="lg" />
              </div>
              <div className="mt-8 pt-2">
                <h2 className="type-h3">{user?.name}</h2>
                <p className="font-sans text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
              </div>

              {/* Completeness */}
              <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="type-label">Profile Complete</p>
                  <span className="font-mono text-xs font-bold" style={{ color: 'var(--accent)' }}>
                    {completeness}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${completeness}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Placement Status */}
          <div className="cpm-card">
            <div className="card-header">
              <span className="type-h4">Placement Status</span>
            </div>
            <div className="card-body flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={profile?.isPlaced
                  ? { background: 'var(--success-bg)', color: 'var(--success-text)' }
                  : { background: 'var(--info-bg)', color: 'var(--info-text)' }
                }
              >
                {profile?.isPlaced ? <CheckCircle2 className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-sans font-semibold text-sm" style={{ color: 'var(--text)' }}>
                  {profile?.isPlaced ? 'Placed' : 'Available'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {profile?.isPlaced ? 'Congratulations!' : 'Actively applying'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column ─────────────────────────────────────── */}
        <div className="flex-1 space-y-5">

          {!profile && (
            <Alert type="warning">
              <p className="font-semibold" style={{ color: 'var(--warning-text)' }}>Action Required: Academic Details Missing</p>
              <p className="text-xs mt-1">You must save your academic details before you can upload a resume or apply to drives.</p>
            </Alert>
          )}

          {/* Academic Details */}
          <div className="cpm-card">
            <div className="card-header justify-between">
              <span className="type-h4">Academic Information</span>
              {profile && !editMode && (
                <button onClick={() => setEditMode(true)} className="btn-ghost !px-2 !py-1 text-xs">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
              )}
            </div>
            <div className="card-body">
              {editMode ? (
                <form onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="form-label">Roll Number</label>
                      <input className="form-input font-mono" value={form.rollNumber} onChange={set('rollNumber')} required />
                    </div>
                    <div>
                      <label className="form-label">Branch</label>
                      <select className="form-select" value={form.branch} onChange={set('branch')}>
                        {BRANCHES.map((b) => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Current CGPA (0–10)</label>
                      <input className="form-input font-mono" type="number" min="0" max="10" step="0.01" value={form.cgpa} onChange={set('cgpa')} required />
                    </div>
                    <div>
                      <label className="form-label">Active Backlogs</label>
                      <input className="form-input font-mono" type="number" min="0" value={form.backlogCount} onChange={set('backlogCount')} required />
                    </div>
                    <div>
                      <label className="form-label">10th Percentage</label>
                      <input className="form-input font-mono" type="number" min="0" max="100" step="0.01" placeholder="Optional" value={form.tenthPercent} onChange={set('tenthPercent')} />
                    </div>
                    <div>
                      <label className="form-label">12th Percentage</label>
                      <input className="form-input font-mono" type="number" min="0" max="100" step="0.01" placeholder="Optional" value={form.twelfthPercent} onChange={set('twelfthPercent')} />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Skills</label>
                    <input className="form-input" placeholder="e.g. React, Node.js, Python, SQL" value={form.skills} onChange={set('skills')} />
                    <p className="text-2xs mt-1" style={{ color: 'var(--text-subtle)' }}>Comma separated</p>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button type="submit" className="btn-primary" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Academic Profile'}
                    </button>
                    {profile && (
                      <button type="button" className="btn-secondary" onClick={() => setEditMode(false)}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              ) : profile ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4">
                  {[
                    { label: 'Roll Number',    value: profile.rollNumber,                             mono: true },
                    { label: 'Branch',         value: profile.branch,                                 mono: false },
                    { label: 'CGPA',           value: profile.cgpa,                                   mono: true },
                    { label: 'Active Backlogs',value: profile.backlogCount,                            mono: true },
                    { label: '10th %',         value: profile.tenthPercent  ? `${profile.tenthPercent}%`  : '—', mono: true },
                    { label: '12th %',         value: profile.twelfthPercent ? `${profile.twelfthPercent}%` : '—', mono: true },
                  ].map(({ label, value, mono }) => (
                    <div key={label}>
                      <p className="type-label mb-1">{label}</p>
                      <p className={`${mono ? 'font-mono text-sm' : 'font-sans font-semibold text-sm'}`} style={{ color: 'var(--text)' }}>
                        {value}
                      </p>
                    </div>
                  ))}
                  {profile.skills?.length > 0 && (
                    <div className="col-span-full pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                      <p className="type-label mb-3">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((s) => <span key={s} className="skill-tag">{s}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Resume Card */}
          <div className="cpm-card">
            <div className="card-header">
              <span className="type-h4">Resume Document</span>
            </div>
            <div className="card-body">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--error-bg)', color: 'var(--error-text)', border: '1px solid var(--error-border)' }}
                  >
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-sans font-semibold text-sm" style={{ color: 'var(--text)' }}>
                      {extractResumeFilename(profile?.resumePath)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {!profile ? 'Complete academic details first' : 'PDF format, Max 5MB'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {profile?.resumePath && (
                    <button onClick={handleViewResume} disabled={viewingResume} className="btn-secondary disabled:opacity-50">
                      {viewingResume ? 'Generating...' : 'View'}
                    </button>
                  )}
                  <label
                    className={`btn-primary ${!profile ? 'opacity-50 cursor-not-allowed' : uploading ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading...' : profile?.resumePath ? 'Replace' : 'Upload'}
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleResumeUpload}
                      disabled={uploading || !profile}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
