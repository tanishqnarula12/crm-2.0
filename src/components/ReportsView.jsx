import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Card, Avatar, Field, selectCls } from './UI';
import { goalIcon, monthLabel, fmtINR, fmtSip, achievementBadge, CURRENT_MONTH, CURRENT_YEAR } from '../utils/calc';

export default function ReportsView({ goalNames, goalFilter, setGoalFilter, timeframe, setTimeframe, rows, onOpenClient }) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">Reports & Timelines</h2>
        <p className="text-sm text-slate-500 mt-0.5">Track and filter client goals due within a designated timeframe</p>
      </div>
      <Card className="p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Goal Category Filter">
            <select value={goalFilter} onChange={(e) => setGoalFilter(e.target.value)} className={selectCls}>
              <option value="all">All Goals</option>
              {goalNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Target Timeframe">
            <select value={timeframe} onChange={(e) => setTimeframe(Number(e.target.value))} className={selectCls}>
              <option value={1}>1 Year</option>
              <option value={3}>3 Years</option>
              <option value={5}>5 Years</option>
              <option value={10}>10 Years</option>
              <option value={15}>15 Years</option>
              <option value={20}>20 Years</option>
              <option value={50}>All timeframes</option>
            </select>
          </Field>
        </div>
      </Card>

      <p className="text-sm text-slate-550 mb-4">
        Found {rows.length} {rows.length === 1 ? 'goal' : 'goals'} due on or before <span className="font-bold text-slate-700">{monthLabel(CURRENT_MONTH, CURRENT_YEAR + timeframe)}</span>
      </p>

      <Card className="overflow-hidden border border-slate-200/60">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold">Client</th>
                <th className="text-left px-5 py-3.5 font-semibold">Goal</th>
                <th className="text-right px-5 py-3.5 font-semibold">Target Date</th>
                <th className="text-right px-5 py-3.5 font-semibold">Time Horizon</th>
                <th className="text-right px-5 py-3.5 font-semibold">Future Cost</th>
                <th className="text-right px-5 py-3.5 font-semibold">Additional SIP req.</th>
                <th className="text-right px-5 py-3.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, i) => {
                const Icon = goalIcon(r.goal.name);
                return (
                  <tr key={i} className="hover:bg-blue-50/20 cursor-pointer transition-colors" onClick={() => onOpenClient(r.clientId)}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.clientName} size="sm" />
                        <span className="font-semibold text-slate-900">{r.clientName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-semibold">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-blue-600 shrink-0" />
                        {r.goal.name}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-650 tabular-nums">{monthLabel(r.goal.targetMonth || 1, r.goal.targetYear)}</td>
                    <td className="px-5 py-3.5 text-right text-slate-650 tabular-nums">{r.calc.years >= 1 ? `${r.calc.years.toFixed(1)} yrs` : `${r.calc.months} mo`}</td>
                    <td className="px-5 py-3.5 text-right text-slate-650 tabular-nums font-bold">{fmtINR(r.calc.futureValue)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {r.calc.sipOnTrack ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50 rounded-full">
                          <CheckCircle2 size={11} /> On track
                        </span>
                      ) : (
                        <span className="text-slate-600 tabular-nums font-semibold">{fmtSip(r.calc.additionalSip)}/mo</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-full ${achievementBadge(r.calc.achievementPct)}`}>
                        {r.calc.achievementPct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-16 text-slate-400">
                    No client goals match the chosen timeline or category filters
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
