import { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { getApiError, formatCTC } from '../../utils/helpers';
import { PageLoader, StatCard } from '../../components/common/UI';
import PageHero from '../../components/common/PageHero';
import PageTitle from '../../components/common/PageTitle';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell
} from 'recharts';
import { Users, Briefcase, IndianRupee, ArrowRight, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard()
      .then((res) => setStats(res.data.data))
      .catch((err) => toast.error(getApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!stats)  return null;

  const pieData = [
    { name: 'Placed',   value: stats.placedStudents },
    { name: 'Unplaced', value: Math.max(0, stats.unplacedStudents) },
  ];
  const PIE_COLORS = ['var(--accent)', 'var(--border)'];

  return (
    <div className="animate-fade-rise">
      <PageTitle title="Admin Dashboard" />
      <PageHero
        title="Admin Control Center"
        subtitle="Live placement analytics, drive metrics, and department performance."
        actions={
          <div className="flex gap-3">
            <Link to="/admin/users" className="btn-secondary" style={{ color: 'var(--hero-text)', borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)' }}>
              Manage Users
            </Link>
            <Link to="/admin/reports" className="btn-primary">
              Reports <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        }
      />

      <div className="page-container max-w-7xl">

        {/* Top: Hero Stat + KPIs */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">

          {/* Main Hero Stat */}
          <div
            className="cpm-card flex-shrink-0 w-full lg:w-72 flex flex-col justify-center items-center text-center p-8 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #172B4D 0%, #2D4F85 100%)', border: 'none' }}
          >
            <div
              className="absolute inset-0"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.07) 1px, transparent 0)', backgroundSize: '16px 16px' }}
            />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <Activity className="w-6 h-6 text-orange-400" />
              </div>
              <div className="font-mono text-5xl font-bold text-white mb-2 tracking-tight">
                {stats.placementRate}%
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em' }}>
                Placement Rate
              </div>
              <div
                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-sans"
                style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--success-fill)' }}></span>
                {stats.placedStudents} placed of {stats.totalStudents}
              </div>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              icon={<Users className="w-4 h-4" strokeWidth={2.5} style={{ color: 'var(--info-text)' }} />}
              colorClass=""
              style={{ background: 'var(--info-bg)' }}
              value={stats.totalStudents}
              label="Total Students"
              sub={`${stats.unplacedStudents} Unplaced`}
            />
            <StatCard
              icon={<Briefcase className="w-4 h-4" strokeWidth={2.5} style={{ color: 'var(--warning-text)' }} />}
              colorClass=""
              value={stats.activeDrives}
              label="Active Drives"
              sub={`${stats.totalDrives} Total Drives`}
            />
            <StatCard
              icon={<IndianRupee className="w-4 h-4" strokeWidth={2.5} style={{ color: 'var(--success-text)' }} />}
              colorClass=""
              value={stats.averagePackage ? formatCTC(stats.averagePackage) : '₹0 LPA'}
              label="Avg CTC Package"
              sub={`${stats.totalSelected} Selected`}
            />
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Bar Chart */}
          <div className="cpm-card lg:col-span-2">
            <div className="card-header">
              <span className="type-h4">Branch-wise Placement</span>
            </div>
            <div className="card-body">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.branchWisePlacement || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="branch" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: 'var(--bg-surface-2)' }}
                      contentStyle={{
                        backgroundColor: 'var(--bg-elevated)', borderRadius: '8px',
                        color: 'var(--text)', fontSize: '12px', border: '1px solid var(--border)',
                      }}
                    />
                    <Bar dataKey="total"  name="Enrolled" fill="var(--border)"   radius={[4,4,0,0]} barSize={28} />
                    <Bar dataKey="placed" name="Placed"   fill="var(--accent)"   radius={[4,4,0,0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Donut */}
          <div className="cpm-card flex flex-col">
            <div className="card-header"><span className="type-h4">Placement Ratio</span></div>
            <div className="card-body flex-1 flex flex-col items-center justify-center">
              {stats.totalStudents === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data available</p>
              ) : (
                <>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData} cx="50%" cy="50%"
                          innerRadius={56} outerRadius={80}
                          paddingAngle={3} dataKey="value" stroke="none"
                          animationBegin={0} animationDuration={900}
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--bg-elevated)', borderRadius: '8px',
                            color: 'var(--text)', fontSize: '12px', border: '1px solid var(--border)',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-5 mt-1">
                    {[
                      { color: 'var(--accent)',  label: `Placed (${stats.placedStudents})` },
                      { color: 'var(--border)',  label: `Unplaced (${stats.unplacedStudents})` },
                    ].map(({ color, label }) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded" style={{ background: color }} />
                        <span className="font-sans text-xs font-semibold" style={{ color: 'var(--text)' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Branch Table */}
        <div className="cpm-card">
          <div className="card-header">
            <span className="type-h4">Program Statistics Breakdown</span>
          </div>
          <div className="overflow-x-auto">
            <table className="cpm-table">
              <thead>
                <tr>
                  <th>Program / Branch</th>
                  <th className="text-center">Enrolled</th>
                  <th className="text-center">Placed</th>
                  <th className="text-center">Placement %</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {stats.branchWisePlacement.map((b) => (
                  <tr key={b.branch}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold font-mono"
                          style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                        >
                          {b.branch.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{b.branch}</span>
                      </div>
                    </td>
                    <td className="text-center font-sans font-medium text-sm" style={{ color: 'var(--text-muted)' }}>{b.total}</td>
                    <td className="text-center font-sans font-bold text-sm" style={{ color: 'var(--text)' }}>{b.placed}</td>
                    <td className="text-center font-mono font-semibold text-sm" style={{ color: 'var(--text)' }}>{b.placementPercent}%</td>
                    <td className="w-1/3">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${Math.min(b.placementPercent, 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
