import React from 'react';
import { avatarColor, initials } from '../utils/calc';

export function Avatar({ name, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'w-12 h-12 text-base' : size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
  return (
    <div className={`${sizeClass} ${avatarColor(name)} rounded-full flex items-center justify-center text-white font-bold shadow-sm shrink-0 transition-all hover:scale-105 active:scale-95`}>
      {initials(name)}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-lg shadow-slate-100/40 dark:shadow-none hover:shadow-xl hover:shadow-slate-200/30 dark:hover:shadow-none transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
}

export function StatTile({ label, value, hint, icon: Icon, accent = 'blue' }) {
  const accents = {
    blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-1 ring-blue-100/50 dark:ring-blue-900/30',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-100/50 dark:ring-indigo-900/30',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-100/50 dark:ring-emerald-900/30',
    amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 ring-1 ring-amber-100/50 dark:ring-amber-900/30',
  };

  return (
    <Card className="p-5 border border-slate-200/60 dark:border-slate-800/80 hover:translate-y-[-2px] duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums truncate">{value}</p>
          {hint && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium">{hint}</p>}
        </div>
        {Icon && (
          <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${accents[accent]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </Card>
  );
}

export function Field({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{label}</label>
      {children}
      {hint && <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

export const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-600 dark:focus:ring-blue-500/10 transition-all placeholder-slate-400 dark:placeholder-slate-600 shadow-sm';
export const selectCls = inputCls + ' bg-white dark:bg-slate-950 cursor-pointer appearance-none';

export const btnPrimary = 'inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 text-xs font-bold uppercase tracking-wider bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
export const btnSecondary = 'inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 text-xs font-bold uppercase tracking-wider bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer';
export const btnGhost = 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer';
