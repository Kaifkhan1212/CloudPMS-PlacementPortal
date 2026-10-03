import { useState, useEffect } from 'react';
import { placementApi } from '../../api/placementApi';
import { getApiError, formatDate, formatCTC } from '../../utils/helpers';
import { PageLoader, EmptyState, StatusBadge, SectionHeader, filterTabClass, filterTabStyle } from '../../components/common/UI';
import PageTitle from '../../components/common/PageTitle';
import PageHero from '../../components/common/PageHero';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, MapPin, Users, Calendar, MoreVertical, Edit, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageDrives() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const res = await placementApi.getMyDrives();
      setDrives(res.data.data.drives);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredDrives = drives.filter(d => {
    const matchFilter = filter === 'All' || d.status === filter;
    const matchSearch = d.company.toLowerCase().includes(search.toLowerCase()) || 
                        d.jobRole.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-rise">
      <PageTitle title="Manage Drives" />
      <PageHero
        title="Manage Placement Drives"
        subtitle="Create, monitor, and manage campus recruitment drives and applicant pipelines."
        actions={
          <button onClick={() => navigate('/placement/drives/new')} className="btn-primary">
            <Plus className="w-4 h-4" /> Publish New Drive
          </button>
        }
      />

      <div className="page-container max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide w-full md:w-auto">
            {['All', 'Upcoming', 'Ongoing', 'Completed'].map((s) => {
              const count = s === 'All' ? drives.length : drives.filter(d => d.status === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={filterTabClass(filter === s)}
                  style={filterTabStyle(filter === s)}
                >
                  {s}
                  <span className="px-1.5 py-0.5 rounded text-2xs font-mono font-bold"
                    style={filter === s ? { background: 'rgba(255,255,255,0.2)', color: '#fff' } : { background: 'var(--border)', color: 'var(--text-muted)' }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search company or role..."
              className="form-input !pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredDrives.length === 0 ? (
          <EmptyState
            icon={<Search className="w-8 h-8" />}
            title="No drives found"
            message={search ? "Adjust your search filters." : "Publish a new drive to start accepting applications."}
            action={
              <button onClick={() => navigate('/placement/drives/new')} className="btn-primary mt-4">
                <Plus className="w-4 h-4" /> Publish New Drive
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filteredDrives.map((drive) => (
              <div key={drive._id} className="cpm-card flex flex-col md:flex-row overflow-hidden transition-all hover:shadow-card-md hover:-translate-y-0.5">
                
                {/* Left content block */}
                <div className="flex-1 p-5 md:p-6 md:pr-4 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className="type-h3 group-hover:text-accent transition-colors" style={{ color: 'var(--text)' }}>
                          {drive.company}
                        </h3>
                        <StatusBadge status={drive.status} />
                      </div>
                      <p className="font-sans font-medium text-sm" style={{ color: 'var(--text-muted)' }}>{drive.jobRole}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-5">
                    <div className="flex items-center gap-2 text-sm font-sans" style={{ color: 'var(--text-muted)' }}>
                      <IndianRupeeIcon className="w-4 h-4" />
                      <span className="font-mono font-bold" style={{ color: 'var(--text)' }}>{formatCTC(drive.ctc)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-sans" style={{ color: 'var(--text-muted)' }}>
                      <Calendar className="w-4 h-4" />
                      <span>Drive: {drive.driveDate ? formatDate(drive.driveDate) : 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-sans" style={{ color: 'var(--text-muted)' }}>
                      <MapPin className="w-4 h-4" />
                      <span>{drive.venue || 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-sans flex-wrap" style={{ color: 'var(--text-muted)' }}>
                      <Users className="w-4 h-4" />
                      <span>Eligibility: {drive.eligibility.allowedBranches.join(', ')} (CGPA {drive.eligibility.minCgpa}+)</span>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 flex gap-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <Link to={`/placement/drives/${drive._id}/edit`} className="btn-secondary !py-1.5 !px-3 text-sm flex-1 justify-center">
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </Link>
                    <Link to={`/placement/drives/${drive._id}/applicants`} className="btn-primary !py-1.5 !px-3 text-sm flex-1 justify-center">
                      <Users className="w-3.5 h-3.5" /> View Pipeline
                    </Link>
                  </div>
                </div>

                {/* Right stats block (desktop side, mobile bottom) */}
                <div 
                  className="drive-stats-block w-full md:w-48 p-4 md:p-6 flex flex-row md:flex-col items-center justify-center gap-4 md:gap-6" 
                  style={{ background: 'var(--bg-surface-2)' }}
                >
                  <div className="text-center flex-1">
                    <p className="type-label mb-1">Applicants</p>
                    <p className="font-mono text-3xl font-bold" style={{ color: 'var(--text)' }}>
                      0
                    </p>
                  </div>
                  <div className="hidden md:block w-full h-px" style={{ background: 'var(--border)' }}></div>
                  <div className="md:hidden h-10 w-px" style={{ background: 'var(--border)' }}></div>
                  <div className="text-center flex-1">
                    <p className="type-label mb-1">Deadline</p>
                    <p className="font-sans text-sm font-semibold mt-1" style={{ color: 'var(--text)' }}>
                      {formatDate(drive.deadline)}
                    </p>
                    {new Date(drive.deadline) < new Date() && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-2xs font-bold uppercase tracking-wider" 
                            style={{ background: 'var(--error-bg)', color: 'var(--error-text)' }}>
                        Expired
                      </span>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IndianRupeeIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 3h12"/>
      <path d="M6 8h12"/>
      <path d="M6 13l8.5 8"/>
      <path d="M6 13h3"/>
      <path d="M9 13c6.667 0 6.667-10 0-10"/>
    </svg>
  );
}
