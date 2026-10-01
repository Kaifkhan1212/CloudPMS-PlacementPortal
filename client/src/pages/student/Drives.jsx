import { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';
import { getApiError, formatDate, formatCTC, daysUntil } from '../../utils/helpers';
import { StatusBadge, EmptyState, PageLoader, CompanyAvatar, DeadlinePill } from '../../components/common/UI';
import PageHero from '../../components/common/PageHero';
import PageTitle from '../../components/common/PageTitle';
import { Briefcase, MapPin, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentDrives() {
  const [drives, setDrives]         = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [loading, setLoading]       = useState(true);
  const [applying, setApplying]     = useState(null);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const [drivesRes, appsRes] = await Promise.all([
        studentApi.getEligibleDrives({ applied: true }),
        studentApi.getMyApplications(),
      ]);
      setDrives(drivesRes.data.data.drives);
      const ids = new Set(appsRes.data.data.applications.map((a) => a.drive._id));
      setAppliedIds(ids);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrives(); }, []);

  const handleApply = async (driveId) => {
    setApplying(driveId);
    try {
      await studentApi.applyToDrive(driveId);
      toast.success('Application submitted successfully!');
      setAppliedIds((prev) => new Set([...prev, driveId]));
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setApplying(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-rise">
      <PageTitle title="Browse Drives" />
      <PageHero
        title="Browse Drives"
        subtitle="Explore and apply to curated placement opportunities matching your academic profile."
      />

      <div className="page-container">
        {drives.length === 0 ? (
          <EmptyState
            icon={<Search className="w-8 h-8" strokeWidth={1.5} />}
            title="No open drives currently"
            message="There are no active placement drives matching your eligibility right now. Check back soon."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {drives.map((drive) => {
              const isApplied = appliedIds.has(drive._id);
              const isExpired = new Date(drive.deadline) < new Date();
              const deadlineDays = daysUntil(drive.deadline);

              return (
                <div key={drive._id} className="drive-card group">
                  <div className="drive-card-body flex flex-col gap-4">
                    {/* Header: Avatar, Status */}
                    <div className="flex items-start justify-between">
                      <CompanyAvatar name={drive.company} size="md" />
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={drive.status} />
                        {!isApplied && <DeadlinePill daysText={deadlineDays} isExpired={isExpired} />}
                      </div>
                    </div>

                    {/* Company & Role */}
                    <div>
                      <h2
                        className="font-serif text-lg font-bold transition-colors group-hover:text-orange-500"
                        style={{ color: 'var(--text)' }}
                      >
                        {drive.company}
                      </h2>
                      <p className="font-sans text-sm font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {drive.jobRole}
                      </p>
                    </div>

                    {/* Package highlights */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="inline-block px-2.5 py-1 font-mono text-sm font-bold rounded-md"
                        style={{ background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)' }}
                      >
                        {formatCTC(drive.ctc)}
                      </span>
                      {drive.venue && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-sans font-medium rounded-md"
                          style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                        >
                          <MapPin className="w-3 h-3" />
                          {drive.venue}
                        </span>
                      )}
                    </div>

                    {/* Eligibility summary */}
                    <div className="mt-2 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                      <p className="type-caption uppercase tracking-wider mb-2">Eligibility</p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                        <div>
                          <p className="text-2xs font-medium" style={{ color: 'var(--text-subtle)' }}>Branches</p>
                          <p
                            className="text-xs font-semibold mt-0.5 truncate"
                            style={{ color: 'var(--text)' }}
                            title={drive.eligibility.allowedBranches.join(', ')}
                          >
                            {drive.eligibility.allowedBranches.join(', ')}
                          </p>
                        </div>
                        <div>
                          <p className="text-2xs font-medium" style={{ color: 'var(--text-subtle)' }}>Min CGPA</p>
                          <p className="text-xs font-mono font-medium mt-0.5" style={{ color: 'var(--text)' }}>
                            {drive.eligibility.minCgpa}
                          </p>
                        </div>
                        <div>
                          <p className="text-2xs font-medium" style={{ color: 'var(--text-subtle)' }}>Max Backlogs</p>
                          <p className="text-xs font-mono font-medium mt-0.5" style={{ color: 'var(--text)' }}>
                            {drive.eligibility.maxBacklogs}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="drive-card-footer mt-auto pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    {isApplied ? (
                      <div
                        className="w-full flex items-center justify-center gap-2 py-2.5 font-sans text-sm font-semibold rounded-md"
                        style={{ background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)' }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Applied
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApply(drive._id)}
                        disabled={isExpired || applying === drive._id}
                        className="btn-apply w-full"
                      >
                        {applying === drive._id ? 'Submitting…' : isExpired ? 'Deadline Passed' : 'Apply Now'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
