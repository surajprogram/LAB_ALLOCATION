import React from 'react';

export const SlotBadge = ({ slot }) => {
  const colorMap = {
    S1: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    S2: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    S3: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    S4: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
  };

  const defaultColor = 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
        colorMap[slot] || defaultColor
      }`}
    >
      {slot}
    </span>
  );
};

export const AlgorithmBadge = ({ algorithm }) => {
  const isORTools = algorithm?.toUpperCase() === 'OR_TOOLS' || algorithm?.toUpperCase() === 'OR-TOOLS';
  const isBestFit = algorithm?.toUpperCase() === 'BEST_FIT';
  const isFCFS = algorithm?.toUpperCase() === 'FCFS';
  const isRescheduled = algorithm?.toUpperCase() === 'RESCHEDULED';

  const label = isORTools ? 'OR-Tools CP-SAT' : isBestFit ? 'Best Fit' : isFCFS ? 'FCFS' : algorithm;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
        isORTools
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
          : isBestFit
          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800'
          : isFCFS
          ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800'
          : isRescheduled
          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800'
          : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isORTools
            ? 'bg-emerald-500'
            : isBestFit
            ? 'bg-blue-500'
            : isFCFS
            ? 'bg-purple-500'
            : 'bg-amber-500'
        }`}
      />
      {label}
    </span>
  );
};

export const SolverStatusBadge = ({ status }) => {
  const s = status?.toUpperCase() || 'UNKNOWN';
  const isOptimal = s === 'OPTIMAL';
  const isFeasible = s === 'FEASIBLE';
  const isInfeasible = s === 'INFEASIBLE';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${
        isOptimal
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
          : isFeasible
          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
          : isInfeasible
          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
          : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isOptimal ? 'bg-emerald-500' : isFeasible ? 'bg-blue-500' : isInfeasible ? 'bg-rose-500' : 'bg-slate-400'
        }`}
      />
      {status || 'OPTIMAL'}
    </span>
  );
};

export const CapacityBadge = ({ capacity, required }) => {
  const diff = capacity - (required || 0);
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
      <span className="font-semibold text-slate-900 dark:text-white">{capacity}</span> seats
      {required !== undefined && (
        <span
          className={`text-[11px] ${
            diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          ({diff >= 0 ? `+${diff}` : diff} free)
        </span>
      )}
    </span>
  );
};
