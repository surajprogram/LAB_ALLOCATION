import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Server,
  Zap,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { getLabs, simulateReschedule, commitReschedule } from '../services/api';
import { SlotBadge, AlgorithmBadge } from '../components/common/StatusBadge';
import { useToast } from '../context/ToastContext';

const ALL_SLOTS = ['S1', 'S2', 'S3', 'S4'];

const Rescheduling = () => {
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState('Lab A');
  const [selectedSlot, setSelectedSlot] = useState('S2');
  const [baseAlgorithm, setBaseAlgorithm] = useState('BEST_FIT');

  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [diffResult, setDiffResult] = useState(null);
  const toast = useToast();

  const fetchLabs = async () => {
    try {
      const res = await getLabs();
      setLabs(res.data);
      if (res.data.length > 0 && !selectedLab) {
        setSelectedLab(res.data[0].lab_name);
      }
    } catch (err) {
      toast.error('Failed to load laboratories: ' + (err.response?.data?.detail || err.message));
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await simulateReschedule({
        unavailable_lab_name: selectedLab,
        unavailable_slot: selectedSlot,
        base_algorithm: baseAlgorithm,
      });
      setDiffResult(res.data);
      toast.info(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to simulate rescheduling.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    setCommitting(true);
    try {
      const res = await commitReschedule({
        unavailable_lab_name: selectedLab,
        unavailable_slot: selectedSlot,
        base_algorithm: baseAlgorithm,
      });
      setDiffResult(res.data);
      toast.success(res.data.message);
      fetchLabs(); // Refresh lab list to reflect updated available slots
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to commit rescheduling.');
    } finally {
      setCommitting(false);
    }
  };

  // Run initial simulation for the exact scenario in the prompt: Lab A in S2
  useEffect(() => {
    handleSimulate();
  }, []);

  const oldAllocs = diffResult?.old_allocations || [];
  const newAllocs = diffResult?.new_allocations || [];
  const unrescheduled = diffResult?.unrescheduled_requests || [];

  // Helper to determine if an allocation was changed or moved
  const getChangeStatus = (reqId) => {
    const oldItem = oldAllocs.find((a) => a.request_id === reqId);
    const newItem = newAllocs.find((a) => a.request_id === reqId);

    if (!newItem) return 'dropped';
    if (!oldItem) return 'new';
    if (oldItem.laboratory_id !== newItem.laboratory_id || oldItem.time_slot !== newItem.time_slot) {
      return 'reassigned';
    }
    return 'preserved';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Simulation Controls */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 rounded-3xl border border-slate-800 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold uppercase tracking-wider">
            Failure Recovery Simulation
          </span>
          <span className="text-xs text-slate-400">Minimal Schedule Perturbation</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Dynamic Laboratory Rescheduling</h2>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Simulate unexpected laboratory outages (e.g. maintenance, hardware failure, power loss) and trigger immediate dynamic reallocation preserving valid existing assignments.
        </p>

        {/* Outage Simulation Form */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Target Laboratory
            </label>
            <select
              value={selectedLab}
              onChange={(e) => setSelectedLab(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            >
              {labs.map((l) => (
                <option key={l.id} value={l.lab_name}>
                  {l.lab_name} (Capacity: {l.capacity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Unavailable Time Slot
            </label>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            >
              {ALL_SLOTS.map((s) => (
                <option key={s} value={s}>
                  Slot {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Base Scheduling Engine
            </label>
            <select
              value={baseAlgorithm}
              onChange={(e) => setBaseAlgorithm(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            >
              <option value="OR_TOOLS">Google OR-Tools CP-SAT (Exact)</option>
              <option value="BEST_FIT">Greedy Best Fit Heuristic</option>
              <option value="FCFS">FCFS Queue Heuristic</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulate}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Simulate</span>
            </button>
            <button
              onClick={handleCommit}
              disabled={committing || !diffResult}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
              title="Apply changes and persist to database"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Commit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      {diffResult && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Outage Scenario
            </span>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-bold text-sm text-rose-600 dark:text-rose-400">
                {diffResult.unavailable_lab_name}
              </span>
              <span className="text-slate-400">in</span>
              <SlotBadge slot={diffResult.unavailable_slot} />
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Original Sessions
            </span>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {diffResult.original_scheduled_count}
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Assignments Changed
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {diffResult.assignments_changed_count}
              </span>
              <span className="text-xs text-slate-400">reassigned / moved</span>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Recovered Schedule
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {diffResult.new_scheduled_count}
              </span>
              <span className="text-xs text-slate-400">active sessions</span>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison: Before vs After */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BEFORE SCHEDULE */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Original Baseline Schedule
              </h3>
            </div>
            <span className="text-xs text-slate-400">Pre-Outage</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="px-4 py-3">Req</th>
                  <th className="px-4 py-3">Dept</th>
                  <th className="px-4 py-3">Lab</th>
                  <th className="px-4 py-3">Slot</th>
                  <th className="px-4 py-3">Unused</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {oldAllocs.map((a, i) => {
                  const isAffected =
                    a.lab_name === selectedLab && a.time_slot === selectedSlot;
                  return (
                    <tr
                      key={i}
                      className={
                        isAffected
                          ? 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-semibold'
                          : 'hover:bg-slate-50/60'
                      }
                    >
                      <td className="px-4 py-3 font-mono font-bold">{a.request_code}</td>
                      <td className="px-4 py-3">{a.department_name}</td>
                      <td className="px-4 py-3 font-semibold">
                        {a.lab_name}
                        {isAffected && (
                          <span className="ml-1.5 text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold">
                            (Outage)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <SlotBadge slot={a.time_slot} />
                      </td>
                      <td className="px-4 py-3">{a.unused_seats}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* AFTER SCHEDULE */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Dynamically Rescheduled System
              </h3>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Recovered & Validated
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="px-4 py-3">Req</th>
                  <th className="px-4 py-3">Dept</th>
                  <th className="px-4 py-3">Lab</th>
                  <th className="px-4 py-3">Slot</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {newAllocs.map((a, i) => {
                  const status = getChangeStatus(a.request_id);
                  return (
                    <tr
                      key={i}
                      className={
                        status === 'reassigned'
                          ? 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold'
                          : 'hover:bg-slate-50/60'
                      }
                    >
                      <td className="px-4 py-3 font-mono font-bold">{a.request_code}</td>
                      <td className="px-4 py-3">{a.department_name}</td>
                      <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">
                        {a.lab_name}
                      </td>
                      <td className="px-4 py-3">
                        <SlotBadge slot={a.time_slot} />
                      </td>
                      <td className="px-4 py-3">
                        {status === 'reassigned' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                            <Sparkles className="w-3 h-3" />
                            <span>Reallocated</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-500">
                            Preserved
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Unrescheduled Requests (if any) */}
      {unrescheduled.length > 0 && (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/30 rounded-3xl border border-rose-200 dark:border-rose-900/60">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold mb-2">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-sm">Requests Unable to Reschedule ({unrescheduled.length})</h3>
          </div>
          <p className="text-xs text-rose-600 dark:text-rose-300 mb-3">
            The following requests could not find a remaining valid lab-slot combination satisfying capacity and allowed slots:
          </p>
          <div className="space-y-2">
            {unrescheduled.map((u, i) => (
              <div
                key={i}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-rose-900/40 text-xs flex justify-between items-center"
              >
                <span className="font-bold text-slate-900 dark:text-white">
                  {u.request_code} ({u.department_name})
                </span>
                <span className="text-slate-500 italic">{u.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Rescheduling;

