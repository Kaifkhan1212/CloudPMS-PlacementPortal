import { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';
import { getApiError, formatDate, formatCTC } from '../../utils/helpers';
import { StatusBadge, EmptyState, PageLoader, CompanyAvatar } from '../../components/common/UI';
import PageHero from '../../components/common/PageHero';
import PageTitle from '../../components/common/PageTitle';
import { FileText, MapPin, Calendar, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const TRACKER_NODES = ['Applied', 'Shortlisted', 'Interview Scheduled', 'Selected'];
const ALL_STATUSES = ['Applied', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'];

export default function StudentApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    studentApi.getMyApplications()
      .then((r) => setApplications(r.data.data.applications))
      .catch((err) => toast.error(getApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All'
    ? applications
    : applications.filter((a) => a.status === filter);

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-rise">
      <PageTitle title="My Applications" />
      <PageHero
        title="My Applications"
        subtitle="Track the status of all your campus placement applications in real-time."
      />

      <div className="page-container max-w-5xl">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {['All', ...ALL_STATUSES].map((s) => {
            const count = s === 'All' ? applications.length : applications.filter(a => a.status === s).length;
            const isActive = filter === s;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-sans font-medium transition-all duration-200 flex-shrink-0 ${
                  isActive
                    ? 'bg-navy-600 text-white shadow-sm'
                    : 'bg-card text-muted border border-border hover:bg-warm hover:text-ink'
                }`}
              >
                {s}
                <span className={`px-1.5 py-0.5 rounded text-2xs font-mono font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-warm text-muted'
                }`}>
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
          <div className="space-y-6">
            {filtered.map((app) => {
              const isRejected = app.status === 'Rejected';
              const activeIdx = ALL_STATUSES.indexOf(app.status);
              
              let fillPercent = 0;
              if (isRejected) {
                fillPercent = 100;
              } else if (activeIdx >= 0) {
                fillPercent = (activeIdx / (TRACKER_NODES.length - 1)) * 100;
              }

              return (
                <div key={app._id} className={`cpm-card group ${isRejected ? 'opacity-80 grayscale-[30%]' : ''}`}>
                  <div className="card-body">
                    {/* Top Section */}
                    <div className="flex items-start justify-between flex-wrap gap-6 mb-8">
                      {/* Left: Company & Drive Info */}
                      <div className="flex items-start gap-4">
                        <CompanyAvatar name={app.drive.company} size="lg" />
                        <div>
                          <div className="flex items-center gap-3">
                            <h2 className="type-h3 group-hover:text-orange-600 transition-colors">{app.drive.company}</h2>
                            <StatusBadge status={app.status} />
                          </div>
                          <p className="type-body font-medium mt-1">{app.drive.jobRole}</p>
                          
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3">
                            <div className="flex items-center gap-1.5 text-sm text-ink">
                              <span className="font-mono text-green-700 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                                {formatCTC(app.drive.ctc)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted font-sans font-medium">
                              <Calendar className="w-3.5 h-3.5" />
                              Applied: {formatDate(app.appliedAt)}
                            </div>
                            {app.drive.venue && (
                              <div className="flex items-center gap-1.5 text-xs text-muted font-sans font-medium">
                                <MapPin className="w-3.5 h-3.5" />
                                {app.drive.venue}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Remarks / Notes */}
                      {(app.remarks || isRejected) && (
                        <div className="bg-warm border border-border p-3 rounded-sm max-w-sm w-full md:w-auto">
                          <p className="type-label mb-1">Status Note</p>
                          <p className="font-sans text-xs text-ink leading-relaxed">
                            {app.remarks || (isRejected && "The company has decided not to proceed with your application at this time.")}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Timeline Tracker */}
                    <div className="relative pt-4 pb-8 px-4 mt-4 border-t border-border/50">
                      <div className="tracker-rail">
                        <div className={`tracker-fill ${isRejected ? '!bg-slate-300' : ''}`} style={{ width: `${fillPercent}%` }} />
                        
                        {TRACKER_NODES.map((node, i) => {
                          const leftPercent = (i / (TRACKER_NODES.length - 1)) * 100;
                          let nodeState = '';
                          let label = node;

                          if (isRejected) {
                            if (i === TRACKER_NODES.length - 1) {
                              nodeState = 'rejected';
                              label = 'Rejected';
                            } else {
                              nodeState = 'rejected';
                            }
                          } else {
                            if (i < activeIdx) nodeState = 'active';
                            else if (i === activeIdx) nodeState = 'current';
                          }

                          return (
                            <div key={i} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${leftPercent}%` }}>
                              <div className={`tracker-node ${nodeState}`}>
                                {nodeState === 'active' && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                                {nodeState === 'rejected' && label === 'Rejected' && <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>}
                              </div>
                              <div className={`absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-sans text-xs font-semibold tracking-wide ${
                                nodeState === 'current' ? 'text-orange-600' :
                                nodeState === 'active' ? 'text-navy-600' :
                                nodeState === 'rejected' && label === 'Rejected' ? 'text-slate-600' :
                                'text-subtle'
                              }`}>
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
