import { buildProjection, MONTH_NAMES } from './calc';
import logoUrl from '../assets/logo.png';

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const pdfINR = (n) => {
  if (!isFinite(n) || n === null || n === undefined) return 'Rs. 0';
  const abs = Math.abs(n);
  if (abs >= 10000000) return `Rs. ${(n / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `Rs. ${(n / 100000).toFixed(2)} L`;
  return `Rs. ${Math.round(n).toLocaleString('en-IN')}`;
};
const pdfSip = (n) => isFinite(n) ? `Rs. ${Math.round(Number(n)).toLocaleString('en-IN')}` : 'Rs. 0';

function buildGoalProjectionHTML(g) {
  const projection = buildProjection(g);
  if (!projection.length) return '';

  const rows = projection.map((r, ri) => `
    <tr style="background:${ri % 2 === 0 ? '#ffffff' : '#f8fafc'}">
      <td style="padding:4px 8px;text-align:center;font-weight:bold;font-size:8pt;border-bottom:1px solid #f1f5f9">${
        r.isPartial
          ? `${r.year} (${MONTH_NAMES[r.firstMonth - 1]}${r.firstMonth === r.lastMonth ? '' : '–' + MONTH_NAMES[r.lastMonth - 1]})`
          : String(r.year)
      }</td>
      <td style="padding:4px 8px;text-align:right;font-size:8pt;border-bottom:1px solid #f1f5f9">${pdfINR(r.openingBal)}</td>
      <td style="padding:4px 8px;text-align:right;font-size:8pt;border-bottom:1px solid #f1f5f9">${pdfSip(r.monthlySip)}</td>
      <td style="padding:4px 8px;text-align:right;font-size:8pt;border-bottom:1px solid #f1f5f9">${pdfINR(r.yearContribution)}</td>
      <td style="padding:4px 8px;text-align:right;font-size:8pt;color:#059669;border-bottom:1px solid #f1f5f9">${pdfINR(r.growth)}</td>
      <td style="padding:4px 8px;text-align:center;font-size:8pt;font-weight:bold;border-bottom:1px solid #f1f5f9">${pdfINR(r.closingBal)}</td>
    </tr>`).join('');

  return `<div style="margin-top:10px;padding:12px 14px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;break-inside:avoid;page-break-inside:avoid">
    <div style="font-size:9pt;font-weight:bold;margin-bottom:8px;font-family:Arial,sans-serif;color:#0f172a">Year-by-year Projection</div>
    <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif">
      <thead>
        <tr style="background:#1e3a8a;color:white">
          <th style="padding:5px 8px;text-align:center;font-size:7.5pt;font-weight:bold">Year</th>
          <th style="padding:5px 8px;text-align:right;font-size:7.5pt;font-weight:bold">Opening</th>
          <th style="padding:5px 8px;text-align:right;font-size:7.5pt;font-weight:bold">Monthly SIP</th>
          <th style="padding:5px 8px;text-align:right;font-size:7.5pt;font-weight:bold">Contribution</th>
          <th style="padding:5px 8px;text-align:right;font-size:7.5pt;font-weight:bold">Growth</th>
          <th style="padding:5px 8px;text-align:center;font-size:7.5pt;font-weight:bold">Closing</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

export async function exportClientPdf(containerEl, client, includeProjection = true) {
  if (!containerEl) {
    alert('Could not find print content. Please try again.');
    return;
  }

  const styleTags = Array.from(document.querySelectorAll('style'))
    .map(s => `<style>${s.textContent}</style>`)
    .join('\n');
  const linkTags = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map(l => `<link rel="stylesheet" href="${l.href}">`)
    .join('\n');

  const clone = containerEl.cloneNode(true);

  // Remove all buttons (back, edit, export, delete icons)
  clone.querySelectorAll('button').forEach(el => el.remove());

  // Keep "Goals Summary" heading glued to the cards below it
  clone.querySelectorAll('h3').forEach(el => {
    if (el.textContent.includes('Goals Summary')) {
      el.style.breakAfter = 'avoid';
      el.style.pageBreakAfter = 'avoid';
      if (el.parentElement) {
        el.parentElement.style.breakAfter = 'avoid';
        el.parentElement.style.pageBreakAfter = 'avoid';
      }
    }
  });

  // Strip animation classes so nothing is invisible on load
  // SVG elements (Lucide icons) have SVGAnimatedString className — skip those
  clone.querySelectorAll('[class]').forEach(el => {
    if (typeof el.className !== 'string') return;
    el.className = el.className
      .split(' ')
      .filter(c =>
        !c.startsWith('animate-') &&
        !c.startsWith('hover:scale') &&
        !c.startsWith('hover:-translate') &&
        !c.startsWith('active:scale') &&
        !c.startsWith('group-hover:opacity')
      )
      .join(' ');
  });

  // When projections are on: inject table directly after each goal card,
  // then force the goals grid to single column so they flow naturally.
  if (includeProjection && client.goals && client.goals.length > 0) {
    const goalsGrid = clone.querySelector('[class*="lg:grid-cols-2"]');
    if (goalsGrid) {
      const goalCards = Array.from(goalsGrid.children);
      // Iterate forward — insertAdjacentHTML('afterend') on a child inserts
      // the new node as the next sibling inside the same parent, so
      // forward iteration keeps indices stable.
      goalCards.forEach((cardEl, i) => {
        if (i >= client.goals.length) return;
        const projHtml = buildGoalProjectionHTML(client.goals[i]);
        if (projHtml) cardEl.insertAdjacentHTML('afterend', projHtml);
      });
      // Stack goals+projections into a single column
      goalsGrid.style.gridTemplateColumns = '1fr';
    }
  }

  // Convert logo to base64 so it embeds correctly in the about:blank print window
  const logoDataUrl = await new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve('');
    img.src = logoUrl;
  });

  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const html = `<!DOCTYPE html>
<html class="${document.documentElement.className}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1280">
  <title>${escHtml(client.name)} – Goal Report</title>
  ${linkTags}
  ${styleTags}
  <style>
    @page { size: A4 landscape; margin: 10mm 12mm; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    button { display: none !important; }
    .animate-fade-in,
    .animate-scale-up,
    .animate-slide-up { animation: none !important; opacity: 1 !important; transform: none !important; }

    /* Force Tailwind responsive grid classes to apply regardless of viewport size.
       Escaped colon: .md\:grid-cols-3 targets the HTML class "md:grid-cols-3" */
    .md\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
    .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .lg\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .lg\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }

    /* Prevent small individual tiles / cards from splitting mid-element.
       Intentionally NOT applied to p-6 / p-5 which catches large wrapper cards
       and causes blank pages (whole card pushed to next page). */
    div[class*="rounded-2xl"],
    div[class*="rounded-["] {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .print-header {
      background: #1e3a8a;
      color: white;
      padding: 14px 20px;
      border-bottom: 4px solid #3b82f6;
      border-radius: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .print-footer {
      margin-top: 28px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #94a3b8;
      font-family: Arial, sans-serif;
    }
  </style>
</head>
<body class="${document.body.className}" style="padding:16px;background:white;max-width:100%;margin:0;">
  <div class="print-header">
    <div style="display:flex;align-items:center;gap:12px;">
      ${logoDataUrl ? `<img src="${logoDataUrl}" style="height:44px;width:44px;object-fit:contain;border-radius:10px;background:white;padding:3px;" />` : ''}
      <div>
        <div style="font-size:16pt;font-weight:bold;">Team Fintness</div>
        <div style="font-size:8pt;color:#bae0ff;margin-top:2px;">Building fitter financial futures</div>
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:10pt;font-weight:bold;">GOAL REPORT</div>
      <div style="font-size:8pt;color:#bae0ff;margin-top:2px;">Generated ${dateStr}</div>
    </div>
  </div>
  ${clone.outerHTML}
  <div class="print-footer">
    <span>Generated by Team Fintness Goal Management System</span>
    <span>Confidential — For client use only</span>
  </div>
</body>
</html>`;

  // Open at 1280px so lg: breakpoints (≥1024px) fire correctly
  const win = window.open('', '_blank', 'width=1280,height=900');
  if (!win) {
    alert('Please allow pop-ups to export the report.');
    return;
  }

  win.document.write(html);
  win.document.close();

  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;
    win.focus();
    win.print();
  };
  win.onload = doPrint;
  setTimeout(doPrint, 1500);
}
