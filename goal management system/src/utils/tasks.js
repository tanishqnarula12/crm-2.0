// Task management — lightweight localStorage-backed store.
// Tasks are independent of the Supabase clients/goals data, so they persist
// locally per browser. Swappable for a DB-backed service later.

const KEY = 'crm:tasks';

export const loadTasks = () => {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveTasks = (tasks) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(tasks));
  } catch {
    /* ignore quota / serialization errors */
  }
};

export const TASK_STAGES = [
  'Open',
  'Waiting For Client',
  'In Process',
  'Completed',
  'Lost',
];

// Visual theme per stage (badge colours)
export const STAGE_THEME = {
  'Open': 'bg-blue-50 text-blue-700 ring-blue-200/60 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-900/40',
  'In Process': 'bg-amber-50 text-amber-700 ring-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-900/40',
  'Waiting For Client': 'bg-violet-50 text-violet-700 ring-violet-200/60 dark:bg-violet-950/30 dark:text-violet-400 dark:ring-violet-900/40',
  'Completed': 'bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900/40',
  'Lost': 'bg-rose-50 text-rose-700 ring-rose-200/60 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-900/40',
};

// "Related to" top-level options
export const RELATED_OPTIONS = ['NFT', 'Others'];

// NFT (Non-Financial Transaction) types — shown when "Related to" = NFT
export const NFT_TYPES = [
  'NSE Bank Addition',
  'Change of Bank',
  'Change of Broker',
  'Change of Contact Details',
  'Change of Name',
  'Change of Tax Status',
  'Folio Consolidation',
  'KYC - Private Limited',
  'KYC - HUF',
  'KYC - Individual (RI)',
  'KYC - NRI',
  'KYC - Trust',
  'KYC - Partnership',
  'KYC Modification',
  'Minor to Major',
  'New PAN Application',
  'PAN Card Updations',
  'PAN, KYC & FATCA Updation',
  'FATCA Updation',
  'IIN & FATCA Creation',
  'Mandate Creation',
  'Unit Transmission',
  'Change of IFSC',
  'Nominee Updation',
  'DOB Updation',
];

// AMC list — multi-select shown when "Related to" = NFT
export const AMC_LIST = [
  'Kotak', 'HDFC', 'ICICI', 'AXIS', 'TATA', 'Franklin', 'SBI', 'UTI',
  'Sundaram', 'Aditya Birla', 'Nippon', 'Bandhan', 'PGIM', 'DSP', 'PPFS',
  'Quant', 'Canara', 'LIC', 'Mahindra', 'Motilal Oswal', 'Mirae',
  'Baroda BNP', 'INVESCO', 'WhiteOak', 'HSBC',
];

export const fmtTaskStamp = (iso) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};
