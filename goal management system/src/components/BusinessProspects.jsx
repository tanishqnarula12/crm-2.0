import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import SCHEMES from '../utils/schemes.json';
import {
  UserCheck, Search, X, Trash2, Pencil, Briefcase, CalendarClock, IndianRupee, CheckCircle2,
  LayoutGrid, Table as TableIcon, History, ArrowRight, Crown
} from 'lucide-react';
import { Card, Avatar, btnPrimary, btnGhost, inputCls, selectCls, Field } from './UI';
import {
  loadProspects, saveProspects, CATEGORY_THEME, fmtProspectStamp, fmtAmountINR,
  PROSPECT_STAGES, PROSPECT_STAGE_THEME
} from '../utils/prospects';
import { uid } from '../utils/calc';

const CATEGORIES = [
  "Small Cap",
  "Mid Cap",
  "Large Cap",
  "Large and Mid Cap",
  "Flexi Cap",
  "Multi Cap",
  "Multi Asset",
  "Gold",
  "Debt"
];

const getSchemesForCategory = (cat) => {
  if (cat && SCHEMES[cat]) {
    return SCHEMES[cat];
  }
  const all = {};
  for (const c in SCHEMES) {
    SCHEMES[c].forEach(s => { all[s] = true; });
  }
  return Object.keys(all).sort();
};

