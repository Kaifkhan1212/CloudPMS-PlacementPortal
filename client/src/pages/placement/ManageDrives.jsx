import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { placementApi } from '../../api/placementApi';
import { getApiError, formatDate, formatCTC, daysUntil } from '../../utils/helpers';
import { StatusBadge, EmptyState, PageLoader, GhostCard, CompanyAvatar, DeadlinePill } from '../../components/common/UI';
import PageHero from '../../components/common/PageHero';
import PageTitle from '../../components/common/PageTitle';
import { Plus, Building2, MapPin, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const BRANCHES = ['MCA','BCA','BBA','BSc IT','BCom'];
const EMPTY_FORM = {
  company:'', jobRole:'', ctc:'', description:'',
  deadline:'', driveDate:'', venue:'',
  minCgpa: '6.0', allowedBranches: ['MCA'], maxBacklogs: '0',
};

function DriveForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleBranch = (b) =>
    setForm((f) => ({
      ...f,
      allowedBranches: f.allowedBranches.includes(b)
        ? f.allowedBranches.filter((x) => x !== b)
        : [...f.allowedBranches, b],
    }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.allowedBranches.length === 0) { toast.error('Select at least one branch'); return; }
    onSubmit({
      company: form.company, jobRole: form.jobRole,
      ctc: parseFloat(form.ctc), description: form.description,
      deadline: form.deadline, driveDate: form.driveDate || undefined,
      venue: form.venue,
      eligibility: {
        minCgpa: parseFloat(form.minCgpa),
        allowedBranches: form.allowedBranches,
        maxBacklogs: parseInt(form.maxBacklogs, 10),
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
      
      {/* SECTION: Company & Role */}
      <div>
        <h3 className="type-h4 mb-4 pb-2 border-b border-border">1. Company & Role</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="form-label">Company Name *</label>
            <input className="form-input" placeholder="e.g. Google, Microsoft" value={form.company} onChange={set('company')} required />
          </div>
          <div>
            <label className="form-label">Job Role *</label>
            <input className="form-input" placeholder="e.g. Software Engineer" value={form.jobRole} onChange={set('jobRole')} required />
          </div>
        </div>
      </div>

      {/* SECTION: Compensation & Logistics */}
      <div>
        <h3 className="type-h4 mb-4 pb-2 border-b border-border">2. Compensation & Logistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="form-label">CTC (LPA) *</label>
            <input className="form-input font-mono" type="number" min="0" step="0.1" placeholder="e.g. 12.5" value={form.ctc} onChange={set('ctc')} required />
          </div>
          <div>
            <label className="form-label">Venue</label>
            <input className="form-input" placeholder="e.g. Main Auditorium / Online" value={form.venue} onChange={set('venue')} />
          </div>
        </div>
      </div>

      {/* SECTION: Dates */}
      <div>
        <h3 className="type-h4 mb-4 pb-2 border-b border-border">3. Important Dates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="form-label">Application Deadline *</label>
            <input className="form-input font-mono text-sm" type="datetime-local" value={form.deadline} onChange={set('deadline')} required />
          </div>
          <div>
            <label className="form-label">Drive Date / Interview Date</label>
            <input className="form-input font-mono text-sm" type="datetime-local" value={form.driveDate} onChange={set('driveDate')} />
          </div>
        </div>
      </div>

      {/* SECTION: Eligibility */}
      <div>
        <h3 className="type-h4 mb-4 pb-2 border-b border-border">4. Eligibility Criteria</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="form-label">Minimum CGPA</label>
            <input className="form-input font-mono" type="number" min="0" max="10" step="0.1" value={form.minCgpa} onChange={set('minCgpa')} />
          </div>
          <div>
            <label className="form-label">Max Active Backlogs Allowed</label>
            <input className="form-input font-mono" type="number" min="0" value={form.maxBacklogs} onChange={set('maxBacklogs')} />
          </div>
        </div>
        <div>
          <label className="form-label">Allowed Branches *</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {BRANCHES.map((b) => {
              const isSelected = form.allowedBranches.includes(b);
              return (
                <button
                  key={b} type="button"
                  onClick={() => toggleBranch(b)}
                  className={`px-4 py-2 rounded-sm text-sm font-sans font-medium transition-all ${
                    isSelected
                      ? 'bg-navy-600 text-white shadow-sm'
                      : 'bg-card text-muted border border-border hover:bg-warm hover:text-ink'
                  }`}
                >
                  {b}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION: Description */}
      <div>
        <h3 className="type-h4 mb-4 pb-2 border-b border-border">5. Description</h3>
        <div>
          <label className="form-label hidden">Description</label>
          <textarea className="form-textarea h-32" placeholder="Add any specific requirements, job description links, or instructions..." value={form.description} onChange={set('description')} />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-6 border-t border-border">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Publishing…' : (initial ? 'Update Drive' : 'Publish Drive')}
        </button>
        {onCancel && <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

export default function PlacementDrives() {
  const [drives, setDrives]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editDrive, setEditDrive] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [filter, setFilter]     = useState('All');

  const fetchDrives = () =>
    placementApi.getMyDrives()
      .then((r) => setDrives(r.data.data.drives))
      .catch((err) => toast.error(getApiError(err)))
      .finally(() => setLoading(false));

  useEffect(() => { fetchDrives(); }, []);

  const handleCreate = async (payload) => {
    setSaving(true);
    try {
      await placementApi.createDrive(payload);
      toast.success('New drive published successfully!');
      setShowForm(false);
      fetchDrives();
    } catch (err) { toast.error(getApiError(err)); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (payload) => {
    setSaving(true);
    try {
      await placementApi.updateDrive(editDrive._id, payload);
      toast.success('Drive updated.');
      setEditDrive(null);
      fetchDrives();
    } catch (err) { toast.error(getApiError(err)); }
    finally { setSaving(false); }
  };

  const handleClose = async (id) => {
    if (!window.confirm('Are you sure you want to close this drive? Students will no longer be able to apply.')) return;
    try {
      await placementApi.closeDrive(id);
      toast.success('Drive marked as completed.');
      fetchDrives();
    } catch (err) { toast.error(getApiError(err)); }
  };

  if (loading) return <PageLoader />;

  const filteredDrives = filter === 'All' 
    ? drives 
    : drives.filter(d => d.status === filter);

  return (
    <div className="animate-fade-rise">
      <PageTitle title="Manage Drives" />
      <PageHero
        title="Placement Drives"
        subtitle="Create and monitor campus recruitment drives. Manage applications and shortlisting."
        actions={
          <button
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-sm text-sm font-sans font-semibold transition-all shadow-sm hover:-translate-y-px"
            onClick={() => { setShowForm(true); setEditDrive(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            <Plus className="w-4 h-4" />
            Publish New Drive
          </button>
        }
      />
      <div className="page-container max-w-6xl">

      {/* Create / Edit Form */}
      {(showForm || editDrive) && (
        <div className="cpm-card mb-10 shadow-card-md border-navy-200">
          <div className="card-header bg-navy-50/50">
            <h2 className="type-h3">{editDrive ? `Edit Drive: ${editDrive.company}` : 'Publish New Drive'}</h2>
          </div>
          <div className="card-body">
            <DriveForm
              initial={editDrive ? {
                ...editDrive,
                minCgpa: editDrive.eligibility.minCgpa,
                allowedBranches: editDrive.eligibility.allowedBranches,
                maxBacklogs: editDrive.eligibility.maxBacklogs,
                deadline: editDrive.deadline ? editDrive.deadline.slice(0,16) : '',
                driveDate: editDrive.driveDate ? editDrive.driveDate.slice(0,16) : '',
              } : null}
              onSubmit={editDrive ? handleUpdate : handleCreate}
              onCancel={() => { setShowForm(false); setEditDrive(null); }}
              loading={saving}
            />
          </div>
        </div>
      )}

      {!showForm && !editDrive && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-2 mb-6">
            {['All', 'Upcoming', 'Ongoing', 'Completed'].map(s => {
               const count = s === 'All' ? drives.length : drives.filter(d => d.status === s).length;
               const isActive = filter === s;
               return (
                 <button
                   key={s}
                   onClick={() => setFilter(s)}
                   className={`inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-sans font-medium transition-all ${
                     isActive
                       ? 'bg-navy-600 text-white shadow-sm'
                       : 'bg-card text-muted border border-border hover:bg-warm hover:text-ink'
                   }`}
                 >
                   {s}
                   <span className={`px-1.5 py-0.5 rounded text-2xs font-mono font-bold ${isActive ? 'bg-white/20' : 'bg-warm text-muted'}`}>
                     {count}
                   </span>
                 </button>
               );
            })}
          </div>

          {/* Drives list */}
          {filteredDrives.length === 0 ? (
            <div className="mt-8">
              <EmptyState 
                icon={<Search className="w-8 h-8" />}
                title={filter === 'All' ? "No drives posted yet" : `No ${filter.toLowerCase()} drives`}
                message={filter === 'All' ? "Use the 'Publish New Drive' button above to create your first placement drive." : `You don't have any drives matching the status '${filter}'.`}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDrives.map((drive) => {
                const isExpired = new Date(drive.deadline) < new Date();
                const deadlineDays = daysUntil(drive.deadline);
                
                return (
                  <div key={drive._id} className="drive-card !flex-row group">
                    <div className="drive-card-body !py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      
                      {/* Left: Info */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="hidden sm:block mt-1">
                          <CompanyAvatar name={drive.company} size="lg" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h2 className="type-h3 group-hover:text-orange-600 transition-colors">{drive.company}</h2>
                            <StatusBadge status={drive.status} />
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
                            <span className="type-body font-medium">{drive.jobRole}</span>
                            <span className="text-border">|</span>
                            <span className="font-mono font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200 text-sm">
                              {formatCTC(drive.ctc)}
                            </span>
                            {drive.venue && (
                              <>
                                <span className="text-border">|</span>
                                <span className="flex items-center gap-1 text-xs text-muted font-medium">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {drive.venue}
                                </span>
                              </>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                            <div>
                              <span className="type-label block mb-0.5">Deadline</span>
                              <span className="font-sans font-medium text-ink flex items-center gap-1.5">
                                {formatDate(drive.deadline)}
                                {drive.status !== 'Completed' && (
                                  <span className={`text-2xs font-semibold px-1 rounded-sm ${isExpired ? 'bg-slate-100 text-slate-500' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>
                                    {deadlineDays}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="type-label block mb-0.5">Min CGPA</span>
                              <span className="font-mono text-ink">{drive.eligibility.minCgpa}</span>
                            </div>
                            <div>
                              <span className="type-label block mb-0.5">Branches</span>
                              <span className="font-sans font-medium text-ink">{drive.eligibility.allowedBranches.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Metrics & Actions */}
                      <div className="w-full sm:w-auto flex sm:flex-col items-center justify-between gap-4 border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-6">
                        <div className="text-center sm:text-right w-full sm:w-auto">
                          <p className="font-mono text-3xl font-bold text-ink leading-none">{drive.applicantCount}</p>
                          <p className="type-label mt-1">Applicants</p>
                        </div>
                        
                        <div className="flex flex-col gap-2 w-full sm:w-32">
                          <Link to={`/placement/drives/${drive._id}/applicants`} className="btn-primary w-full text-center">
                            Manage
                          </Link>
                          {drive.status !== 'Completed' && (
                            <div className="flex gap-2">
                              <button onClick={() => { setEditDrive(drive); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="btn-secondary flex-1 px-0 text-xs">
                                Edit
                              </button>
                              <button onClick={() => handleClose(drive._id)} className="btn-ghost flex-1 px-0 text-xs text-muted hover:text-error-600 hover:bg-error-50">
                                Close
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
              
              {filter === 'All' && (
                <div className="mt-6">
                  <GhostCard
                    icon={<Building2 className="w-8 h-8" />}
                    title="Publish another drive"
                    description="Bring more companies to campus and expand opportunities for students."
                    onClick={() => { setShowForm(true); setEditDrive(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    buttonLabel="New Drive"
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
