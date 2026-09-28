import { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';
import { getApiError, formatDate, formatCTC, daysUntil } from '../../utils/helpers';
import { StatusBadge, EmptyState, PageLoader, CompanyAvatar, DeadlinePill } from '../../components/common/UI';
import PageHero from '../../components/common/PageHero';
import PageTitle from '../../components/common/PageTitle';
import { Briefcase, MapPin, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentDrives() {
  const [drives, setDrives]           = useState([]);
  const [appliedIds, setAppliedIds]   = useState(new Set());
  const [loading, setLoading]         = useState(true);
  const [applying, setApplying]       = useState(null);

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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                      <h2 className="type-h3 group-hover:text-orange-600 transition-colors">{drive.company}</h2>
                      <p className="type-body font-medium mt-0.5">{drive.jobRole}</p>
                    </div>

                    {/* Package highlights */}
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-2.5 py-1 bg-green-50 text-green-700 font-mono text-sm font-bold rounded-sm border border-green-200">
                        {formatCTC(drive.ctc)}
                      </span>
                      {drive.venue && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-sans font-medium text-muted bg-warm rounded-sm border border-border">
                          <MapPin className="w-3 h-3" />
                          {drive.venue}
                        </span>
                      )}
                    </div>

                    {/* Eligibility summary */}
                    <div className="mt-2 pt-4 border-t border-border">
                      <p className="type-caption uppercase tracking-wider mb-2">Eligibility</p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                        <div>
                          <p className="text-2xs text-subtle font-medium">Branches</p>
                          <p className="text-xs text-ink font-semibold mt-0.5 truncate" title={drive.eligibility.allowedBranches.join(', ')}>
                            {drive.eligibility.allowedBranches.join(', ')}
                          </p>
                        </div>
                        <div>
                          <p className="text-2xs text-subtle font-medium">Min CGPA</p>
                          <p className="text-xs text-ink font-mono font-medium mt-0.5">{drive.eligibility.minCgpa}</p>
                        </div>
                        <div>
                          <p className="text-2xs text-subtle font-medium">Max Backlogs</p>
                          <p className="text-xs text-ink font-mono font-medium mt-0.5">{drive.eligibility.maxBacklogs}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="drive-card-footer mt-auto pt-4 border-t border-border/50">
                    {isApplied ? (
                      <div className="w-full flex items-center justify-center gap-2 py-2.5 bg-success-50 text-success-700 font-sans text-sm font-semibold border border-success-500/20 rounded-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Applied
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApply(drive._id)}
                        disabled={isExpired || applying === drive._id}
                        className="btn-apply w-full shadow-sm"
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
