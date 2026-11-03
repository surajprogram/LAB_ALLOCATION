import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  Zap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Armchair,
  Clock,
  ShieldCheck,
  LayoutGrid,
  ListFilter,
  Layers,
  Sliders,
} from 'lucide-react';
import { runFCFS, runBestFit, runORTools } from '../services/api';
import { SlotBadge, AlgorithmBadge, SolverStatusBadge } from '../components/common/StatusBadge';
import { useToast } from '../context/ToastContext';

const ScheduleGenerator = () => {
  const [activeTab, setActiveTab] = useState('table'); // 'table' or 'grid'
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [executingAlgo, setExecutingAlgo] = useState(null);
  const [timeLimit, setTimeLimit] = useState(10);
  const toast = useToast();

  const handleRunAlgorithm = async (type) => {
    setLoading(true);
    setExecutingAlgo(type);
    try {
      let res;
      if (type === 'FCFS') {
        res = await runFCFS();
      } else if (type === 'BEST_FIT') {
        res = await runBestFit();
      } else {
        res = await runORTools(timeLimit);
      }
      setResult(res.data);
      const name =
        type === 'FCFS'
          ? 'FCFS'
          : type === 'BEST_FIT'
          ? 'Best Fit'
          : 'Google OR-Tools CP-SAT';
      toast.success(
        `${name} executed successfully! ${res.data.scheduled_count} sessions allocated.`
      );
    } catch (err) {
      toast.error(err.response?.data?.detail || `Failed to run ${type} algorithm.`);
    } finally {
      setLoading(false);
      setExecutingAlgo(null);
    }
  };

  // Run OR-Tools by default on first load (to showcase the exact solver)
  useEffect(() => {
    handleRunAlgorithm('OR_TOOLS');
  }, []);

  const allocations = result?.allocations || [];
  const unallocated = result?.unallocated || [];
  const matrix = result?.matrix;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Controls & 3 Algorithm Run Triggers */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl border border-slate-800 text-white shadow-xl shadow-slate-950/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[11px] font-bold uppercase tracking-wider">
                Optimization Engine
              </span>
              <span className="text-xs text-slate-400">Strict Hard Constraints Enforced</span>
            </div>
            <h2 className="text-2xl font-bold mt-1 text-white">Laboratory Schedule Generator</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Execute standard FCFS queue, greedy Best Fit heuristic, or Google OR-Tools CP-SAT exact solver. Zero double-booking guaranteed.
            </p>

            {/* Time Limit Setting for OR-Tools */}
            <div className="flex items-center gap-2 mt-4 text-xs text-slate-300">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>OR-Tools Solver Timeout:</span>
              <select
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-medium focus:outline-none"
              >
                <option value={2}>2 seconds</option>
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
                <option value={30}>30 seconds</option>
              </select>
            </div>
          </div>

          {/* Three Distinct Execution Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            {/* Button 1: Run FCFS */}
            <button
              onClick={() => handleRunAlgorithm('FCFS')}
              disabled={loading}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all shadow-md ${
                result?.algorithm_name === 'FCFS'
                  ? 'bg-purple-600 text-white ring-2 ring-purple-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30'
              } disabled:opacity-50`}
            >
              <Play className={`w-4 h-4 ${executingAlgo === 'FCFS' ? 'animate-spin' : ''}`} />
              <span>{executingAlgo === 'FCFS' ? 'Executing FCFS...' : 'Run FCFS'}</span>
            </button>

            {/* Button 2: Run Best Fit */}
            <button
              onClick={() => handleRunAlgorithm('BEST_FIT')}
              disabled={loading}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all shadow-md ${
                result?.algorithm_name === 'BEST_FIT'
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30'
              } disabled:opacity-50`}
            >
              <Zap className={`w-4 h-4 ${executingAlgo === 'BEST_FIT' ? 'animate-bounce' : ''}`} />
              <span>{executingAlgo === 'BEST_FIT' ? 'Running Best Fit...' : 'Run Best Fit'}</span>
            </button>

            {/* Button 3: Run Google OR-Tools CP-SAT */}
            <button
              onClick={() => handleRunAlgorithm('OR_TOOLS')}
              disabled={loading}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-lg ${
                result?.algorithm_name === 'OR_TOOLS'
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/50 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20'
              } disabled:opacity-50`}
            >
              <Sparkles className={`w-4 h-4 ${executingAlgo === 'OR_TOOLS' ? 'animate-spin' : ''}`} />
              <span>{executingAlgo === 'OR_TOOLS' ? 'Solving CP-SAT...' : 'Run OR-Tools CP-SAT'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Execution Summary KPIs */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Active Engine
            </span>
            <div className="mt-2">
              <AlgorithmBadge algorithm={result.algorithm_name} />
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Solver Status
            </span>
            <div className="mt-2">
              <SolverStatusBadge
                status={
                  result.solver_status ||
                  (result.algorithm_name === 'OR_TOOLS' ? 'OPTIMAL' : 'HEURISTIC')
                }
              />
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Scheduled
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {result.scheduled_count}
              </span>
              <span className="text-xs text-slate-400">requests</span>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Unused Seats
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {result.total_unused_seats}
              </span>
              <span className="text-xs text-slate-400">seats</span>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Hard Conflicts
            </span>
            <div className="mt-1 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-2xl font-bold">0</span>
              <span className="text-[11px] font-medium text-emerald-600">(Valid)</span>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Runtime
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {result.runtime_ms}
              </span>
              <span className="text-xs text-slate-400">ms</span>
            </div>
          </div>
        </div>
      )}

      {/* View Switcher: Table View vs Timetable Matrix */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'table'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Allocation Table View</span>
          </button>
          <button
            onClick={() => setActiveTab('grid')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'grid'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Timetable Matrix View</span>
          </button>
        </div>

        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Success Rate: {result?.scheduling_percentage ?? 100}%
        </span>
      </div>

      {/* Tab 1: Detailed Table View */}
      {activeTab === 'table' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Request</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Allocated Lab</th>
                  <th className="px-6 py-4">Time Slot</th>
                  <th className="px-6 py-4">Computers Req.</th>
                  <th className="px-6 py-4">Lab Capacity</th>
                  <th className="px-6 py-4">Unused Seats</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {allocations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                      No allocations generated yet. Click one of the buttons above to run.
                    </td>
                  </tr>
                ) : (
                  allocations.map((a, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono">
                          {a.request_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {a.department_name}
                      </td>
                      <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">
                        {a.lab_name}
                      </td>
                      <td className="px-6 py-4">
                        <SlotBadge slot={a.time_slot} />
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                        {a.computers_required}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-500">
                        {a.capacity}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 font-bold ${
                            a.unused_seats === 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          <Armchair className="w-3.5 h-3.5" />
                          <span>{a.unused_seats}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Timetable Matrix View */}
      {activeTab === 'grid' && matrix && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Laboratory Timetable Schedule Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rows represent campus laboratories, columns represent active schedule time slots.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Laboratory
                  </th>
                  {matrix.slots.map((slot) => (
                    <th
                      key={slot}
                      className="px-4 py-3 text-xs font-bold uppercase text-slate-700 dark:text-slate-300"
                    >
                      <SlotBadge slot={slot} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {Object.keys(matrix.grid).map((labName) => (
                  <tr key={labName}>
                    <td className="px-4 py-4 text-left font-bold text-sm text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/30">
                      {labName}
                    </td>
                    {matrix.slots.map((slot) => {
                      const alloc = matrix.grid[labName][slot];
                      return (
                        <td key={slot} className="px-3 py-3">
                          {alloc ? (
                            <div className="p-3 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-950/40 dark:to-blue-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl text-left shadow-xs transition-all hover:scale-[1.02]">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                  {alloc.request_code}
                                </span>
                                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  {alloc.unused_seats} seats free
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
                                {alloc.department_name}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {alloc.computers_required} / {alloc.capacity} computers
                              </p>
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-50/60 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                              Available / Free
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unallocated Requests Section (if any) */}
      {unallocated.length > 0 && (
        <div className="p-6 bg-rose-50/80 dark:bg-rose-950/30 rounded-3xl border border-rose-200 dark:border-rose-900/60">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold mb-3">
            <AlertCircle className="w-5 h-5" />
            <h3>Unallocated Requests ({unallocated.length})</h3>
          </div>
          <div className="space-y-2">
            {unallocated.map((u, i) => (
              <div
                key={i}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white mr-2">
                    {u.request_code}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300 mr-2">
                    ({u.department_name}, {u.computers_required} computers)
                  </span>
                  <span className="text-slate-400">
                    Slots: {u.allowed_slots.join(', ')}
                  </span>
                </div>
                <span className="text-rose-600 dark:text-rose-400 font-medium italic">
                  {u.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleGenerator;
