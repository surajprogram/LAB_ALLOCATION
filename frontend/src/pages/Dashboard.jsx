import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Server,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Armchair,
  ArrowRight,
  Cpu,
  RefreshCw,
  GitCompare,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import StatCard from '../components/common/StatCard';
import { SolverStatusBadge } from '../components/common/StatusBadge';
import { getDashboardStats } from '../services/api';
import { useToast } from '../context/ToastContext';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getDashboardStats();
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load dashboard metrics: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const handleReset = () => fetchStats();
    window.addEventListener('dataset-reset', handleReset);
    return () => window.removeEventListener('dataset-reset', handleReset);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading optimization metrics...</p>
        </div>
      </div>
    );
  }

  const {
    total_laboratories,
    total_departments,
    total_requests,
    scheduled_sessions,
    unallocated_sessions,
    total_unused_seats,
    fcfs_result,
    best_fit_result,
    or_tools_result,
    lab_utilization = [],
    slot_usage = [],
  } = data || {};

  // Pie chart data for allocation status
  const pieData = [
    { name: 'Scheduled', value: scheduled_sessions, color: '#10b981' },
    { name: 'Unallocated', value: unallocated_sessions, color: '#f43f5e' },
  ];

  // 3-Algorithm comparison chart data
  const comparisonData = [
    {
      name: 'Scheduled Requests',
      FCFS: fcfs_result?.scheduled_count || 0,
      'Best Fit': best_fit_result?.scheduled_count || 0,
      'OR-Tools CP-SAT': or_tools_result?.scheduled_count || 0,
    },
    {
      name: 'Unallocated Requests',
      FCFS: fcfs_result?.unallocated_count || 0,
      'Best Fit': best_fit_result?.unallocated_count || 0,
      'OR-Tools CP-SAT': or_tools_result?.unallocated_count || 0,
    },
    {
      name: 'Unused Computer Seats',
      FCFS: fcfs_result?.total_unused_seats || 0,
      'Best Fit': best_fit_result?.total_unused_seats || 0,
      'OR-Tools CP-SAT': or_tools_result?.total_unused_seats || 0,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl text-white shadow-xl shadow-blue-950/20">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
            CODE CRACK 3.0 • Engineering Project
          </span>
          <h2 className="text-2xl font-bold mt-1">Campus Laboratory Allocation Optimizer</h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Multi-engine laboratory session scheduler featuring FCFS, Greedy Best Fit, and Google OR-Tools CP-SAT exact global optimization.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/schedule"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Engine</span>
          </Link>
          <Link
            to="/rescheduling"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Simulate Outage</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Laboratories"
          value={total_laboratories}
          subtext="Active computer labs"
          icon={Server}
          color="blue"
        />
        <StatCard
          title="Departments"
          value={total_departments}
          subtext="Requesting departments"
          icon={Building2}
          color="indigo"
        />
        <StatCard
          title="Total Requests"
          value={total_requests}
          subtext="Demand sessions"
          icon={FileSpreadsheet}
          color="purple"
        />
        <StatCard
          title="Scheduled Sessions"
          value={scheduled_sessions}
          subtext="Successfully allocated"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Unallocated"
          value={unallocated_sessions}
          subtext="Unscheduled demand"
          icon={AlertCircle}
          color={unallocated_sessions > 0 ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Unused Seats"
          value={total_unused_seats}
          subtext="Surplus computer capacity"
          icon={Armchair}
          color="amber"
        />
      </div>

      {/* 3 Algorithm Comparison Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: FCFS */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-purple-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">FCFS Algorithm</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200">
              Queue Heuristic
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <p className="text-[11px] text-slate-400">Scheduled</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {fcfs_result?.scheduled_count ?? 0}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <p className="text-[11px] text-slate-400">Unused Seats</p>
              <p className="text-lg font-bold text-amber-600 mt-0.5">
                {fcfs_result?.total_unused_seats ?? 0}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <p className="text-[11px] text-slate-400">Runtime</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {fcfs_result?.runtime_ms ?? 0} ms
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Best Fit */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Best Fit Heuristic</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200">
              Greedy Heuristic
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <p className="text-[11px] text-slate-400">Scheduled</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {best_fit_result?.scheduled_count ?? 0}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <p className="text-[11px] text-slate-400">Unused Seats</p>
              <p className="text-lg font-bold text-emerald-600 mt-0.5">
                {best_fit_result?.total_unused_seats ?? 0}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <p className="text-[11px] text-slate-400">Runtime</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {best_fit_result?.runtime_ms ?? 0} ms
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Google OR-Tools CP-SAT */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-emerald-500/30 dark:border-emerald-600/30 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-l from-emerald-600 to-teal-600 text-white text-[10px] font-bold uppercase rounded-bl-xl tracking-wider">
            Exact Optimal
          </div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">OR-Tools CP-SAT</h3>
            </div>
            <div className="mr-24">
              <SolverStatusBadge status={or_tools_result?.solver_status || 'OPTIMAL'} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <p className="text-[11px] text-slate-400">Scheduled</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {or_tools_result?.scheduled_count ?? 0}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <p className="text-[11px] text-slate-400">Unused Seats</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {or_tools_result?.total_unused_seats ?? 0}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <p className="text-[11px] text-slate-400">Runtime</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {or_tools_result?.runtime_ms ?? 0} ms
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: FCFS vs Best Fit vs OR-Tools */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Three-Algorithm Benchmark</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Comparison across FCFS, Greedy Best Fit, and OR-Tools CP-SAT
              </p>
            </div>
            <Link
              to="/comparison"
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>Full Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Bar dataKey="FCFS" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Best Fit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="OR-Tools CP-SAT" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Lab Utilization Rate */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Laboratory Utilization Rate</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Allocated computers vs Total laboratory capacity
              </p>
            </div>
            <Link
              to="/labs"
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>Manage Labs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lab_utilization}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="lab_name" tick={{ fontSize: 11 }} />
                <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Utilization']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="utilization_rate" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Slot-wise Usage */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Slot-Wise Laboratory Usage</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Computer seats populated across slots S1, S2, S3
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slot_usage}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="slot" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val, name) => [val, name === 'total_computers_used' ? 'Computers Used' : 'Sessions']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="total_computers_used" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Allocation Success Ratio Donut */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Request Fulfillment Ratio</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Scheduled vs Unallocated Department Demand
            </p>
          </div>
          <div className="h-52 my-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Scheduled ({scheduled_sessions})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span>Unallocated ({unallocated_sessions})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
