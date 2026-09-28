import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { placementApi } from '../../api/placementApi';
import { getApiError } from '../../utils/helpers';
import { StatusBadge, EmptyState, PageLoader, Avatar, CompanyAvatar } from '../../components/common/UI';
import PageHero from '../../components/common/PageHero';
import PageTitle from '../../components/common/PageTitle';
import { Users, FileText, Download, Check, X, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['Applied','Shortlisted','Interview Scheduled','Selected','Rejected'];

export default function DriveApplicants() {
  const { driveId }                 = useParams();
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('All');
  const [updating, setUpdating]     = useState(null);
  const [remarkModal, setRemarkModal] = useState(null);
  const [remark, setRemark]         = useState('');
  const [interviewDate, setInterviewDate] = useState('');

  const fetchApplicants = (status) =>
    placementApi.getDriveApplicants(driveId, status !== 'All' ? { status } : {})
      .then((r) => setData(r.data.data))
      .catch((err) => toast.error(getApiError(err)))
      .finally(() => setLoading(false));

  useEffect(() => { fetchApplicants(filter); }, [filter]);

  const openModal = (appId, status) => {
    setRemarkModal({ appId, status });
    setRemark('');
    setInterviewDate('');
  };

  const confirmUpdate = async () => {
    const { appId, status } = remarkModal;
    setUpdating(appId);
    setRemarkModal(null);
    try {
      await placementApi.updateAppStatus(appId, {
        status,
        remarks: remark || undefined,
        interviewDate: interviewDate || undefined,
      });
      toast.success(`Applicant status moved to "${status}"`);
      fetchApplicants(filter);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <PageLoader />;

  const applications = data?.applications || [];
  const drive        = data?.drive;

  return (
    <div className="animate-fade-rise relative min-h-screen">
      <PageTitle title={drive ? `${drive.company} — Applicants` : 'Applicants'} />
      <PageHero
        title={drive ? drive.company : 'Drive Applicants'}
        subtitle={drive ? `Managing applicants for the ${drive.jobRole} role.` : 'Managing applicants.'}
        actions={
          <Link to="/placement/drives" className="btn-secondary !bg-white/10 !text-white !border-white/20 hover:!bg-white/20">
            <ArrowLeft className="w-4 h-4" />
            Back to Drives
          </Link>
        }
      >
        {drive && (
          <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-navy-200">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-400" />
              <span className="font-mono text-white text-base font-bold">{data?.count ?? 0}</span> Total Applicants
            </div>
          </div>
        )}
      </PageHero>

      <div className="page-container max-w-7xl">
        
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {['All', ...STATUSES].map((s) => {
            const isActive = filter === s;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`inline-flex items-center px-4 py-2 rounded-sm text-sm font-sans font-medium transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-navy-600 text-white shadow-sm'
                    : 'bg-card text-muted border border-border hover:bg-warm hover:text-ink'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>

        {applications.length === 0 ? (
          <div className="mt-12">
            <EmptyState 
              icon={<Users className="w-8 h-8" />} 
              title="No applicants found" 
              message={filter === 'All' ? "No students have applied to this drive yet." : `There are no applicants with the status '${filter}'.`} 
            />
          </div>
        ) : (
          <div className="cpm-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="cpm-table cpm-table-zebra w-full">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Roll No.</th>
                    <th>Branch</th>
                    <th>CGPA</th>
                    <th className="text-center">Backlogs</th>
                    <th>Resume</th>
                    <th>Current Status</th>
                    <th>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const s = app.student;
                    return (
                      <tr key={app._id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <Avatar name={s?.user?.name} size="sm" />
                            <div>
                              <div className="font-sans font-semibold text-ink">{s?.user?.name}</div>
                              <div className="text-xs text-muted mt-0.5">{s?.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="font-mono text-xs">{s?.rollNumber}</td>
                        <td className="font-sans font-medium">{s?.branch}</td>
                        <td className="font-mono text-sm font-semibold">{s?.cgpa}</td>
                        <td className="text-center font-mono text-sm">{s?.backlogCount}</td>
                        <td>
                          {s?.resumePath ? (
                            <a href={s.resumePath} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-navy-600 hover:text-orange-600 font-sans text-xs font-semibold transition-colors">
                              <FileText className="w-3.5 h-3.5" /> View PDF
                            </a>
                          ) : (
                            <span className="text-subtle text-xs">—</span>
                          )}
                        </td>
                        <td>
                          <div className="flex flex-col gap-1.5 items-start">
                            <StatusBadge status={app.status} />
                            {app.remarks && <p className="text-2xs text-muted max-w-[140px] truncate" title={app.remarks}>{app.remarks}</p>}
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1.5">
                            {STATUSES.filter((s) => s !== app.status).map((nextStatus) => {
                              // Simplified actions visually
                              let btnClass = "px-2 py-1 text-2xs font-sans font-semibold rounded-sm transition-colors border ";
                              if (nextStatus === 'Selected')   btnClass += "bg-success-50 text-success-700 border-success-200 hover:bg-success-100";
                              else if (nextStatus === 'Rejected') btnClass += "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900";
                              else if (nextStatus === 'Shortlisted') btnClass += "bg-info-50 text-info-700 border-info-200 hover:bg-info-100";
                              else btnClass += "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100";

                              return (
                                <button
                                  key={nextStatus}
                                  onClick={() => openModal(app._id, nextStatus)}
                                  disabled={updating === app._id}
                                  className={btnClass}
                                >
                                  {nextStatus}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Remark Modal */}
        {remarkModal && (
          <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="cpm-card w-full max-w-md p-6 shadow-card-lg animate-fade-rise">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
                <h2 className="type-h3">Update Status</h2>
                <button onClick={() => setRemarkModal(null)} className="text-muted hover:text-ink transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-6 flex items-center gap-3 p-3 bg-warm rounded-sm border border-border">
                <span className="type-label mb-0">Moving to:</span>
                <StatusBadge status={remarkModal.status} />
              </div>

              <div className="space-y-4">
                {remarkModal.status === 'Interview Scheduled' && (
                  <div>
                    <label className="form-label">Interview Date & Time</label>
                    <input type="datetime-local" className="form-input font-mono text-sm"
                      value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
                  </div>
                )}
                <div>
                  <label className="form-label">Internal Remarks / Notes (Optional)</label>
                  <textarea className="form-textarea h-24" placeholder="Add notes for the student or internal reference..."
                    value={remark} onChange={(e) => setRemark(e.target.value)} />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6 pt-5 border-t border-border">
                <button className="btn-primary flex-1" onClick={confirmUpdate}>Confirm Update</button>
                <button className="btn-secondary flex-1" onClick={() => setRemarkModal(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
