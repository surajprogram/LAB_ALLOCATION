import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  History,
  CheckCircle2,
  Calendar,
  Layers,
  Armchair,
  Clock,
} from 'lucide-react';
import { getReportsSummary, getExportCsvUrl } from '../services/api';
import { SlotBadge, AlgorithmBadge } from '../components/common/StatusBadge';
import { useToast } from '../context/ToastContext';

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlgo, setSelectedAlgo] = useState('OR_TOOLS');
  const toast = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await getReportsSummary();
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load reports: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const handleReset = () => fetchReports();
    window.addEventListener('dataset-reset', handleReset);
    return () => window.removeEventListener('dataset-reset', handleReset);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const url = getExportCsvUrl(selectedAlgo);
    window.open(url, '_blank');
    toast.success(`Exporting ${selectedAlgo} allocations report to CSV...`);
  };

  const activeSchedule =
    selectedAlgo === 'OR_TOOLS'
      ? data?.or_tools_schedule
      : selectedAlgo === 'FCFS'
      ? data?.fcfs_schedule
      : data?.best_fit_schedule;
  const allocations = activeSchedule?.allocations || [];
  const history = data?.history || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Actions (Hidden during print) */}
      <div className="print:hidden p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Scheduling Reports & Export Center</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate formal documentation, export allocation rosters to CSV, and access audit history
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Algorithm Selector for Export */}
          <select
            value={selectedAlgo}
            onChange={(e) => setSelectedAlgo(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:outline-none"
          >
            <option value="OR_TOOLS">OR-Tools CP-SAT (Exact Optimal)</option>
            <option value="BEST_FIT">Best Fit Schedule</option>
            <option value="FCFS">FCFS Schedule</option>
          </select>

          {/* Export CSV Button */}
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Report</span>
          </button>
        </div>
      </div>

      {/* Official Printable Allocation Table */}
      <div className="p-6 md:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs print:border-none print:shadow-none print:p-0">
        {/* Printable Formal Header */}
        <div className="pb-6 mb-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              CODE CRACK 3.0 • Academic Engineering Project
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Campus Computer Laboratory Allocation Roster
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Optimized session allocations generated via {selectedAlgo} algorithm engine
            </p>
          </div>

          <div className="text-right text-xs text-slate-400">
            <p>Generated: {new Date().toLocaleDateString()}</p>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
              Status: Conflict-Free
            </p>
          </div>
        </div>

        {/* Schedule Summary Stats */}
        {activeSchedule && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-[11px] text-slate-400">Scheduled Sessions</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {activeSchedule.scheduled_count}
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-[11px] text-slate-400">Fulfillment Rate</span>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                {activeSchedule.scheduling_percentage}%
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-[11px] text-slate-400">Unused Seats</span>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {activeSchedule.total_unused_seats} seats
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-[11px] text-slate-400">Execution Runtime</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {activeSchedule.runtime_ms} ms
              </p>
            </div>
          </div>
        )}

        {/* Allocation Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 font-bold text-slate-700 dark:text-slate-300">
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Assigned Lab</th>
                <th className="px-4 py-3">Time Slot</th>
                <th className="px-4 py-3">Seats Req.</th>
                <th className="px-4 py-3">Lab Cap.</th>
                <th className="px-4 py-3">Surplus (Unused)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {allocations.map((a, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                    {a.request_code}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {a.department_name}
                  </td>
                  <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400">
                    {a.lab_name}
                  </td>
                  <td className="px-4 py-3">
                    <SlotBadge slot={a.time_slot} />
                  </td>
                  <td className="px-4 py-3 font-semibold">{a.computers_required}</td>
                  <td className="px-4 py-3 text-slate-500">{a.capacity}</td>
                  <td className="px-4 py-3 font-bold text-amber-600 dark:text-amber-400">
                    {a.unused_seats}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signatures for Print */}
        <div className="hidden print:flex justify-between mt-16 pt-8 border-t border-slate-300 text-xs">
          <div>
            <div className="w-48 border-b border-slate-400 mb-2"></div>
            <p className="font-bold">Laboratory In-Charge</p>
            <p className="text-slate-500">Department of Computer Science</p>
          </div>
          <div>
            <div className="w-48 border-b border-slate-400 mb-2"></div>
            <p className="font-bold">Academic Dean / Registrar</p>
            <p className="text-slate-500">Campus Administration</p>
          </div>
        </div>
      </div>

      {/* Historical Runs Log (Hidden during print) */}
      <div className="print:hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Algorithm Execution & Benchmark History
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Algorithm</th>
                <th className="px-4 py-3">Scheduled</th>
                <th className="px-4 py-3">Unallocated</th>
                <th className="px-4 py-3">Unused Seats</th>
                <th className="px-4 py-3">Conflicts</th>
                <th className="px-4 py-3">Runtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-6 text-center text-slate-400">
                    No execution history recorded yet.
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-slate-400">
                      {h.created_at ? new Date(h.created_at).toLocaleString() : 'Recent'}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      <AlgorithmBadge algorithm={h.algorithm_name} />
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {h.scheduled_count}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{h.unallocated_count}</td>
                    <td className="px-4 py-3 font-semibold text-amber-600">{h.total_unused_seats}</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">{h.conflicts}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{h.runtime_ms} ms</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;

