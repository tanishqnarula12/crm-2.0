import React from 'react';
import {
  User, Phone, Mail, MapPin, Pencil, CheckCircle2, XCircle, Lock,
  Contact, UsersRound, Users, Briefcase,
  Activity, Archive, CalendarDays, TrendingUp, Paperclip, FileText, Skull, Clock,
  ListChecks, Plus, Trash2, Check, X, MessageSquare, Send, Wallet, FileBarChart, Printer, Eye, Target, Shield, Upload, FolderOpen
} from 'lucide-react';
import { Avatar, Card, btnPrimary, btnSecondary, btnGhost, inputCls } from './UI';
import { FIXED_ROLES, MANAGER_ROLES } from '../utils/team';
import { loadTasks } from '../utils/tasks';
import { loadProspects, CATEGORY_THEME, PROSPECT_STAGE_THEME, fmtAmountINR } from '../utils/prospects';
import { updateClient } from '../services/db';
import { uid, calcGoal, fmtINR, fmtFull, fmtSip, goalEmoji, monthLabel, fmtDate } from '../utils/calc';
import { hasAllocation, allocationTotals, filledItems } from '../utils/assets';

export default function ClientProfileView({
  client, clients = [], onEditClient, isViewer,
  onNavigateToTasks, onOpenTask, tasksChangeCounter,
  onNavigateToProspects, onOpenProspect, prospectsChangeCounter,
}) {
  const details = client.clientDetails || {};
  const {
    mobile = '',
    email = '',
    clientType = '',
    dob = '',
    address1 = '',
    address2 = '',
    address3 = '',
    city = '',
    state = '',
    pinCode = '',
    profession = '',
    professionOther = '',
    familyDetails = [],
    mutualFunds = 'No',
    insuranceTerm = 'No',
    insuranceMedical = 'No',
    insuranceAccidental = 'No'
  } = details;

  const [tasks, setTasks] = React.useState(() => loadTasks());
  const [prospects, setProspects] = React.useState(() => loadProspects());
  const [previewDoc, setPreviewDoc] = React.useState(null);

  // Upload States
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);
  const [docTitle, setDocTitle] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [selectedFileDataUrl, setSelectedFileDataUrl] = React.useState('');
  
  // Filter State
  const [attachmentFilter, setAttachmentFilter] = React.useState('custom');

  // Sync tasks when client or counter changes
  React.useEffect(() => {
    setTasks(loadTasks());
  }, [client, tasksChangeCounter]);

  // Sync prospects when client or counter changes
  React.useEffect(() => {
    setProspects(loadProspects());
  }, [client, prospectsChangeCounter]);

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
    if (!docTitle || !selectedFileDataUrl) {
      alert("Please provide a title and select a file.");
      return;
    }

    try {
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

      await updateClient(client.id, {
        clientDetails: {
          ...details,
          attachments: updated
        }
      });

      if (window.refreshAppData) {
        await window.refreshAppData();
      }

      setIsUploadModalOpen(false);
      setDocTitle('');
      setSelectedFile(null);
      setSelectedFileDataUrl('');
      alert("Document uploaded successfully!");
    } catch (err) {
      alert("Error uploading document: " + err.message);
    }
  };

  const dynamicAttachments = React.useMemo(() => {
    const list = [];
    
    // Goal Report
    if (client.goals && client.goals.length > 0) {
      const latest = client.goals.reduce((acc, g) => (g.createdAt && g.createdAt > acc ? g.createdAt : acc), '');
      list.push({
        id: `goal-${client.id}`,
        type: 'goal',
        client,
        title: `Goal Plan Report · ${client.goals.length} goal${client.goals.length > 1 ? 's' : ''}`,
        date: latest,
        goals: client.goals
      });
    }

    // Asset Allocation Report
    if (client.assetAllocation && hasAllocation(client)) {
      list.push({
        id: `asset-${client.id}`,
        type: 'asset',
        client,
        title: `Asset Allocation Report`,
        date: client.assetAllocation.updatedAt || '',
        assetAllocation: client.assetAllocation
      });
    }

    // Minutes of Meeting Reports
    (client.moms || []).forEach(m => {
      list.push({
        id: `mom-${m.id}`,
        type: 'mom',
        client,
        title: `Minutes of Meeting #${m.meetingNumber || '—'}`,
        date: m.meetingDate || m.createdAt || '',
        mom: m
      });
    });

    // Policy Review Report
    const held = [
      details.insuranceTerm === 'Yes' && 'Term',
      details.insuranceMedical === 'Yes' && 'Medical',
      details.insuranceAccidental === 'Yes' && 'Accidental',
    ].filter(Boolean);
    if (held.length > 0) {
      list.push({
        id: `policy-${client.id}`,
        type: 'policy',
        client,
        title: `Policy Review Report · ${held.length} coverages`,
        date: '',
        policies: held
      });
    }

    // Portfolio Review Report
    if ((client.goals && client.goals.length > 0) || (client.assetAllocation && hasAllocation(client))) {
      const latestGoalDate = client.goals?.reduce((acc, g) => (g.createdAt && g.createdAt > acc ? g.createdAt : acc), '') || '';
      const latestAssetDate = client.assetAllocation?.updatedAt || '';
      const latestDate = latestGoalDate > latestAssetDate ? latestGoalDate : latestAssetDate;
      list.push({
        id: `portfolio-${client.id}`,
        type: 'portfolio',
        client,
        title: `Portfolio Review Report`,
        date: latestDate,
        goals: client.goals || [],
        assetAllocation: client.assetAllocation
      });
    }

    return list;
  }, [client, details]);

  const ATTACHMENT_TABS = [
    { id: 'custom', label: 'Documents', icon: FolderOpen },
    { id: 'mom', label: 'Minutes of Meeting', icon: FileText },
    { id: 'goal', label: 'Goal Report', icon: Target },
    { id: 'policy', label: 'Insurance Policies', icon: Shield },
    { id: 'asset', label: 'Asset Allocation Report', icon: Wallet },
    { id: 'portfolio', label: 'Portfolio Review Report', icon: FileBarChart },
  ];

  const attachmentCounts = React.useMemo(() => {
    const counts = { custom: details.attachments?.length || 0, mom: 0, goal: 0, policy: 0, asset: 0, portfolio: 0 };
    dynamicAttachments.forEach(doc => {
      if (counts[doc.type] !== undefined) {
        counts[doc.type]++;
      }
    });
    return counts;
  }, [dynamicAttachments, details.attachments]);

  // The client themselves is always the "Self" applicant, shown first, followed
  // by family members (any duplicate "Self" entry in the saved list is dropped).
  const applicantRows = [
    { name: client.name, relation: 'Self', pan: client.pan, dob },
    ...familyDetails.filter(f => (f.relation || '').toLowerCase() !== 'self'),
  ];

  const formattedAddress = [
    address1,
    address2,
    address3,
    [city, state, pinCode].filter(Boolean).join(', ')
  ].filter(Boolean).join('\n');

  const openTasks = React.useMemo(() => {
    return tasks.filter(t => 
      (t.groupLeaderId === client.id || t.groupLeader === client.name) &&
      t.stage !== 'Completed' && 
      t.stage !== 'Lost'
    );
  }, [client, tasks]);

  const closedTasks = React.useMemo(() => {
    return tasks.filter(t =>
      (t.groupLeaderId === client.id || t.groupLeader === client.name) &&
      (t.stage === 'Completed' || t.stage === 'Lost')
    );
  }, [client, tasks]);

  // Business prospects belonging to this client's group (matched by id, name, or PAN)
  const clientProspects = React.useMemo(() => {
    return prospects.filter(p =>
      p.groupLeaderId === client.id ||
      p.groupLeader === client.name ||
      (client.pan && p.pan === client.pan)
    );
  }, [client, prospects]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <Card className="relative overflow-hidden p-6 border border-slate-200/60 dark:border-slate-800/80 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-16 -right-12 w-48 h-48 rounded-full bg-blue-400/10 dark:bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-32 w-44 h-44 rounded-full bg-indigo-400/10 dark:bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="ring-4 ring-white/70 dark:ring-slate-800/70 rounded-full shadow-lg">
              <Avatar name={client.name} size="lg" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{client.name}</h2>
                <StatusBadge status={details.status || 'Active'} />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium flex items-center gap-2">
                <span className="font-mono tracking-wider bg-blue-100/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-lg text-xs border border-blue-200/60 dark:border-blue-900/40">{client.pan}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span>{client.age || '—'} years old</span>
              </p>
            </div>
          </div>
          {!isViewer && (
            <button onClick={onEditClient} className={btnPrimary + ' w-full md:w-auto'}>
              <Pencil size={14} /> Edit Client Details
            </button>
          )}
        </div>
      </Card>

      {/* Client Profile & Business Details */}
      <Card className="p-6 border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xl rounded-3xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <User size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Client Profile &amp; Business Details</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium font-sans">
              Contact information, team assignments, family members, and business holdings status
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          {/* Box 1: Personal & Contact details */}
          <SectionBox accent="blue" icon={Contact} title="Personal & Contact Details">
            <div className="space-y-3">
              <ContactRow icon={Phone} accent="blue" label="Mobile" value={mobile} />
              <ContactRow icon={Mail} accent="sky" label="Email" value={email} />
              <ContactRow icon={User} accent="blue" label="Client Type" value={clientType} emptyText="Not configured" />
              <ContactRow icon={Briefcase} accent="blue" label="Profession" value={profession === 'Other' ? (professionOther || 'Other') : profession} emptyText="Not configured" />
              <ContactRow icon={MapPin} accent="cyan" label="Address" value={formattedAddress} multiline emptyText="No address details configured" />
            </div>
          </SectionBox>

          {/* Box 2: Internal Assignment Details */}
          <SectionBox accent="blue" icon={UsersRound} title="Internal Team Assignments">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RoleTile label="Owner" name={FIXED_ROLES.owner} fixed />
              {MANAGER_ROLES.map(role => (
                <RoleTile key={role.key} label={role.label} name={details[role.key]} />
              ))}
              <RoleTile label="Operation Manager" name={FIXED_ROLES.operationManager} fixed />
              <RoleTile label="Internal Manager" name={FIXED_ROLES.internalManager} fixed />
            </div>
          </SectionBox>

          {/* Box 3: Family Details (Tabular) */}
          <SectionBox accent="blue" icon={Users} title="Family & Applicants Details">
            <div className="overflow-x-auto border border-blue-100/70 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 shadow-sm">
              <table className="w-full text-xs text-left text-slate-700 dark:text-slate-350 min-w-[320px]">
                <thead className="bg-blue-50/70 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider border-b border-blue-100 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5 text-[10px]">Applicant Name</th>
                    <th className="px-4 py-2.5 text-[10px]">PAN</th>
                    <th className="px-4 py-2.5 text-[10px]">Relation</th>
                    <th className="px-4 py-2.5 text-[10px]">Date of Birth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {applicantRows.map((f, i) => (
                    <tr key={i} className="hover:bg-blue-50/40 dark:hover:bg-slate-900/20 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-2.5">
                          <Avatar name={f.name} size="sm" />
                          <span className="font-bold text-slate-800 dark:text-slate-200">{f.name || '—'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        {f.pan || '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-[11px] font-bold ring-1 ring-blue-200/50 dark:ring-blue-900/30">
                          {f.relation || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">
                        {f.dob ? fmtDate(f.dob) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionBox>

          {/* Box 4: Business Details (Products holding status) */}
          <SectionBox accent="blue" icon={Briefcase} title="Business & Holdings Status">
            <div className="grid grid-cols-2 gap-3">
              <HoldingBadge label="Mutual Funds" status={mutualFunds} />
              <HoldingBadge label="Term Insurance" status={insuranceTerm} />
              <HoldingBadge label="Medical Insurance" status={insuranceMedical} />
              <HoldingBadge label="Accidental Insurance" status={insuranceAccidental} />
            </div>
          </SectionBox>
        </div>
      </Card>

      {/* Activities Card */}
      <Card className="p-6 border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xl rounded-3xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Activities</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium font-sans">
              Operational track of active (open) and completed (closed) client engagement tasks
            </p>
          </div>
        </div>

        <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <SectionBox accent="indigo" icon={Activity} title="Open Activities">
            {details.openActivities && details.openActivities.length > 0 ? (
              <ListBox items={details.openActivities} emptyText="No open activities configured" />
            ) : (
              openTasks.length === 0 && <p className="text-xs text-slate-450 dark:text-slate-500 italic font-medium">No open activities or tasks configured</p>
            )}

            {openTasks.length > 0 && (
              <div className={details.openActivities && details.openActivities.length > 0 ? "mt-4 pt-4 border-t border-indigo-150/50 dark:border-indigo-900/30" : ""}>
                <h5 className="text-[10px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-2.5 flex items-center gap-1.5">
                  <ListChecks size={12} /> Tasks Module
                </h5>
                <OpenTasksBox tasks={openTasks} onSelectTask={onOpenTask} />
              </div>
            )}
          </SectionBox>

          <SectionBox accent="purple" icon={Archive} title="Closed Activities">
            {details.closedActivities && details.closedActivities.length > 0 ? (
              <ClosedActivitiesBox items={details.closedActivities} emptyText="No closed activities configured" />
            ) : (
              closedTasks.length === 0 && <p className="text-xs text-slate-450 dark:text-slate-500 italic font-medium">No closed activities or tasks configured</p>
            )}

            {closedTasks.length > 0 && (
              <div className={details.closedActivities && details.closedActivities.length > 0 ? "mt-4 pt-4 border-t border-purple-150/50 dark:border-purple-900/30" : ""}>
                <h5 className="text-[10px] font-black uppercase tracking-wider text-purple-500 dark:text-purple-400 mb-2.5 flex items-center gap-1.5">
                  <ListChecks size={12} /> Tasks Module (Closed)
                </h5>
                <OpenTasksBox tasks={closedTasks} onSelectTask={onOpenTask} />
              </div>
            )}
          </SectionBox>
        </div>
      </Card>

      {/* Meeting Setup History */}
      <Card className="p-6 border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xl rounded-3xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <CalendarDays size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Meeting Setup History</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium font-sans">
              Timeline record of client-advisor meeting interactions
            </p>
          </div>
        </div>
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <ListBox items={details.meetingHistory} emptyText="No meeting history recorded" />
        </div>
      </Card>

      {/* Business Prospects */}
      <Card className="p-6 border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xl rounded-3xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Business Prospects</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium font-sans">
                Active opportunities generated from Insurance &amp; Investment proposals
              </p>
            </div>
          </div>
          {onNavigateToProspects && clientProspects.length > 0 && (
            <button
              onClick={() => onNavigateToProspects(clientProspects[0].id)}
              className={btnSecondary + ' py-1.5 px-3 text-[11px] flex items-center gap-1 shrink-0'}
            >
              View All
            </button>
          )}
        </div>
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          {details.businessProspects && details.businessProspects.length > 0 && (
            <ListBox items={details.businessProspects} emptyText="No active business prospects" />
          )}

          {clientProspects.length === 0 ? (
            (!details.businessProspects || details.businessProspects.length === 0) && (
              <p className="text-xs text-slate-450 dark:text-slate-500 italic font-medium">No active business prospects configured</p>
            )
          ) : (
            <div className={details.businessProspects && details.businessProspects.length > 0 ? "pt-4 border-t border-indigo-150/50 dark:border-indigo-900/30" : ""}>
              <h5 className="text-[10px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-2.5 flex items-center gap-1.5">
                <Briefcase size={12} /> Prospect Module
              </h5>
              <ProspectsBox prospects={clientProspects} onSelectProspect={onOpenProspect} />
            </div>
          )}
        </div>
      </Card>

      {/* Attachments */}
      <Card className="p-6 border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xl rounded-3xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Paperclip size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Attachments</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium font-sans">
                Client files, identity documents, and proposal summaries
              </p>
            </div>
          </div>
          {!isViewer && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className={btnSecondary + ' py-1.5 px-3 text-[11px] flex items-center gap-1'}
            >
              <Upload size={12} /> Upload
            </button>
          )}
        </div>

        {/* Attachment Tab Chips (Differentiators matching DocumentsView) */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {ATTACHMENT_TABS.map(({ id, label, icon: Icon }) => {
            const active = attachmentFilter === id;
            return (
              <button
                key={id}
                onClick={() => setAttachmentFilter(id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer border ${
                  active
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={11} />
                {label}
                <span className={`text-[9px] px-1 py-0.2 rounded-full ${active ? 'bg-white/20 dark:bg-slate-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  {attachmentCounts[id]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <AttachmentsBox
            staticItems={attachmentFilter === 'custom' ? details.attachments : []}
            dynamicItems={dynamicAttachments.filter(doc => doc.type === attachmentFilter)}
            onPreview={setPreviewDoc}
            client={client}
            emptyText="No documents match this category"
          />
        </div>
      </Card>

      {/* Notes */}
      <Card className="p-6 border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xl rounded-3xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Notes</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium font-sans">
              Detailed comments, operational remarks, and client relationship history
            </p>
          </div>
        </div>
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <NotesFeed client={client} details={details} isViewer={isViewer} />
        </div>
      </Card>

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setIsUploadModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200/50 dark:border-slate-800/80 p-6 animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center">
                  <Upload size={16} />
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">Upload Document for {client.name}</h3>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Document Title</label>
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
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Choose File</label>
                <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer group">
                  <input
                    type="file"
                    required
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Paperclip size={24} className="mx-auto text-slate-400 group-hover:text-blue-500 transition-colors mb-2" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350 block font-sans">
                    {selectedFile ? selectedFile.name : 'Click to select or drag file here'}
                  </span>
                  <span className="text-[10px] text-slate-450 dark:text-slate-500 block mt-1 font-sans">
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

      {previewDoc && <DocPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </div>
  );
}

// --- Themed section wrapper ----------------------------------------------
const SECTION_THEMES = {
  blue: {
    box: 'from-blue-50/70 to-sky-50/40 dark:from-blue-950/15 dark:to-slate-950/20 border-blue-100/70 dark:border-blue-900/20',
    chip: 'bg-gradient-to-br from-blue-500 to-sky-500 text-white shadow-blue-500/25',
    title: 'text-blue-700 dark:text-blue-300',
  },
  indigo: {
    box: 'from-indigo-50/70 to-violet-50/40 dark:from-indigo-950/15 dark:to-slate-950/20 border-indigo-100/70 dark:border-indigo-900/20',
    chip: 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-indigo-500/25',
    title: 'text-indigo-700 dark:text-indigo-300',
  },
  purple: {
    box: 'from-purple-50/70 to-fuchsia-50/40 dark:from-purple-950/15 dark:to-slate-950/20 border-purple-100/70 dark:border-purple-900/20',
    chip: 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-purple-500/25',
    title: 'text-purple-700 dark:text-purple-300',
  },
  cyan: {
    box: 'from-cyan-50/70 to-blue-50/40 dark:from-cyan-950/15 dark:to-slate-950/20 border-cyan-100/70 dark:border-cyan-900/20',
    chip: 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-cyan-500/25',
    title: 'text-cyan-700 dark:text-cyan-300',
  },
};

function SectionBox({ accent, icon: Icon, title, children }) {
  const t = SECTION_THEMES[accent] || SECTION_THEMES.blue;
  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-br ${t.box} border space-y-4`}>
      <h4 className="flex items-center gap-2.5">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-md ${t.chip}`}>
          <Icon size={15} />
        </span>
        <span className={`text-xs font-black uppercase tracking-wider ${t.title}`}>{title}</span>
      </h4>
      {children}
    </div>
  );
}

// --- Contact row with colored icon chip ----------------------------------
const CONTACT_ACCENTS = {
  blue: 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
  sky: 'bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400',
  cyan: 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400',
};

function ContactRow({ icon: Icon, accent, label, value, multiline, emptyText = 'Not configured' }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${CONTACT_ACCENTS[accent] || CONTACT_ACCENTS.blue}`}>
        <Icon size={14} />
      </span>
      <div className="min-w-0">
        <span className="font-semibold block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</span>
        <span className={`font-bold text-slate-800 dark:text-slate-200 text-xs ${multiline ? 'whitespace-pre-line leading-relaxed' : ''}`}>
          {value || <span className="text-slate-400 dark:text-slate-600 italic font-normal">{emptyText}</span>}
        </span>
      </div>
    </div>
  );
}

function RoleTile({ label, name, fixed }) {
  const assigned = Boolean(name);
  return (
    <div className={`p-3 rounded-xl border shadow-sm flex items-center gap-2.5 transition-all duration-300 ${
      fixed
        ? 'bg-indigo-50/60 dark:bg-indigo-950/15 border-indigo-200/60 dark:border-indigo-900/30'
        : assigned
          ? 'bg-white dark:bg-slate-950 border-blue-200/50 dark:border-blue-900/20'
          : 'bg-white/60 dark:bg-slate-950/40 border-dashed border-slate-200 dark:border-slate-800'
    }`}>
      {assigned ? (
        <Avatar name={name} size="sm" />
      ) : (
        <span className="w-7 h-7 rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0">
          <User size={13} className="text-slate-300 dark:text-slate-600" />
        </span>
      )}
      <div className="min-w-0">
        <span className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
          <span className="font-semibold truncate">{label}</span>
          {fixed && <Lock size={9} className="text-indigo-400 dark:text-indigo-500 shrink-0" />}
        </span>
        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate block">
          {name || <span className="text-slate-400 dark:text-slate-600 font-normal italic">Unassigned</span>}
        </span>
      </div>
    </div>
  );
}

function HoldingBadge({ label, status }) {
  const isYes = status === 'Yes';
  return (
    <div className={`p-3 rounded-xl border flex items-center justify-between shadow-sm transition-all duration-300 ${
      isYes
        ? 'bg-gradient-to-br from-emerald-50 to-teal-50/60 dark:from-emerald-950/20 dark:to-slate-950/20 border-emerald-200/70 dark:border-emerald-900/40'
        : 'bg-gradient-to-br from-rose-50 to-pink-50/60 dark:from-rose-950/20 dark:to-slate-950/20 border-rose-200/70 dark:border-rose-900/40'
    }`}>
      <div>
        <span className="font-bold text-xs block text-slate-750 dark:text-slate-200">{label}</span>
        <span className={`text-[10px] font-black uppercase tracking-wider mt-0.5 block ${
          isYes ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
        }`}>
          {status}
        </span>
      </div>
      {isYes ? (
        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
      ) : (
        <XCircle size={18} className="text-rose-500 shrink-0" />
      )}
    </div>
  );
}

// --- Badge for client status in Hero section -----------------------------
function StatusBadge({ status }) {
  let bg = '';
  let border = '';
  let text = '';
  let Icon = CheckCircle2;
  
  if (status === 'Active') {
    bg = 'bg-emerald-50 dark:bg-emerald-950/30';
    border = 'border-emerald-250/50 dark:border-emerald-900/30';
    text = 'text-emerald-700 dark:text-emerald-400';
    Icon = CheckCircle2;
  } else if (status === 'Inactive') {
    bg = 'bg-amber-50 dark:bg-amber-950/30';
    border = 'border-amber-250/50 dark:border-amber-900/30';
    text = 'text-amber-750 dark:text-amber-400';
    Icon = Clock;
  } else { // Dead
    bg = 'bg-rose-50 dark:bg-rose-950/30';
    border = 'border-rose-250/50 dark:border-rose-900/30';
    text = 'text-rose-700 dark:text-rose-400';
    Icon = Skull;
  }
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${bg} ${border} ${text} border shadow-sm`}>
      <Icon size={12} />
      {status}
    </span>
  );
}

// --- List/Notes rendering helpers for CRM profile sections ---------------
function ListBox({ items, emptyText }) {
  if (!items || items.length === 0) {
    return <p className="text-xs text-slate-450 dark:text-slate-500 italic font-medium">{emptyText}</p>;
  }
  return (
    <ul className="space-y-2.5">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80 dark:bg-blue-400/80 mt-1.5 shrink-0" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ClosedActivitiesBox({ items, emptyText }) {
  if (!items || items.length === 0) {
    return <p className="text-xs text-slate-450 dark:text-slate-500 italic font-medium">{emptyText}</p>;
  }
  return (
    <ul className="space-y-2.5">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2.5">
          <CheckCircle2 size={13} className="text-emerald-500/80 mt-0.5 shrink-0" />
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 line-through leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function AttachmentsBox({ staticItems = [], dynamicItems = [], onPreview, client, emptyText }) {
  const hasStatic = staticItems && staticItems.length > 0;
  const hasDynamic = dynamicItems && dynamicItems.length > 0;

  if (!hasStatic && !hasDynamic) {
    return <p className="text-xs text-slate-450 dark:text-slate-500 italic font-medium">{emptyText}</p>;
  }

  // Icons and styles lookup per document type
  const docMeta = {
    mom: { icon: FileText, style: 'bg-blue-500/10 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
    goal: { icon: Target, style: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
    asset: { icon: Wallet, style: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' },
    policy: { icon: Shield, style: 'bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },
    portfolio: { icon: FileBarChart, style: 'bg-rose-500/10 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* 1. Dynamic Auto-Generated Reports */}
      {dynamicItems.map((doc) => {
        const meta = docMeta[doc.type] || { icon: FileText, style: 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400' };
        const Icon = meta.icon;
        return (
          <div
            key={doc.id}
            onClick={() => onPreview && onPreview(doc)}
            className="p-3 bg-white dark:bg-slate-955 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 shadow-xs hover:shadow-md cursor-pointer transition-all duration-300 hover:border-blue-400/50 hover:-translate-y-[1px] group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.style}`}>
                <Icon size={15} />
              </span>
              <div className="min-w-0">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{doc.title}</span>
                <span className="text-[9px] text-slate-450 dark:text-slate-500 uppercase font-black tracking-wider block mt-0.5">Report Document</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye size={12} /> View
            </span>
          </div>
        );
      })}

      {/* 2. Static Uploaded Files */}
      {staticItems.map((item, idx) => {
        const isObj = item && typeof item === 'object';
        const doc = {
          id: isObj ? (item.id || `custom-attachment-${idx}`) : `legacy-attachment-${idx}`,
          type: 'custom',
          client: client,
          title: isObj ? (item.name || item.fileName || 'Untitled Document') : item,
          date: isObj ? (item.date || '') : '',
          attachment: isObj ? item : { name: item, fileName: item },
          isLegacy: !isObj
        };
        return (
          <div
            key={`static-${idx}`}
            onClick={() => onPreview && onPreview(doc)}
            className="p-3 bg-white dark:bg-slate-955 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 shadow-xs hover:shadow-md cursor-pointer transition-all duration-300 hover:border-blue-400/50 hover:-translate-y-[1px] group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-450 dark:text-slate-550 flex items-center justify-center shrink-0">
                <Paperclip size={14} />
              </span>
              <div className="min-w-0">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {doc.title}
                </span>
                <span className="text-[9px] text-slate-450 dark:text-slate-500 uppercase font-black tracking-wider block mt-0.5">
                  Uploaded Document
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye size={12} /> View
            </span>
          </div>
        );
      })}
    </div>
  );
}

function NotesFeed({ client, details, isViewer }) {
  const [isAdding, setIsAdding] = React.useState(false);
  const [newNoteText, setNewNoteText] = React.useState('');
  const [editingNoteId, setEditingNoteId] = React.useState(null);
  const [editingNoteText, setEditingNoteText] = React.useState('');

  const notesList = React.useMemo(() => {
    if (Array.isArray(details.notes)) {
      return details.notes;
    }
    if (typeof details.notes === 'string' && details.notes.trim()) {
      return [{
        id: 'legacy-1',
        text: details.notes,
        createdAt: client.updatedAt || new Date().toISOString(),
        author: 'Nitesh Luthra'
      }];
    }
    return [];
  }, [details.notes, client.updatedAt]);

  const saveNotes = async (updated) => {
    try {
      await updateClient(client.id, {
        clientDetails: {
          ...details,
          notes: updated
        }
      });
      if (window.refreshAppData) {
        await window.refreshAppData();
      }
    } catch (err) {
      alert('Error saving notes: ' + err.message);
    }
  };

  const handleAdd = async () => {
    if (!newNoteText.trim()) return;
    const newNote = {
      id: uid(),
      text: newNoteText.trim(),
      createdAt: new Date().toISOString(),
      author: 'Nitesh Luthra'
    };
    const updated = [newNote, ...notesList];
    await saveNotes(updated);
    setNewNoteText('');
    setIsAdding(false);
  };

  const handleUpdate = async (id) => {
    if (!editingNoteText.trim()) return;
    const updated = notesList.map(n => 
      n.id === id ? { ...n, text: editingNoteText.trim(), updatedAt: new Date().toISOString() } : n
    );
    await saveNotes(updated);
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    const updated = notesList.filter(n => n.id !== id);
    await saveNotes(updated);
  };

  const startEdit = (note) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.text);
  };

  return (
    <div className="space-y-4">
      {/* Editor triggers and input */}
      {!isViewer && (
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {notesList.length} {notesList.length === 1 ? 'Note' : 'Notes'} recorded
          </span>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className={btnSecondary + ' py-1.5 px-3 text-[11px]'}
            >
              <Plus size={12} /> New Note
            </button>
          )}
        </div>
      )}

      {isAdding && (
        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-inner">
          <textarea
            rows={3}
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Type your notes here... (e.g. Discussed new asset allocation strategy, client requested term insurance review)"
            className={inputCls + ' text-xs resize-y'}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setIsAdding(false); setNewNoteText(''); }}
              className={btnGhost + ' py-1 px-2.5 text-[10px]'}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newNoteText.trim()}
              className={btnPrimary + ' py-1 px-3 text-[10px]'}
            >
              <Send size={10} /> Save Note
            </button>
          </div>
        </div>
      )}

      {/* Notes timeline feed */}
      {notesList.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <MessageSquare className="mx-auto text-slate-400 dark:text-slate-600 mb-2" size={24} />
          <p className="text-xs font-semibold text-slate-450 dark:text-slate-500 italic">No notes recorded yet</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800/80">
          {notesList.map((note) => {
            const isEditing = editingNoteId === note.id;
            return (
              <div key={note.id} className="relative group">
                {/* Timeline circle */}
                <span className="absolute -left-[20px] top-1.5 w-3.5 h-3.5 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-500 dark:border-blue-400 shadow-sm z-10" />

                {isEditing ? (
                  <div className="p-3.5 bg-white dark:bg-slate-950 border border-blue-200 dark:border-blue-800/80 rounded-xl space-y-2.5 shadow-md">
                    <textarea
                      rows={3}
                      value={editingNoteText}
                      onChange={(e) => setEditingNoteText(e.target.value)}
                      className={inputCls + ' text-xs resize-y'}
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className={btnGhost + ' py-1 px-2 text-[10px]'}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdate(note.id)}
                        disabled={!editingNoteText.trim()}
                        className={btnPrimary + ' py-1 px-2.5 text-[10px]'}
                      >
                        <Check size={11} /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50/60 dark:bg-slate-955/20 hover:bg-white dark:hover:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/80 rounded-xl transition-all duration-300 shadow-xs hover:shadow-md">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={note.author || 'Nitesh Luthra'} size="sm" />
                        <div>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            {note.author || 'Nitesh Luthra'}
                          </span>
                          <span className="text-[10px] text-slate-450 dark:text-slate-500 ml-2 font-medium">
                            {new Date(note.createdAt).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {note.updatedAt && ' (edited)'}
                          </span>
                        </div>
                      </div>
                      {!isViewer && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(note)}
                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            title="Edit note"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-455 rounded-lg hover:bg-rose-50/50 dark:hover:bg-rose-955/20 transition-all"
                            title="Delete note"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                      {note.text}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OpenTasksBox({ tasks, onSelectTask, emptyText }) {
  if (!tasks || tasks.length === 0) {
    return <p className="text-xs text-slate-450 dark:text-slate-500 italic font-medium">{emptyText}</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          onClick={() => onSelectTask && onSelectTask(task)}
          className="p-2.5 bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 rounded-xl flex items-center justify-between gap-2 shadow-xs cursor-pointer transition-all duration-300 hover:border-indigo-300 hover:shadow-md hover:bg-blue-50/5 dark:hover:bg-slate-800/40"
        >
          <div className="min-w-0 flex-1">
            <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 block truncate" title={task.taskName}>{task.taskName}</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 block truncate">
              {task.assignedTo ? `To: ${task.assignedTo}` : 'Unassigned'}
              {task.dueDate && ` • Due: ${new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
            </span>
          </div>
          <span className={`inline-flex px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md ring-1 shrink-0 ${
            task.stage === 'Open' ? 'bg-blue-50 text-blue-700 ring-blue-200/40 dark:bg-blue-950/20 dark:text-blue-400 dark:ring-blue-900/40' :
            task.stage === 'In Process' ? 'bg-amber-50 text-amber-700 ring-amber-200/40 dark:bg-amber-950/20 dark:text-amber-400 dark:ring-amber-900/40' :
            task.stage === 'Waiting For Client' ? 'bg-violet-50 text-violet-700 ring-violet-200/40 dark:bg-violet-950/20 dark:text-violet-400 dark:ring-violet-900/40' :
            task.stage === 'Completed' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-900/40' :
            task.stage === 'Lost' ? 'bg-rose-50 text-rose-700 ring-rose-200/60 dark:bg-rose-950/20 dark:text-rose-400 dark:ring-rose-900/40' :
            'bg-slate-50 text-slate-700 ring-slate-200/40 dark:bg-slate-955/20 dark:text-slate-450 dark:ring-slate-900/40'
          }`}>
            {task.stage}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProspectsBox({ prospects, onSelectProspect, emptyText }) {
  if (!prospects || prospects.length === 0) {
    return <p className="text-xs text-slate-450 dark:text-slate-500 italic font-medium">{emptyText}</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {prospects.map((p) => (
        <div
          key={p.id}
          onClick={() => onSelectProspect && onSelectProspect(p)}
          className="p-2.5 bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 rounded-xl flex items-center justify-between gap-2 shadow-xs cursor-pointer transition-all duration-300 hover:border-indigo-300 hover:shadow-md hover:bg-blue-50/5 dark:hover:bg-slate-800/40"
        >
          <div className="min-w-0 flex-1">
            <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 block truncate" title={p.proposalType}>{p.proposalType}</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 block truncate">
              {fmtAmountINR(p.amount)}
              <span className={`ml-1.5 inline-flex px-1 py-0.5 rounded ${CATEGORY_THEME[p.proposalCategory] || CATEGORY_THEME.investment}`}>{p.proposalCategory}</span>
            </span>
            {(p.proposalType === 'Proposed SIP Changes' || p.proposalType === 'sipchanges') && (p.sipRejected || p.sipContinue) && (
              <div className="flex flex-wrap items-center gap-1 mt-1 text-[8px] font-bold uppercase tracking-wider">
                {p.sipRejected && (
                  <span className="px-1 py-0.5 rounded bg-rose-50 text-rose-700 ring-1 ring-rose-200/60 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-900/40">
                    Rejected: {fmtAmountINR(p.sipRejected)}
                  </span>
                )}
                {p.sipContinue && (
                  <span className="px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900/40">
                    Continue: {fmtAmountINR(p.sipContinue)}
                  </span>
                )}
              </div>
            )}
          </div>
          <span className={`inline-flex px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md ring-1 shrink-0 ${PROSPECT_STAGE_THEME[p.stage || 'Qualified']}`}>
            {p.stage || 'Qualified'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview modal — renders the document content and supports print / Save PDF.
// ---------------------------------------------------------------------------
const TYPE_META = {
  custom: { label: 'Uploaded Document', icon: FolderOpen, badge: 'bg-slate-50 text-slate-700 ring-slate-200/60 dark:bg-slate-950/30 dark:text-slate-400 dark:ring-slate-900/40', chip: 'from-blue-500 to-indigo-600' },
  mom: { label: 'Minutes of Meeting', icon: FileText, badge: 'bg-blue-50 text-blue-700 ring-blue-200/60 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-900/40', chip: 'from-blue-500 to-indigo-600' },
  goal: { label: 'Goal Report', icon: Target, badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900/40', chip: 'from-emerald-500 to-teal-600' },
  asset: { label: 'Asset Allocation Report', icon: Wallet, badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200/60 dark:bg-indigo-950/30 dark:text-indigo-400 dark:ring-indigo-900/40', chip: 'from-indigo-500 to-purple-600' },
  policy: { label: 'Policy Review Report', icon: Shield, badge: 'bg-amber-50 text-amber-700 ring-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-900/40', chip: 'from-amber-500 to-orange-600' },
  portfolio: { label: 'Portfolio Review Report', icon: FileBarChart, badge: 'bg-rose-50 text-rose-700 ring-rose-200/60 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-900/40', chip: 'from-rose-500 to-pink-600' },
};

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
          <h4 className="font-bold text-slate-800 dark:text-slate-200 font-sans">No Online Preview Available</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">This is a legacy reference file. No file content is stored in local database.</p>
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
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 font-sans">{file.name || file.fileName}</h4>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5 font-sans">Uploaded by {file.uploadedBy || 'Nitesh Luthra'} {file.date ? `· ${new Date(file.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</p>
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
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-955 flex items-center justify-center min-h-[300px] max-h-[500px]">
        {isImage ? (
          <img src={dataUrl} alt={file.name} className="max-w-full max-h-[500px] object-contain shadow-sm" />
        ) : isPdf ? (
          <iframe src={dataUrl} title={file.name} className="w-full h-[500px] border-0" />
        ) : (
          <div className="text-center p-8 space-y-3">
            <FolderOpen size={40} className="mx-auto text-slate-400 dark:text-slate-655" />
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-350 font-sans">Preview not supported for this file type</p>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 font-sans">Download the file to view its full contents on your device.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
          <p className="text-xs text-slate-750 dark:text-slate-350 italic whitespace-pre-wrap leading-relaxed">
            {assetAllocation.remark}
          </p>
        </DocSection>
      )}
    </div>
  );
}

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
