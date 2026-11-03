import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  Building2,
  FileSpreadsheet,
  Cpu,
  GitCompare,
  RefreshCw,
  FileText,
  Layers,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Laboratories', path: '/labs', icon: Server },
  { name: 'Departments', path: '/departments', icon: Building2 },
  { name: 'Requests', path: '/requests', icon: FileSpreadsheet },
  { name: 'Schedule Generator', path: '/schedule', icon: Cpu },
  { name: 'Algorithm Comparison', path: '/comparison', icon: GitCompare },
  { name: 'Dynamic Rescheduling', path: '/rescheduling', icon: RefreshCw },
  { name: 'Reports & Export', path: '/reports', icon: FileText },
];

const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
              CampusLab Opt
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                CODE CRACK 3.0
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
          <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Project Badge / Footer */}
        <div className="p-4 mx-4 mb-4 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-800/40 border border-slate-700/60">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">Final Year Project</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Intelligent Lab Allocation with FCFS & Best Fit Optimization Engine.
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

