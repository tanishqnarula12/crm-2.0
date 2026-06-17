import React from 'react';
import {
  Users2, CalendarCheck2, AlertTriangle, TrendingUp, UserPlus, Handshake,
  UserMinus, TrendingDown, Activity, Mail, Ban, ListChecks, ArrowUpRight
} from 'lucide-react';
import { Card } from './UI';

// Static mock data matching the planned CRM dashboard's "Home" screen.
// Not wired to live data yet — this is a visual preview of the bigger product.
const STAT_TILES = [
  { label: 'My Total Group Leaders', value: '124', trend: '+12%', hint: 'Active Leaders', icon: Users2, accent: 'blue' },
  { label: 'My Meeting Completed — This month', value: '48', trend: '+8%', hint: 'Target: 60', icon: CalendarCheck2, accent: 'emerald' },
  { label: 'My Group Leader With No Activity', value: '15', trend: '+5%', hint: 'Needs Attention', icon: AlertTriangle, accent: 'amber' },
  { label: 'My Total SIP — This month', value: '85%', hint: 'Collection Rate', icon: TrendingUp, accent: 'indigo', progress: 85 },
  { label: 'My Active Lead — This month', value: '312', trend: '+26%', hint: 'New Inquiries', icon: UserPlus, accent: 'blue' },
  { label: 'In Touch Clients (CY) — This month', value: '92%', hint: 'Retention Score', icon: Handshake, accent: 'emerald', progress: 92 },
  { label: 'Clients Not Touched (CY) — This month', value: '42', trend: '+12%', hint: 'Follow-up Required', icon: UserMinus, accent: 'amber' },
  { label: 'No of GL Not Touched', value: '18', trend: '+15%', hint: 'Decreasing Trend', icon: TrendingDown, accent: 'rose' },
  { label: 'No of GL Not Touched From', value: '23', hint: '', icon: Activity, accent: 'indigo', progress: 38 },
  { label: 'SIP in Pipeline', value: '—', hint: 'No data yet', icon: Mail, accent: 'slate' },
  { label: 'My Junk Leads — This month', value: '0', hint: 'Excellent', icon: Ban, accent: 'emerald' },
  { label: 'Total Task', value: '31', trend: '+100%', hint: 'Last Month: 0', icon: ListChecks, accent: 'blue' },
];

const ACCENTS = {
  blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
  indigo: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
  rose: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
  slate: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
};

const PROGRESS_BAR_COLORS = {
  blue: '#3b82f6',
  indigo: '#6366f1',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  slate: '#94a3b8',
};

function DashboardTile({ label, value, trend, hint, icon: Icon, accent, progress }) {
  return (
    <Card className="p-5 border border-slate-200/60 dark:border-slate-800/80">
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">{label}</p>
        <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${ACCENTS[accent]}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">{value}</p>
        {trend && (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
            <ArrowUpRight size={12} /> {trend}
          </span>
        )}
      </div>
      {progress != null ? (
        <div className="h-1.5 mt-3 rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: PROGRESS_BAR_COLORS[accent] }} />
        </div>
      ) : hint ? (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-2">{hint}</p>
      ) : null}
    </Card>
  );
}

const GL_CONVERTED = [
  { name: 'Sudhir Rai', amount: '₹5,000.00', records: 1 },
  { name: 'Utkarsh Singh', amount: '₹10,000.00', records: 2 },
];
const GL_CONVERTED_TOTAL = { amount: '₹15,000.00', records: 3 };

export default function Dashboard({ greetingName = 'there' }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Welcome {greetingName} 👋</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Here's what's happening with your clients and portfolios today.
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {STAT_TILES.map((tile, i) => <DashboardTile key={i} {...tile} />)}
      </div>

      {/* Bottom: GL converted + upcoming meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border border-slate-200/60 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No of GL Converted — This Month</h3>
            <button disabled className="text-[11px] font-bold text-blue-600 dark:text-blue-400 opacity-60 cursor-not-allowed">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="text-left py-2.5 font-bold">Group Leader Name</th>
                  <th className="text-right py-2.5 font-bold">Sum of Amount (Prospect Business)</th>
                  <th className="text-right py-2.5 font-bold">Record Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {GL_CONVERTED.map(row => (
                  <tr key={row.name}>
                    <td className="py-3 font-semibold text-blue-600 dark:text-blue-400">{row.name}</td>
                    <td className="py-3 text-right text-slate-700 dark:text-slate-300 tabular-nums">{row.amount}</td>
                    <td className="py-3 text-right text-slate-700 dark:text-slate-300 tabular-nums">{row.records}</td>
                  </tr>
                ))}
                <tr className="font-bold text-slate-900 dark:text-white">
                  <td className="py-3">Total</td>
                  <td className="py-3 text-right tabular-nums">{GL_CONVERTED_TOTAL.amount}</td>
                  <td className="py-3 text-right tabular-nums">{GL_CONVERTED_TOTAL.records}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6 border border-slate-200/60 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Number of Meeting Scheduled — Next Month</h3>
            <button disabled className="text-[11px] font-bold text-slate-500 dark:text-slate-400 opacity-60 cursor-not-allowed">Sort</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="text-left py-2.5 font-bold">Group Leader Name</th>
                  <th className="text-left py-2.5 font-bold">Meeting Setup</th>
                  <th className="text-left py-2.5 font-bold">Meeting Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="3" className="text-center py-10 text-slate-400 dark:text-slate-600 text-xs font-semibold">
                    No Group Leaders found for the next month.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
