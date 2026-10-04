import { useState, useEffect, useMemo } from 'react';
import { placementApi } from '../../api/placementApi';
import { getApiError, formatDate } from '../../utils/helpers';
import { PageLoader, EmptyState, Avatar, StatusBadge } from '../../components/common/UI';
import PageHero from '../../components/common/PageHero';
import PageTitle from '../../components/common/PageTitle';
import { Calendar, Search, Clock, MapPin, CheckCircle2, XCircle, FileText, ChevronRight, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [viewingResume, setViewingResume] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Upcoming'); // Upcoming, Today, Completed
  const [companyFilter, setCompanyFilter] = useState('');
  
  // Modal
  const [actionModal, setActionModal] = useState(null);
  const [remark, setRemark] = useState('');
  const [newDate, setNewDate] = useState('');
  
  // Detail Drawer
  const [activeInterview, setActiveInterview] = useState(null);

  useEffect(() => {
    fetchAllInterviews();
  }, []);

  const fetchAllInterviews = async () => {
    try {
      setLoading(true);
      // 1. Fetch all drives
      const drivesRes = await placementApi.getMyDrives();
      const drives = drivesRes.data.data.drives || [];

      // 2. Fetch applicants for all drives
      const appPromises = drives.map(d => placementApi.getDriveApplicants(d._id, {}));
      const appsRes = await Promise.all(appPromises);

      // 3. Extract applications that have an interview scheduled (either pending, selected, or rejected)
      const allInterviews = [];
      appsRes.forEach((res, index) => {
        const drive = drives[index];
        const applications = res.data.data.applications || [];
        applications.forEach(app => {
          // If they have an interviewDate OR they are currently in 'Interview Scheduled' status
          if (app.interviewDate || app.status === 'Interview Scheduled') {
            allInterviews.push({
              ...app,
              drive // Attach drive info for display
            });
          }
        });
      });

      // Sort by date ascending
      allInterviews.sort((a, b) => new Date(a.interviewDate || a.createdAt) - new Date(b.interviewDate || b.createdAt));
      setInterviews(allInterviews);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionModal) return;
    const { appId, type } = actionModal;
    setUpdating(appId);
    
    try {
      let payload = {};
      if (type === 'reschedule') {
        payload = { status: 'Interview Scheduled', interviewDate: newDate, remarks: remark };
      } else if (type === 'select') {
        payload = { status: 'Selected', remarks: remark };
      } else if (type === 'reject') {
        payload = { status: 'Rejected', remarks: remark };
      }

      await placementApi.updateAppStatus(appId, payload);
      toast.success('Interview updated successfully');
      
      // Update local state
      setInterviews(prev => prev.map(inv => {
        if (inv._id === appId) {
          return { ...inv, status: payload.status, remarks: payload.remarks || inv.remarks, interviewDate: payload.interviewDate || inv.interviewDate };
        }
        return inv;
      }));
      
      if (activeInterview?._id === appId) {
        setActiveInterview(prev => ({ ...prev, status: payload.status, remarks: payload.remarks || prev.remarks, interviewDate: payload.interviewDate || prev.interviewDate }));
      }
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setUpdating(null);
      setActionModal(null);
      setRemark('');
      setNewDate('');
    }
  };

  const handleViewResume = async () => {
    if (!activeInterview?.student?._id) return;
    setViewingResume(true);
    try {
      const res = await placementApi.getStudentResumeView(activeInterview.student._id);
      window.open(res.data.data.url, '_blank');
    } catch (err) {
      toast.error(getApiError(err) || 'Failed to open resume');
    } finally {
      setViewingResume(false);
    }
  };

  const companies = [...new Set(interviews.map(i => i.drive.company))];

  const filteredInterviews = useMemo(() => {
    return interviews.filter(inv => {
      const matchSearch = inv.student?.user?.name?.toLowerCase().includes(search.toLowerCase()) || 
                          inv.student?.rollNumber?.toLowerCase().includes(search.toLowerCase());
      const matchCompany = companyFilter ? inv.drive.company === companyFilter : true;
      
      let matchStatus = true;
      const today = new Date();
      today.setHours(0,0,0,0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const invDate = inv.interviewDate ? new Date(inv.interviewDate) : null;
      const isCompleted = inv.status === 'Selected' || inv.status === 'Rejected';
      
      if (statusFilter === 'Completed') {
        matchStatus = isCompleted;
      } else if (statusFilter === 'Today') {
        matchStatus = !isCompleted && invDate && invDate >= today && invDate < tomorrow;
      } else if (statusFilter === 'Upcoming') {
        matchStatus = !isCompleted && (!invDate || invDate >= tomorrow);
      } else if (statusFilter === 'All') {
        matchStatus = true;
      }

      return matchSearch && matchCompany && matchStatus;
    });
  }, [interviews, search, companyFilter, statusFilter]);

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-rise flex flex-col min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <PageTitle title="Interview Workspace" />
      <PageHero
        title="Interviews"
        subtitle="Manage upcoming interview schedules, evaluate candidates, and record final decisions."
      />

      <div className="page-container max-w-7xl flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide w-full md:w-auto">
            {['Upcoming', 'Today', 'Completed', 'All'].map((s) => {
              const isActive = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="inline-flex items-center px-4 py-2 rounded-md text-sm font-sans font-medium transition-all duration-150 flex-shrink-0"
                  style={isActive
                    ? { background: 'var(--accent)', color: '#fff', border: '1.5px solid var(--accent)' }
                    : { background: 'var(--bg-surface-2)', color: 'var(--text-muted)', border: '1.5px solid var(--border)' }
                  }
                >
                  {s}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            <div className="relative flex-1 md:w-56 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search candidate..."
                className="form-input !pl-9 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="form-select flex-1 md:w-48 min-w-0" 
              value={companyFilter} 
              onChange={e => setCompanyFilter(e.target.value)}
            >
              <option value="">All Companies</option>
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Timeline List */}
        {filteredInterviews.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-8 h-8" />}
            title="No interviews found"
            message={`No interviews match the '${statusFilter}' filter criteria.`}
          />
        ) : (
          <div className="space-y-5 relative mt-4 md:mt-2">
            {/* Vertical timeline line */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 hidden md:block" style={{ background: 'var(--border)' }}></div>

            {filteredInterviews.map((inv) => {
              const dateObj = inv.interviewDate ? new Date(inv.interviewDate) : null;
              const timeString = dateObj ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD';
              const dateString = dateObj ? dateObj.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) : 'Date TBD';
              
              const isCompleted = inv.status === 'Selected' || inv.status === 'Rejected';
              const isSelected = inv.status === 'Selected';

              return (
                <div key={inv._id} className="relative flex items-start gap-4 md:gap-8 group cursor-pointer" onClick={() => setActiveInterview(inv)}>
                  {/* Timeline dot */}
                  <div className="hidden md:flex flex-shrink-0 mt-6 w-12 justify-center relative z-10">
                    <div 
                      className="w-4 h-4 rounded-full border-2 transition-transform duration-300 group-hover:scale-125 group-hover:shadow-glow" 
                      style={{ 
                        background: 'var(--bg-page)', 
                        borderColor: isCompleted ? (isSelected ? 'var(--success-fill)' : 'var(--error-fill)') : 'var(--accent)'
                      }} 
                    />
                  </div>

                  {/* Card */}
                  <div className="interview-card cpm-card flex-1 flex flex-col md:flex-row gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-md" style={{ borderLeft: `4px solid ${isCompleted ? (isSelected ? 'var(--success-border)' : 'var(--error-border)') : 'var(--accent)'}` }}>
                    
                    {/* Left: Time & Candidate */}
                    <div className="flex-1 flex items-start gap-4">
                      <Avatar name={inv.student?.user?.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-lg font-bold truncate group-hover:text-accent transition-colors" style={{ color: 'var(--text)' }}>
                          {inv.student?.user?.name}
                        </h3>
                        <p className="font-sans text-sm font-medium mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                          {inv.student?.branch} • {inv.student?.rollNumber}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold px-2.5 py-1 rounded-md" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                            <Clock className="w-3.5 h-3.5" /> 
                            <span className="font-mono text-xs">{dateString}, {timeString}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold px-2.5 py-1 rounded-md" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                            <MapPin className="w-3.5 h-3.5" /> 
                            <span className="truncate max-w-[120px] sm:max-w-none">{inv.drive.venue || 'Virtual'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Drive & Status */}
                    <div className="interview-card-right md:w-64 flex flex-col md:items-end justify-center md:text-right gap-3 border-t md:border-t-0 pt-4 md:pt-0" style={{ borderColor: 'var(--border)' }}>
                      <div>
                        <p className="font-sans font-bold text-sm" style={{ color: 'var(--text)' }}>{inv.drive.company}</p>
                        <p className="font-sans text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{inv.drive.jobRole}</p>
                      </div>
                      <StatusBadge status={inv.status} />
                      
                      {!isCompleted && (
                        <div className="flex gap-2 w-full md:w-auto mt-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActionModal({ appId: inv._id, type: 'select' }); }}
                            className="flex-1 md:flex-none px-3 py-1.5 rounded-md text-xs font-sans font-bold transition-all hover:brightness-110"
                            style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success-text)' }}
                          >
                            Select
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActionModal({ appId: inv._id, type: 'reject' }); }}
                            className="flex-1 md:flex-none px-3 py-1.5 rounded-md text-xs font-sans font-bold transition-all hover:brightness-110"
                            style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error-text)' }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Candidate Detail Drawer */}
      {activeInterview && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md h-full shadow-card-lg animate-slide-in flex flex-col" style={{ background: 'var(--bg-surface)' }}>
            <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
              <h2 className="type-h4 mb-0">Interview Details</h2>
              <button onClick={() => setActiveInterview(null)} className="p-1 rounded hover:bg-surface-2 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <Avatar name={activeInterview.student?.user?.name} size="lg" />
                <div>
                  <h3 className="type-h3">{activeInterview.student?.user?.name}</h3>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>{activeInterview.student?.user?.email}</p>
                  <StatusBadge status={activeInterview.status} />
                </div>
              </div>

              {/* Schedule Info */}
              <div className="p-4 rounded-lg border" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                <p className="type-label mb-3">Schedule Information</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Company</span>
                    <span className="text-sm font-semibold text-right" style={{ color: 'var(--text)' }}>{activeInterview.drive.company}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Date &amp; Time</span>
                    <span className="text-sm font-mono font-bold" style={{ color: 'var(--text)' }}>
                      {activeInterview.interviewDate ? new Date(activeInterview.interviewDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'TBD'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Mode / Venue</span>
                    <span className="text-sm font-semibold text-right" style={{ color: 'var(--text)' }}>{activeInterview.drive.venue || 'Virtual'}</span>
                  </div>
                </div>
              </div>

              {/* Academic Overview */}
              <div>
                <p className="type-label mb-2">Candidate Overview</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="p-3 rounded border" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                    <p className="text-2xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-subtle)' }}>Branch</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{activeInterview.student?.branch}</p>
                  </div>
                  <div className="p-3 rounded border" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                    <p className="text-2xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-subtle)' }}>CGPA</p>
                    <p className="text-sm font-mono font-bold" style={{ color: 'var(--text)' }}>{activeInterview.student?.cgpa}</p>
                  </div>
                </div>
                {activeInterview.student?.resumePath && (
                  <button onClick={handleViewResume} disabled={viewingResume} className="w-full text-left flex items-center justify-between p-3 rounded border hover:border-accent transition-colors group disabled:opacity-50" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded flex items-center justify-center bg-accent text-white"><FileText className="w-4 h-4" /></div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                          {viewingResume ? 'Generating Secure Link...' : 'View Resume'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 group-hover:text-accent transition-colors" style={{ color: 'var(--text-muted)' }} />
                  </button>
                )}
              </div>

              {/* Internal Notes */}
              {activeInterview.remarks && (
                <div>
                  <p className="type-label mb-2">Internal Notes</p>
                  <div className="p-3 rounded text-sm border font-sans" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                    {activeInterview.remarks}
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            {activeInterview.status === 'Interview Scheduled' && (
              <div className="p-5 border-t space-y-3" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                <button 
                  className="w-full py-2.5 rounded-md text-sm font-sans font-bold transition-all hover:brightness-110 flex items-center justify-center gap-2"
                  style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success-text)' }}
                  onClick={() => { setActionModal({ appId: activeInterview._id, type: 'select' }); setActiveInterview(null); }}
                >
                  <CheckCircle2 className="w-4 h-4" /> Final Selection (Offer)
                </button>
                <div className="flex gap-3">
                  <button 
                    className="flex-1 py-2 rounded-md text-sm font-sans font-bold transition-colors hover:bg-surface"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    onClick={() => { 
                      setNewDate(activeInterview.interviewDate ? new Date(activeInterview.interviewDate).toISOString().slice(0, 16) : '');
                      setActionModal({ appId: activeInterview._id, type: 'reschedule' }); 
                      setActiveInterview(null); 
                    }}
                  >
                    Reschedule
                  </button>
                  <button 
                    className="flex-1 py-2 rounded-md text-sm font-sans font-bold transition-all hover:brightness-110"
                    style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error-text)' }}
                    onClick={() => { setActionModal({ appId: activeInterview._id, type: 'reject' }); setActiveInterview(null); }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="cpm-card w-full max-w-md p-6 shadow-card-lg animate-fade-rise">
            <h2 className="type-h3 mb-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
              {actionModal.type === 'reschedule' ? 'Reschedule Interview' : actionModal.type === 'select' ? 'Confirm Selection' : 'Confirm Rejection'}
            </h2>
            
            <div className="space-y-4">
              {actionModal.type === 'reschedule' && (
                <div>
                  <label className="form-label">New Date & Time</label>
                  <input type="datetime-local" className="form-input font-mono text-sm" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                </div>
              )}
              <div>
                <label className="form-label">Internal Note / Feedback (Optional)</label>
                <textarea className="form-textarea h-24" placeholder="Add details for this action..." value={remark} onChange={(e) => setRemark(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
              <button 
                className="btn-primary flex-1 py-2.5" 
                onClick={handleAction} 
                disabled={updating === actionModal.appId || (actionModal.type === 'reschedule' && !newDate)}
              >
                {updating === actionModal.appId ? 'Updating...' : 'Confirm'}
              </button>
              <button className="btn-secondary flex-1 py-2.5" onClick={() => setActionModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
