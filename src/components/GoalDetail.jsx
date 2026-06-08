import React from 'react';
import { 
  ChevronLeft, Pencil, Percent, TrendingUp, Calendar, IndianRupee, Info, CheckCircle2 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Card, btnSecondary } from './UI';
import { 
  calcGoal, buildProjection, monthLabel, fmtINR, fmtSip, goalIcon, achievementColor, CURRENT_YEAR, CURRENT_MONTH, MONTH_NAMES 
} from '../utils/calc';

export default function GoalDetail({ goal, clientName, onBack, onEdit }) {
  const c = calcGoal(goal);
  const projection = buildProjection(goal);
  const remainingLabel = c.years >= 1 ? `${c.years.toFixed(1)} years to go` : c.months > 0 ? `${c.months} months to go` : 'Due now';
  const Icon = goalIcon(goal.name);

  // Format data for Recharts
  const chartData = projection.map(r => ({
    name: String(r.year),
    'Closing Balance': Math.round(r.closingBal),
    'Total Invested': Math.round(r.totalInvested)
  }));

  // Custom Tooltip Formatter
  const formatTooltipValue = (value) => {
    return [fmtINR(value), null];
  };

  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 mb-5 transition-colors group">
        <ChevronLeft size={16} className="transition-transform group-hover:translate-x-[-2px]" /> Back to {clientName}
      </button>

      <Card className="p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-700 to-sky-500 flex items-center justify-center text-white shadow-md ring-1 ring-blue-900/10">
              <Icon size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{goal.name}</h2>
              <p className="text-sm text-slate-500 mt-1">
                Target {monthLabel(goal.targetMonth || 1, goal.targetYear)}
                <span className="mx-2 text-slate-350">·</span>{remainingLabel}
                <span className="mx-2 text-slate-350">·</span>
                <span className="text-slate-400">started {monthLabel(goal.createdMonth || CURRENT_MONTH, goal.createdYear || CURRENT_YEAR)}</span>
              </p>
            </div>
          </div>
          <button onClick={onEdit} className={btnSecondary}>
            <Pencil size={14} /> Edit
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
          <Metric label="Goal (today)" value={fmtINR(goal.amount)} />
          <Metric label="Future value" value={fmtINR(c.futureValue)} />
          <Metric label="Total SIP needed" value={fmtSip(c.sipRequired) + '/mo'} highlight />
          <Metric label="Additional SIP" value={fmtSip(c.additionalSip) + '/mo'} pill={c.sipOnTrack ? 'On track' : null} />
          <Metric label="Lump-sum required" value={fmtINR(c.lumpSumRequired)} />
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Goal achievement with current plan</span>
            <span className="text-base font-bold text-slate-900 tabular-nums">{c.achievementPct.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 ${achievementColor(c.achievementPct)}`} style={{ width: `${Math.min(100, c.achievementPct)}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Projected corpus <span className="font-bold text-slate-700 tabular-nums">{fmtINR(c.projectedCorpus)}</span> vs target future value <span className="font-bold text-slate-700 tabular-nums">{fmtINR(c.futureValue)}</span>
            {c.shortfall > 0 && <> · shortfall <span className="font-bold text-rose-600 tabular-nums">{fmtINR(c.shortfall)}</span></>}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
          <MiniStat icon={Percent} label="Inflation" value={`${goal.inflation}%`} />
          <MiniStat icon={TrendingUp} label="Expected return" value={`${goal.expectedReturn}%`} />
          <MiniStat icon={Calendar} label="SIP step-up" value={`${goal.sipIncRate}%`} />
          <MiniStat icon={IndianRupee} label="Current corpus" value={fmtINR(goal.currentInv)} />
        </div>
      </Card>

      {/* Visual Charts section */}
      {chartData.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-bold text-slate-800 mb-3.5">Growth Projection Chart</h3>
          <Card className="p-5">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClosing" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => {
                      if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
                      if (val >= 100000) return `${(val / 100000).toFixed(0)}L`;
                      if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                      return val;
                    }}
                  />
                  <Tooltip 
                    formatter={formatTooltipValue} 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderColor: '#e2e8f0', 
                      borderRadius: '8px', 
                      fontSize: '12px' 
                    }}
                    labelClassName="font-bold text-slate-800"
                  />
                  <Area type="monotone" dataKey="Closing Balance" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorClosing)" />
                  <Area type="monotone" dataKey="Total Invested" stroke="#94a3b8" strokeWidth={1.5} fillOpacity={1} fill="url(#colorInvested)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-slate-600">Closing Balance (Projected Corpus)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-slate-400" />
                <span className="text-slate-600">Total Invested Principal</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      <h3 className="text-base font-bold text-slate-800 mb-3.5">Year-by-year projection details</h3>
      <Card className="overflow-hidden border border-slate-200/60">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Year</th>
                <th className="text-right px-5 py-3 font-semibold">Opening</th>
                <th className="text-right px-5 py-3 font-semibold">Monthly SIP</th>
                <th className="text-right px-5 py-3 font-semibold">Contribution</th>
                <th className="text-right px-5 py-3 font-semibold">Growth</th>
                <th className="text-right px-5 py-3 font-semibold">Closing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projection.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 font-bold text-slate-900 tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      {r.year}
                      {r.isPartial && (
                        <span
                          title={`Calculated months: ${MONTH_NAMES[r.firstMonth - 1]}${r.firstMonth === r.lastMonth ? '' : '–' + MONTH_NAMES[r.lastMonth - 1]} ${r.year} (${r.monthsCovered} ${r.monthsCovered === 1 ? 'month' : 'months'})`}
                          className="text-slate-400 hover:text-slate-650 cursor-help"
                        >
                          <Info size={12} />
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600 tabular-nums">{fmtINR(r.openingBal)}</td>
                  <td className="px-5 py-3 text-right text-slate-600 tabular-nums">{fmtSip(r.monthlySip)}</td>
                  <td className="px-5 py-3 text-right text-slate-600 tabular-nums">{fmtINR(r.yearContribution)}</td>
                  <td className="px-5 py-3 text-right text-emerald-600 font-semibold tabular-nums">{fmtINR(r.growth)}</td>
                  <td className="px-5 py-3 text-right font-bold text-slate-900 tabular-nums">{fmtINR(r.closingBal)}</td>
                </tr>
              ))}
              {projection.length === 0 && (
                <tr><td colSpan="6" className="text-center py-10 text-slate-400">Target date is now or in the past</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value, pill, highlight }) {
  return (
    <div className={`rounded-xl p-4 transition-transform hover:scale-[1.02] ${highlight ? 'bg-gradient-to-br from-blue-50 to-sky-50 ring-1 ring-blue-200/60' : 'bg-slate-50 ring-1 ring-slate-100/60'}`}>
      <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">{label}</p>
      {pill ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50 rounded-full">
          <CheckCircle2 size={11} /> {pill}
        </span>
      ) : (
        <p className={`text-base font-bold tabular-nums ${highlight ? 'text-blue-800' : 'text-slate-900'}`}>{value}</p>
      )}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">{label}</p>
        <p className="font-bold text-slate-900 tabular-nums truncate">{value}</p>
      </div>
    </div>
  );
}
