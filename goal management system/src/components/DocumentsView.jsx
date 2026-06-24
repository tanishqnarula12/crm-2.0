import React, { useState, useMemo } from 'react';
import {
  FolderOpen, FileText, Target, Shield, Search, X, Printer, Eye, CalendarDays, Wallet, FileBarChart, Upload, Paperclip
} from 'lucide-react';
import { Card, Avatar, btnPrimary, btnSecondary, btnGhost, inputCls } from './UI';
import { calcGoal, fmtINR, fmtFull, fmtSip, goalEmoji, monthLabel, fmtDate } from '../utils/calc';
import { hasAllocation, allocationTotals, filledItems } from '../utils/assets';
import { updateClient } from '../services/db';

// ---------------------------------------------------------------------------
// Build a unified, DB-driven list of generated documents from the clients data.
// Three sources: Minutes of Meeting (client.moms), Goal Reports (client.goals),
// and Insurance Policies (clientDetails insurance holdings).
// ---------------------------------------------------------------------------
const DOC_TYPES = [
  { id: 'custom', label: 'Documents', icon: FolderOpen },
  { id: 'mom', label: 'Minutes of Meeting', icon: FileText },
  { id: 'goal', label: 'Goal Report', icon: Target },
  { id: 'policy', label: 'Insurance Policies', icon: Shield },
  { id: 'asset', label: 'Asset Allocation Report', icon: Wallet },
  { id: 'portfolio', label: 'Portfolio Review Report', icon: FileBarChart },
];

