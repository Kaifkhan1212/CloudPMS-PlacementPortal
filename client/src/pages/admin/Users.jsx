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
  { value: '', label: 'All Roles' },
  { value: 'student', label: 'Students' },
  { value: 'placement_cell', label: 'Placement Cell' },
  { value: 'admin', label: 'Admins' },
];

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (roleFilter) params.role = roleFilter;
      if (search.trim()) params.search = search.trim();

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

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleToggle = async (userId) => {
    if (userId === currentUser?._id) {
      toast.error('You cannot deactivate your own account.');
      return;
    }
    setTogglingId(userId);
    try {
      const res = await adminApi.toggleUser(userId);
      toast.success(res.data.message || 'Status updated');
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isVerified: res.data.data.isVerified } : u))
      );
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
          <span className="font-mono text-white font-bold">{total}</span>
          <span className="text-navy-200 text-sm">Registered Accounts</span>
        </div>
      </PageHero>

      <div className="page-container max-w-7xl">
        
        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-6">
          <form onSubmit={handleSearchSubmit} className="w-full lg:max-w-md relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
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
                  className={`inline-flex items-center px-4 py-2 rounded-sm text-sm font-sans font-medium transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-navy-600 text-white shadow-sm'
                      : 'bg-card text-muted border border-border hover:bg-warm hover:text-ink'
                  }`}
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
              message={search ? "Try adjusting your search query." : "No users match the selected role filter."}
            />
          </div>
        ) : (
          <div className="cpm-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="cpm-table cpm-table-zebra">
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
                    return (
                      <tr key={u._id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} size="md" />
                            <div>
                              <div className="font-sans font-semibold text-ink">
                                {u.name} {isSelf && <span className="text-muted font-normal ml-1">(You)</span>}
                              </div>
                              <div className="text-xs text-muted mt-0.5">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-sans font-semibold border ${
                            u.role === 'student' ? 'bg-info-50 text-info-700 border-info-200' :
                            u.role === 'placement_cell' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            'bg-navy-50 text-navy-700 border-navy-200'
                          }`}>
                            {u.role === 'student' && <GraduationCap className="w-3.5 h-3.5" />}
                            {u.role === 'placement_cell' && <Building2 className="w-3.5 h-3.5" />}
                            {u.role === 'admin' && <Shield className="w-3.5 h-3.5" />}
                            {u.role === 'placement_cell' ? 'Placement Cell' : 
                             u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          </span>
                        </td>
                        <td className="font-sans text-sm text-muted">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-2xs font-sans font-bold uppercase tracking-wider ${
                            u.isVerified ? 'text-success-600 bg-success-50' : 'text-error-600 bg-error-50'
                          }`}>
                            {u.isVerified ? <Check className="w-3 h-3" strokeWidth={3} /> : <X className="w-3 h-3" strokeWidth={3} />}
                            {u.isVerified ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="text-right">
                          {isSelf ? (
                            <span className="text-xs text-muted font-medium bg-warm px-3 py-1.5 rounded-sm border border-border">Self</span>
                          ) : (
                            <button
                              onClick={() => handleToggle(u._id)}
                              disabled={togglingId === u._id}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-sm transition-colors border ${
                                u.isVerified
                                  ? 'border-error-200 text-error-600 hover:bg-error-50'
                                  : 'border-success-200 text-success-600 hover:bg-success-50'
                              }`}
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
              <div className="px-6 py-4 bg-warm border-t border-border flex items-center justify-between">
                <span className="font-sans text-sm text-muted font-medium">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="btn-secondary !py-1.5 !px-3 text-sm"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="btn-secondary !py-1.5 !px-3 text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
