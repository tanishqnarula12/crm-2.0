import React from 'react';
import { 
  ChevronLeft, Pencil, Percent, TrendingUp, Calendar, IndianRupee, Info, CheckCircle2 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Card, btnSecondary } from './UI';
import { 
  calcGoal, buildProjection, monthLabel, fmtINR, fmtSip, goalIcon, goalEmoji, achievementColor, CURRENT_YEAR, CURRENT_MONTH, MONTH_NAMES 
} from '../utils/calc';

export default function GoalDetail({ goal, clientName, onBack, onEdit }) {
  const c = calcGoal(goal);
  const projection = buildProjection(goal);
  const remainingLabel = c.years >= 1 ? `${c.years.toFixed(1)} years to go` : c.months > 0 ? `${c.months} months to go` : 'Due now';

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

  const achievementBarColor = (pct) => {
    if (pct >= 99.95) return 'bg-gradient-to-r from-emerald-500 to-teal-500';
    if (pct >= 60) return 'bg-gradient-to-r from-orange-400 to-amber-500';
    if (pct >= 30) return 'bg-gradient-to-r from-yellow-400 to-amber-500';
    return 'bg-gradient-to-r from-rose-500 to-red-600';
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors group cursor-pointer">
        <ChevronLeft size={16} className="transition-transform group-hover:translate-x-[-2px]" /> Back to {clientName}'s portfolio
      </button>

      <Card className="p-6 border border-slate-200/60 dark:border-slate-800/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 flex items-center justify-center shrink-0 text-4xl select-none">
              {goalEmoji(goal.name)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{goal.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium flex items-center flex-wrap gap-2">
                <span>Target {monthLabel(goal.targetMonth || 1, goal.targetYear)}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span>{remainingLabel}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-slate-400 dark:text-slate-500">Started {monthLabel(goal.createdMonth || CURRENT_MONTH, goal.createdYear || CURRENT_YEAR)}</span>
              </p>
            </div>
          </div>
          <button onClick={onEdit} className={btnSecondary + ' w-full sm:w-auto'}>
            <Pencil size={14} /> Edit Details
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          <Metric label="Goal cost (today)" value={fmtINR(goal.amount)} />
          <Metric label="Future value" value={fmtINR(c.futureValue)} />
          <Metric label="Additional SIP" value={fmtSip(c.additionalSip) + '/mo'} negative={c.additionalSip < 0} />
          <Metric label="Lump-sum required" value={fmtINR(c.lumpSumRequired)} />
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Goal Achievement with current plan</span>
            <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">{c.achievementPct.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/20 dark:border-slate-900">
            <div className={`h-full transition-all duration-500 ${achievementBarColor(c.achievementPct)}`} style={{ width: `${Math.min(100, c.achievementPct)}%` }} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium">
            Projected corpus <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">{fmtINR(c.projectedCorpus)}</span> vs target future value <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">{fmtINR(c.futureValue)}</span>
            {c.shortfall > 0 && <> · shortfall <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">{fmtINR(c.shortfall)}</span></>}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs">
          <MiniStat icon={Percent} label="Inflation" value={`${goal.inflation}%`} />
          <MiniStat icon={TrendingUp} label="Expected return" value={`${goal.expectedReturn}%`} />
          <MiniStat icon={Calendar} label="SIP annual step-up" value={`${goal.sipIncRate}%`} />
          <MiniStat icon={IndianRupee} label="Current corpus" value={fmtINR(goal.currentInv)} />
        </div>
      </Card>

      {/* Visual Charts section */}
      {chartData.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-400 uppercase tracking-wider">Growth Projection Chart</h3>
          <Card className="p-6 border border-slate-200 dark:border-slate-800">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClosing" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-balance)" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="var(--chart-balance)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-invested)" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="var(--chart-invested)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
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
                      backgroundColor: 'var(--tooltip-bg)', 
                      borderColor: 'var(--tooltip-border)', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      color: 'var(--tooltip-color)',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                    }}
                    labelClassName="font-bold text-slate-800 dark:text-slate-200"
                  />
                  <Area type="monotone" dataKey="Closing Balance" stroke="var(--chart-balance)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorClosing)" />
                  <Area type="monotone" dataKey="Total Invested" stroke="var(--chart-invested)" strokeWidth={1.5} fillOpacity={1} fill="url(#colorInvested)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-6 mt-4 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-blue-500 dark:bg-indigo-500" />
                <span className="text-slate-600 dark:text-slate-400">Closing Balance (Projected Corpus)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-slate-400 dark:bg-slate-600" />
                <span className="text-slate-600 dark:text-slate-400">Total Invested Principal</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-400 uppercase tracking-wider">Year-by-year projection details</h3>
        <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="text-left px-6 py-4 font-bold">Year</th>
                  <th className="text-right px-6 py-4 font-bold">Opening Bal</th>
                  <th className="text-right px-6 py-4 font-bold">Monthly SIP</th>
                  <th className="text-right px-6 py-4 font-bold">Contribution</th>
                  <th className="text-right px-6 py-4 font-bold">Estimated Growth</th>
                  <th className="text-right px-6 py-4 font-bold">Closing Bal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                {projection.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      <span className="inline-flex items-center gap-1.5">
                        {r.year}
                        {r.isPartial && (
                          <span
                            title={`Calculated months: ${MONTH_NAMES[r.firstMonth - 1]}${r.firstMonth === r.lastMonth ? '' : '–' + MONTH_NAMES[r.lastMonth - 1]} ${r.year} (${r.monthsCovered} ${r.monthsCovered === 1 ? 'month' : 'months'})`}
                            className="text-slate-400 hover:text-slate-650 cursor-help"
                          >
                            <Info size={13} />
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right text-slate-650 dark:text-slate-350 tabular-nums">{fmtINR(r.openingBal)}</td>
                    <td className="px-6 py-3.5 text-right text-slate-650 dark:text-slate-350 tabular-nums">{fmtSip(r.monthlySip)}</td>
                    <td className="px-6 py-3.5 text-right text-slate-650 dark:text-slate-350 tabular-nums">{fmtINR(r.yearContribution)}</td>
                    <td className="px-6 py-3.5 text-right text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">{fmtINR(r.growth)}</td>
                    <td className="px-6 py-3.5 text-right font-bold text-slate-900 dark:text-white tabular-nums">{fmtINR(r.closingBal)}</td>
                  </tr>
                ))}
                {projection.length === 0 && (
                  <tr><td colSpan="6" className="text-center py-10 text-slate-400 dark:text-slate-600">Target date is now or in the past</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, pill, highlight, negative }) {
  return (
    <Card className={`p-5 hover:translate-y-[-1px] duration-300 border ${highlight ? 'border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-slate-900 dark:to-slate-850' : negative ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/10' : 'border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40'}`}>
      <p className={`text-[10px] font-bold mb-2 uppercase tracking-wider ${negative ? 'text-rose-500 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>{label}</p>
      {pill ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 ring-1 ring-emerald-250/50 dark:ring-emerald-900/50 rounded-full">
          <CheckCircle2 size={11} /> {pill}
        </span>
      ) : (
        <p className={`text-base font-bold tabular-nums ${negative ? 'text-rose-600 dark:text-rose-400' : highlight ? 'text-blue-800 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>{value}</p>
      )}
    </Card>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-450 border border-slate-200/30 dark:border-slate-800 flex items-center justify-center shrink-0">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">{label}</p>
        <p className="font-bold text-slate-900 dark:text-white tabular-nums truncate text-xs mt-0.5">{value}</p>
      </div>
    </div>
  );
}
