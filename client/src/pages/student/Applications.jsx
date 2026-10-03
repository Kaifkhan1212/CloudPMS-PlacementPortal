import { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';
import { getApiError, formatDate, formatCTC } from '../../utils/helpers';
import { StatusBadge, EmptyState, PageLoader, CompanyAvatar } from '../../components/common/UI';
import PageHero from '../../components/common/PageHero';
import PageTitle from '../../components/common/PageTitle';
import { FileText, MapPin, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const TRACKER_NODES = ['Applied', 'Shortlisted', 'Interview Scheduled', 'Selected'];
const ALL_STATUSES  = ['Applied', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'];

export default function StudentApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('All');

  useEffect(() => {
    studentApi.getMyApplications()
      .then((r) => setApplications(r.data.data.applications))
      .catch((err) => toast.error(getApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? applications : applications.filter((a) => a.status === filter);

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-rise">
      <PageTitle title="My Applications" />
      <PageHero
        title="My Applications"
        subtitle="Track the status of all your campus placement applications in real-time."
      />

      <div className="page-container max-w-5xl">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {['All', ...ALL_STATUSES].map((s) => {
            const count    = s === 'All' ? applications.length : applications.filter(a => a.status === s).length;
            const isActive = filter === s;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-sans font-medium transition-all duration-150 flex-shrink-0"
                style={isActive
                  ? { background: 'var(--accent)', color: '#fff', border: '1.5px solid var(--accent)' }
                  : { background: 'var(--bg-surface-2)', color: 'var(--text-muted)', border: '1.5px solid var(--border)' }
                }
              >
                {s}
                <span
                  className="px-1.5 py-0.5 rounded text-2xs font-mono font-bold"
                  style={isActive
                    ? { background: 'rgba(255,255,255,0.2)', color: '#fff' }
                    : { background: 'var(--border)', color: 'var(--text-muted)' }
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              icon={<FileText className="w-8 h-8" strokeWidth={1.5} />}
              title="No applications found"
              message={filter === 'All'
                ? "You haven't applied to any drives yet. Check the Browse tab to discover opportunities."
                : `You don't have any applications with the status '${filter}'.`}
            />
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map((app) => {
              const isRejected = app.status === 'Rejected';
              const activeIdx  = ALL_STATUSES.indexOf(app.status);
              let fillPercent  = 0;
              if (isRejected)        fillPercent = 100;
              else if (activeIdx >= 0) fillPercent = (activeIdx / (TRACKER_NODES.length - 1)) * 100;

              return (
                <div
                  key={app._id}
                  className="cpm-card group"
                  style={isRejected ? { opacity: 0.75 } : {}}
                >
                  <div className="card-body">
                    {/* Top Section */}
                    <div className="flex items-start justify-between flex-col sm:flex-row flex-wrap gap-4 mb-6">
                      {/* Left: Company & Drive Info */}
                      <div className="flex items-start gap-3 sm:gap-4">
                        <CompanyAvatar name={app.drive.company} size="lg" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                            <h2
                              className="font-serif text-lg sm:text-xl font-bold transition-colors group-hover:text-orange-500 break-words"
                              style={{ color: 'var(--text)' }}
                            >
                              {app.drive.company}
                            </h2>
                            <StatusBadge status={app.status} />
                          </div>
                          <p className="font-sans text-sm font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
                            {app.drive.jobRole}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
                            <span
                              className="font-mono text-sm font-bold px-2 py-0.5 rounded"
                              style={{ background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)' }}
                            >
                              {formatCTC(app.drive.ctc)}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs font-sans font-medium" style={{ color: 'var(--text-muted)' }}>
                              <Calendar className="w-3.5 h-3.5" />
                              Applied: {formatDate(app.appliedAt)}
                            </span>
                            {app.drive.venue && (
                              <span className="flex items-center gap-1.5 text-xs font-sans font-medium" style={{ color: 'var(--text-muted)' }}>
                                <MapPin className="w-3.5 h-3.5" />
                                {app.drive.venue}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Remarks */}
                      {(app.remarks || isRejected) && (
                        <div
                          className="p-3 rounded-lg max-w-sm w-full md:w-auto"
                          style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}
                        >
                          <p className="type-label mb-1">Status Note</p>
                          <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
                            {app.remarks || (isRejected && 'The company has decided not to proceed with your application at this time.')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Timeline Tracker */}
                    <div className="relative pt-4 pb-10 px-2 sm:px-4 mt-4 overflow-x-hidden" style={{ borderTop: '1px solid var(--border)' }}>
                      <div className="tracker-rail">
                        <div
                          className="tracker-fill"
                          style={{
                            width: `${fillPercent}%`,
                            background: isRejected ? 'var(--border-strong)' : 'var(--accent)',
                          }}
                        />
                        {TRACKER_NODES.map((node, i) => {
                          const leftPercent = (i / (TRACKER_NODES.length - 1)) * 100;
                          let nodeState = '';
                          let label = node;

                          if (isRejected) {
                            if (i === TRACKER_NODES.length - 1) { nodeState = 'rejected'; label = 'Rejected'; }
                            else { nodeState = 'rejected'; }
                          } else {
                            if (i < activeIdx)      nodeState = 'active';
                            else if (i === activeIdx) nodeState = 'current';
                          }

                          return (
                            <div key={i} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${leftPercent}%` }}>
                              <div className={`tracker-node ${nodeState}`}>
                                {nodeState === 'active' && (
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#fff">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                                  </svg>
                                )}
                                {nodeState === 'rejected' && label === 'Rejected' && (
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/>
                                  </svg>
                                )}
                              </div>
                              <div
                                className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-sans text-xs font-semibold tracking-wide"
                                style={{
                                  color: nodeState === 'current' ? 'var(--accent)'
                                       : nodeState === 'active' ? 'var(--text)'
                                       : nodeState === 'rejected' && label === 'Rejected' ? 'var(--error-text)'
                                       : 'var(--text-subtle)',
                                }}
                              >
                                {label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
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
