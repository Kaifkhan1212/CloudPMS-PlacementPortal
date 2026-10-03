import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { placementApi } from '../../api/placementApi';
import { getApiError } from '../../utils/helpers';
import { PageLoader, EmptyState, Avatar, StatusBadge } from '../../components/common/UI';
import PageHero from '../../components/common/PageHero';
import PageTitle from '../../components/common/PageTitle';
import { Users, FileText, ArrowLeft, MoreHorizontal, Search, ChevronRight, CheckCircle2, Clock, XCircle, ChevronDown, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const PIPELINE_STAGES = [
  { id: 'Applied',             label: 'Applied',     color: 'var(--info-border)',    bg: 'var(--info-bg)',    text: 'var(--info-text)' },
  { id: 'Shortlisted',         label: 'Shortlisted', color: 'var(--purple-border)',  bg: 'var(--purple-bg)',  text: 'var(--purple-text)' },
  { id: 'Interview Scheduled', label: 'Interview',   color: 'var(--warning-border)', bg: 'var(--warning-bg)', text: 'var(--warning-text)' },
  { id: 'Selected',            label: 'Selected',    color: 'var(--success-border)', bg: 'var(--success-bg)', text: 'var(--success-text)' },
  { id: 'Rejected',            label: 'Rejected',    color: 'var(--error-border)',   bg: 'var(--error-bg)',   text: 'var(--error-text)' },
];

export default function DriveApplicants() {
  const { driveId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [minCgpa, setMinCgpa] = useState('');

  // Modals / Drawers
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [remark, setRemark] = useState('');
  const [interviewDate, setInterviewDate] = useState('');

  const fetchApplicants = () =>
    placementApi.getDriveApplicants(driveId, {}) // fetch all to build pipeline
      .then((r) => setData(r.data.data))
      .catch((err) => toast.error(getApiError(err)))
      .finally(() => setLoading(false));

  useEffect(() => { fetchApplicants(); }, [driveId]);

  const confirmAction = async () => {
    if (!actionModal) return;
    const { appId, status } = actionModal;
    setUpdating(appId);
    try {
      await placementApi.updateAppStatus(appId, {
        status,
        remarks: remark || undefined,
        interviewDate: interviewDate || undefined,
      });
      toast.success(`Moved to ${status}`);
      // Update local state immediately for snappy UI
      setData(prev => {
        const apps = prev.applications.map(a => 
          a._id === appId ? { ...a, status, remarks: remark, interviewDate: interviewDate } : a
        );
        return { ...prev, applications: apps };
      });
      if (activeCandidate?._id === appId) {
        setActiveCandidate(prev => ({ ...prev, status, remarks: remark, interviewDate: interviewDate }));
      }
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setUpdating(null);
      setActionModal(null);
      setRemark('');
      setInterviewDate('');
    }
  };

  const applications = data?.applications || [];
  const drive = data?.drive;

  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const s = app.student;
      if (!s) return false;
      const matchSearch = s.user?.name?.toLowerCase().includes(search.toLowerCase()) || s.user?.email?.toLowerCase().includes(search.toLowerCase()) || s.rollNumber?.toLowerCase().includes(search.toLowerCase());
      const matchBranch = branchFilter ? s.branch === branchFilter : true;
      const matchCgpa = minCgpa ? (s.cgpa >= parseFloat(minCgpa)) : true;
      return matchSearch && matchBranch && matchCgpa;
    });
  }, [applications, search, branchFilter, minCgpa]);

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-rise flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>
      <PageTitle title={drive ? `${drive.company} — Workspace` : 'Workspace'} />
      
      {/* Workspace Header */}
      <div className="flex-shrink-0 px-4 md:px-8 py-4 border-b z-10" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="workspace-header-inner flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-screen-2xl mx-auto">
          <div>
            <Link to="/placement/drives" className="inline-flex items-center gap-1.5 text-xs font-semibold mb-2 transition-colors" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Drives
            </Link>
            <h1 className="type-h3 flex items-center gap-2 flex-wrap">
              {drive?.company} <span className="font-sans text-sm font-normal px-2 py-0.5 rounded border" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'var(--bg-surface-2)' }}>{drive?.jobRole}</span>
            </h1>
          </div>

          {/* Filters */}
          <div className="workspace-filter-row flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search candidate..." className="form-input !py-1.5 !pl-8 text-sm w-full" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-select !py-1.5 text-sm flex-1 min-w-[120px]" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
              <option value="">All Branches</option>
              <option value="MCA">MCA</option>
              <option value="BCA">BCA</option>
              <option value="BBA">BBA</option>
              <option value="BSc IT">BSc IT</option>
            </select>
            <select className="form-select !py-1.5 text-sm flex-1 min-w-[120px]" value={minCgpa} onChange={e => setMinCgpa(e.target.value)}>
              <option value="">Any CGPA</option>
              <option value="6.0">6.0+</option>
              <option value="7.0">7.0+</option>
              <option value="8.0">8.0+</option>
              <option value="9.0">9.0+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="pipeline-board flex-1 overflow-x-auto overflow-y-hidden p-4 md:p-8" style={{ background: 'var(--bg-page)' }}>
        <div className="flex gap-4 md:gap-6 h-full max-w-screen-2xl mx-auto items-start" style={{ minWidth: 'max-content' }}>
          {PIPELINE_STAGES.map((stage) => {
            const stageApps = filteredApps.filter(a => a.status === stage.id);
            return (
              <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col h-full rounded-xl overflow-hidden border" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                {/* Column Header */}
                <div className="px-4 py-3 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)', background: stage.bg }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                    <h3 className="font-sans font-semibold text-sm" style={{ color: stage.text }}>{stage.label}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono text-xs font-bold" style={{ background: 'rgba(255,255,255,0.4)', color: stage.text }}>
                    {stageApps.length}
                  </span>
                </div>

                {/* Candidate Cards */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
                  {stageApps.map(app => (
                    <CandidateCard 
                      key={app._id} 
                      app={app} 
                      onClick={() => setActiveCandidate(app)}
                      onAction={(newStatus) => setActionModal({ appId: app._id, status: newStatus, current: app.status })}
                      isActive={activeCandidate?._id === app._id}
                    />
                  ))}
                  {stageApps.length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>No candidates</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Candidate Drawer Modal (Slide over) */}
      {activeCandidate && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md h-full shadow-card-lg animate-slide-in flex flex-col" style={{ background: 'var(--bg-surface)' }}>
            <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
              <h2 className="type-h4 mb-0">Candidate Details</h2>
              <button onClick={() => setActiveCandidate(null)} className="p-1 rounded hover:bg-surface-2 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <Avatar name={activeCandidate.student?.user?.name} size="lg" />
                <div>
                  <h3 className="type-h3">{activeCandidate.student?.user?.name}</h3>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{activeCandidate.student?.user?.email}</p>
                  <div className="mt-2"><StatusBadge status={activeCandidate.status} /></div>
                </div>
              </div>

              {/* Academic Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                <div><p className="type-label mb-1">Roll Number</p><p className="font-mono text-sm font-bold" style={{ color: 'var(--text)' }}>{activeCandidate.student?.rollNumber}</p></div>
                <div><p className="type-label mb-1">Branch</p><p className="font-sans text-sm font-bold" style={{ color: 'var(--text)' }}>{activeCandidate.student?.branch}</p></div>
                <div><p className="type-label mb-1">CGPA</p><p className="font-mono text-sm font-bold" style={{ color: 'var(--text)' }}>{activeCandidate.student?.cgpa}</p></div>
                <div><p className="type-label mb-1">Backlogs</p><p className="font-mono text-sm font-bold" style={{ color: 'var(--text)' }}>{activeCandidate.student?.backlogCount}</p></div>
              </div>

              {/* Skills */}
              {activeCandidate.student?.skills?.length > 0 && (
                <div>
                  <p className="type-label mb-2">Technical Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {activeCandidate.student.skills.map(s => (
                      <span key={s} className="px-2 py-1 rounded text-xs font-medium border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Resume */}
              <div>
                <p className="type-label mb-2">Resume</p>
                {activeCandidate.student?.resumePath ? (
                  <a href={activeCandidate.student.resumePath} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded border hover:border-accent transition-colors group" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded flex items-center justify-center bg-accent text-white"><FileText className="w-4 h-4" /></div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>View Document</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>PDF Format</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 group-hover:text-accent transition-colors" style={{ color: 'var(--text-muted)' }} />
                  </a>
                ) : (
                  <p className="text-sm italic" style={{ color: 'var(--text-subtle)' }}>No resume uploaded</p>
                )}
              </div>

              {/* Remarks */}
              {activeCandidate.remarks && (
                <div>
                  <p className="type-label mb-2">Internal Remarks</p>
                  <div className="p-3 rounded text-sm border" style={{ background: 'var(--warning-bg)', borderColor: 'var(--warning-border)', color: 'var(--warning-text)' }}>
                    {activeCandidate.remarks}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Actions */}
            <div className="p-5 border-t" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
              <p className="type-label mb-3">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {PIPELINE_STAGES.filter(s => s.id !== activeCandidate.status).map(stage => (
                  <button
                    key={stage.id}
                    onClick={() => { setActionModal({ appId: activeCandidate._id, status: stage.id, current: activeCandidate.status }); setActiveCandidate(null); }}
                    className="flex-1 py-2 px-3 rounded text-xs font-bold border transition-colors text-center"
                    style={{ background: 'var(--bg-surface)', borderColor: stage.color, color: stage.text }}
                    onMouseEnter={e => e.currentTarget.style.background = stage.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                  >
                    Move to {stage.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="cpm-card w-full max-w-md p-6 shadow-card-lg animate-fade-rise">
            <div className="flex items-center justify-between mb-5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="type-h3">Confirm Status Change</h2>
              <button onClick={() => setActionModal(null)} className="text-muted hover:text-ink transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="mb-6 flex items-center justify-center gap-4 p-4 rounded-lg border" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
              <div className="text-center">
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>From</p>
                <StatusBadge status={actionModal.current} />
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--border-strong)' }} />
              <div className="text-center">
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>To</p>
                <StatusBadge status={actionModal.status} />
              </div>
            </div>

            <div className="space-y-4">
              {actionModal.status === 'Interview Scheduled' && (
                <div>
                  <label className="form-label">Interview Date & Time</label>
                  <input type="datetime-local" className="form-input font-mono text-sm" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
                </div>
              )}
              <div>
                <label className="form-label">Internal Note (Optional)</label>
                <textarea className="form-textarea h-24" placeholder="Feedback or context for this decision..." value={remark} onChange={(e) => setRemark(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
              <button className="btn-primary flex-1 py-2.5" onClick={confirmAction} disabled={updating === actionModal.appId}>
                {updating === actionModal.appId ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent for the pipeline card
function CandidateCard({ app, onClick, onAction, isActive }) {
  const s = app.student;
  if (!s) return null;

  return (
    <div 
      className={`cpm-card p-3 cursor-pointer transition-all duration-200 border-2 ${isActive ? 'shadow-card-md' : 'hover:shadow-card'}`}
      style={{ borderColor: isActive ? 'var(--accent)' : 'transparent', background: 'var(--bg-surface)' }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="font-sans font-bold text-sm" style={{ color: 'var(--text)' }}>
          {s.user?.name}
        </div>
        <div className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded border" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          {s.cgpa}
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        <span className="truncate">{s.branch}</span>
        <span className="w-1 h-1 rounded-full" style={{ background: 'var(--border-strong)' }} />
        <span>{s.rollNumber}</span>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex -space-x-1">
          {/* Mock interviewers / reviewers could go here. For now, show resume badge */}
          {s.resumePath ? (
            <span className="flex items-center gap-1 text-2xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: 'var(--info-bg)', color: 'var(--info-text)' }}>
              <FileText className="w-3 h-3" /> PDF
            </span>
          ) : (
            <span className="text-2xs text-subtle italic">No Resume</span>
          )}
        </div>
        
        {/* Quick actions dropdown trigger placeholder, click card to open drawer is better UX for now */}
        <button 
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="text-2xs font-semibold px-2 py-1 rounded hover:bg-surface-2 transition-colors" 
          style={{ color: 'var(--accent)', border: '1px solid var(--accent)' }}
        >
          Review
        </button>
      </div>
    </div>
  );
}