const TYPE_META = {
  custom: { label: 'Uploaded Document', icon: FolderOpen, badge: 'bg-slate-50 text-slate-700 ring-slate-200/60 dark:bg-slate-950/30 dark:text-slate-400 dark:ring-slate-900/40', chip: 'from-blue-500 to-indigo-600' },
  mom: { label: 'Minutes of Meeting', icon: FileText, badge: 'bg-blue-50 text-blue-700 ring-blue-200/60 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-900/40', chip: 'from-blue-500 to-indigo-600' },
  goal: { label: 'Goal Report', icon: Target, badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900/40', chip: 'from-emerald-500 to-teal-600' },
  asset: { label: 'Asset Allocation Report', icon: Wallet, badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200/60 dark:bg-indigo-950/30 dark:text-indigo-400 dark:ring-indigo-900/40', chip: 'from-indigo-500 to-purple-600' },
  policy: { label: 'Policy Review Report', icon: Shield, badge: 'bg-amber-50 text-amber-700 ring-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-900/40', chip: 'from-amber-500 to-orange-600' },
  portfolio: { label: 'Portfolio Review Report', icon: FileBarChart, badge: 'bg-rose-50 text-rose-700 ring-rose-200/60 dark:bg-rose-955/30 dark:text-rose-400 dark:ring-rose-900/40', chip: 'from-rose-500 to-pink-600' },
};

export default function DocumentsView({ clients = [] }) {
  const [typeFilter, setTypeFilter] = useState('custom');
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Upload Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileDataUrl, setSelectedFileDataUrl] = useState('');

  const documents = useMemo(() => {
    const docs = [];
    clients.forEach(c => {
      // 1. Custom Uploaded Documents
      const details = c.clientDetails || {};
      const attachments = details.attachments || [];
      attachments.forEach((item, idx) => {
        if (typeof item === 'string') {
          docs.push({
            id: `legacy-attachment-${c.id}-${idx}`,
            type: 'custom',
            client: c,
            title: item,
            date: c.updatedAt || '',
            isLegacy: true,
            attachment: { name: item, fileName: item }
          });
        } else if (item && typeof item === 'object') {
          docs.push({
            id: item.id || `custom-attachment-${c.id}-${idx}`,
            type: 'custom',
            client: c,
            title: item.name || item.fileName || 'Untitled Document',
            date: item.date || '',
            isLegacy: false,
            attachment: item
          });
        }
      });

      // 2. Minutes of Meeting
      (c.moms || []).forEach(m => {
        docs.push({
          id: `mom-${m.id}`,
          type: 'mom',
          client: c,
          title: `Minutes of Meeting #${m.meetingNumber || '—'}`,
          date: m.meetingDate || m.createdAt || '',
          mom: m,
        });
      });

      // 3. Goal Report (one per client that has goals)
      if (c.goals && c.goals.length > 0) {
        const latest = c.goals.reduce((acc, g) => (g.createdAt && g.createdAt > acc ? g.createdAt : acc), '');
        docs.push({
          id: `goal-${c.id}`,
          type: 'goal',
          client: c,
          title: `Goal Plan Report · ${c.goals.length} goal${c.goals.length > 1 ? 's' : ''}`,
          date: latest,
          goals: c.goals,
        });
      }

      // 4. Asset Allocation Report
      if (c.assetAllocation && hasAllocation(c)) {
        docs.push({
          id: `asset-${c.id}`,
          type: 'asset',
          client: c,
          title: `Asset Allocation Report · Current Strategy`,
          date: c.assetAllocation.updatedAt || '',
          assetAllocation: c.assetAllocation,
        });
      }

      // 5. Policy Review Report (from holdings status)
      const held = [
        details.insuranceTerm === 'Yes' && 'Term',
        details.insuranceMedical === 'Yes' && 'Medical',
        details.insuranceAccidental === 'Yes' && 'Accidental',
      ].filter(Boolean);
      if (held.length > 0) {
        docs.push({
          id: `ins-${c.id}`,
          type: 'policy',
          client: c,
          title: `Policy Review Report · ${held.length} ${held.length > 1 ? 'policies' : 'policy'}`,
          date: '',
          policies: held,
        });
      }

      // 6. Portfolio Review Report
      if ((c.goals && c.goals.length > 0) || (c.assetAllocation && hasAllocation(c))) {
        const latestGoalDate = c.goals?.reduce((acc, g) => (g.createdAt && g.createdAt > acc ? g.createdAt : acc), '') || '';
        const latestAssetDate = c.assetAllocation?.updatedAt || '';
        const latestDate = latestGoalDate > latestAssetDate ? latestGoalDate : latestAssetDate;
        docs.push({
          id: `portfolio-${c.id}`,
          type: 'portfolio',
          client: c,
          title: `Portfolio Review Report`,
          date: latestDate,
          goals: c.goals || [],
          assetAllocation: c.assetAllocation,
        });
      }
    });
    return docs;
  }, [clients]);

  const counts = useMemo(() => {
    const c = { custom: 0, mom: 0, goal: 0, asset: 0, policy: 0, portfolio: 0 };
    documents.forEach(d => {
      if (c[d.type] !== undefined) c[d.type]++;
    });
    return c;
  }, [documents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents
      .filter(d => d.type === typeFilter)
      .filter(d => !q || d.client.name.toLowerCase().includes(q) || d.title.toLowerCase().includes(q))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [documents, typeFilter, query]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please select a file smaller than 5MB.");
      return;
    }

    setSelectedFile(file);
    if (!docTitle) {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setDocTitle(nameWithoutExt);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedFileDataUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClientId || !docTitle || !selectedFileDataUrl) {
      alert("Please select a client, provide a title, and select a file.");
      return;
    }

    try {
      const targetClient = clients.find(c => c.id === selectedClientId);
      if (!targetClient) return;

      const details = targetClient.clientDetails || {};
      const currentAttachments = details.attachments || [];

      const newAttachment = {
        id: 'custom-' + Date.now(),
        name: docTitle,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        dataUrl: selectedFileDataUrl,
        date: new Date().toISOString(),
        uploadedBy: 'Nitesh Luthra',
      };

      const updated = [newAttachment, ...currentAttachments];

      await updateClient(selectedClientId, {
        clientDetails: {
          ...details,
          attachments: updated
        }
      });

      if (window.refreshAppData) {
        await window.refreshAppData();
      }

      setIsUploadModalOpen(false);
      setSelectedClientId('');
      setDocTitle('');
      setSelectedFile(null);
      setSelectedFileDataUrl('');
      alert("Document uploaded successfully!");
    } catch (err) {
      alert("Error uploading document: " + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <FolderOpen size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Documents</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">All generated client documents, securely sourced from your live data</p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end md:self-auto w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search client or document…" className={inputCls + ' pl-9 w-full md:w-64'} />
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className={btnPrimary + ' py-2 px-3 text-xs shrink-0 flex items-center gap-1.5'}
          >
            <Upload size={14} /> Upload Doc
          </button>
        </div>
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2">
        {DOC_TYPES.map(({ id, label, icon: Icon }) => {
          const active = typeFilter === id;
          return (
            <button
              key={id}
              onClick={() => setTypeFilter(id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                active
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={13} />
              {label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 dark:bg-slate-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>{counts[id]}</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
          <FolderOpen className="mx-auto text-slate-400 dark:text-slate-600 mb-4" size={36} />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {documents.length === 0 ? 'No documents generated yet' : 'No documents match your filters'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
            {typeFilter === 'custom' 
              ? 'Upload client files, identity documents, and proposal summaries to see them here.'
              : 'Minutes of Meeting, Goal Reports and Insurance holdings will appear here automatically.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => {
            const meta = TYPE_META[doc.type];
            const Icon = meta.icon;
            return (
              <button
                key={doc.id}
                onClick={() => setPreview(doc)}
                className="text-left bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.chip} text-white flex items-center justify-center shadow-md shrink-0`}>
                    <Icon size={18} />
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full ring-1 ${meta.badge}`}>
                    {meta.label}
                  </span>
                </div>
                <h3 className="mt-3.5 text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{doc.title}</h3>
                <div className="mt-3 flex items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Avatar name={doc.client.name} size="sm" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{doc.client.name}</div>
                    <div className="text-[10px] text-slate-450 dark:text-slate-500 flex items-center gap-1">
                      <CalendarDays size={10} /> {doc.date ? fmtDate(doc.date) : 'Generated'}
                    </div>
                  </div>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye size={12} /> View
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setIsUploadModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200/50 dark:border-slate-800/80 p-6 animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center">
                  <Upload size={16} />
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upload New Document</h3>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">Select Client</label>
                <select
                  required
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className={inputCls + ' text-xs'}
                >
                  <option value="">-- Choose a Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.pan})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Identity Proof, Signed Consent Form"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className={inputCls + ' text-xs'}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5">Choose File</label>
                <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer group">
                  <input
                    type="file"
                    required
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Paperclip size={24} className="mx-auto text-slate-400 group-hover:text-blue-500 transition-colors mb-2" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {selectedFile ? selectedFile.name : 'Click to select or drag file here'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Image or PDF (Max 5MB)'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className={btnGhost + ' py-2 px-4'}>
                  Cancel
                </button>
                <button type="submit" className={btnPrimary + ' py-2 px-5'}>
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {preview && <DocPreviewModal doc={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview modal — renders the document content and supports print / Save PDF.
// ---------------------------------------------------------------------------
function DocPreviewModal({ doc, onClose }) {
  const meta = TYPE_META[doc.type];

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in" onClick={onClose}>
      <style dangerouslySetInnerHTML={{ __html: DOC_PRINT_STYLES }} />
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl shadow-2xl my-8 border border-slate-200/50 dark:border-slate-800/80 animate-scale-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="no-print flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.chip} text-white flex items-center justify-center shrink-0`}>
              <meta.icon size={17} />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{doc.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{doc.client.name}{doc.date ? ` · ${fmtDate(doc.date)}` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => window.print()} className={btnSecondary + ' py-2 px-3'}>
              <Printer size={14} /> Print
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Document body */}
        <div className="doc-print-body p-6 max-h-[72vh] overflow-y-auto">
          <div className="doc-letterhead hidden print:block mb-5">
            <div className="text-lg font-bold text-slate-900">Team Fintness</div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500">{meta.label}</div>
          </div>
          {doc.type === 'custom' && <CustomDocPreview doc={doc} />}
          {doc.type === 'mom' && <MomDoc mom={doc.mom} client={doc.client} />}
          {doc.type === 'goal' && <GoalDoc goals={doc.goals} client={doc.client} />}
          {doc.type === 'asset' && <AssetDoc assetAllocation={doc.assetAllocation} client={doc.client} />}
          {doc.type === 'policy' && <PolicyDoc client={doc.client} />}
          {doc.type === 'portfolio' && <PortfolioDoc goals={doc.goals} assetAllocation={doc.assetAllocation} client={doc.client} />}
        </div>
      </div>
    </div>
  );
}

function CustomDocPreview({ doc }) {
  const file = doc.attachment;
  if (!file || (!file.dataUrl && !file.data)) {
    return (
      <div className="text-center py-12 space-y-4">
        <FolderOpen size={48} className="mx-auto text-slate-400 dark:text-slate-650" />
        <div>
          <h4 className="font-bold text-slate-800 dark:text-slate-200">No Online Preview Available</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">This is a legacy reference file. No file content is stored in local database.</p>
        </div>
      </div>
    );
  }

  const dataUrl = file.dataUrl || file.data;
  const isImage = file.fileType?.startsWith('image/');
  const isPdf = file.fileType === 'application/pdf';

  return (
    <div className="space-y-6">
      {/* File Info */}
      <div className="p-4 bg-slate-50 dark:bg-slate-955/40 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center font-sans font-bold text-xs uppercase">
            {file.fileName?.split('.').pop() || 'file'}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{file.name || file.fileName}</h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Uploaded by {file.uploadedBy || 'Nitesh Luthra'} {file.date ? `· ${new Date(file.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</p>
          </div>
        </div>
        <a 
          href={dataUrl} 
          download={file.fileName}
          className={btnPrimary + ' py-2 px-3.5 text-[11px]'}
        >
          Download File
        </a>
      </div>

      {/* Preview container */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[500px]">
        {isImage ? (
          <img src={dataUrl} alt={file.name} className="max-w-full max-h-[500px] object-contain shadow-sm" />
        ) : isPdf ? (
          <iframe src={dataUrl} title={file.name} className="w-full h-[500px] border-0" />
        ) : (
          <div className="text-center p-8 space-y-3">
            <FolderOpen size={40} className="mx-auto text-slate-400 dark:text-slate-650" />
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-350">Preview not supported for this file type</p>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1">Download the file to view its full contents on your device.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Section helpers -------------------------------------------------------
function DocSection({ title, children }) {
  return (
    <section className="mb-5">
      <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 pl-2 border-l-2 border-blue-500">{title}</h4>
      {children}
    </section>
  );
}

function KVRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-slate-100 dark:border-slate-800/60 text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{value}</span>
    </div>
  );
}

function BulletList({ items }) {
  const list = (items || []).filter(Boolean);
  if (list.length === 0) return <p className="text-sm text-slate-400 dark:text-slate-500 italic">None recorded.</p>;
  return (
    <ul className="space-y-1.5">
      {list.map((it, i) => (
        <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
          <span className="text-blue-500 mt-0.5">•</span>
          <span>{typeof it === 'string' ? it : JSON.stringify(it)}</span>
        </li>
      ))}
    </ul>
  );
}

// --- Minutes of Meeting document ------------------------------------------
function MomDoc({ mom, client }) {
  const d = mom.data || {};
  return (
    <div>
      <DocSection title="Meeting Details">
        <KVRow label="Client" value={client.name} />
        <KVRow label="Meeting Number" value={mom.meetingNumber} />
        <KVRow label="Meeting Date" value={mom.meetingDate ? fmtDate(mom.meetingDate) : '—'} />
        <KVRow label="Advisor" value={d.advisorName} />
        <KVRow label="Mode" value={d.meetingMode} />
      </DocSection>

      {(d.occupation || d.income || d.expenses || d.maritalStatus) && (
        <DocSection title="Client Snapshot">
          <KVRow label="Occupation" value={d.occupation} />
          <KVRow label="Monthly Income" value={d.income} />
          <KVRow label="Monthly Expenses" value={d.expenses} />
          <KVRow label="Marital Status" value={d.maritalStatus} />
          <KVRow label="Spouse" value={d.spouseName} />
        </DocSection>
      )}

      {Array.isArray(d.goals) && d.goals.length > 0 && (
        <DocSection title="Goals Discussed">
          {d.goals.map((g, i) => (
            <KVRow key={i} label={g.name} value={`Target ${fmtINR(g.target)} · Accumulated ${fmtINR(g.accumulated)}`} />
          ))}
        </DocSection>
      )}

      <DocSection title="Agenda"><BulletList items={d.agenda} /></DocSection>
      <DocSection title="Discussion Points"><BulletList items={d.discussion} /></DocSection>
      <DocSection title="Our Recommendations"><BulletList items={d.ourRecs} /></DocSection>
      <DocSection title="Client Recommendations / Asks"><BulletList items={d.clientRecs} /></DocSection>

      {d.followupRequired && (
        <DocSection title="Follow-up">
          <KVRow label="Required" value={d.followupRequired} />
          <KVRow label="Date" value={d.followupDate ? fmtDate(d.followupDate) : ''} />
          <KVRow label="Purpose" value={d.followupPurpose} />
          <KVRow label="Notes" value={d.followupNotes} />
        </DocSection>
      )}
    </div>
  );
}

// --- Goal Report document --------------------------------------------------
function GoalDoc({ goals, client }) {
  const rows = goals.map(g => ({ g, c: calcGoal(g) }));
  const totalSip = rows.reduce((s, { g }) => s + (Number(g.currentSip) || 0), 0);
  const totalAdd = rows.reduce((s, { c }) => s + c.additionalSip, 0);
  const totalLump = rows.reduce((s, { c }) => s + c.lumpSumRequired, 0);

  return (
    <div>
      <DocSection title="Client">
        <KVRow label="Name" value={client.name} />
        <KVRow label="PAN" value={client.pan} />
        <KVRow label="Age" value={client.age ? `${client.age} years` : '—'} />
      </DocSection>

      <DocSection title="Goal Summary">
        <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="text-left px-3 py-2.5">Goal</th>
                <th className="text-left px-3 py-2.5">Target</th>
                <th className="text-right px-3 py-2.5">Future Value</th>
                <th className="text-right px-3 py-2.5">Corpus</th>
                <th className="text-right px-3 py-2.5">SIP Needed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map(({ g, c }) => (
                <tr key={g.id}>
                  <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-200">
                    <span className="mr-1.5">{goalEmoji(g.name)}</span>{g.name}
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{monthLabel(g.targetMonth || 1, g.targetYear)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">{fmtINR(c.futureValue)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">{fmtINR(g.currentInv)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-bold text-blue-700 dark:text-blue-400">{fmtSip(c.sipRequired)}/mo</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection title="Totals">
        <KVRow label="Current Monthly SIP" value={fmtSip(totalSip) + '/mo'} />
        <KVRow label="Additional SIP Required" value={fmtSip(totalAdd) + '/mo'} />
        <KVRow label="Lump-sum Equivalent Today" value={fmtFull(totalLump)} />
      </DocSection>
    </div>
  );
}

// --- Insurance Policies document ------------------------------------------
// --- Asset Allocation document ---------------------------------------------
function AssetDoc({ assetAllocation, client }) {
  const totals = allocationTotals(assetAllocation);
  const items = filledItems(assetAllocation, 'financial').concat(filledItems(assetAllocation, 'physical'));
  const totalAssets = totals.totalAssets;

  return (
    <div>
      <DocSection title="Client">
        <KVRow label="Name" value={client.name} />
        <KVRow label="PAN" value={client.pan} />
        <KVRow label="Age" value={client.age ? `${client.age} years` : '—'} />
      </DocSection>

      <DocSection title="Net Worth Summary">
        <KVRow label="Total Financial Assets" value={fmtINR(totals.financial)} />
        <KVRow label="Total Physical Assets" value={fmtINR(totals.physical)} />
        <KVRow label="Total Assets" value={fmtINR(totalAssets)} />
        <KVRow label="Total Liabilities" value={fmtINR(totals.liabilities)} />
        <KVRow label="Estimated Net Worth" value={fmtINR(totals.netWorth)} />
      </DocSection>

      {items.length > 0 && (
        <DocSection title="Asset Allocation Breakdown">
          <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="text-left px-3 py-2.5">Asset Class</th>
                  <th className="text-left px-3 py-2.5">Category</th>
                  <th className="text-right px-3 py-2.5">Amount</th>
                  <th className="text-right px-3 py-2.5">Allocation %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-200">{item.label}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{item.group}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">{fmtINR(item.amount)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-bold text-blue-700 dark:text-blue-400">
                      {totalAssets > 0 ? ((item.amount / totalAssets) * 100).toFixed(1) + '%' : '0%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DocSection>
      )}

      {assetAllocation?.remark && (
        <DocSection title="Advisory Remarks">
          <p className="text-xs text-slate-700 dark:text-slate-300 italic whitespace-pre-wrap leading-relaxed">
            {assetAllocation.remark}
          </p>
        </DocSection>
      )}
    </div>
  );
}

// --- Policy Review Report document ----------------------------------------
function PolicyDoc({ client }) {
  const d = client.clientDetails || {};
  const policiesList = [
    d.insuranceTerm === 'Yes' && 'Term',
    d.insuranceMedical === 'Yes' && 'Medical',
    d.insuranceAccidental === 'Yes' && 'Accidental',
  ].filter(Boolean);

  return (
    <div>
      <DocSection title="Client">
        <KVRow label="Name" value={client.name} />
        <KVRow label="PAN" value={client.pan} />
        <KVRow label="Mobile" value={d.mobile} />
      </DocSection>

      <DocSection title="Active Insurance Policies">
        <div className="flex flex-wrap gap-2 mb-4">
          {policiesList.map(p => (
            <span key={p} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200/60 dark:ring-amber-900/40 text-xs font-bold animate-fade-in">
              <Shield size={13} /> {p} Insurance
            </span>
          ))}
          {policiesList.length === 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-500 italic">No policies recorded in profile.</span>
          )}
        </div>
      </DocSection>

      <DocSection title="Holdings Status Summary">
        <KVRow label="Term Insurance Coverage" value={d.insuranceTerm || 'No'} />
        <KVRow label="Medical Insurance Coverage" value={d.insuranceMedical || 'No'} />
        <KVRow label="Accidental Insurance Coverage" value={d.insuranceAccidental || 'No'} />
      </DocSection>

      <DocSection title="Policy Status Notes">
        <p className="text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">
          The above summary reflects policies entered in the Client profile. For comprehensive IRR returns, cashflow calculations, surrender options, or comparison with mutual fund wealth growth, please use the Policy Review Workspace inside Client Profile.
        </p>
      </DocSection>
    </div>
  );
}

// --- Portfolio Review Report document -------------------------------------
function PortfolioDoc({ goals, assetAllocation, client }) {
  const totals = assetAllocation ? allocationTotals(assetAllocation) : null;
  const goalRows = (goals || []).map(g => ({ g, c: calcGoal(g) }));

  return (
    <div>
      <DocSection title="Client Summary">
        <KVRow label="Name" value={client.name} />
        <KVRow label="PAN" value={client.pan} />
        <KVRow label="Age" value={client.age ? `${client.age} years` : '—'} />
      </DocSection>

      {totals && (
        <DocSection title="Asset & Net Worth Summary">
          <KVRow label="Financial Assets" value={fmtINR(totals.financial)} />
          <KVRow label="Physical Assets" value={fmtINR(totals.physical)} />
          <KVRow label="Total Assets" value={fmtINR(totals.totalAssets)} />
          <KVRow label="Liabilities" value={fmtINR(totals.liabilities)} />
          <KVRow label="Net Worth" value={fmtINR(totals.netWorth)} />
        </DocSection>
      )}

      {goalRows.length > 0 && (
        <DocSection title="Financial Goals Status">
          <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="text-left px-3 py-2.5">Goal</th>
                  <th className="text-left px-3 py-2.5">Target Year</th>
                  <th className="text-right px-3 py-2.5">Target Amount</th>
                  <th className="text-right px-3 py-2.5">Current SIP</th>
                  <th className="text-center px-3 py-2.5">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {goalRows.map(({ g, c }) => (
                  <tr key={g.id}>
                    <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-200">
                      <span className="mr-1.5">{goalEmoji(g.name)}</span>{g.name}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{g.targetYear}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">{fmtINR(c.futureValue)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">{fmtSip(g.currentSip)}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {c.achievementPct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DocSection>
      )}

      <DocSection title="Portfolio Manager Remarks">
        <p className="text-xs text-slate-550 dark:text-slate-450 italic leading-relaxed">
          This comprehensive portfolio review is generated dynamically based on active client assets, loans, liabilities, and mapped financial goals. Review with client quarterly to rebalance assets and align goals.
        </p>
      </DocSection>
    </div>
  );
}

const DOC_PRINT_STYLES = `
  @media print {
    @page { size: A4; margin: 16mm; }
    body * { visibility: hidden !important; }
    .doc-print-body, .doc-print-body * { visibility: visible !important; }
    .doc-print-body {
      position: absolute !important; left: 0 !important; top: 0 !important;
      width: 100% !important; max-height: none !important; overflow: visible !important;
      padding: 0 !important; background: #fff !important;
      -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
    }
    .no-print { display: none !important; }
  }
`;
