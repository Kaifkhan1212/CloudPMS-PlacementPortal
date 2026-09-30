import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { getApiError, formatCTC } from '../../utils/helpers';
import { PageLoader, StatCard } from '../../components/common/UI';
import PageHero from '../../components/common/PageHero';
import PageTitle from '../../components/common/PageTitle';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';
import { Users, Briefcase, IndianRupee, ArrowRight, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#172B4D', '#E8E4DB'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard()
      .then((res) => setStats(res.data.data))
      .catch((err) => toast.error(getApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!stats) return null;

  const pieData = [
    { name: 'Placed', value: stats.placedStudents },
    { name: 'Unplaced', value: Math.max(0, stats.unplacedStudents) },
  ];

  return (
    <div className="animate-fade-rise relative min-h-screen">
      <PageTitle title="Admin Dashboard" />
      <PageHero
        title="Admin Control Center"
        subtitle="Live placement analytics, drive metrics, and department performance."
        actions={
          <div className="flex gap-3">
            <Link to="/admin/users" className="btn-secondary !bg-white/10 !text-white !border-white/20 hover:!bg-white/20">
              Manage Users
            </Link>
            <Link to="/admin/reports" className="btn-primary !bg-orange-500 !border-orange-500 hover:!bg-orange-600 hover:!border-orange-600">
              Reports <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        }
      />

      <div className="page-container -mt-6 relative z-20 max-w-7xl">
        
        {/* Top Section: Hero Stat + KPIs */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          
          {/* Main Hero Stat */}
          <div className="cpm-card flex-shrink-0 w-full lg:w-1/3 bg-navy-600 border-navy-700 text-white relative overflow-hidden flex flex-col justify-center items-center text-center p-8">
            <div className="absolute top-0 left-0 w-full h-full opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}
            />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-orange-400" />
              </div>
              <div className="font-mono text-6xl font-bold text-white mb-2 tracking-tight">
                {stats.placementRate}%
              </div>
              <div className="type-label text-navy-200">Overall Placement Rate</div>
              <div className="mt-3 inline-flex items-center gap-2 bg-navy-700/50 px-3 py-1.5 rounded-sm border border-white/10 text-xs font-sans text-navy-100">
                <span className="w-2 h-2 rounded-full bg-success-500"></span>
                {stats.placedStudents} placed out of {stats.totalStudents}
              </div>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={<Users className="w-4 h-4 text-info-600" strokeWidth={2.5} />}
              colorClass="bg-info-50 text-info-600 border border-info-100"
              value={stats.totalStudents}
              label="Total Students"
              sub={`${stats.unplacedStudents} Unplaced`}
            />
            <StatCard
              icon={<Briefcase className="w-4 h-4 text-orange-600" strokeWidth={2.5} />}
              colorClass="bg-orange-50 text-orange-600 border border-orange-100"
              value={stats.activeDrives}
              label="Active Drives"
              sub={`${stats.totalDrives} Total Drives`}
            />
            <StatCard
              icon={<IndianRupee className="w-4 h-4 text-success-600" strokeWidth={2.5} />}
              colorClass="bg-success-50 text-success-600 border border-success-100"
              value={stats.averagePackage ? formatCTC(stats.averagePackage) : '₹0 LPA'}
              label="Avg CTC Package"
              sub={`${stats.totalSelected} Students Selected`}
            />
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Bar Chart */}
          <div className="cpm-card lg:col-span-2">
            <div className="card-header justify-between">
              <span className="type-h4">Branch-wise Placement</span>
            </div>
            <div className="card-body">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.branchWisePlacement || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="branch" stroke="#9B9A94" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9B9A94" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: '#F4F0E8' }}
                      contentStyle={{ backgroundColor: '#172B4D', borderRadius: '4px', color: '#fff', fontSize: '12px', border: 'none' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="total" name="Enrolled" fill="#E8E4DB" radius={[2, 2, 0, 0]} barSize={32} />
                    <Bar dataKey="placed" name="Placed" fill="#172B4D" radius={[2, 2, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="cpm-card flex flex-col">
            <div className="card-header"><span className="type-h4">Placement Ratio</span></div>
            <div className="card-body flex-1 flex flex-col items-center justify-center">
              {stats.totalStudents === 0 ? (
                <p className="text-muted text-sm py-12">No data available</p>
              ) : (
                <>
                  <div className="h-56 w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%" cy="50%"
                          innerRadius={60} outerRadius={85}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                          animationBegin={0}
                          animationDuration={1000}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#172B4D', borderRadius: '4px', color: '#fff', fontSize: '12px', border: 'none' }}
                          itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-5 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm bg-navy-600" />
                      <span className="font-sans text-xs font-semibold text-ink">Placed ({stats.placedStudents})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm bg-border" />
                      <span className="font-sans text-xs font-semibold text-ink">Unplaced ({stats.unplacedStudents})</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Branch Breakdown Table */}
        <div className="cpm-card">
          <div className="card-header">
            <span className="type-h4">Program Statistics Breakdown</span>
          </div>
          <div className="overflow-x-auto">
            <table className="cpm-table cpm-table-zebra">
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
                        <div className="w-7 h-7 rounded-sm bg-warm text-muted flex items-center justify-center text-xs font-bold font-mono border border-border">
                          {b.branch.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-ink">{b.branch}</span>
                      </div>
                    </td>
                    <td className="text-center font-sans font-medium text-muted">{b.total}</td>
                    <td className="text-center font-sans font-bold text-ink">{b.placed}</td>
                    <td className="text-center font-mono font-semibold text-ink">{b.placementPercent}%</td>
                    <td className="w-1/3">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${Math.min(b.placementPercent, 100)}%` }}
                        />
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
