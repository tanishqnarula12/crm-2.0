// Business Prospects — lightweight localStorage-backed store.
// Prospects are generated from the Proposals page ("Create Prospect"): each
// selected proposal (Investment sub-type or Insurance type) becomes one prospect
// carrying the generated proposal table, amount and the client's coverage team.

const KEY = 'crm:prospects';

export const loadProspects = () => {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveProspects = (prospects) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(prospects));
  } catch {
    /* ignore quota / serialization errors */
  }
};

// Append new prospects and persist; returns the merged list.
export const addProspects = (newOnes) => {
  const all = [...newOnes, ...loadProspects()];
  saveProspects(all);
  return all;
};

export const CATEGORY_THEME = {
  investment: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900/40',
  insurance: 'bg-amber-50 text-amber-700 ring-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-900/40',
};

// Lifecycle stages for a business prospect
export const PROSPECT_STAGES = ['Qualified', 'Work Executed', 'Close Won', 'Close Lost'];

export const PROSPECT_STAGE_THEME = {
  'Qualified': 'bg-blue-50 text-blue-700 ring-blue-200/60 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-900/40',
  'Work Executed': 'bg-amber-50 text-amber-700 ring-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-900/40',
  'Close Won': 'bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900/40',
  'Close Lost': 'bg-rose-50 text-rose-700 ring-rose-200/60 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-900/40',
};

export const fmtProspectStamp = (iso) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const fmtAmountINR = (val) => {
  const n = Number(String(val ?? '').toString().replace(/,/g, '')) || 0;
  return '₹ ' + n.toLocaleString('en-IN');
};
