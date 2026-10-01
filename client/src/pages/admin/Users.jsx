import { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { useAuth } from '../../context/AuthContext';
import { getApiError, formatDate } from '../../utils/helpers';
import { PageLoader, EmptyState, Avatar } from '../../components/common/UI';
import PageHero from '../../components/common/PageHero';
import PageTitle from '../../components/common/PageTitle';
import { Users as UsersIcon, Search, Check, X, Shield, GraduationCap, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  { value: '',                label: 'All Roles' },
  { value: 'student',         label: 'Students' },
  { value: 'placement_cell',  label: 'Placement Cell' },
  { value: 'admin',           label: 'Admins' },
];

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (roleFilter)       params.role   = roleFilter;
      if (search.trim())    params.search = search.trim();
      const res = await adminApi.getUsers(params);
      setUsers(res.data.data.users);
      setTotal(res.data.data.total);
      setTotalPages(res.data.data.totalPages || 1);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter]);

  const handleSearchSubmit = (e) => { e.preventDefault(); setPage(1); fetchUsers(); };

  const handleToggle = async (userId) => {
    if (userId === currentUser?._id) { toast.error('You cannot deactivate your own account.'); return; }
    setTogglingId(userId);
    try {
      const res = await adminApi.toggleUser(userId);
      toast.success(res.data.message || 'Status updated');
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isVerified: res.data.data.isVerified } : u));
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="animate-fade-rise">
      <PageTitle title="User Management" />
      <PageHero
        title="User Management"
        subtitle="Manage access across students, placement officers, and administrators."
      >
        <div className="mt-4 flex items-center gap-2">
          <UsersIcon className="w-4 h-4 text-orange-400" />
          <span className="font-mono font-bold text-white">{total}</span>
          <span className="text-sm" style={{ color: 'var(--hero-muted)' }}>Registered Accounts</span>
        </div>
      </PageHero>

      <div className="page-container max-w-7xl">

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-6">
          <form onSubmit={handleSearchSubmit} className="w-full lg:max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input !pl-9"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="hidden" />
          </form>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide w-full lg:w-auto">
            {ROLES.map((r) => {
              const isActive = roleFilter === r.value;
              return (
                <button
                  key={r.value}
                  onClick={() => { setRoleFilter(r.value); setPage(1); }}
                  className="inline-flex items-center px-4 py-2 rounded-md text-sm font-sans font-medium transition-all flex-shrink-0"
                  style={isActive
                    ? { background: 'var(--accent)', color: '#fff', border: '1.5px solid var(--accent)' }
                    : { background: 'var(--bg-surface-2)', color: 'var(--text-muted)', border: '1.5px solid var(--border)' }
                  }
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <PageLoader />
        ) : users.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              icon={<UsersIcon className="w-8 h-8" />}
              title="No users found"
              message={search ? 'Try adjusting your search query.' : 'No users match the selected role filter.'}
            />
          </div>
        ) : (
          <div className="cpm-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="cpm-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th className="text-center">Status</th>
                    <th className="text-right">Access Control</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = u._id === currentUser?._id;
                    const roleStyle =
                      u.role === 'student'         ? { bg: 'var(--info-bg)',    text: 'var(--info-text)',    border: 'var(--info-border)' }
                      : u.role === 'placement_cell' ? { bg: 'var(--warning-bg)', text: 'var(--warning-text)', border: 'var(--warning-border)' }
                      : { bg: 'var(--bg-surface-2)', text: 'var(--text-muted)', border: 'var(--border)' };

                    return (
                      <tr key={u._id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} size="md" />
                            <div>
                              <div className="font-sans font-semibold text-sm" style={{ color: 'var(--text)' }}>
                                {u.name}{isSelf && <span className="font-normal ml-1" style={{ color: 'var(--text-muted)' }}>(You)</span>}
                              </div>
                              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-sans font-semibold"
                            style={{ background: roleStyle.bg, color: roleStyle.text, border: `1px solid ${roleStyle.border}` }}
                          >
                            {u.role === 'student'        && <GraduationCap className="w-3.5 h-3.5" />}
                            {u.role === 'placement_cell' && <Building2 className="w-3.5 h-3.5" />}
                            {u.role === 'admin'          && <Shield className="w-3.5 h-3.5" />}
                            {u.role === 'placement_cell' ? 'Placement Cell' : u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          </span>
                        </td>
                        <td className="font-sans text-sm" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="text-center">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-2xs font-sans font-bold uppercase tracking-wider"
                            style={u.isVerified
                              ? { background: 'var(--success-bg)', color: 'var(--success-text)' }
                              : { background: 'var(--error-bg)',   color: 'var(--error-text)' }
                            }
                          >
                            {u.isVerified ? <Check className="w-3 h-3" strokeWidth={3} /> : <X className="w-3 h-3" strokeWidth={3} />}
                            {u.isVerified ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="text-right">
                          {isSelf ? (
                            <span
                              className="text-xs font-medium px-3 py-1.5 rounded"
                              style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                            >
                              Self
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggle(u._id)}
                              disabled={togglingId === u._id}
                              className="text-xs font-semibold px-3 py-1.5 rounded transition-colors border"
                              style={u.isVerified
                                ? { borderColor: 'var(--error-border)', color: 'var(--error-text)' }
                                : { borderColor: 'var(--success-border)', color: 'var(--success-text)' }
                              }
                            >
                              {togglingId === u._id ? 'Updating...' : u.isVerified ? 'Suspend Access' : 'Restore Access'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface-2)' }}
              >
                <span className="font-sans text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button disabled={page <= 1}         onClick={() => setPage(p => Math.max(1, p - 1))}         className="btn-secondary !py-1.5 !px-3 text-sm">Previous</button>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="btn-secondary !py-1.5 !px-3 text-sm">Next</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
