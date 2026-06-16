import React, { useState, useMemo } from 'react';
import {
  Users, Plus, X, SlidersHorizontal, Search, Trash2, CheckCircle2, AlertCircle, FileSpreadsheet, PieChart, Wallet
} from 'lucide-react';
import {
  Avatar, Card, Field, inputCls, selectCls, btnPrimary, btnGhost
} from './UI';
import { hasAllocation } from '../utils/assets';

export default function ClientList({ clients, onSelect, onAdd, onDelete, onImport, isViewer }) {
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [goalsMin, setGoalsMin] = useState('');
  const [goalsMax, setGoalsMax] = useState('');
  const [goalSet, setGoalSet] = useState('all');
  const [allocSet, setAllocSet] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const aMin = ageMin === '' ? null : Number(ageMin);
    const aMax = ageMax === '' ? null : Number(ageMax);
    const gMin = goalsMin === '' ? null : Number(goalsMin);
    const gMax = goalsMax === '' ? null : Number(goalsMax);
    return clients.filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !(c.pan || '').toLowerCase().includes(q)) return false;
      if (aMin !== null && c.age < aMin) return false;
      if (aMax !== null && c.age > aMax) return false;
      const gc = c.goals ? c.goals.length : 0;
      if (gMin !== null && gc < gMin) return false;
      if (gMax !== null && gc > gMax) return false;
      if (goalSet === 'yes' && gc === 0) return false;
      if (goalSet === 'no' && gc > 0) return false;
      if (allocSet !== 'all') {
        const allocated = hasAllocation(c);
        if (allocSet === 'yes' && !allocated) return false;
        if (allocSet === 'no' && allocated) return false;
      }
      return true;
    });
  }, [clients, query, ageMin, ageMax, goalsMin, goalsMax, goalSet, allocSet]);

  const activeCount =
    (ageMin !== '' || ageMax !== '' ? 1 : 0) +
    (goalsMin !== '' || goalsMax !== '' ? 1 : 0) +
    (goalSet !== 'all' ? 1 : 0) +
    (allocSet !== 'all' ? 1 : 0);

  const clearAll = () => {
    setAgeMin(''); setAgeMax(''); setGoalsMin(''); setGoalsMax(''); setGoalSet('all'); setAllocSet('all');
  };

  return (
    <div className="space-y-6">
      {/* Header row: title + search bar + filter toggle + add client */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Clients Directory</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {filtered.length === clients.length ? `Showing all ${clients.length} profiles` : `Showing ${filtered.length} of ${clients.length} profiles`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar — always visible */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or PAN…"
              className={inputCls + ' pl-9 w-56'}
            />
          </div>
          <button
            onClick={() => setShowFilters(s => !s)}
            className={`relative inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border rounded-xl transition-all cursor-pointer ${
              showFilters
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/60 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal size={14} /> Filter
            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-blue-600 dark:bg-blue-500 text-white">
                {activeCount}
              </span>
            )}
          </button>
          {!isViewer && (
            <button onClick={onAdd} className={btnPrimary}>
              <Plus size={14} /> Add client
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <Card className="p-6 border border-blue-100 dark:border-blue-900/40 bg-blue-50/10 dark:bg-blue-950/5 shadow-md animate-scale-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Age Range">
              <div className="flex items-center gap-2">
                <input type="number" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} placeholder="Min" className={inputCls} />
                <span className="text-slate-400 dark:text-slate-600">–</span>
                <input type="number" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} placeholder="Max" className={inputCls} />
              </div>
            </Field>
            <Field label="Goals Count">
              <div className="flex items-center gap-2">
                <input type="number" min="0" value={goalsMin} onChange={(e) => setGoalsMin(e.target.value)} placeholder="Min" className={inputCls} />
                <span className="text-slate-400 dark:text-slate-600">–</span>
                <input type="number" min="0" value={goalsMax} onChange={(e) => setGoalsMax(e.target.value)} placeholder="Max" className={inputCls} />
              </div>
            </Field>
            <Field label="Goal Status">
              <div className="relative">
                <select value={goalSet} onChange={(e) => setGoalSet(e.target.value)} className={selectCls}>
                  <option value="all">All clients</option>
                  <option value="yes">Goal set: Yes</option>
                  <option value="no">Goal set: No</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                  <SlidersHorizontal size={12} />
                </div>
              </div>
            </Field>
            <Field label="Asset Allocation Status">
              <div className="relative">
                <select value={allocSet} onChange={(e) => setAllocSet(e.target.value)} className={selectCls}>
                  <option value="all">All clients</option>
                  <option value="yes">Allocation set: Yes</option>
                  <option value="no">Allocation set: No</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                  <SlidersHorizontal size={12} />
                </div>
              </div>
            </Field>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-200/40 dark:border-slate-800/40">
            {/* Import Excel lives inside the filter panel */}
            {!isViewer && (
              <button
                onClick={onImport}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer w-full sm:w-auto justify-center"
              >
                <FileSpreadsheet size={14} /> Import Excel
              </button>
            )}
            {activeCount > 0 && (
              <button onClick={clearAll} className={btnGhost}>
                <X size={14} /> Clear filters
              </button>
            )}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden border border-slate-200/60 dark:border-slate-800/80 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="text-left px-6 py-4 font-bold">Client Name</th>
                <th className="text-left px-6 py-4 font-bold">PAN Card</th>
                <th className="text-left px-6 py-4 font-bold">Age</th>
                <th className="text-left px-6 py-4 font-bold">Goals Defined</th>
                <th className="text-left px-6 py-4 font-bold">Goal Status</th>
                <th className="text-left px-6 py-4 font-bold">Asset Allocation Status</th>
                <th className="px-6 py-4 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-blue-50/20 dark:hover:bg-slate-800/40 cursor-pointer transition-colors" onClick={() => onSelect(c.id)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} />
                      <span className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs tracking-wider">{c.pan}</td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300 tabular-nums">{c.age || '—'}</td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300 tabular-nums font-semibold">{c.goals ? c.goals.length : 0}</td>
                  <td className="px-6 py-4">
                    {c.goals && c.goals.length > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200/50 dark:ring-emerald-900/30 rounded-full">
                        <CheckCircle2 size={11} /> Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-1 ring-slate-200/50 dark:ring-slate-700/50 rounded-full">
                        <AlertCircle size={11} /> No
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {hasAllocation(c) ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200/50 dark:ring-emerald-900/30 rounded-full">
                        <PieChart size={11} /> Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-1 ring-slate-200/50 dark:ring-slate-700/50 rounded-full">
                        <Wallet size={11} /> No
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!isViewer && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                        className="text-slate-400 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all active:scale-95 cursor-pointer"
                        title="Delete client profile"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-20 text-slate-400 dark:text-slate-600">
                    {clients.length === 0 ? (
                      <div className="flex flex-col items-center gap-3 animate-fade-in">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-300 dark:text-slate-800">
                          <Users size={32} />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">No Clients Registered</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">Click "Add client" or "Import Excel" to establish client profiles and start goal planning</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <span className="font-semibold text-slate-500 dark:text-slate-400">No results found</span>
                        <span className="text-xs">Adjust your filters to see more profiles</span>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