// ===========================================================================
// PROSPECTS MODULE — list of all generated business prospects
// ===========================================================================
export default function ProspectsView({ isViewer, onOpenProspect, prospectsChangeCounter, activeProspectId, setActiveProspectId }) {
  const [prospects, setProspects] = useState(() => loadProspects());
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'card'
  const [editing, setEditing] = useState(null); // local fallback modal when no onOpenProspect is supplied

  // Re-read from storage when proposal pages add prospects
  useEffect(() => {
    const sync = () => setProspects(loadProspects());
    window.addEventListener('focus', sync);
    window.addEventListener('crm:prospects-updated', sync);
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('crm:prospects-updated', sync);
    };
  }, []);

  // Re-sync when a parent-driven edit (e.g. from Client Profile) saves a change
  useEffect(() => {
    setProspects(loadProspects());
  }, [prospectsChangeCounter]);

  // Deep-link: open a specific prospect's form when navigated here with an id
  useEffect(() => {
    if (activeProspectId) {
      const found = prospects.find(p => p.id === activeProspectId);
      if (found) openEdit(found);
      if (setActiveProspectId) setActiveProspectId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProspectId, prospects]);

  const persist = (next) => { setProspects(next); saveProspects(next); };

  const openEdit = (p) => {
    if (onOpenProspect) onOpenProspect(p);
    else setEditing(p);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prospects
      .filter(p => stageFilter === 'all' || (p.stage || 'Qualified') === stageFilter)
      .filter(p => catFilter === 'all' || p.proposalCategory === catFilter)
      .filter(p => !q ||
        (p.applicant || '').toLowerCase().includes(q) ||
        (p.groupLeader || '').toLowerCase().includes(q) ||
        (p.proposalType || '').toLowerCase().includes(q) ||
        (p.pan || '').toLowerCase().includes(q))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [prospects, query, stageFilter, catFilter]);

  const stageCounts = useMemo(() => {
    const c = { all: prospects.length };
    PROSPECT_STAGES.forEach(s => { c[s] = prospects.filter(p => (p.stage || 'Qualified') === s).length; });
    return c;
  }, [prospects]);

  const handleSaveEdit = (updated) => {
    persist(prospects.map(p => p.id === updated.id ? updated : p));
    setEditing(null);
  };
  const handleDelete = (id) => {
    if (!window.confirm('Delete this prospect? This cannot be undone.')) return;
    persist(prospects.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <UserCheck size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Business Prospects</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Opportunities generated from Insurance &amp; Investment proposals</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prospect…" className={inputCls + ' pl-9 w-full md:w-56'} />
          </div>
          {/* View toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 shrink-0">
            <button onClick={() => setViewMode('table')} title="Table view" className={`p-1.5 rounded-lg cursor-pointer transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><TableIcon size={15} /></button>
            <button onClick={() => setViewMode('card')} title="Card view" className={`p-1.5 rounded-lg cursor-pointer transition-colors ${viewMode === 'card' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={15} /></button>
          </div>
        </div>
      </div>

      {/* Stage filter chips */}
      <div className="flex flex-wrap gap-2">
        <FilterChip label="All" count={stageCounts.all} active={stageFilter === 'all'} onClick={() => setStageFilter('all')} />
        {PROSPECT_STAGES.map(s => (
          <FilterChip key={s} label={s} count={stageCounts[s]} active={stageFilter === s} onClick={() => setStageFilter(s)} />
        ))}
        <span className="mx-1 w-px self-stretch bg-slate-200 dark:bg-slate-800" />
        {['all', 'investment', 'insurance'].map(c => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
              catFilter === c
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {c === 'all' ? 'All Types' : c}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
          <UserCheck className="mx-auto text-slate-400 dark:text-slate-600 mb-4" size={36} />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {prospects.length === 0 ? 'No prospects yet' : 'No prospects match your filters'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Open a client's Proposals → build a proposal → click <strong>Create Prospect</strong>.</p>
        </Card>
      ) : viewMode === 'table' ? (
        <Card className="overflow-hidden border border-slate-200/60 dark:border-slate-800/80 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="text-left px-6 py-4 font-bold">Proposal</th>
                  <th className="text-left px-6 py-4 font-bold">Applicant</th>
                  <th className="text-right px-6 py-4 font-bold">Amount</th>
                  <th className="text-left px-6 py-4 font-bold">Closing</th>
                  <th className="text-center px-6 py-4 font-bold">Stage</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                {filtered.map(p => (
                  <tr key={p.id} onClick={() => openEdit(p)} className="hover:bg-blue-50/20 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{p.proposalType}</div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ring-1 ${CATEGORY_THEME[p.proposalCategory] || CATEGORY_THEME.investment}`}>{p.proposalCategory}</span>
                        {(p.proposalType === 'Proposed SIP Changes' || p.proposalType === 'sipchanges') && (
                          <>
                            {p.sipRejected && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-200/60 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-900/40">
                                Rejected: {fmtAmountINR(p.sipRejected)}
                              </span>
                            )}
                            {p.sipContinue && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900/40">
                                Continue: {fmtAmountINR(p.sipContinue)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700 dark:text-slate-300 font-medium">{p.applicant || '—'}</div>
                      {p.pan && <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">{p.pan}</div>}
                      {p.groupLeader && <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1"><Crown size={10} className="text-amber-500" /> {p.groupLeader}</div>}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums font-bold text-slate-900 dark:text-white">{fmtAmountINR(p.amount)}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 tabular-nums">{p.closingDate ? new Date(p.closingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ring-1 ${PROSPECT_STAGE_THEME[p.stage || 'Qualified']}`}>{p.stage || 'Qualified'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isViewer && (
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-all opacity-0 group-hover:opacity-100" title="Delete"><Trash2 size={14} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full ring-1 ${CATEGORY_THEME[p.proposalCategory] || CATEGORY_THEME.investment}`}>{p.proposalCategory}</span>
                  <span className={`inline-flex items-center px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full ring-1 ${PROSPECT_STAGE_THEME[p.stage || 'Qualified']}`}>{p.stage || 'Qualified'}</span>
                </div>
                {!isViewer && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/30" title="Edit"><Pencil size={13} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/30" title="Delete"><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
              <button onClick={() => openEdit(p)} className="text-left w-full mt-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{p.proposalType}</h3>
                <div className="mt-1 text-lg font-black text-slate-900 dark:text-white tabular-nums">{fmtAmountINR(p.amount)}</div>
                {(p.proposalType === 'Proposed SIP Changes' || p.proposalType === 'sipchanges') && (p.sipRejected || p.sipContinue) && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {p.sipRejected && (
                      <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-200/60 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-900/40">
                        Rejected: {fmtAmountINR(p.sipRejected)}
                      </span>
                    )}
                    {p.sipContinue && (
                      <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900/40">
                        Continue: {fmtAmountINR(p.sipContinue)}
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Avatar name={p.applicant} size="sm" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{p.applicant}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <CalendarClock size={10} /> {p.closingDate ? `Closing ${new Date(p.closingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : (p.createdAt ? fmtProspectStamp(p.createdAt) : '—')}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Local fallback modal — only used when this view manages its own state
          (i.e. no onOpenProspect was supplied by a parent like App.jsx) */}
      {!onOpenProspect && editing && (
        <ProspectModal
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onConfirm={(list) => handleSaveEdit(list[0])}
        />
      )}
    </div>
  );
}

function FilterChip({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
        active
          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      {label}
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 dark:bg-slate-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>{count}</span>
    </button>
  );
}

// ===========================================================================
// PROSPECT MODAL — confirmation/edit form
//   mode "create": receives `drafts` (one per selected proposal) + `base`;
//                  each proposal is its own tab with its own table + remarks.
//   mode "edit":   receives a single `initial` prospect (+ stage management)
// ===========================================================================
export function ProspectModal({ mode = 'create', drafts = [], base = {}, initial = null, onClose, onConfirm }) {
  const isEdit = mode === 'edit';
  const seed = isEdit ? initial : base;

  // Shared header fields (apply to every prospect being created)
  const [groupLeader, setGroupLeader] = useState(seed.groupLeader || '');
  const [applicant, setApplicant] = useState(seed.applicant || '');
  const [pan, setPan] = useState(seed.pan || '');
  const [closingDate, setClosingDate] = useState(seed.closingDate || '');
  const [serviceManager, setServiceManager] = useState(seed.serviceManager || '');
  const [relationshipManager, setRelationshipManager] = useState(seed.relationshipManager || '');
  const [owner, setOwner] = useState(seed.owner || '');
  const [internalManager, setInternalManager] = useState(seed.internalManager || '');
  const [insuranceManager, setInsuranceManager] = useState(seed.insuranceManager || '');
  const [portfolioManager, setPortfolioManager] = useState(seed.portfolioManager || '');

  // Stage management (edit mode)
  const initialStage = initial?.stage || 'Qualified';
  const [stage, setStage] = useState(initialStage);
  const [stageRemark, setStageRemark] = useState('');
  const stageChanged = isEdit && stage !== initialStage;

  // Per-proposal items (each has its own amount, table AND remarks). One tab each.
  const initialItems = isEdit
    ? [{ 
        proposalType: initial.proposalType, 
        proposalCategory: initial.proposalCategory, 
        amount: initial.amount, 
        table: initial.table || { cols: [], rows: [] }, 
        remarks: initial.remarks || '',
        sipRejected: initial.sipRejected || '',
        sipContinue: initial.sipContinue || ''
      }]
    : drafts.map(d => ({ remarks: '', sipRejected: '', sipContinue: '', ...d }));
  const [items, setItems] = useState(initialItems);
  const [activeIdx, setActiveIdx] = useState(0);
  const active = items[activeIdx] || items[0] || {};

  const setActiveField = (field, val) => {
    setItems(prev => prev.map((it, idx) => idx === activeIdx ? { ...it, [field]: val } : it));
  };

  const handleTableChange = (rowIndex, colIndex, value) => {
    setItems(prev => prev.map((it, idx) => {
      if (idx !== activeIdx) return it;
      const newRows = [...it.table.rows];
      const row = [...newRows[rowIndex]];
      row[colIndex] = value;
      newRows[rowIndex] = row;

      // Re-calculate totals if there is a totalRow
      let newTotalRow = it.table.totalRow;
      let newAmount = it.amount;
      if (newTotalRow) {
        newTotalRow = it.table.cols.map((col, ci) => {
          if (ci === 0) return "";
          if (ci === 1) return "TOTAL";
          const isNum = (col.toLowerCase().includes('amount') || col.toLowerCase().includes('sip') || col.toLowerCase().includes('term')) && !col.toLowerCase().includes('date');
          if (isNum) {
            const sum = newRows.reduce((s, r) => {
              const val = String(r[ci] || '').replace(/,/g, '');
              const num = parseFloat(val);
              return s + (isNaN(num) ? 0 : num);
            }, 0);
            newAmount = sum; // Auto-update the main prospect amount!
            return sum;
          }
          return "";
        });
      }

      return {
        ...it,
        amount: newAmount,
        table: {
          ...it.table,
          rows: newRows,
          totalRow: newTotalRow
        }
      };
    }));
  };

  const canSave = groupLeader.trim() && applicant.trim() && items.length > 0 && 
    (!stageChanged || stageRemark.trim()) &&
    items.every(it => {
      if (it.proposalType === 'SIP Cancellation' || it.proposalType === 'SIP Registration') {
        return String(it.amount || '').trim() !== '' && Number(it.amount) > 0;
      }
      return true;
    });

  const handleConfirm = () => {
    if (!canSave) return;
    const shared = {
      groupLeaderId: seed.groupLeaderId || '',
      groupLeader: groupLeader.trim(), applicant: applicant.trim(), pan, closingDate,
      serviceManager, relationshipManager, owner, internalManager, insuranceManager, portfolioManager,
    };
    const stageHistory = stageChanged
      ? [...(initial?.stageHistory || []), { at: new Date().toISOString(), from: initialStage, to: stage, remark: stageRemark.trim() }]
      : (initial?.stageHistory || []);

    const list = items.map((it) => ({
      id: (isEdit && initial?.id) || uid(),
      ...shared,
      proposalType: it.proposalType,
      proposalCategory: it.proposalCategory,
      amount: it.amount,
      table: it.table || { cols: [], rows: [] },
      remarks: it.remarks || '',
      sipRejected: it.sipRejected || '',
      sipContinue: it.sipContinue || '',
      stage: isEdit ? stage : 'Qualified',
      stageHistory,
      createdAt: (isEdit && initial?.createdAt) || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    onConfirm(list);
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-50 flex items-center justify-center p-0 md:p-6 overflow-hidden animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-none md:rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200/50 dark:border-slate-800/80 animate-scale-up flex flex-col h-full md:h-[90vh] max-h-screen" onClick={(e) => e.stopPropagation()}>
        {/* Header (fixed) */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              {isEdit ? <Pencil size={15} /> : <Briefcase size={16} />}
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {isEdit ? 'Edit Prospect' : `Confirm Prospect${items.length > 1 ? `s (${items.length})` : ''}`}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body (scrolls) */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Shared prospect fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Group Leader Name *">
              <input value={groupLeader} onChange={(e) => setGroupLeader(e.target.value)} className={inputCls} placeholder="Family / group head" />
            </Field>
            <Field label="Applicant Name *">
              <input value={applicant} onChange={(e) => setApplicant(e.target.value)} className={inputCls} placeholder="Applicant" />
            </Field>
            <Field label="PAN of Applicant">
              <input value={pan} onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))} className={inputCls + ' font-mono tracking-widest uppercase'} placeholder="ABCDE1234F" />
            </Field>
            <Field label="Created Date & Time" hint="Set automatically">
              <div className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 tabular-nums">
                {isEdit && initial?.createdAt ? fmtProspectStamp(initial.createdAt) : 'On confirm'}
              </div>
            </Field>
            <Field label="Closing Date">
              <input type="date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} className={inputCls} />
            </Field>
            {isEdit && (
              <Field label="Stage">
                <select value={stage} onChange={(e) => setStage(e.target.value)} className={selectCls}>
                  {PROSPECT_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            )}

            <Field label="Service Manager"><input value={serviceManager} onChange={(e) => setServiceManager(e.target.value)} className={inputCls} /></Field>
            <Field label="Relationship Manager"><input value={relationshipManager} onChange={(e) => setRelationshipManager(e.target.value)} className={inputCls} /></Field>
            <Field label="Owner"><input value={owner} onChange={(e) => setOwner(e.target.value)} className={inputCls} /></Field>
            <Field label="Internal Manager"><input value={internalManager} onChange={(e) => setInternalManager(e.target.value)} className={inputCls} /></Field>
            <Field label="Insurance Manager"><input value={insuranceManager} onChange={(e) => setInsuranceManager(e.target.value)} className={inputCls} /></Field>
            <Field label="Portfolio Manager"><input value={portfolioManager} onChange={(e) => setPortfolioManager(e.target.value)} className={inputCls} /></Field>
          </div>


          {/* Stage history log (edit) */}
          {isEdit && (initial?.stageHistory || []).length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 p-4">
              <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2"><History size={13} /> Stage Change Log</h4>
              <ol className="space-y-2">
                {[...initial.stageHistory].reverse().map((h, i) => (
                  <li key={i} className="text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{fmtProspectStamp(h.at)}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">{h.from}</span>
                      <ArrowRight size={11} className="text-slate-400" />
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-[10px] font-bold">{h.to}</span>
                    </div>
                    {h.remark && <p className="text-slate-600 dark:text-slate-400 mt-0.5 pl-1">{h.remark}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Proposals — tabbed sections (one per proposal), each with its own table + remarks */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isEdit ? 'Proposal' : `Proposals — ${items.length} prospect${items.length > 1 ? 's' : ''} will be created`}
            </h4>

            {items.length > 1 && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-100/70 dark:bg-slate-950/40 rounded-xl overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {items.map((it, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                      activeIdx === i ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {it.proposalType}
                  </button>
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full ring-1 ${CATEGORY_THEME[active.proposalCategory] || CATEGORY_THEME.investment}`}>{active.proposalCategory}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{active.proposalType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {active.proposalType === 'SIP Cancellation' || active.proposalType === 'SIP Registration' ? 'Amount *' : 'Amount'}
                  </span>
                  <div className="relative">
                    <IndianRupee size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      value={active.amount}
                      onChange={(e) => setActiveField('amount', e.target.value.replace(/[^0-9.]/g, ''))}
                      className={inputCls + ' pl-7 py-1.5 w-36 text-right tabular-nums font-bold'}
                    />
                  </div>
                </div>
              </div>
              <ProspectTable table={active.table} onChange={handleTableChange} />

              {/* Mandatory stage-change remark */}
              {stageChanged && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/15 p-4">
                  <Field label={`Reason for stage change → ${stage} *`} hint="Required whenever the prospect stage changes">
                    <textarea value={stageRemark} onChange={(e) => setStageRemark(e.target.value)} rows={2} className={inputCls + ' resize-y'} placeholder="Explain why the stage changed…" />
                  </Field>
                </div>
              )}

              <Field label="Remarks (for this proposal)">
                <textarea value={active.remarks} onChange={(e) => setActiveField('remarks', e.target.value)} rows={2} className={inputCls + ' resize-y'} placeholder={`Notes for ${active.proposalType}…`} />
              </Field>
            </div>
          </div>
        </div>

        {/* Footer (fixed) */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-b-none md:rounded-b-2xl flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className={btnGhost}>Cancel</button>
          <button onClick={handleConfirm} disabled={!canSave} className={btnPrimary}>
            <CheckCircle2 size={14} /> {isEdit ? 'Save Changes' : `Confirm & Create${items.length > 1 ? ` ${items.length}` : ''}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// --- Category Cell component (rendered as a select dropdown) ----------------
function CategoryCell({ value, onChange }) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent border-0 focus:bg-slate-50 dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 py-1 px-1.5 rounded text-xs text-slate-700 dark:text-slate-300"
    >
      <option value="">Select Category...</option>
      {CATEGORIES.map((cat, idx) => (
        <option key={idx} value={cat}>{cat}</option>
      ))}
    </select>
  );
}

// --- Scheme Autocomplete Cell component (rendered as input with dropdown) ---
function SchemeAutocompleteCell({ value, categoryValue, onChange }) {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [filtered, setFiltered] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const handleFocus = () => {
    setFocused(true);
    updateFilteredList(query);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setFocused(false);
    }, 180);
  };

  const updateFilteredList = (q) => {
    const list = getSchemesForCategory(categoryValue);
    const trimmed = q.toLowerCase().trim();
    const matches = list.filter(item => item.toLowerCase().indexOf(trimmed) >= 0);
    setFiltered(matches.slice(0, 50));
    setActiveIndex(-1);
  };

  const handleChange = (val) => {
    const cleaned = val.replace(/[\r\n]/g, ' ');
    setQuery(cleaned);
    onChange(cleaned);
    updateFilteredList(cleaned);
  };

  const selectOption = (val) => {
    setQuery(val);
    onChange(val);
    setFocused(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (focused && filtered.length > 0 && activeIndex >= 0 && activeIndex < filtered.length) {
        selectOption(filtered[activeIndex]);
      }
    }
    if (!focused || filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    }
  };

  return (
    <div className="relative">
      <textarea
        value={query}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search mutual fund..."
        rows={2}
        className="w-full bg-transparent border-0 focus:bg-slate-50 dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 py-1 px-1.5 rounded text-xs text-slate-700 dark:text-slate-350 resize-none h-10 leading-normal"
      />
      {focused && filtered.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              onMouseDown={() => selectOption(item)}
              className={`px-3 py-1.5 text-xs font-semibold cursor-pointer truncate text-slate-800 dark:text-slate-200 transition-colors ${
                activeIndex === idx
                  ? 'bg-blue-50 dark:bg-blue-955/40 text-blue-600'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-850/50'
              }`}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Renders the proposal table (cols + rows, optional total) --------------
function ProspectTable({ table, onChange }) {
  const cols = table?.cols || [];
  const rows = table?.rows || [];
  const totalRow = table?.totalRow || null;
  if (cols.length === 0 || rows.length === 0) {
    return <p className="text-xs text-slate-400 dark:text-slate-500 italic font-medium">No table data.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          <tr>{cols.map((c, i) => <th key={i} className="px-3 py-2 text-left">{c}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((r, ri) => (
            <tr key={ri}>
              {(Array.isArray(r) ? r : cols.map(() => '')).map((cell, ci) => {
                const colName = cols[ci] || '';
                const isCategoryCol = colName.toLowerCase().includes('category');
                const isSchemeCol = colName.toLowerCase().includes('scheme');
                const isAmountCol = (colName.toLowerCase().includes('amount') || colName.toLowerCase().includes('sip') || colName.toLowerCase().includes('term')) && !colName.toLowerCase().includes('date');

                return (
                  <td key={ci} className="px-1 py-1">
                    {onChange ? (
                      isCategoryCol ? (
                        <CategoryCell
                          value={cell}
                          onChange={(val) => onChange(ri, ci, val)}
                        />
                      ) : isSchemeCol ? (
                        <SchemeAutocompleteCell
                          value={cell}
                          categoryValue={(() => {
                            const catColIndex = cols.findIndex(col => col.toLowerCase().includes('category'));
                            return catColIndex !== -1 ? r[catColIndex] : '';
                          })()}
                          onChange={(val) => onChange(ri, ci, val)}
                        />
                      ) : (
                        <input
                          type="text"
                          value={cell == null ? '' : String(cell)}
                          onChange={(e) => onChange(ri, ci, e.target.value)}
                          className={`w-full bg-transparent border-0 focus:bg-slate-50 dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 py-1 px-1.5 rounded text-xs text-slate-700 dark:text-slate-350 ${isAmountCol ? 'text-right font-mono font-semibold' : ''}`}
                        />
                      )
                    ) : (
                      <span className="px-2 py-1.5 block text-slate-700 dark:text-slate-300">{cell === '' || cell == null ? '—' : String(cell)}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {totalRow && (
            <tr className="bg-slate-50 dark:bg-slate-950/50 font-bold">
              {totalRow.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-slate-900 dark:text-white">
                  {cell === '' || cell == null ? '' : (typeof cell === 'number' ? '₹ ' + cell.toLocaleString('en-IN') : String(cell))}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
