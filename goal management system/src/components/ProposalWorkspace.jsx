import React from 'react';
import InsuranceProposal from './InsuranceProposal';
import InvestmentProposal from './InvestmentProposal';
import { Card } from './UI';
import { FileText, ShieldAlert } from 'lucide-react';

export default function ProposalWorkspace({ client, subTab, setSubTab, isViewer }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tab Switcher */}
      <div className="no-print flex items-center gap-2 p-1 bg-slate-100/80 dark:bg-slate-950/40 rounded-xl max-w-md shadow-inner border border-slate-200/20 dark:border-slate-800/40">
        <button
          type="button"
          onClick={() => setSubTab('insurance')}
          className={`flex-1 py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
            subTab === 'insurance'
              ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm font-extrabold'
              : 'text-slate-400 dark:text-slate-505 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Insurance Proposal
        </button>
        <button
          type="button"
          onClick={() => setSubTab('investment')}
          className={`flex-1 py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
            subTab === 'investment'
              ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm font-extrabold'
              : 'text-slate-400 dark:text-slate-505 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Investment Proposal
        </button>
      </div>

      {/* Render Sub-Tool */}
      <div className="mt-4">
        {subTab === 'insurance' ? (
          <InsuranceProposal client={client} isViewer={isViewer} />
        ) : (
          <InvestmentProposal client={client} isViewer={isViewer} />
        )}
      </div>
    </div>
  );
}
