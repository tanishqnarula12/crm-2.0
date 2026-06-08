import React from 'react';
import { avatarColor, initials } from '../utils/calc';

export function Avatar({ name, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'w-12 h-12 text-base' : size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
  return (
    <div className={`${sizeClass} ${avatarColor(name)} rounded-full flex items-center justify-center text-white font-semibold shadow-sm shrink-0 transition-transform hover:scale-105`}>
      {initials(name)}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
}

export function StatTile({ label, value, hint, icon: Icon, accent = 'blue' }) {
  const accents = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <Card className="p-5 hover:translate-y-[-2px] hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 mb-1.5 truncate">{label}</p>
          <p className="text-xl font-semibold text-slate-900 tabular-nums truncate">{value}</p>
          {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
        </div>
        {Icon && (
          <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${accents[accent]}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
    </Card>
  );
}

export function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export const inputCls = 'w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400';
export const selectCls = inputCls + ' bg-white cursor-pointer';
export const btnPrimary = 'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-gradient-to-br from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white rounded-lg shadow-sm hover:shadow transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed';
export const btnSecondary = 'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-all hover:scale-[1.01] active:scale-[0.99]';
export const btnGhost = 'inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all';
