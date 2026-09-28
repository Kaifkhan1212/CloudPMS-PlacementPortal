import { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { getApiError, formatDate, formatCTC } from '../../utils/helpers';
import { StatusBadge, PageLoader, EmptyState, CompanyAvatar } from '../../components/common/UI';
import PageHero from '../../components/common/PageHero';
import PageTitle from '../../components/common/PageTitle';
import { BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Reports() {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDriveReport()
      .then((res) => setReport(res.data.data.report || []))
      .catch((err) => toast.error(getApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-rise">
      <PageTitle title="Drive Reports" />
      <PageHero
        title="Drive Analytics"
        subtitle="Detailed funnel tracking and performance metrics for individual campus drives."
      />

      <div className="page-container max-w-6xl">
        {report.length === 0 ? (
          <EmptyState
            icon={<BarChart2 className="w-8 h-8" />}
            title="No report data available"
            message="Applications submitted to campus drives will generate statistical reports here."
          />
        ) : (
          <div className="space-y-6">
            {report.map((item) => {
              const appliedCount = item.statusBreakdown.find((s) => s.status === 'Applied')?.count || 0;
              const shortlistedCount = item.statusBreakdown.find((s) => s.status === 'Shortlisted')?.count || 0;
              const interviewCount = item.statusBreakdown.find((s) => s.status === 'Interview Scheduled')?.count || 0;
              const selectedCount = item.selectedCount || 0;
              const rejectedCount = item.statusBreakdown.find((s) => s.status === 'Rejected')?.count || 0;

              const conversionRate = item.totalApplications > 0
                ? Math.round((selectedCount / item.totalApplications) * 100)
                : 0;

              return (
                <div key={item.driveId} className="cpm-card overflow-hidden border-navy-200">
                  <div className="card-body p-0">
                    
                    {/* Header Row */}
                    <div className="p-6 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border">
                      <div className="flex items-center gap-4">
                        <CompanyAvatar name={item.company} size="lg" />
                        <div>
                          <div className="flex items-center gap-3">
                            <h2 className="type-h3">{item.company}</h2>
                            <StatusBadge status={item.status} />
                          </div>
                          <div className="mt-1 flex items-center gap-3 flex-wrap">
                            <span className="type-body font-medium">{item.jobRole}</span>
                            <span className="text-border">|</span>
                            <span className="font-mono text-success-700 bg-success-50 border border-success-200 font-bold px-1.5 py-0.5 rounded text-sm">
                              {formatCTC(item.ctc)}
                            </span>
                            <span className="text-border">|</span>
                            <span className="text-xs text-muted font-sans font-medium">Deadline: {formatDate(item.deadline)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 bg-warm p-4 rounded-sm border border-border">
                        <div className="text-center min-w-[70px]">
                          <p className="type-label mb-0.5">Applicants</p>
                          <p className="font-mono text-xl font-bold text-ink">{item.totalApplications}</p>
                        </div>
                        <div className="w-px h-8 bg-border"></div>
                        <div className="text-center min-w-[70px]">
                          <p className="type-label mb-0.5">Offers</p>
                          <p className="font-mono text-xl font-bold text-success-600">{selectedCount}</p>
                        </div>
                        <div className="w-px h-8 bg-border"></div>
                        <div className="text-center min-w-[70px]">
                          <p className="type-label mb-0.5">Conversion</p>
                          <p className="font-mono text-xl font-bold text-navy-600">{conversionRate}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Funnel Pipeline */}
                    <div className="p-6 bg-white flex flex-col">
                      <p className="type-label mb-4">Applicant Pipeline</p>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { label: 'Applied', val: appliedCount, color: 'border-slate-200 bg-slate-50 text-slate-700' },
                          { label: 'Shortlisted', val: shortlistedCount, color: 'border-info-200 bg-info-50 text-info-700' },
                          { label: 'Interviewed', val: interviewCount, color: 'border-purple-200 bg-purple-50 text-purple-700' },
                          { label: 'Selected', val: selectedCount, color: 'border-success-200 bg-success-50 text-success-700' },
                          { label: 'Rejected', val: rejectedCount, color: 'border-error-200 bg-error-50 text-error-700 opacity-60' },
                        ].map((stat, i, arr) => (
                          <div key={stat.label} className="flex items-center">
                            <div className={`px-4 py-2 border rounded-sm min-w-[120px] ${stat.color} flex flex-col items-center justify-center`}>
                              <div className="font-mono text-xl font-bold leading-none mb-1">{stat.val}</div>
                              <div className="font-sans text-[10px] font-bold uppercase tracking-wider opacity-80">{stat.label}</div>
                            </div>
                            {i < arr.length - 1 && (
                              <svg className="w-5 h-5 text-border mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </div>
                        ))}
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
