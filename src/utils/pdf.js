import {
  calcGoal,
  buildProjection,
  monthLabel,
  generateAssumptionsText,
  CURRENT_YEAR,
  CURRENT_MONTH,
  MONTH_NAMES
} from './calc';

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

// PDF-safe rupee formatters
const pdfINR = (n) => {
  if (!isFinite(n) || n === null || n === undefined) return 'Rs. 0';
  const abs = Math.abs(n);
  if (abs >= 10000000) return `Rs. ${(n / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `Rs. ${(n / 100000).toFixed(2)} L`;
  return `Rs. ${Math.round(n).toLocaleString('en-IN')}`;
};
const pdfFull = (n) => isFinite(n) ? `Rs. ${Math.round(n).toLocaleString('en-IN')}` : 'Rs. 0';
const pdfSip = (n) => isFinite(n) ? `Rs. ${Math.round(Number(n)).toLocaleString('en-IN')}` : 'Rs. 0';

export async function exportClientPdf(client) {
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
  doc.text('Team Fintness', margin, 42);
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

  // ── Per-goal sections ────────────────────────────────────
  client.goals.forEach((g, gi) => {
    const c = calcGoal(g);
    const projection = buildProjection(g);

    if (y > pageH - 220) { doc.addPage(); y = margin + 10; }

    if (gi > 0) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y);
      y += 18;
    }

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
    doc.line(margin, pageH - 36, pageW - margin, pageH - 36);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...slate400);
    doc.text('Generated by Team Fintness Goal Management System', margin, pageH - 20);
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin, pageH - 20, { align: 'right' });
  }

  const filename = `${client.name}_Goal Report.pdf`;
  doc.save(filename);
}
