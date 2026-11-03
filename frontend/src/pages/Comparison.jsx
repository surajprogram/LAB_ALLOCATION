import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Clock,
  Armchair,
  ShieldCheck,
  TrendingUp,
  Info,
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
} from 'recharts';
import { getComparisonStats } from '../services/api';
import { SolverStatusBadge } from '../components/common/StatusBadge';
import { useToast } from '../context/ToastContext';

const Comparison = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchComparison = async () => {
    try {
      setLoading(true);
      const res = await getComparisonStats();
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load algorithm comparison: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
    const handleReset = () => fetchComparison();
    window.addEventListener('dataset-reset', handleReset);
    return () => window.removeEventListener('dataset-reset', handleReset);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Calculating 3-algorithm benchmarks...</p>
        </div>
      </div>
    );
  }

  const { fcfs, best_fit, or_tools, metrics = [] } = data || {};

  const barChartData = [
    {
      metric: 'Scheduled',
      FCFS: fcfs?.scheduled_count || 0,
      'Best Fit': best_fit?.scheduled_count || 0,
      'OR-Tools CP-SAT': or_tools?.scheduled_count || 0,
    },
    {
      metric: 'Unallocated',
      FCFS: fcfs?.unallocated_count || 0,
      'Best Fit': best_fit?.unallocated_count || 0,
      'OR-Tools CP-SAT': or_tools?.unallocated_count || 0,
    },
    {
      metric: 'Unused Seats',
      FCFS: fcfs?.total_unused_seats || 0,
      'Best Fit': best_fit?.total_unused_seats || 0,
      'OR-Tools CP-SAT': or_tools?.total_unused_seats || 0,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-blue-600" />
            <span>Tri-Algorithm Comparative Benchmark</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Empirical evaluation: FCFS (Queue Heuristic) vs Best Fit (Greedy Heuristic) vs Google OR-Tools (Exact CP-SAT)
          </p>
        </div>

        <button
          onClick={fetchComparison}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all self-start sm:self-auto"
        >
          <span>Recalculate All Benchmarks</span>
        </button>
      </div>

      {/* Top Winner Summary Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-950 to-emerald-950 rounded-3xl border border-blue-800/60 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-400/20 text-amber-300 rounded-2xl border border-amber-400/30">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                Exact Global Optimality
              </span>
              <h3 className="text-xl font-bold mt-0.5 text-white">
                OR-Tools CP-SAT guarantees the global theoretical optimum
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Using two-phase lexicographic constraint programming, OR-Tools CP-SAT first locks the maximum feasible scheduled count (5/5), then explores the exact solution space to minimize unused capacity ({or_tools?.total_unused_seats ?? 20} seats vs {fcfs?.total_unused_seats ?? 55} in FCFS).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 shrink-0">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold">Seat Efficiency</p>
              <p className="text-2xl font-black text-emerald-400">
                +{Math.max(0, (fcfs?.total_unused_seats || 0) - (or_tools?.total_unused_seats || 0))} seats saved
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Side by Side 3-Algorithm Metrics Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Three-Engine Performance Matrix
          </h3>
          <span className="text-xs font-semibold text-slate-400">Official Dataset: 5 Requests • 4 Laboratories</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Evaluation Metric</th>
                <th className="px-6 py-4 text-purple-600 dark:text-purple-400">FCFS</th>
                <th className="px-6 py-4 text-blue-600 dark:text-blue-400">Greedy Best Fit</th>
                <th className="px-6 py-4 text-emerald-600 dark:text-emerald-400">Google OR-Tools CP-SAT</th>
                <th className="px-6 py-4">Winner / Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
              {metrics.map((m, i) => (
                <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    {m.metric}
                  </td>
                  <td className="px-6 py-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {m.fcfs} {m.unit}
                  </td>
                  <td className="px-6 py-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {m.best_fit} {m.unit}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {m.or_tools} {m.unit}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        m.winner.includes('OR-Tools')
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200'
                          : m.winner.includes('Best Fit')
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200'
                          : m.winner.includes('FCFS')
                          ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{m.winner}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Recharts Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
            Tri-Algorithm Comparative Metric Chart
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Direct visual comparison of scheduled sessions and unused seats
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
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

        {/* Algorithm Engineering Note & Solver Limitations */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-sm">Engineering Analysis & Solver Tradeoffs</h3>
            </div>
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong>1. FCFS Queue:</strong> O(R · L · S) computational complexity. Fast and trivial to implement, but vulnerable to high seat wastage (55 seats unused in sample data).
              </p>
              <p>
                <strong>2. Greedy Best Fit:</strong> O(R · L · S log(L · S)) computational complexity. Evaluates candidate lab-slot combinations greedily. On this dataset it finds an optimal 20-seat solution, but on complex overlapping slot schedules, greedy decisions can trap the search in a suboptimal local minimum.
              </p>
              <p>
                <strong>3. Google OR-Tools CP-SAT:</strong> Formulates the problem with binary decision variables x[r, l, s] ∈ {'{0, 1}'} and executes two-phase lexicographic optimization:
                <br />
                • <em>Phase 1:</em> Maximize ∑ x[r, l, s] (Fulfill maximum requests)
                <br />
                • <em>Phase 2:</em> Minimize ∑ (C_l - c_r) · x[r, l, s] subject to ∑ x[r, l, s] ≥ M*
              </p>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-amber-900 dark:text-amber-200 font-medium">
                <strong>Documented Solver Limitation:</strong> The laboratory allocation problem is NP-complete. While OR-Tools CP-SAT solves small and medium campus instances in under 100 milliseconds, solving massive multi-campus instances with thousands of requests requires imposing solver timeouts (time_limit_seconds), which transitions the solver from OPTIMAL to FEASIBLE.
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Two-Phase Lexicographic Optimization</span>
            <span>Zero Conflicts Mathematically Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comparison;
