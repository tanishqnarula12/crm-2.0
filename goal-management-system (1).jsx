import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Target, FileBarChart, Plus, ChevronLeft, Trash2, X, TrendingUp, IndianRupee,
  Calendar, Percent, Search, SlidersHorizontal, Pencil, Info, Shield, Plane, Car,
  Home, Heart, GraduationCap, Gift, Sparkles, Wallet, MoreHorizontal, CheckCircle2,
  AlertCircle, Download, RefreshCw, Save, FileText
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────────────────────
   Constants & helpers
   ────────────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'gms:state';
const NOW = new Date();
const CURRENT_YEAR = NOW.getFullYear();
const CURRENT_MONTH = NOW.getMonth() + 1;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthLabel = (m, y) => `${MONTH_NAMES[(m - 1 + 12) % 12]} ${y}`;
const monthsBetween = (fromM, fromY, toM, toY) => (toY - fromY) * 12 + (toM - fromM);

const GOAL_PRESETS = ['Emergency', 'Vacation', 'Dream Car', 'Dream Home', 'Marriage', 'Kids Education', 'Kids Marriage', 'Financial Freedom', 'Wealth Creation', 'Others'];

const GOAL_ICONS = {
  'Emergency': Shield,
  'Vacation': Plane,
  'Dream Car': Car,
  'Dream Home': Home,
  'Marriage': Heart,
  'Kids Education': GraduationCap,
  'Kids Marriage': Gift,
  'Financial Freedom': Sparkles,
  'Wealth Creation': Wallet,
};
const goalIcon = (name) => GOAL_ICONS[name] || MoreHorizontal;

