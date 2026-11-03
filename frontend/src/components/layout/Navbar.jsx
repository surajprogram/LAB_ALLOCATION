import React, { useState } from 'react';
import { Sun, Moon, Database, LogOut, CheckCircle2, User, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { seedDatabase } from '../../services/api';

const Navbar = ({ onToggleMobileSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const toast = useToast();
  const [seeding, setSeeding] = useState(false);

  const handleResetData = async () => {
    if (!window.confirm('Reset all laboratories, departments, and requests to default sample dataset?')) {
      return;
    }
    setSeeding(true);
    try {
      await seedDatabase(true);
      toast.success('Database successfully reset to official sample dataset!');
      window.dispatchEvent(new CustomEvent('dataset-reset'));
    } catch (err) {
      toast.error('Failed to reset dataset: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 rounded-full text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>System Online • PostgreSQL Connected</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Reset / Reseed Button */}
        <button
          onClick={handleResetData}
          disabled={seeding}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all disabled:opacity-50"
          title="Reset laboratories & requests to sample dataset"
        >
          <Database className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${seeding ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">{seeding ? 'Resetting...' : 'Reset Sample Data'}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* User Profile / Logout */}
        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                {user.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                  {user.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {user.role}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;

