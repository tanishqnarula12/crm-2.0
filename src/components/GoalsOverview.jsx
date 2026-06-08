import React from 'react';
import { Target, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { Card, Avatar } from './UI';
import { goalIcon, calcGoal, monthLabel, fmtINR, fmtSip, achievementBadge } from '../utils/calc';

export function GoalsOverview({ goalGroups, onSelect }) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">Goals Summary</h2>
        <p className="text-sm text-slate-500 mt-0.5">{goalGroups.length} unique goals across all client portfolios</p>
      </div>
      {goalGroups.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Target className="mx-auto text-slate-300 mb-3" size={36} />
          <p className="text-sm text-slate-500">No client goals defined yet</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goalGroups.map(g => {
            const Icon = goalIcon(g.name);
            return (
              <Card key={g.name} className="p-5 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all hover:scale-[1.01]" >
                <div onClick={() => onSelect(g.name)} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 ring-1 ring-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{g.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{g.count} {g.count === 1 ? 'client' : 'clients'}</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-blue-600 name-count tabular-nums">{g.count}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function GoalGroupDetail({ groupName, entries, onBack, onSelectClient }) {
  const Icon = goalIcon(groupName);
  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 mb-5 transition-colors group">
        <ChevronLeft size={16} className="transition-transform group-hover:translate-x-[-2px]" /> Back to goals overview
      </button>
      <Card className="p-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-850 to-sky-500 flex items-center justify-center text-white shadow-md">
            <Icon size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{groupName}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{entries.length} {entries.length === 1 ? 'client has' : 'clients have'} this goal</p>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden border border-slate-200/60">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold">Client</th>
                <th className="text-right px-5 py-3.5 font-semibold">Target Date</th>
                <th className="text-right px-5 py-3.5 font-semibold">Goal cost (today)</th>
                <th className="text-right px-5 py-3.5 font-semibold">Additional SIP required</th>
                <th className="text-right px-5 py-3.5 font-semibold">Projected achievement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map(e => {
                const c = calcGoal(e.goal);
                return (
                  <tr key={e.id + e.goal.id} className="hover:bg-blue-50/20 cursor-pointer transition-colors" onClick={() => onSelectClient(e.id)}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={e.name} size="sm" />
                        <span className="font-semibold text-slate-900">{e.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-600 tabular-nums">{monthLabel(e.goal.targetMonth || 1, e.goal.targetYear)}</td>
                    <td className="px-5 py-3.5 text-right text-slate-600 tabular-nums">{fmtINR(e.goal.amount)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {c.sipOnTrack ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50 rounded-full">
                          <CheckCircle2 size={11} /> On track
                        </span>
                      ) : (
                        <span className="text-slate-600 tabular-nums font-semibold">{fmtSip(c.additionalSip)}/mo</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-full ${achievementBadge(c.achievementPct)}`}>
                        {c.achievementPct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
