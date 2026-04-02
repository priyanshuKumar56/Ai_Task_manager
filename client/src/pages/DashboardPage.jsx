import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PlusCircle, CheckCircle2, XCircle, Clock, Loader2, Activity, TrendingUp, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useTaskStats, useTasks } from '../hooks/useTasks';
import useAuthStore from '../store/authStore';
import StatusBadge from '../components/tasks/StatusBadge';

const COLORS = {
  success: '#22c55e',
  failed: '#ef4444',
  running: '#f59e0b',
  pending: '#94a3b8',
  queued: '#38bdf8',
  cancelled: '#64748b',
};

const StatCard = ({ label, value, icon: Icon, color, loading }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        {loading ? (
          <div className="skeleton h-7 w-16 mt-1" />
        ) : (
          <p className="text-2xl font-bold text-slate-100">{value ?? 0}</p>
        )}
      </div>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: statsData, isLoading: statsLoading } = useTaskStats();
  const { data: tasksData, isLoading: tasksLoading } = useTasks({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });

  const stats = statsData?.data?.stats || {};
  const byStatus = stats.byStatus || {};
  const byOperation = stats.byOperation || {};
  const recentTasks = tasksData?.data?.tasks || [];

  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

  const pieData = Object.entries(byStatus)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k, value: v }));

  const barData = Object.entries(byOperation).map(([op, info]) => ({
    name: op.replace('_', ' '),
    tasks: info.count,
    avgMs: info.avgDurationMs || 0,
  }));

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Welcome back, <span className="text-brand-400">{user?.username}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Here's your task processing overview</p>
        </div>
        <Link to="/tasks/new" className="btn-primary">
          <PlusCircle size={15} /> New Task
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Tasks" value={total} icon={Activity} color="bg-brand-600" loading={statsLoading} />
        <StatCard label="Successful" value={byStatus.success} icon={CheckCircle2} color="bg-green-600" loading={statsLoading} />
        <StatCard label="Failed" value={byStatus.failed} icon={XCircle} color="bg-red-600" loading={statsLoading} />
        <StatCard label="Running" value={(byStatus.running || 0) + (byStatus.queued || 0) + (byStatus.pending || 0)} icon={Loader2} color="bg-amber-600" loading={statsLoading} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie chart */}
        <div className="card p-6">
          <h3 className="section-title mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-brand-400" /> Task Distribution</h3>
          {pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No tasks yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#f1f5f9' }}
                  itemStyle={{ color: '#94a3b8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap gap-3 mt-2">
            {pieData.map(({ name, value }) => (
              <div key={name} className="flex items-center gap-1.5 text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[name] }} />
                {name} ({value})
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div className="card p-6">
          <h3 className="section-title mb-4 flex items-center gap-2"><Zap size={16} className="text-brand-400" /> Tasks by Operation</h3>
          {barData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No tasks yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#f1f5f9' }}
                  itemStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="tasks" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent tasks */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title flex items-center gap-2"><Clock size={16} className="text-brand-400" /> Recent Tasks</h3>
          <Link to="/tasks" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">View all →</Link>
        </div>
        {tasksLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-12 w-full" />)}
          </div>
        ) : recentTasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No tasks yet. <Link to="/tasks/new" className="text-brand-400 hover:underline">Create your first task →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTasks.map((task) => (
              <Link
                key={task.taskId}
                to={`/tasks/${task.taskId}`}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-900 hover:bg-surface-800 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StatusBadge status={task.status} />
                  <span className="text-sm text-slate-200 truncate group-hover:text-white">{task.title}</span>
                  <span className="text-xs text-slate-500 flex-shrink-0 font-mono bg-surface-800 px-2 py-0.5 rounded">{task.operation}</span>
                </div>
                <span className="text-xs text-slate-500 flex-shrink-0 ml-4">
                  {new Date(task.createdAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
