import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, Download, Plus, Target, Trash2, Pencil, FileText, RefreshCw, CheckCircle2, Save, TrendingUp, IndianRupee 
} from 'lucide-react';
import { 
  Avatar, Card, btnPrimary, btnSecondary, btnGhost, inputCls 
} from './UI';
import { 
  calcGoal, fmtINR, fmtFull, fmtSip, goalIcon, achievementColor, generateAssumptionsText, refreshAssumptionsText, monthLabel 
} from '../utils/calc';
import { exportClientPdf } from '../utils/pdf';

export default function ClientDetail({ client, totals, onBack, onAddGoal, onSelectGoal, onDeleteGoal, onSaveAssumptions, onEditClient }) {
  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportClientPdf(client);
    } catch (err) {
      alert('Could not generate PDF: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 mb-5 transition-colors group">
        <ChevronLeft size={16} className="transition-transform group-hover:translate-x-[-2px]" /> Back to clients
      </button>

      <Card className="p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={client.name} size="lg" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{client.name}</h2>
              <p className="text-sm text-slate-500 mt-1">
                <span className="font-mono tracking-wide bg-slate-100 px-2 py-0.5 rounded text-xs">{client.pan}</span>
                <span className="mx-2 text-slate-300">·</span>
                {client.age} years old
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button onClick={onEditClient} className={btnSecondary + ' flex-1 sm:flex-none'}>
              <Pencil size={14} /> Edit Details
            </button>
            <button onClick={handleExport} disabled={exporting} className={btnSecondary + ' flex-1 sm:flex-none disabled:opacity-60 disabled:cursor-wait'}>
              <Download size={14} className={exporting ? 'animate-bounce' : ''} /> {exporting ? 'Generating…' : 'Export PDF'}
            </button>
            <button onClick={onAddGoal} className={btnPrimary + ' flex-1 sm:flex-none'}>
              <Plus size={14} /> Add goal
            </button>
          </div>
        </div>

        {client.goals && client.goals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <SummaryTile label="Total SIP needed" value={fmtSip(totals.totalSip) + '/mo'} icon={TrendingUp} accent="blue" />
            <SummaryTile label="Additional SIP needed" value={fmtSip(totals.totalAdditional) + '/mo'} icon={Plus} accent="indigo" />
            <SummaryTile label="Lump-sum needed today" value={fmtFull(totals.totalLump)} icon={IndianRupee} accent="emerald" />
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-800">Goals ({client.goals ? client.goals.length : 0})</h3>
      </div>

      {!client.goals || client.goals.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-slate-200">
          <Target className="mx-auto text-slate-300 mb-4" size={36} />
          <p className="text-sm text-slate-500 mb-4">No goals defined yet for this client</p>
          <button onClick={onAddGoal} className={btnSecondary}>
            <Plus size={14} /> Create the first goal
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {client.goals.map(g => {
            const c = calcGoal(g);
            const Icon = goalIcon(g.name);
            return (
              <Card key={g.id} className="p-5 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all group" >
                <div onClick={() => onSelectGoal(g.id)}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 ring-1 ring-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{g.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Target {monthLabel(g.targetMonth || 1, g.targetYear)}
                          {c.years > 0 && ` · ${c.years >= 1 ? `${c.years.toFixed(1)} yrs` : `${c.months} mo`}`}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteGoal(g.id); }} 
                      className="text-slate-300 hover:text-rose-600 p-2 rounded-md hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-xs text-slate-500 font-semibold">Achievement Progress</span>
                      <span className="text-xs font-bold text-slate-900 tabular-nums">{c.achievementPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${achievementColor(c.achievementPct)}`} style={{ width: `${Math.min(100, c.achievementPct)}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs border-t border-slate-50 pt-3">
                    <KV label="Goal (today)" value={fmtINR(g.amount)} />
                    <KV label="Future value" value={fmtINR(c.futureValue)} />
                    <KV label="Current investment" value={fmtINR(g.currentInv)} />
                    <KV label="Current SIP" value={fmtSip(g.currentSip) + '/mo'} />
                    <KV label="Total SIP needed" value={fmtSip(c.sipRequired) + '/mo'} />
                    <KV label="Additional SIP" value={c.sipOnTrack ? null : (fmtSip(c.additionalSip) + '/mo')} pill={c.sipOnTrack ? 'On track' : null} />
                    <KV label="Lump-sum req." value={fmtINR(c.lumpSumRequired)} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <AssumptionsSection client={client} onSave={onSaveAssumptions} />
      </div>
    </div>
  );
}

function AssumptionsSection({ client, onSave }) {
  const savedText = client.assumptions;
  const hasSaved = typeof savedText === 'string' && savedText.length > 0;
  const generated = useMemo(() => generateAssumptionsText(client), [client]);
  const displayText = hasSaved ? savedText : generated;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayText);
  const [confirmRefresh, setConfirmRefresh] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(displayText);
  }, [displayText, editing]);

  const startEdit = () => {
    setDraft(displayText);
    setEditing(true);
    setConfirmRefresh(false);
    setJustRefreshed(false);
  };
  const cancel = () => {
    setDraft(displayText);
    setEditing(false);
    setConfirmRefresh(false);
  };
  const save = () => {
    onSave(draft);
    setEditing(false);
    setConfirmRefresh(false);
  };
  const doRefresh = () => {
    const next = refreshAssumptionsText(client, draft || '');
    setDraft(next);
    setConfirmRefresh(false);
    setJustRefreshed(true);
    setTimeout(() => setJustRefreshed(false), 1800);
  };
  const onRefreshClick = () => {
    const fresh = generateAssumptionsText(client);
    if (!draft.trim() || draft === fresh) {
      doRefresh();
      return;
    }
    const next = refreshAssumptionsText(client, draft);
    if (next === draft) {
      setJustRefreshed(true);
      setTimeout(() => setJustRefreshed(false), 1800);
      return;
    }
    setConfirmRefresh(true);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-sky-50 ring-1 ring-blue-100 flex items-center justify-center text-blue-700">
            <FileText size={16} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Assumptions</h3>
            <p className="text-xs text-slate-500">Notes and assumptions used in planning for this client</p>
          </div>
        </div>
        {!editing && (
          <button onClick={startEdit} className={btnSecondary}>
            <Pencil size={14} /> Edit
          </button>
        )}
      </div>

      {!editing ? (
        <div className="rounded-lg bg-slate-50 ring-1 ring-slate-100 px-4 py-3.5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-sans border border-slate-200/20">
          {displayText}
          {!hasSaved && (
            <p className="mt-3 text-[11px] text-slate-400 italic">
              Auto-generated from goals. Click Edit to customise and save.
            </p>
          )}
        </div>
      ) : (
        <div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={Math.max(8, Math.min(20, (draft.match(/\n/g) || []).length + 2))}
            className={inputCls + ' font-sans leading-relaxed resize-y'}
            placeholder="Write your assumptions and notes for this client…"
          />

          {confirmRefresh && (
            <div className="mt-3 flex items-center justify-between gap-3 px-3 py-2.5 bg-amber-50 ring-1 ring-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                Update the rate list with fresh values from this client's goals? Your notes stay untouched.
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setConfirmRefresh(false)} className="text-xs font-semibold text-slate-600 hover:text-slate-950 px-2 py-1">Cancel</button>
                <button onClick={doRefresh} className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-2.5 py-1 rounded-md">Yes, update</button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 gap-2">
            <div className="flex items-center gap-2">
              <button onClick={onRefreshClick} className={btnGhost} title="Replace text with a fresh version pulled from this client's goals">
                <RefreshCw size={14} /> Refresh from goals
              </button>
              {justRefreshed && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 size={12} /> Refreshed
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={cancel} className={btnGhost}>Cancel</button>
              <button onClick={save} className={btnPrimary}>
                <Save size={14} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function SummaryTile({ label, value, icon: Icon, accent }) {
  const accents = {
    blue: 'from-blue-50 to-blue-100/30 text-blue-700 ring-blue-200/50',
    indigo: 'from-indigo-50 to-indigo-100/30 text-indigo-700 ring-indigo-200/50',
    emerald: 'from-emerald-50 to-emerald-100/30 text-emerald-700 ring-emerald-200/50',
  };
  return (
    <div className={`rounded-xl bg-gradient-to-br ${accents[accent]} ring-1 p-4 flex items-start justify-between hover:scale-[1.01] transition-transform`}>
      <div className="min-w-0">
        <p className="text-xs font-semibold opacity-85 mb-1">{label}</p>
        <p className="text-lg font-bold tabular-nums">{value}</p>
      </div>
      <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center shrink-0">
        <Icon size={15} />
      </div>
    </div>
  );
}

function KV({ label, value, pill }) {
  return (
    <div>
      <p className="text-slate-500 text-[10px] font-semibold mb-0.5 uppercase tracking-wider">{label}</p>
      {pill ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50 rounded-full mt-0.5">
          <CheckCircle2 size={10} /> {pill}
        </span>
      ) : (
        <p className="font-bold text-slate-900 tabular-nums">{value}</p>
      )}
    </div>
  );
}
