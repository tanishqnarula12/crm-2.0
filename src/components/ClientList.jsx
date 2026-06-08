import React, { useState, useMemo } from 'react';
import {
  Users, Plus, X, SlidersHorizontal, Search, Trash2, CheckCircle2, AlertCircle, FileSpreadsheet
} from 'lucide-react';
import { 
  Avatar, Card, Field, inputCls, selectCls, btnPrimary, btnGhost 
} from './UI';

export default function ClientList({ clients, onSelect, onAdd, onDelete, onImport }) {
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [goalsMin, setGoalsMin] = useState('');
  const [goalsMax, setGoalsMax] = useState('');
  const [goalSet, setGoalSet] = useState('all');

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
      return true;
    });
  }, [clients, query, ageMin, ageMax, goalsMin, goalsMax, goalSet]);

  const activeCount =
    (query ? 1 : 0) +
    (ageMin !== '' || ageMax !== '' ? 1 : 0) +
    (goalsMin !== '' || goalsMax !== '' ? 1 : 0) +
    (goalSet !== 'all' ? 1 : 0);

  const clearAll = () => {
    setQuery(''); setAgeMin(''); setAgeMax(''); setGoalsMin(''); setGoalsMax(''); setGoalSet('all');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Clients</h2>
          <p className="text-sm text-slate-550 mt-0.5">
            {filtered.length === clients.length ? `${clients.length} clients` : `${filtered.length} of ${clients.length} clients`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(s => !s)}
            className={`relative inline-flex items-center gap-1.5 px-3 py-2.5 text-sm border rounded-lg font-semibold transition-colors ${
              showFilters 
                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal size={14} /> Filter
            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-blue-600 text-white">
                {activeCount}
              </span>
            )}
          </button>
          <button
            onClick={onImport}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm border border-slate-300 bg-white text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
            title="Import clients from Excel"
          >
            <FileSpreadsheet size={14} /> Import Excel
          </button>
          <button onClick={onAdd} className={btnPrimary}>
            <Plus size={14} /> Add client
          </button>
        </div>
      </div>

      {showFilters && (
        <Card className="p-5 mb-5 border border-blue-100 bg-blue-50/10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Search name or PAN</label>
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type to filter…" className={inputCls + ' pl-10'} />
              </div>
            </div>
            <Field label="Age">
              <div className="flex items-center gap-2">
                <input type="number" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} placeholder="Min" className={inputCls} />
                <span className="text-slate-400">–</span>
                <input type="number" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} placeholder="Max" className={inputCls} />
              </div>
            </Field>
            <Field label="Goals count">
              <div className="flex items-center gap-2">
                <input type="number" min="0" value={goalsMin} onChange={(e) => setGoalsMin(e.target.value)} placeholder="Min" className={inputCls} />
                <span className="text-slate-400">–</span>
                <input type="number" min="0" value={goalsMax} onChange={(e) => setGoalsMax(e.target.value)} placeholder="Max" className={inputCls} />
              </div>
            </Field>
          </div>
          <div className="flex items-end justify-between gap-3 mt-4">
            <div className="flex-1 max-w-xs">
              <Field label="Goal status">
                <select value={goalSet} onChange={(e) => setGoalSet(e.target.value)} className={selectCls}>
                  <option value="all">All clients</option>
                  <option value="yes">Goal set: Yes</option>
                  <option value="no">Goal set: No</option>
                </select>
              </Field>
            </div>
            {activeCount > 0 && (
              <button onClick={clearAll} className={btnGhost}>
                <X size={14} /> Clear filters
              </button>
            )}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden border border-slate-200/60">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 font-semibold">Client</th>
                <th className="text-left px-6 py-4 font-semibold">PAN</th>
                <th className="text-left px-6 py-4 font-semibold">Age</th>
                <th className="text-left px-6 py-4 font-semibold">Goals</th>
                <th className="text-left px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-blue-50/20 cursor-pointer transition-colors" onClick={() => onSelect(c.id)}>
                  <td className="px-6 py-4.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} />
                      <span className="font-semibold text-slate-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4.5 text-slate-500 font-mono text-xs tracking-wider">{c.pan}</td>
                  <td className="px-6 py-4.5 text-slate-600 tabular-nums">{c.age}</td>
                  <td className="px-6 py-4.5 text-slate-600 tabular-nums">{c.goals ? c.goals.length : 0}</td>
                  <td className="px-6 py-4.5">
                    {c.goals && c.goals.length > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50 rounded-full">
                        <CheckCircle2 size={11} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-500 ring-1 ring-slate-200/50 rounded-full">
                        <AlertCircle size={11} /> No goals
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4.5 text-right">
                    <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} className="text-slate-400 hover:text-rose-600 p-2 rounded-md hover:bg-rose-50 transition-all active:scale-95">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-20 text-slate-400">
                    {clients.length === 0 ? (
                      <div className="flex flex-col items-center gap-3">
                        <Users size={32} className="text-slate-300" />
                        <span className="font-semibold text-slate-500">No clients yet</span>
                        <span className="text-xs text-slate-400">Click "Add client" to create your first client profile</span>
                      </div>
                    ) : 'No clients match your filter criteria'}
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