const fmtINR = (n) => {
  if (!isFinite(n) || n === null || n === undefined) return '₹0';
  const abs = Math.abs(n);
  if (abs >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

const fmtFull = (n) => {
  if (!isFinite(n) || n === null) return '₹0';
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

const fmtSip = (n) => {
  if (!isFinite(n) || n === null || n === undefined) return '₹0';
  return `₹${Math.round(Number(n)).toLocaleString('en-IN')}`;
};

const achievementColor = (pct) => {
  if (pct >= 99.95) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-orange-500';
  if (pct >= 30) return 'bg-amber-500';
  return 'bg-rose-500';
};
const achievementBadge = (pct) => {
  if (pct >= 99.95) return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
  if (pct >= 60) return 'bg-orange-50 text-orange-700 ring-1 ring-orange-200';
  if (pct >= 30) return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
  return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200';
};

const nv = (v) => (v === undefined || v === null || Number.isNaN(v)) ? '' : v;
const parseNum = (e, min) => {
  const raw = e.target.value;
  if (raw === '' || raw === '-') return undefined;
  const n = Number(raw);
  if (!isFinite(n)) return undefined;
  return min !== undefined ? Math.max(min, n) : n;
};

// Stable avatar color per client name
const AVATAR_PALETTE = [
  'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500',
  'bg-pink-500', 'bg-rose-500', 'bg-orange-500', 'bg-amber-500',
  'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500',
];
const avatarColor = (name) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
};
const initials = (name) => name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

/* ──────────────────────────────────────────────────────────────────────────
   Seed data
   ────────────────────────────────────────────────────────────────────────── */

const seedData = {
  clients: [
    { id: 'c1', name: 'Aarav Sharma', pan: 'ABCPS1234A', age: 34, goals: [
      { id: 'g1', name: 'Financial Freedom', amount: 50000000, targetMonth: 4, targetYear: CURRENT_YEAR + 25, createdMonth: CURRENT_MONTH, createdYear: CURRENT_YEAR, inflation: 6, expectedReturn: 12, sipIncRate: 10, currentInv: 500000, currentSip: 25000 },
      { id: 'g2', name: 'Kids Education', amount: 4000000, targetMonth: 6, targetYear: CURRENT_YEAR + 12, createdMonth: CURRENT_MONTH, createdYear: CURRENT_YEAR, inflation: 8, expectedReturn: 11, sipIncRate: 8, currentInv: 200000, currentSip: 15000 },
    ]},
    { id: 'c2', name: 'Priya Patel', pan: 'BXYPP5678B', age: 41, goals: [
      { id: 'g3', name: 'Financial Freedom', amount: 80000000, targetMonth: 3, targetYear: CURRENT_YEAR + 19, createdMonth: CURRENT_MONTH, createdYear: CURRENT_YEAR, inflation: 6, expectedReturn: 11, sipIncRate: 10, currentInv: 1500000, currentSip: 40000 },
      { id: 'g4', name: 'Dream Home', amount: 15000000, targetMonth: 10, targetYear: CURRENT_YEAR + 5, createdMonth: CURRENT_MONTH, createdYear: CURRENT_YEAR, inflation: 7, expectedReturn: 9, sipIncRate: 5, currentInv: 3000000, currentSip: 50000 },
    ]},
    { id: 'c3', name: 'Rohan Mehta', pan: 'CQRPM9012C', age: 28, goals: [
      { id: 'g5', name: 'Financial Freedom', amount: 30000000, targetMonth: 4, targetYear: CURRENT_YEAR + 32, createdMonth: CURRENT_MONTH, createdYear: CURRENT_YEAR, inflation: 6, expectedReturn: 13, sipIncRate: 12, currentInv: 100000, currentSip: 10000 },
    ]},
    { id: 'c4', name: 'Sneha Iyer', pan: 'DLMPI3456D', age: 38, goals: []},
    { id: 'c5', name: 'Vikram Singh', pan: 'EFGPS7890E', age: 45, goals: [
      { id: 'g6', name: 'Kids Education', amount: 6000000, targetMonth: 7, targetYear: CURRENT_YEAR + 8, createdMonth: CURRENT_MONTH, createdYear: CURRENT_YEAR, inflation: 8, expectedReturn: 11, sipIncRate: 8, currentInv: 800000, currentSip: 30000 },
      { id: 'g7', name: 'Vacation', amount: 2000000, targetMonth: 12, targetYear: CURRENT_YEAR + 3, createdMonth: CURRENT_MONTH, createdYear: CURRENT_YEAR, inflation: 5, expectedReturn: 8, sipIncRate: 0, currentInv: 500000, currentSip: 25000 },
    ]},
  ],
};

/* ──────────────────────────────────────────────────────────────────────────
   Calculation engine
   ────────────────────────────────────────────────────────────────────────── */

function fvOfSipStream(startSip, startM, startY, tgtM, tgtY, monthlyR, incRate) {
  if (startSip <= 0) return 0;
  let bal = 0;
  let sip = startSip;
  for (let y = startY; y <= tgtY; y++) {
    if (y > startY) sip = sip * (1 + incRate);
    const firstMonth = y === startY ? startM : 1;
    const lastMonth = y === tgtY ? tgtM : 12;
    const monthsInRow = y === tgtY ? Math.max(0, lastMonth - firstMonth) : (lastMonth - firstMonth + 1);
    for (let i = 0; i < monthsInRow; i++) {
      bal = (bal + sip) * (1 + monthlyR);
    }
  }
  return bal;
}

function calcGoal(goal) {
  const startM = goal.createdMonth || CURRENT_MONTH;
  const startY = goal.createdYear || CURRENT_YEAR;
  const tgtM = goal.targetMonth || 1;
  const tgtY = goal.targetYear || CURRENT_YEAR;
  const months = Math.max(0, monthsBetween(startM, startY, tgtM, tgtY));
  const years = months / 12;
  const amount = Number(goal.amount) || 0;
  const inflation = (Number(goal.inflation) || 0) / 100;
  const r = (Number(goal.expectedReturn) || 0) / 100;
  const incRate = (Number(goal.sipIncRate) || 0) / 100;
  const currentInv = Number(goal.currentInv) || 0;
  const currentSip = Number(goal.currentSip) || 0;
  const monthlyR = r / 12;
  const monthlyInfl = Math.pow(1 + inflation, 1 / 12) - 1;

  const futureValue = amount * Math.pow(1 + monthlyInfl, months);
  const fvOfCurrentInv = currentInv * Math.pow(1 + monthlyR, months);
  const fvOfCurrentSip = fvOfSipStream(currentSip, startM, startY, tgtM, tgtY, monthlyR, incRate);

  const projectedCorpus = fvOfCurrentInv + fvOfCurrentSip;
  const shortfall = Math.max(0, futureValue - projectedCorpus);
  const achievementPct = futureValue > 0 ? Math.min(100, (projectedCorpus / futureValue) * 100) : 100;

  let sipRequired = 0;
  if (months > 0) {
    const sipTargetFV = Math.max(0, futureValue - fvOfCurrentInv);
    if (sipTargetFV > 0) {
      let lo = 0;
      let hi = Math.max(sipTargetFV, 1);
      while (fvOfSipStream(hi, startM, startY, tgtM, tgtY, monthlyR, incRate) < sipTargetFV) {
        hi *= 2;
        if (hi > 1e15) break;
      }
      for (let i = 0; i < 80; i++) {
        const mid = (lo + hi) / 2;
        const fv = fvOfSipStream(mid, startM, startY, tgtM, tgtY, monthlyR, incRate);
        if (fv < sipTargetFV) lo = mid; else hi = mid;
      }
      sipRequired = (lo + hi) / 2;
    }
  }

  const lumpSumRequired = months > 0
    ? Math.max(0, futureValue / Math.pow(1 + monthlyR, months) - currentInv)
    : Math.max(0, futureValue - currentInv);

  const additionalSip = Math.max(0, sipRequired - currentSip);
  const sipOnTrack = currentSip >= sipRequired - 0.5;

  return { months, years, futureValue, projectedCorpus, shortfall, achievementPct, sipRequired, additionalSip, sipOnTrack, lumpSumRequired, fvOfCurrentInv, fvOfCurrentSip };
}

function buildProjection(goal, sipOverride) {
  const startM = goal.createdMonth || CURRENT_MONTH;
  const startY = goal.createdYear || CURRENT_YEAR;
  const tgtM = goal.targetMonth || 1;
  const tgtY = goal.targetYear;
  const totalMonths = Math.max(0, monthsBetween(startM, startY, tgtM, tgtY));
  const r = goal.expectedReturn / 100;
  const monthlyR = r / 12;
  const incRate = goal.sipIncRate / 100;
  const rows = [];

  if (totalMonths === 0) return rows;

  const startBal = Number(goal.currentInv) || 0;
  const startSip = sipOverride !== undefined ? sipOverride : (Number(goal.currentSip) || 0);
  let bal = startBal;
  let sip = startSip;
  let invested = startBal;

  for (let y = startY; y <= tgtY; y++) {
    if (y > startY) sip = sip * (1 + incRate);
    const firstMonth = y === startY ? startM : 1;
    const lastMonth = y === tgtY ? tgtM : 12;
    const monthsInRow = y === tgtY ? Math.max(0, lastMonth - firstMonth) : (lastMonth - firstMonth + 1);

    const openingBal = bal;
    let rowContribution = 0;
    for (let i = 0; i < monthsInRow; i++) {
      bal = (bal + sip) * (1 + monthlyR);
      rowContribution += sip;
      invested += sip;
    }
    const displayLastMonth = y === tgtY ? Math.max(firstMonth, tgtM - 1) : lastMonth;
    if (monthsInRow === 0 && rows.length > 0) continue;
    rows.push({
      year: y,
      firstMonth,
      lastMonth: displayLastMonth,
      monthsCovered: monthsInRow,
      isPartial: monthsInRow < 12,
      openingBal,
      monthlySip: sip,
      yearContribution: rowContribution,
      growth: bal - openingBal - rowContribution,
      closingBal: bal,
      totalInvested: invested,
    });
  }
  return rows;
}

function uid() { return 'id_' + Math.random().toString(36).slice(2, 9); }

// Generate just the auto-block (rates per goal). Plain text — no markers.
// Refresh uses pattern detection to find this block later.
function buildAssumptionsBlock(client) {
  if (!client.goals || client.goals.length === 0) {
    return 'No goals set yet for this client. Add a goal to populate assumptions.';
  }
  const lines = [];
  const sections = [
    { label: 'Inflation rate', key: 'inflation' },
    { label: 'Expected return', key: 'expectedReturn' },
    { label: 'SIP step-up rate', key: 'sipIncRate' },
  ];
  sections.forEach((s, i) => {
    lines.push(`${s.label}:`);
    client.goals.forEach(g => {
      lines.push(`  • ${g.name}: ${g[s.key]}%`);
    });
    if (i < sections.length - 1) lines.push('');
  });
  return lines.join('\n');
}

// First-time pre-fill: just the auto-block, no markers. Refresh uses pattern
// detection (headers + bullets) to locate and update the block on subsequent calls.
function generateAssumptionsText(client) {
  return buildAssumptionsBlock(client);
}

// Refresh: find the auto-generated block in `currentText` (by pattern — headers like
// "Inflation rate:" followed by bullet lines) and replace it with fresh values from
// the client's current goals. Everything outside that block (the advisor's notes)
// stays untouched. No visible markers are stored — detection is by content shape.
function refreshAssumptionsText(client, currentText) {
  const freshBlock = buildAssumptionsBlock(client);

  const lines = currentText.split('\n');
  const headerRegex = /^(Inflation rate|Expected return|SIP step-up rate):\s*$/;
  const bulletRegex = /^\s*•\s/;

  // Find the first header line that's immediately followed by a bullet line.
  let blockStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (headerRegex.test(lines[i]) && i + 1 < lines.length && bulletRegex.test(lines[i + 1])) {
      blockStart = i;
      break;
    }
  }

  // No block found — prepend a fresh one, preserve any existing text below.
  if (blockStart === -1) {
    const trimmedExisting = currentText.replace(/^\s+/, '');
    return trimmedExisting.length > 0
      ? `${freshBlock}\n\n${trimmedExisting}`
      : freshBlock;
  }

  // Expand the end of the block forward through consecutive headers, bullets,
  // and blank lines that sit between header/bullet groups. Stop at the first
  // non-blank line that's neither a header nor a bullet — that's the advisor's notes.
  let blockEnd = blockStart;
  for (let i = blockStart + 1; i < lines.length; i++) {
    const ln = lines[i];
    if (ln.trim() === '') {
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') j++;
      if (j < lines.length && (headerRegex.test(lines[j]) || bulletRegex.test(lines[j]))) {
        continue;
      } else {
        break;
      }
    }
    if (headerRegex.test(ln) || bulletRegex.test(ln)) {
      blockEnd = i;
    } else {
      break;
    }
  }

  // Trim trailing blanks
  while (blockEnd > blockStart && lines[blockEnd].trim() === '') blockEnd--;

  const before = lines.slice(0, blockStart).join('\n');
  const after = lines.slice(blockEnd + 1).join('\n');

  const beforeJoin = before.length > 0 ? (before.endsWith('\n') ? before : before + '\n') : '';
  const afterTrimmed = after.replace(/^\n+/, '');
  const afterJoin = afterTrimmed.length > 0 ? '\n\n' + afterTrimmed : '';

  return `${beforeJoin}${freshBlock}${afterJoin}`;
}

/* ──────────────────────────────────────────────────────────────────────────
   PDF export
   ────────────────────────────────────────────────────────────────────────── */

const PDF_JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const PDF_AUTOTABLE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });
}

