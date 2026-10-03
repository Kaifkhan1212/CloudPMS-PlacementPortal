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
              const appliedCount     = item.statusBreakdown.find((s) => s.status === 'Applied')?.count || 0;
              const shortlistedCount = item.statusBreakdown.find((s) => s.status === 'Shortlisted')?.count || 0;
              const interviewCount   = item.statusBreakdown.find((s) => s.status === 'Interview Scheduled')?.count || 0;
              const selectedCount    = item.selectedCount || 0;
              const rejectedCount    = item.statusBreakdown.find((s) => s.status === 'Rejected')?.count || 0;

              const conversionRate = item.totalApplications > 0
                ? Math.round((selectedCount / item.totalApplications) * 100)
                : 0;

              return (
                <div key={item.driveId} className="cpm-card overflow-hidden">
                  <div className="card-body p-0">
                    
                    {/* Header Row */}
                    <div className="report-header-row p-6 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 border-b border-border">
                      <div className="flex items-center gap-4">
                        <CompanyAvatar name={item.company} size="lg" />
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="type-h3">{item.company}</h2>
                            <StatusBadge status={item.status} />
                          </div>
                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <span className="font-sans text-sm font-medium" style={{ color: 'var(--text)' }}>
                              {item.jobRole}
                            </span>
                            <span style={{ color: 'var(--border-strong)' }}>|</span>
                            <span
                              className="font-mono font-bold px-2 py-0.5 rounded text-xs"
                              style={{ background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)' }}
                            >
                              {formatCTC(item.ctc)}
                            </span>
                            <span style={{ color: 'var(--border-strong)' }}>|</span>
                            <span className="text-xs font-sans font-medium" style={{ color: 'var(--text-muted)' }}>
                              Deadline: {formatDate(item.deadline)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        className="report-stats-box flex items-center gap-4 md:gap-6 p-4 rounded border"
                        style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
                      >
                        <div className="text-center flex-1">
                          <p className="type-label mb-0.5">Applicants</p>
                          <p className="font-mono text-xl font-bold" style={{ color: 'var(--text)' }}>{item.totalApplications}</p>
                        </div>
                        <div className="w-px h-8" style={{ background: 'var(--border)' }}></div>
                        <div className="text-center flex-1">
                          <p className="type-label mb-0.5">Offers</p>
                          <p className="font-mono text-xl font-bold" style={{ color: 'var(--success-fill)' }}>{selectedCount}</p>
                        </div>
                        <div className="w-px h-8" style={{ background: 'var(--border)' }}></div>
                        <div className="text-center flex-1">
                          <p className="type-label mb-0.5">Conversion</p>
                          <p className="font-mono text-xl font-bold" style={{ color: 'var(--text)' }}>{conversionRate}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Funnel Pipeline */}
                    <div className="p-6 flex flex-col" style={{ background: 'var(--bg-surface)' }}>
                      <p className="type-label mb-4">Applicant Pipeline</p>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { label: 'Applied',     val: appliedCount,     bg: 'var(--info-bg)',    text: 'var(--info-text)',    border: 'var(--info-border)' },
                          { label: 'Shortlisted', val: shortlistedCount, bg: 'var(--purple-bg)',  text: 'var(--purple-text)',  border: 'var(--purple-border)' },
                          { label: 'Interviewed', val: interviewCount,   bg: 'var(--warning-bg)', text: 'var(--warning-text)', border: 'var(--warning-border)' },
                          { label: 'Selected',    val: selectedCount,    bg: 'var(--success-bg)', text: 'var(--success-text)', border: 'var(--success-border)' },
                          { label: 'Rejected',    val: rejectedCount,    bg: 'var(--error-bg)',   text: 'var(--error-text)',   border: 'var(--error-border)', opacity: 0.6 },
                        ].map((stat, i, arr) => (
                          <div key={stat.label} className="flex items-center">
                            <div
                              className="px-4 py-2 rounded min-w-[120px] flex flex-col items-center justify-center"
                              style={{
                                background: stat.bg, color: stat.text,
                                border: `1px solid ${stat.border}`,
                                opacity: stat.opacity || 1
                              }}
                            >
                              <div className="font-mono text-xl font-bold leading-none mb-1">{stat.val}</div>
                              <div className="font-sans text-[10px] font-bold uppercase tracking-wider opacity-80">
                                {stat.label}
                              </div>
                            </div>
                            {i < arr.length - 1 && (
                              <svg className="w-5 h-5 mx-1" style={{ color: 'var(--border-strong)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