async function ensurePdfLibs() {
  await loadScript(PDF_JSPDF_URL);
  await loadScript(PDF_AUTOTABLE_URL);
}

// PDF-safe rupee formatters — use "Rs." since jsPDF's default Helvetica
// doesn't reliably render the ₹ glyph.
const pdfINR = (n) => {
  if (!isFinite(n) || n === null || n === undefined) return 'Rs. 0';
  const abs = Math.abs(n);
  if (abs >= 10000000) return `Rs. ${(n / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `Rs. ${(n / 100000).toFixed(2)} L`;
  return `Rs. ${Math.round(n).toLocaleString('en-IN')}`;
};
const pdfFull = (n) => isFinite(n) ? `Rs. ${Math.round(n).toLocaleString('en-IN')}` : 'Rs. 0';
const pdfSip = (n) => isFinite(n) ? `Rs. ${Math.round(Number(n)).toLocaleString('en-IN')}` : 'Rs. 0';

async function exportClientPdf(client) {
  await ensurePdfLibs();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;

  // Brand colors
  const navy = [30, 58, 138];
  const sky = [59, 130, 246];
  const slate900 = [15, 23, 42];
  const slate600 = [71, 85, 105];
  const slate400 = [148, 163, 184];

  let y = 0;

  // ── Header band ──────────────────────────────────────────
  doc.setFillColor(...navy);
  doc.rect(0, 0, pageW, 90, 'F');
  doc.setFillColor(...sky);
  doc.rect(0, 90, pageW, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Team Fitness', margin, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(186, 213, 255);
  doc.text('Building fitter financial futures', margin, 60);

  // Right side: report label + date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('GOAL REPORT', pageW - margin, 42, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(186, 213, 255);
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.text(`Generated ${dateStr}`, pageW - margin, 60, { align: 'right' });

  y = 130;

  // ── Client block ─────────────────────────────────────────
  doc.setTextColor(...slate900);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(client.name, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...slate600);
  doc.text(`PAN: ${client.pan || '—'}    Age: ${client.age || '—'} years`, margin, y + 18);

  y += 44;

  // ── Portfolio summary ────────────────────────────────────
  let totalSip = 0, totalAdditional = 0, totalLump = 0;
  client.goals.forEach(g => {
    const c = calcGoal(g);
    totalSip += c.sipRequired;
    totalAdditional += c.additionalSip;
    totalLump += c.lumpSumRequired;
  });

  if (client.goals.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...slate900);
    doc.text('Portfolio Summary', margin, y);
    y += 12;

    // Three tiles
    const tileW = (pageW - margin * 2 - 16) / 3;
    const tileH = 56;
    const tiles = [
      { label: 'Total SIP needed', value: pdfSip(totalSip) + ' /mo', color: [219, 234, 254] },
      { label: 'Additional SIP needed', value: pdfSip(totalAdditional) + ' /mo', color: [224, 231, 255] },
      { label: 'Lump-sum needed today', value: pdfFull(totalLump), color: [209, 250, 229] },
    ];
    tiles.forEach((t, i) => {
      const x = margin + i * (tileW + 8);
      doc.setFillColor(...t.color);
      doc.roundedRect(x, y, tileW, tileH, 6, 6, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...slate600);
      doc.text(t.label.toUpperCase(), x + 12, y + 18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...slate900);
      doc.text(t.value, x + 12, y + 40);
    });
    y += tileH + 24;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...slate400);
    doc.text('No goals set for this client.', margin, y);
    y += 20;
  }

  // ── Per-goal sections (continuous pages, no forced page break) ─────────
  client.goals.forEach((g, gi) => {
    const c = calcGoal(g);
    const projection = buildProjection(g);

    // Ensure room for at least the goal header + key facts before flowing
    if (y > pageH - 220) { doc.addPage(); y = margin + 10; }

    // Section divider line
    if (gi > 0) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y);
      y += 18;
    }

    // Goal title with index pill
    doc.setFillColor(...navy);
    doc.roundedRect(margin, y - 12, 24, 18, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(String(gi + 1), margin + 12, y + 1, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...slate900);
    doc.text(g.name, margin + 34, y + 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...slate600);
    const remaining = c.years >= 1 ? `${c.years.toFixed(1)} years to go` : c.months > 0 ? `${c.months} months to go` : 'Due now';
    doc.text(`Target ${monthLabel(g.targetMonth || 1, g.targetYear)}  |  ${remaining}  |  Started ${monthLabel(g.createdMonth || CURRENT_MONTH, g.createdYear || CURRENT_YEAR)}`, margin + 34, y + 16);

    // Achievement % on the right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    const pct = c.achievementPct;
    if (pct >= 99.95) doc.setTextColor(5, 150, 105);
    else if (pct >= 60) doc.setTextColor(234, 88, 12);
    else if (pct >= 30) doc.setTextColor(217, 119, 6);
    else doc.setTextColor(225, 29, 72);
    doc.text(`${pct.toFixed(1)}%`, pageW - margin, y + 2, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...slate400);
    doc.text('Achievement', pageW - margin, y + 16, { align: 'right' });

    y += 32;

    // Achievement bar
    const barW = pageW - margin * 2;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, barW, 6, 3, 3, 'F');
    const fillW = barW * Math.min(100, pct) / 100;
    if (pct >= 99.95) doc.setFillColor(16, 185, 129);
    else if (pct >= 60) doc.setFillColor(249, 115, 22);
    else if (pct >= 30) doc.setFillColor(245, 158, 11);
    else doc.setFillColor(244, 63, 94);
    doc.roundedRect(margin, y, fillW, 6, 3, 3, 'F');
    y += 18;

    // Key facts as a 4x2 grid (compact table)
    const facts = [
      ['Goal (today)', pdfINR(g.amount), 'Future value', pdfINR(c.futureValue)],
      ['Current investment', pdfINR(g.currentInv), 'Current SIP', pdfSip(g.currentSip) + ' /mo'],
      ['Total SIP needed', pdfSip(c.sipRequired) + ' /mo', 'Additional SIP needed', c.sipOnTrack ? 'On track' : pdfSip(c.additionalSip) + ' /mo'],
      ['Lump-sum required', pdfINR(c.lumpSumRequired), 'Projected corpus', pdfINR(c.projectedCorpus)],
      ['Inflation', `${g.inflation}%`, 'Expected return', `${g.expectedReturn}%`],
      ['SIP step-up', `${g.sipIncRate}%`, 'Time to goal', `${c.months} months`],
    ];

    doc.autoTable({
      startY: y,
      body: facts,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: { top: 4, right: 8, bottom: 4, left: 0 }, textColor: slate900 },
      columnStyles: {
        0: { textColor: slate600, cellWidth: 110 },
        1: { fontStyle: 'bold', cellWidth: 130 },
        2: { textColor: slate600, cellWidth: 110 },
        3: { fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 14;

    // Projection table (only if there are rows)
    if (projection.length > 0) {
      if (y > pageH - 120) { doc.addPage(); y = margin + 10; }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...slate900);
      doc.text('Year-by-year projection', margin, y);
      y += 6;

      doc.autoTable({
        startY: y,
        head: [['Year', 'Opening', 'Monthly SIP', 'Contribution', 'Growth', 'Closing']],
        body: projection.map(r => [
          r.isPartial
            ? `${r.year} (${MONTH_NAMES[r.firstMonth - 1]}${r.firstMonth === r.lastMonth ? '' : '-' + MONTH_NAMES[r.lastMonth - 1]})`
            : String(r.year),
          pdfINR(r.openingBal),
          pdfSip(r.monthlySip),
          pdfINR(r.yearContribution),
          pdfINR(r.growth),
          pdfINR(r.closingBal),
        ]),
        theme: 'striped',
        headStyles: { fillColor: navy, textColor: 255, fontSize: 9, fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 5 },
        columnStyles: {
          0: { fontStyle: 'bold', textColor: slate900 },
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right', textColor: [5, 150, 105] },
          5: { halign: 'right', fontStyle: 'bold' },
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: margin, right: margin },
      });
      y = doc.lastAutoTable.finalY + 24;
    }
  });

  // ── Assumptions section ──────────────────────────────────
  const assumptionsText = client.assumptions || generateAssumptionsText(client);
  if (assumptionsText && client.goals.length > 0) {
    if (y > pageH - 160) { doc.addPage(); y = margin + 10; }
    // Section title
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...slate900);
    doc.text('Assumptions', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...slate600);
    const wrapped = doc.splitTextToSize(assumptionsText, pageW - margin * 2);
    wrapped.forEach((line) => {
      if (y > pageH - 60) { doc.addPage(); y = margin + 10; }
      doc.text(line, margin, y);
      y += 13;
    });
  }

  // ── Footer on every page ─────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageH - 36, pageW - margin, pageH - 36);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...slate400);
    doc.text('Generated by Team Fitness Goal Management System', margin, pageH - 20);
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin, pageH - 20, { align: 'right' });
  }

  const filename = `${client.name}_Goal Report.pdf`;
  doc.save(filename);
}

function NumberInputGuard() {
  useEffect(() => {
    const isNumberInput = (el) => el && el.tagName === 'INPUT' && el.type === 'number';
    const onWheel = (e) => {
      if (isNumberInput(e.target) && document.activeElement === e.target) {
        e.preventDefault();
        e.target.blur();
        setTimeout(() => e.target.focus(), 0);
      }
    };
    const onKeyDown = (e) => {
      if (isNumberInput(e.target) && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) e.preventDefault();
    };
    document.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('wheel', onWheel, { passive: false });
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);
  return null;
}

/* ──────────────────────────────────────────────────────────────────────────
   Root component
   ────────────────────────────────────────────────────────────────────────── */

export default function GoalManagementSystem() {
  const [state, setState] = useState({ clients: [] });
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState('clients');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [selectedGoalName, setSelectedGoalName] = useState(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [reportGoalFilter, setReportGoalFilter] = useState('all');
  const [reportTimeframe, setReportTimeframe] = useState(5);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get('app-state');
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          parsed.clients = (parsed.clients || []).map(c => {
            const migrated = { ...c };
            if (!migrated.pan) { delete migrated.email; migrated.pan = ''; }
            migrated.goals = (migrated.goals || []).map(g => ({
              ...g,
              targetMonth: g.targetMonth || 1,
              createdMonth: g.createdMonth || CURRENT_MONTH,
              createdYear: g.createdYear || CURRENT_YEAR,
            }));
            return migrated;
          });
          setState(parsed);
        } else {
          setState(seedData);
        }
      } catch { setState(seedData); }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try { await window.storage.set('app-state', JSON.stringify(state)); } catch {}
    })();
  }, [state, loaded]);

  const selectedClient = state.clients.find(c => c.id === selectedClientId);
  const selectedGoal = selectedClient?.goals.find(g => g.id === selectedGoalId);

  const allGoalNames = useMemo(() => {
    const map = new Map();
    state.clients.forEach(c => c.goals.forEach(g => {
      const key = g.name.trim();
      if (!map.has(key)) map.set(key, { name: key, count: 0, clients: [] });
      const e = map.get(key);
      e.count++;
      e.clients.push({ id: c.id, name: c.name, goal: g });
    }));
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [state.clients]);

  const totals = useMemo(() => {
    if (!selectedClient) return { totalSip: 0, totalAdditional: 0, totalLump: 0 };
    let totalSip = 0, totalAdditional = 0, totalLump = 0;
    selectedClient.goals.forEach(g => {
      const c = calcGoal(g);
      totalSip += c.sipRequired;
      totalAdditional += c.additionalSip;
      totalLump += c.lumpSumRequired;
    });
    return { totalSip, totalAdditional, totalLump };
  }, [selectedClient]);

  const reportRows = useMemo(() => {
    const cutoffKey = (CURRENT_YEAR + reportTimeframe) * 12 + CURRENT_MONTH;
    const rows = [];
    state.clients.forEach(c => c.goals.forEach(g => {
      const gKey = g.targetYear * 12 + (g.targetMonth || 1);
      if (gKey <= cutoffKey && (reportGoalFilter === 'all' || g.name === reportGoalFilter)) {
        rows.push({ clientName: c.name, clientId: c.id, goal: g, calc: calcGoal(g) });
      }
    }));
    return rows.sort((a, b) => {
      const ka = a.goal.targetYear * 12 + (a.goal.targetMonth || 1);
      const kb = b.goal.targetYear * 12 + (b.goal.targetMonth || 1);
      return ka - kb;
    });
  }, [state.clients, reportGoalFilter, reportTimeframe]);

  const addClient = (name, pan, age) => {
    setState(s => ({ ...s, clients: [...s.clients, { id: uid(), name, pan, age: Number(age) || 0, goals: [] }] }));
  };
  const updateClient = (clientId, updates) => {
    setState(s => ({ ...s, clients: s.clients.map(c => c.id === clientId ? { ...c, ...updates } : c) }));
  };
  const deleteClient = (id) => {
    if (!window.confirm('Delete this client and all their goals?')) return;
    setState(s => ({ ...s, clients: s.clients.filter(c => c.id !== id) }));
    if (selectedClientId === id) setSelectedClientId(null);
  };
  const addGoal = (clientId, goal) => {
    setState(s => ({ ...s, clients: s.clients.map(c => c.id === clientId ? { ...c, goals: [...c.goals, { ...goal, id: uid() }] } : c) }));
  };
  const updateGoal = (clientId, goalId, updates) => {
    setState(s => ({ ...s, clients: s.clients.map(c => c.id === clientId
      ? { ...c, goals: c.goals.map(g => g.id === goalId ? { ...g, ...updates } : g) }
      : c) }));
  };
  const deleteGoal = (clientId, goalId) => {
    setState(s => ({ ...s, clients: s.clients.map(c => c.id === clientId ? { ...c, goals: c.goals.filter(g => g.id !== goalId) } : c) }));
    if (selectedGoalId === goalId) setSelectedGoalId(null);
  };

  if (!loaded) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; appearance: textfield; }
        .tabular-nums { font-variant-numeric: tabular-nums; }
      `}</style>
      <NumberInputGuard />

      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs tab={tab} onChange={(t) => { setTab(t); setSelectedClientId(null); setSelectedGoalId(null); setSelectedGoalName(null); }} />

        {tab === 'clients' && !selectedClient && (
          <ClientList clients={state.clients} onSelect={setSelectedClientId} onAdd={() => setShowAddClient(true)} onDelete={deleteClient} />
        )}
        {tab === 'clients' && selectedClient && !selectedGoal && (
          <ClientDetail
            client={selectedClient}
            totals={totals}
            onBack={() => setSelectedClientId(null)}
            onAddGoal={() => { setEditingGoalId(null); setShowGoalForm(true); }}
            onSelectGoal={setSelectedGoalId}
            onDeleteGoal={(gid) => deleteGoal(selectedClient.id, gid)}
            onSaveAssumptions={(text) => updateClient(selectedClient.id, { assumptions: text })}
          />
        )}
        {tab === 'clients' && selectedGoal && (
          <GoalDetail
            goal={selectedGoal}
            clientName={selectedClient.name}
            onBack={() => setSelectedGoalId(null)}
            onEdit={() => { setEditingGoalId(selectedGoal.id); setShowGoalForm(true); }}
          />
        )}

        {tab === 'goals' && !selectedGoalName && (
          <GoalsOverview goalGroups={allGoalNames} onSelect={setSelectedGoalName} />
        )}
        {tab === 'goals' && selectedGoalName && (
          <GoalGroupDetail
            groupName={selectedGoalName}
            entries={allGoalNames.find(g => g.name === selectedGoalName)?.clients || []}
            onBack={() => setSelectedGoalName(null)}
            onSelectClient={(cid) => { setTab('clients'); setSelectedClientId(cid); setSelectedGoalName(null); }}
          />
        )}

        {tab === 'reports' && (
          <ReportsView
            goalNames={allGoalNames.map(g => g.name)}
            goalFilter={reportGoalFilter}
            setGoalFilter={setReportGoalFilter}
            timeframe={reportTimeframe}
            setTimeframe={setReportTimeframe}
            rows={reportRows}
            onOpenClient={(cid) => { setTab('clients'); setSelectedClientId(cid); }}
          />
        )}

        {showAddClient && (
          <AddClientModal onClose={() => setShowAddClient(false)} onSave={(n, p, a) => { addClient(n, p, a); setShowAddClient(false); }} />
        )}
        {showGoalForm && selectedClient && (
          <GoalFormModal
            initial={editingGoalId ? selectedClient.goals.find(g => g.id === editingGoalId) : null}
            onClose={() => { setShowGoalForm(false); setEditingGoalId(null); }}
            onSave={(g) => {
              if (editingGoalId) updateGoal(selectedClient.id, editingGoalId, g);
              else addGoal(selectedClient.id, g);
              setShowGoalForm(false);
              setEditingGoalId(null);
            }}
          />
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-6 text-xs text-slate-400 text-center">
        © {CURRENT_YEAR} Team Fitness · Building fitter financial futures
      </footer>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Layout chrome
   ────────────────────────────────────────────────────────────────────────── */

function AppHeader() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Drop your real logo at /logo.png — falls back to monogram if missing */}
          <div className="relative w-10 h-10">
            <img
              src="/logo.png"
              alt="Team Fitness"
              className="w-10 h-10 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
            />
            <div
              style={{ display: 'none' }}
              className="absolute inset-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-800 to-sky-500 items-center justify-center text-white font-bold text-sm shadow-sm ring-1 ring-blue-900/10"
            >
              TF
            </div>
          </div>
          <div className="leading-tight">
            <h1 className="text-base font-semibold text-slate-900">Team Fitness</h1>
            <p className="text-[11px] text-slate-500">Goal Management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">FY {CURRENT_YEAR}</span>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-800 to-sky-500 flex items-center justify-center text-white text-sm font-medium shadow-sm">
            AD
          </div>
        </div>
      </div>
    </header>
  );
}

function Tabs({ tab, onChange }) {
  const items = [
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
  ];
  return (
    <div className="inline-flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
      {items.map(t => {
        const Icon = t.icon;
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all ${
              active
                ? 'bg-gradient-to-br from-blue-800 to-blue-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon size={15} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Shared UI
   ────────────────────────────────────────────────────────────────────────── */

function Avatar({ name, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'w-12 h-12 text-base' : size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
  return (
    <div className={`${sizeClass} ${avatarColor(name)} rounded-full flex items-center justify-center text-white font-semibold shadow-sm shrink-0`}>
      {initials(name)}
    </div>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/70 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function StatTile({ label, value, hint, icon: Icon, accent = 'blue' }) {
  const accents = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 mb-1.5 truncate">{label}</p>
          <p className="text-xl font-semibold text-slate-900 tabular-nums truncate">{value}</p>
          {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
        </div>
        {Icon && (
          <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${accents[accent]}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
    </Card>
  );
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-shadow placeholder-slate-400';
const selectCls = inputCls + ' bg-white';
const btnPrimary = 'inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium bg-gradient-to-br from-blue-800 to-blue-700 text-white rounded-lg hover:from-blue-900 hover:to-blue-800 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const btnSecondary = 'inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors';
const btnGhost = 'inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors';

/* ──────────────────────────────────────────────────────────────────────────
   Client list
   ────────────────────────────────────────────────────────────────────────── */

function ClientList({ clients, onSelect, onAdd, onDelete }) {
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [goalsMin, setGoalsMin] = useState('');
  const [goalsMax, setGoalsMax] = useState('');
  const [goalSet, setGoalSet] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const aMin = ageMin === '' ? null : Number(ageMin);
    const aMax = ageMax === '' ? null : Number(ageMax);
    const gMin = goalsMin === '' ? null : Number(goalsMin);
    const gMax = goalsMax === '' ? null : Number(goalsMax);
    return clients.filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !(c.pan || '').toLowerCase().includes(q)) return false;
      if (aMin !== null && c.age < aMin) return false;
      if (aMax !== null && c.age > aMax) return false;
      const gc = c.goals.length;
      if (gMin !== null && gc < gMin) return false;
      if (gMax !== null && gc > gMax) return false;
      if (goalSet === 'yes' && gc === 0) return false;
      if (goalSet === 'no' && gc > 0) return false;
      return true;
    });
  }, [clients, query, ageMin, ageMax, goalsMin, goalsMax, goalSet]);

  const activeCount =
    (query ? 1 : 0) +
    (ageMin !== '' || ageMax !== '' ? 1 : 0) +
    (goalsMin !== '' || goalsMax !== '' ? 1 : 0) +
    (goalSet !== 'all' ? 1 : 0);

  const clearAll = () => {
    setQuery(''); setAgeMin(''); setAgeMax(''); setGoalsMin(''); setGoalsMax(''); setGoalSet('all');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Clients</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length === clients.length ? `${clients.length} clients` : `${filtered.length} of ${clients.length} clients`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(s => !s)}
            className={`relative inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors ${
              showFilters ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal size={14} /> Filter
            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold rounded-full bg-blue-600 text-white">
                {activeCount}
              </span>
            )}
          </button>
          <button onClick={onAdd} className={btnPrimary}>
            <Plus size={14} /> Add client
          </button>
        </div>
      </div>

      {showFilters && (
        <Card className="p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Search name or PAN</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type to filter…" className={inputCls + ' pl-9'} />
              </div>
            </div>
            <Field label="Age">
              <div className="flex items-center gap-2">
                <input type="number" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} placeholder="Min" className={inputCls} />
                <span className="text-slate-400">–</span>
                <input type="number" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} placeholder="Max" className={inputCls} />
              </div>
            </Field>
            <Field label="Goals count">
              <div className="flex items-center gap-2">
                <input type="number" min="0" value={goalsMin} onChange={(e) => setGoalsMin(e.target.value)} placeholder="Min" className={inputCls} />
                <span className="text-slate-400">–</span>
                <input type="number" min="0" value={goalsMax} onChange={(e) => setGoalsMax(e.target.value)} placeholder="Max" className={inputCls} />
              </div>
            </Field>
          </div>
          <div className="flex items-end justify-between gap-3 mt-3">
            <div className="flex-1 max-w-xs">
              <Field label="Goal set">
                <select value={goalSet} onChange={(e) => setGoalSet(e.target.value)} className={selectCls}>
                  <option value="all">All clients</option>
                  <option value="yes">Goal set: Yes</option>
                  <option value="no">Goal set: No</option>
                </select>
              </Field>
            </div>
            {activeCount > 0 && (
              <button onClick={clearAll} className={btnGhost}>
                <X size={14} /> Clear filters
              </button>
            )}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/60 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Client</th>
              <th className="text-left px-5 py-3 font-medium">PAN</th>
              <th className="text-left px-5 py-3 font-medium">Age</th>
              <th className="text-left px-5 py-3 font-medium">Goals</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-blue-50/30 cursor-pointer transition-colors" onClick={() => onSelect(c.id)}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} />
                    <span className="font-medium text-slate-900">{c.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-slate-500 font-mono text-xs tracking-wide">{c.pan}</td>
                <td className="px-5 py-3.5 text-slate-600 tabular-nums">{c.age}</td>
                <td className="px-5 py-3.5 text-slate-600 tabular-nums">{c.goals.length}</td>
                <td className="px-5 py-3.5">
                  {c.goals.length > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 rounded-full">
                      <CheckCircle2 size={11} /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-500 ring-1 ring-slate-200 rounded-full">
                      <AlertCircle size={11} /> No goals
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="6" className="text-center py-14 text-slate-400">
                {clients.length === 0 ? (
                  <div className="flex flex-col items-center gap-2">
                    <Users size={28} className="text-slate-300" />
                    No clients yet — add one to get started
                  </div>
                ) : 'No clients match your filters'}
              </td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Client detail
   ────────────────────────────────────────────────────────────────────────── */

function ClientDetail({ client, totals, onBack, onAddGoal, onSelectGoal, onDeleteGoal, onSaveAssumptions }) {
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
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
        <ChevronLeft size={16} /> Back to clients
      </button>

      <Card className="p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={client.name} size="lg" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{client.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                <span className="font-mono">{client.pan}</span>
                <span className="mx-2 text-slate-300">·</span>
                {client.age} years
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} disabled={exporting} className={btnSecondary + ' disabled:opacity-60 disabled:cursor-wait'}>
              <Download size={14} /> {exporting ? 'Generating…' : 'Export PDF'}
            </button>
            <button onClick={onAddGoal} className={btnPrimary}>
              <Plus size={14} /> Add goal
            </button>
          </div>
        </div>

        {client.goals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100">
            <SummaryTile label="Total SIP needed" value={fmtSip(totals.totalSip) + '/mo'} icon={TrendingUp} accent="blue" />
            <SummaryTile label="Additional SIP needed" value={fmtSip(totals.totalAdditional) + '/mo'} icon={Plus} accent="indigo" />
            <SummaryTile label="Lump-sum needed today" value={fmtFull(totals.totalLump)} icon={IndianRupee} accent="emerald" />
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Goals ({client.goals.length})</h3>
      </div>

      {client.goals.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Target className="mx-auto text-slate-300 mb-3" size={32} />
          <p className="text-sm text-slate-500 mb-3">No goals yet</p>
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
                        <h4 className="font-semibold text-slate-900 truncate">{g.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Target {monthLabel(g.targetMonth || 1, g.targetYear)}
                          {c.years > 0 && ` · ${c.years >= 1 ? `${c.years.toFixed(1)} yrs` : `${c.months} mo`}`}
                        </p>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteGoal(g.id); }} className="text-slate-300 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-xs text-slate-500">Achievement</span>
                      <span className="text-sm font-semibold text-slate-900 tabular-nums">{c.achievementPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${achievementColor(c.achievementPct)}`} style={{ width: `${Math.min(100, c.achievementPct)}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
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
    // Replace only the auto-generated block inside markers; preserve the rest of the draft.
    const next = refreshAssumptionsText(client, draft || '');
    setDraft(next);
    setConfirmRefresh(false);
    setJustRefreshed(true);
    setTimeout(() => setJustRefreshed(false), 1800);
  };
  const onRefreshClick = () => {
    // If the current draft is empty or identical to a fresh pre-fill, refresh silently
    const fresh = generateAssumptionsText(client);
    if (!draft.trim() || draft === fresh) {
      doRefresh();
      return;
    }
    // Check whether anything would actually change inside the auto-block
    const next = refreshAssumptionsText(client, draft);
    if (next === draft) {
      // No change — still flash the "Refreshed" pill so the click feels acknowledged
      setJustRefreshed(true);
      setTimeout(() => setJustRefreshed(false), 1800);
      return;
    }
    // Otherwise show the inline confirm row
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
            <h3 className="text-base font-semibold text-slate-900">Assumptions</h3>
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
        <div className="rounded-lg bg-slate-50 ring-1 ring-slate-100 px-4 py-3.5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
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
                <button onClick={() => setConfirmRefresh(false)} className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1">Cancel</button>
                <button onClick={doRefresh} className="text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 px-2.5 py-1 rounded-md">Yes, update</button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 gap-2">
            <div className="flex items-center gap-2">
              <button onClick={onRefreshClick} className={btnGhost} title="Replace text with a fresh version pulled from this client's goals">
                <RefreshCw size={14} /> Refresh from goals
              </button>
              {justRefreshed && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-2 py-0.5 rounded-full">
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
    blue: 'from-blue-50 to-blue-100/40 text-blue-700 ring-blue-200/60',
    indigo: 'from-indigo-50 to-indigo-100/40 text-indigo-700 ring-indigo-200/60',
    emerald: 'from-emerald-50 to-emerald-100/40 text-emerald-700 ring-emerald-200/60',
  };
  return (
    <div className={`rounded-xl bg-gradient-to-br ${accents[accent]} ring-1 p-4 flex items-start justify-between`}>
      <div className="min-w-0">
        <p className="text-xs font-medium opacity-80 mb-1">{label}</p>
        <p className="text-lg font-semibold tabular-nums">{value}</p>
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
      <p className="text-slate-500 mb-0.5">{label}</p>
      {pill ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 rounded-full">
          <CheckCircle2 size={10} /> {pill}
        </span>
      ) : (
        <p className="font-semibold text-slate-900 tabular-nums">{value}</p>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Goal detail
   ────────────────────────────────────────────────────────────────────────── */

function GoalDetail({ goal, clientName, onBack, onEdit }) {
  const c = calcGoal(goal);
  const projection = buildProjection(goal);
  const remainingLabel = c.years >= 1 ? `${c.years.toFixed(1)} years to go` : c.months > 0 ? `${c.months} months to go` : 'Due now';
  const Icon = goalIcon(goal.name);

  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
        <ChevronLeft size={16} /> Back to {clientName}
      </button>

      <Card className="p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-800 to-sky-500 flex items-center justify-center text-white shadow-md ring-1 ring-blue-900/10">
              <Icon size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{goal.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Target {monthLabel(goal.targetMonth || 1, goal.targetYear)}
                <span className="mx-2 text-slate-300">·</span>{remainingLabel}
                <span className="mx-2 text-slate-300">·</span>
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
            <span className="text-sm font-medium text-slate-700">Goal achievement with current plan</span>
            <span className="text-base font-semibold text-slate-900 tabular-nums">{c.achievementPct.toFixed(1)}%</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full transition-all ${achievementColor(c.achievementPct)}`} style={{ width: `${Math.min(100, c.achievementPct)}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Projected corpus <span className="font-medium text-slate-700 tabular-nums">{fmtINR(c.projectedCorpus)}</span> vs target <span className="font-medium text-slate-700 tabular-nums">{fmtINR(c.futureValue)}</span>
            {c.shortfall > 0 && <> · shortfall <span className="font-medium text-rose-600 tabular-nums">{fmtINR(c.shortfall)}</span></>}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
          <MiniStat icon={Percent} label="Inflation" value={`${goal.inflation}%`} />
          <MiniStat icon={TrendingUp} label="Expected return" value={`${goal.expectedReturn}%`} />
          <MiniStat icon={Calendar} label="SIP step-up" value={`${goal.sipIncRate}%`} />
          <MiniStat icon={IndianRupee} label="Current corpus" value={fmtINR(goal.currentInv)} />
        </div>
      </Card>

      <h3 className="text-sm font-semibold text-slate-700 mb-3">Year-by-year projection</h3>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/60 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Year</th>
                <th className="text-right px-5 py-3 font-medium">Opening</th>
                <th className="text-right px-5 py-3 font-medium">Monthly SIP</th>
                <th className="text-right px-5 py-3 font-medium">Contribution</th>
                <th className="text-right px-5 py-3 font-medium">Growth</th>
                <th className="text-right px-5 py-3 font-medium">Closing</th>
              </tr>
            </thead>
            <tbody>
              {projection.map((r, i) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3 font-semibold text-slate-900 tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      {r.year}
                      {r.isPartial && (
                        <span
                          title={`Calculated months: ${MONTH_NAMES[r.firstMonth - 1]}${r.firstMonth === r.lastMonth ? '' : '–' + MONTH_NAMES[r.lastMonth - 1]} ${r.year} (${r.monthsCovered} ${r.monthsCovered === 1 ? 'month' : 'months'})`}
                          className="text-slate-400 hover:text-slate-600 cursor-help"
                        >
                          <Info size={12} />
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600 tabular-nums">{fmtINR(r.openingBal)}</td>
                  <td className="px-5 py-3 text-right text-slate-600 tabular-nums">{fmtSip(r.monthlySip)}</td>
                  <td className="px-5 py-3 text-right text-slate-600 tabular-nums">{fmtINR(r.yearContribution)}</td>
                  <td className="px-5 py-3 text-right text-emerald-600 font-medium tabular-nums">{fmtINR(r.growth)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-900 tabular-nums">{fmtINR(r.closingBal)}</td>
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
    <div className={`rounded-xl p-4 ${highlight ? 'bg-gradient-to-br from-blue-50 to-sky-50 ring-1 ring-blue-200/60' : 'bg-slate-50 ring-1 ring-slate-100'}`}>
      <p className="text-[11px] font-medium text-slate-500 mb-1">{label}</p>
      {pill ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 rounded-full">
          <CheckCircle2 size={11} /> {pill}
        </span>
      ) : (
        <p className={`text-base font-semibold tabular-nums ${highlight ? 'text-blue-800' : 'text-slate-900'}`}>{value}</p>
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
        <p className="text-slate-500 text-[11px]">{label}</p>
        <p className="font-semibold text-slate-900 tabular-nums truncate">{value}</p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Goals overview & group
   ────────────────────────────────────────────────────────────────────────── */

function GoalsOverview({ goalGroups, onSelect }) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Goals</h2>
        <p className="text-sm text-slate-500 mt-0.5">{goalGroups.length} unique goals across all clients</p>
      </div>
      {goalGroups.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Target className="mx-auto text-slate-300 mb-2" size={28} />
          <p className="text-sm text-slate-500">No goals set yet</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {goalGroups.map(g => {
            const Icon = goalIcon(g.name);
            return (
              <Card key={g.name} className="p-4 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all" >
                <div onClick={() => onSelect(g.name)} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 ring-1 ring-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{g.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{g.count} {g.count === 1 ? 'client' : 'clients'}</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-blue-700 tabular-nums">{g.count}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GoalGroupDetail({ groupName, entries, onBack, onSelectClient }) {
  const Icon = goalIcon(groupName);
  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
        <ChevronLeft size={16} /> Back to goals
      </button>
      <Card className="p-5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-800 to-sky-500 flex items-center justify-center text-white shadow-md">
            <Icon size={22} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{groupName}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{entries.length} {entries.length === 1 ? 'client has' : 'clients have'} this goal</p>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/60 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Client</th>
              <th className="text-right px-5 py-3 font-medium">Target</th>
              <th className="text-right px-5 py-3 font-medium">Goal amount</th>
              <th className="text-right px-5 py-3 font-medium">Additional SIP required</th>
              <th className="text-right px-5 py-3 font-medium">Achievement</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => {
              const c = calcGoal(e.goal);
              return (
                <tr key={e.id + e.goal.id} className="border-t border-slate-100 hover:bg-blue-50/30 cursor-pointer transition-colors" onClick={() => onSelectClient(e.id)}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={e.name} size="sm" />
                      <span className="font-medium text-slate-900">{e.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-600 tabular-nums">{monthLabel(e.goal.targetMonth || 1, e.goal.targetYear)}</td>
                  <td className="px-5 py-3.5 text-right text-slate-600 tabular-nums">{fmtINR(e.goal.amount)}</td>
                  <td className="px-5 py-3.5 text-right">
                    {c.sipOnTrack ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 rounded-full">
                        <CheckCircle2 size={11} /> On track
                      </span>
                    ) : (
                      <span className="text-slate-600 tabular-nums">{fmtSip(c.additionalSip)}/mo</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${achievementBadge(c.achievementPct)}`}>
                      {c.achievementPct.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Reports
   ────────────────────────────────────────────────────────────────────────── */

function ReportsView({ goalNames, goalFilter, setGoalFilter, timeframe, setTimeframe, rows, onOpenClient }) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Reports</h2>
        <p className="text-sm text-slate-500 mt-0.5">Goals due within a chosen timeframe</p>
      </div>
      <Card className="p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Goal filter">
            <select value={goalFilter} onChange={(e) => setGoalFilter(e.target.value)} className={selectCls}>
              <option value="all">All goals</option>
              {goalNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Achieved within">
            <select value={timeframe} onChange={(e) => setTimeframe(Number(e.target.value))} className={selectCls}>
              <option value={1}>1 year</option>
              <option value={3}>3 years</option>
              <option value={5}>5 years</option>
              <option value={10}>10 years</option>
              <option value={15}>15 years</option>
              <option value={20}>20 years</option>
              <option value={50}>All</option>
            </select>
          </Field>
        </div>
      </Card>

      <p className="text-sm text-slate-500 mb-3">
        {rows.length} {rows.length === 1 ? 'goal' : 'goals'} due by <span className="font-medium text-slate-700">{monthLabel(CURRENT_MONTH, CURRENT_YEAR + timeframe)}</span>
      </p>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/60 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Client</th>
              <th className="text-left px-5 py-3 font-medium">Goal</th>
              <th className="text-right px-5 py-3 font-medium">Target</th>
              <th className="text-right px-5 py-3 font-medium">Time left</th>
              <th className="text-right px-5 py-3 font-medium">Future value</th>
              <th className="text-right px-5 py-3 font-medium">Additional SIP req.</th>
              <th className="text-right px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const Icon = goalIcon(r.goal.name);
              return (
                <tr key={i} className="border-t border-slate-100 hover:bg-blue-50/30 cursor-pointer transition-colors" onClick={() => onOpenClient(r.clientId)}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.clientName} size="sm" />
                      <span className="font-medium text-slate-900">{r.clientName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="text-blue-600 shrink-0" />
                      {r.goal.name}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-600 tabular-nums">{monthLabel(r.goal.targetMonth || 1, r.goal.targetYear)}</td>
                  <td className="px-5 py-3.5 text-right text-slate-600 tabular-nums">{r.calc.years >= 1 ? `${r.calc.years.toFixed(1)} yrs` : `${r.calc.months} mo`}</td>
                  <td className="px-5 py-3.5 text-right text-slate-600 tabular-nums">{fmtINR(r.calc.futureValue)}</td>
                  <td className="px-5 py-3.5 text-right">
                    {r.calc.sipOnTrack ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 rounded-full">
                        <CheckCircle2 size={11} /> On track
                      </span>
                    ) : (
                      <span className="text-slate-600 tabular-nums">{fmtSip(r.calc.additionalSip)}/mo</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${achievementBadge(r.calc.achievementPct)}`}>
                      {r.calc.achievementPct.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan="7" className="text-center py-12 text-slate-400">No goals match the filters</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Modals
   ────────────────────────────────────────────────────────────────────────── */

function Modal({ title, onClose, children, footer, maxWidth = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={onClose}>
      <div className={`bg-white rounded-2xl w-full ${maxWidth} shadow-2xl my-8`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}

function AddClientModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [pan, setPan] = useState('');
  const [age, setAge] = useState('');
  const panValid = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);

  return (
    <Modal
      title="Add client"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={btnGhost}>Cancel</button>
          <button onClick={() => name.trim() && panValid && onSave(name, pan, age)} disabled={!name.trim() || !panValid} className={btnPrimary}>
            Save client
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Full name" />
        </Field>
        <Field label="PAN no." hint={pan && !panValid ? 'Format: 5 letters, 4 digits, 1 letter' : null}>
          <input
            value={pan}
            onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))}
            placeholder="ABCDE1234F"
            maxLength={10}
            className={inputCls + ' font-mono tracking-wider uppercase'}
          />
        </Field>
        <Field label="Age">
          <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className={inputCls} placeholder="e.g. 35" />
        </Field>
      </div>
    </Modal>
  );
}

function GoalFormModal({ initial, onClose, onSave }) {
  const isEdit = !!initial;
  const initialIsPreset = initial ? GOAL_PRESETS.includes(initial.name) && initial.name !== 'Others' : true;
  const [nameChoice, setNameChoice] = useState(initial ? (initialIsPreset ? initial.name : 'Others') : '');
  const [customName, setCustomName] = useState(initial && !initialIsPreset ? initial.name : '');
  const [form, setForm] = useState(() => initial ? {
    name: initial.name,
    amount: initial.amount,
    targetMonth: initial.targetMonth || 1,
    targetYear: initial.targetYear,
    inflation: initial.inflation,
    expectedReturn: initial.expectedReturn,
    sipIncRate: initial.sipIncRate,
    currentInv: initial.currentInv,
    currentSip: initial.currentSip,
    createdMonth: initial.createdMonth || CURRENT_MONTH,
    createdYear: initial.createdYear || CURRENT_YEAR,
  } : {
    name: '',
    amount: undefined,
    targetMonth: CURRENT_MONTH,
    targetYear: CURRENT_YEAR + 10,
    inflation: 6,
    expectedReturn: 12,
    sipIncRate: 10,
    currentInv: undefined,
    currentSip: undefined,
    createdMonth: CURRENT_MONTH,
    createdYear: CURRENT_YEAR,
  });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const effectiveName = nameChoice === 'Others' ? customName.trim() : nameChoice;
  const previewCalc = calcGoal({ ...form, name: effectiveName });
  const targetBeforeStart = monthsBetween(form.createdMonth, form.createdYear, form.targetMonth, form.targetYear) <= 0;

  const handleSave = () => {
    if (!effectiveName || targetBeforeStart || !form.amount) return;
    const normalized = {
      ...form,
      name: effectiveName,
      amount: Number(form.amount) || 0,
      inflation: Number(form.inflation) || 0,
      expectedReturn: Number(form.expectedReturn) || 0,
      sipIncRate: Number(form.sipIncRate) || 0,
      currentInv: Number(form.currentInv) || 0,
      currentSip: Number(form.currentSip) || 0,
    };
    const payload = isEdit
      ? { ...normalized, createdMonth: initial.createdMonth || CURRENT_MONTH, createdYear: initial.createdYear || CURRENT_YEAR }
      : { ...normalized, createdMonth: CURRENT_MONTH, createdYear: CURRENT_YEAR };
    onSave(payload);
  };

  return (
    <Modal
      title={isEdit ? 'Edit goal' : 'Add goal'}
      onClose={onClose}
      maxWidth="max-w-3xl"
      footer={
        <div className="flex justify-between items-center">
          {isEdit && (
            <p className="text-xs text-slate-400">
              Started in {monthLabel(initial.createdMonth || CURRENT_MONTH, initial.createdYear || CURRENT_YEAR)} — projections stay anchored
            </p>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={onClose} className={btnGhost}>Cancel</button>
            <button onClick={handleSave} disabled={!effectiveName || targetBeforeStart || !form.amount} className={btnPrimary}>
              {isEdit ? 'Save changes' : 'Save goal'}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Goal name">
          <select value={nameChoice} onChange={(e) => setNameChoice(e.target.value)} className={selectCls}>
            <option value="" disabled>Select a goal…</option>
            {GOAL_PRESETS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          {nameChoice === 'Others' && (
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter goal name"
              className={inputCls + ' mt-2'}
            />
          )}
        </Field>
        <Field label="Goal amount (today)">
          <input type="number" value={nv(form.amount)} onChange={(e) => upd('amount', parseNum(e, 0))} className={inputCls} placeholder="₹" />
        </Field>

        <Field label="Target month">
          <select value={form.targetMonth} onChange={(e) => upd('targetMonth', Number(e.target.value))} className={selectCls}>
            {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </Field>
        <Field label="Target year">
          <input type="number" value={nv(form.targetYear)} onChange={(e) => upd('targetYear', parseNum(e, 0))} className={inputCls} />
        </Field>

        <Field label="Future goal value (auto)">
          <div className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-medium tabular-nums">{fmtFull(previewCalc.futureValue)}</div>
        </Field>
        <Field label="Time to goal">
          <div className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700">
            {targetBeforeStart ? <span className="text-rose-600 font-medium">Target must be after start</span> : <span className="tabular-nums">{previewCalc.months} months ({previewCalc.years.toFixed(2)} yrs)</span>}
          </div>
        </Field>

        <Field label="Inflation rate (%)">
          <input type="number" step="0.1" value={nv(form.inflation)} onChange={(e) => upd('inflation', parseNum(e))} className={inputCls} />
        </Field>
        <Field label="Expected return (%)">
          <input type="number" step="0.1" value={nv(form.expectedReturn)} onChange={(e) => upd('expectedReturn', parseNum(e))} className={inputCls} />
        </Field>
        <Field label="SIP step-up rate (%)">
          <input type="number" step="0.1" value={nv(form.sipIncRate)} onChange={(e) => upd('sipIncRate', parseNum(e))} className={inputCls} />
        </Field>
        <Field label="Current investment">
          <input type="number" value={nv(form.currentInv)} onChange={(e) => upd('currentInv', parseNum(e, 0))} className={inputCls} placeholder="₹" />
        </Field>
        <div className="md:col-span-2">
          <Field label="Current SIP (monthly)">
            <input type="number" value={nv(form.currentSip)} onChange={(e) => upd('currentSip', parseNum(e, 0))} className={inputCls} placeholder="₹" />
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 p-4 bg-gradient-to-br from-blue-50/60 to-sky-50/60 ring-1 ring-blue-100 rounded-xl">
        <PreviewTile label="Total SIP needed" value={fmtSip(previewCalc.sipRequired) + '/mo'} />
        <PreviewTile label="Additional SIP" value={previewCalc.sipOnTrack ? null : (fmtSip(previewCalc.additionalSip) + '/mo')} pill={previewCalc.sipOnTrack ? 'On track' : null} />
        <PreviewTile label="Lump-sum required" value={fmtINR(previewCalc.lumpSumRequired)} />
        <PreviewTile label="Achievement" value={previewCalc.achievementPct.toFixed(1) + '%'} />
      </div>
    </Modal>
  );
}

function PreviewTile({ label, value, pill }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-500 mb-1">{label}</p>
      {pill ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 rounded-full">
          <CheckCircle2 size={11} /> {pill}
        </span>
      ) : (
        <p className="text-sm font-semibold text-slate-900 tabular-nums">{value}</p>
      )}
    </div>
  );
}
