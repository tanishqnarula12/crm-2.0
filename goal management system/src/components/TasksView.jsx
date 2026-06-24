import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus, X, Search, Trash2, ListChecks, MessageSquare, Send, Pencil, Check, ChevronDown, Crown
} from 'lucide-react';
import { Card, btnPrimary, btnSecondary, btnGhost, inputCls, selectCls, Field } from './UI';
import { TEAM_MEMBERS } from '../utils/team';
import {
  loadTasks, saveTasks, TASK_STAGES, STAGE_THEME, RELATED_OPTIONS, NFT_TYPES, AMC_LIST, fmtTaskStamp
} from '../utils/tasks';
import { uid } from '../utils/calc';

export default function TasksView({ clients = [], isViewer, activeTaskId, setActiveTaskId, onOpenTask, tasksChangeCounter }) {
  const [tasks, setTasks] = useState(() => loadTasks());
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  useEffect(() => {
    setTasks(loadTasks());
  }, [tasksChangeCounter]);

  useEffect(() => {
    if (activeTaskId) {
      const found = tasks.find(t => t.id === activeTaskId);
      if (found) {
        onOpenTask && onOpenTask(found);
      }
      if (setActiveTaskId) {
        setActiveTaskId(null);
      }
    }
  }, [activeTaskId, tasks, setActiveTaskId, onOpenTask]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks
      .filter(t => stageFilter === 'all' || t.stage === stageFilter)
      .filter(t => !q ||
        (t.taskName || '').toLowerCase().includes(q) ||
        (t.applicant || '').toLowerCase().includes(q) ||
        (t.groupLeader || '').toLowerCase().includes(q) ||
        (t.pan || '').toLowerCase().includes(q) ||
        (t.nftType || '').toLowerCase().includes(q) ||
        (t.assignedTo || '').toLowerCase().includes(q))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [tasks, query, stageFilter]);

  const counts = useMemo(() => {
    const c = { all: tasks.length };
    TASK_STAGES.forEach(s => { c[s] = tasks.filter(t => t.stage === s).length; });
    return c;
  }, [tasks]);

  const openCreate = () => { onOpenTask && onOpenTask(null); };
  const openEdit = (task) => { onOpenTask && onOpenTask(task); };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveTasks(updated);
      return updated;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ListChecks size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Tasks</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Track and assign work across the team</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks…" className={inputCls + ' pl-9 w-full md:w-56'} />
          </div>
          {!isViewer && (
            <button onClick={openCreate} className={btnPrimary + ' shrink-0'}>
              <Plus size={14} /> New Task
            </button>
          )}
        </div>
      </div>

      {/* Stage filter chips */}
      <div className="flex flex-wrap gap-2">
        <FilterChip label="All" count={counts.all} active={stageFilter === 'all'} onClick={() => setStageFilter('all')} />
        {TASK_STAGES.map(s => (
          <FilterChip key={s} label={s} count={counts[s]} active={stageFilter === s} onClick={() => setStageFilter(s)} />
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
          <ListChecks className="mx-auto text-slate-400 dark:text-slate-600 mb-4" size={36} />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">
            {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
          </p>
          {!isViewer && tasks.length === 0 && (
            <button onClick={openCreate} className={btnSecondary}><Plus size={14} /> Create the first task</button>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden border border-slate-200/60 dark:border-slate-800/80 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="text-left px-6 py-4 font-bold">Task</th>
                  <th className="text-left px-6 py-4 font-bold">Related To</th>
                  <th className="text-left px-6 py-4 font-bold">Applicant</th>
                  <th className="text-left px-6 py-4 font-bold">Assigned To</th>
                  <th className="text-left px-6 py-4 font-bold">Due</th>
                  <th className="text-center px-6 py-4 font-bold">Stage</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                {filtered.map(t => (
                  <tr key={t.id} onClick={() => openEdit(t)} className="hover:bg-blue-50/20 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{t.taskName || 'Untitled task'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700 dark:text-slate-300 font-medium">
                        {t.relatedTo === 'NFT' ? (t.nftType || 'NFT') : (t.otherSpecify || t.relatedTo || '—')}
                      </div>
                      {t.relatedTo === 'NFT' && Array.isArray(t.amcs) && t.amcs.length > 0 && (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[200px]">{t.amcs.join(', ')}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700 dark:text-slate-300 font-medium">{t.applicant || '—'}</div>
                      {t.pan && <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">{t.pan}</div>}
                      {t.groupLeader && (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                          <Crown size={10} className="text-amber-500" /> {t.groupLeader}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{t.assignedTo || '—'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 tabular-nums">{t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ring-1 ${STAGE_THEME[t.stage] || STAGE_THEME['Open']}`}>
                        {t.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isViewer && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-all opacity-0 group-hover:opacity-100"
                          title="Delete task"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}


    </div>
  );
}

function FilterChip({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
        active
          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      {label}
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 dark:bg-slate-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>{count}</span>
    </button>
  );
}

// Searchable Group Leader picker — combobox with a typeahead + dropdown that
// shows each client's PAN so the right group leader can be disambiguated.
function GroupLeaderSelect({ options, value, pan, onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filtered = options.filter(o => {
    const s = q.toLowerCase().trim();
    return !s || o.name.toLowerCase().includes(s) || (o.pan || '').toLowerCase().includes(s);
  });

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={selectCls + ' flex items-center justify-between text-left gap-2' + (disabled ? ' opacity-65 cursor-not-allowed bg-slate-50 dark:bg-slate-950/20' : '')}
      >
        <span className={`truncate ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>
          {value || 'Search & select group leader…'}
          {value && pan && <span className="ml-2 text-[10px] font-mono text-slate-400 dark:text-slate-500">{pan}</span>}
        </span>
        <ChevronDown size={15} className="text-slate-400 shrink-0" />
      </button>
      {open && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or PAN…" className={inputCls + ' pl-8 py-1.5 text-xs'} />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400 dark:text-slate-500 italic">No clients found.</div>
            ) : filtered.map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => { onSelect(o); setOpen(false); setQ(''); }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-colors ${value === o.name ? 'bg-blue-50/40 dark:bg-slate-800/40' : ''}`}
              >
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{o.name}</span>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0">{o.pan || '—'}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function TaskFormModal({ initial, clients, isViewer, onClose, onSave }) {
  const isEdit = !!initial;
  const [isEditingMode, setIsEditingMode] = useState(!isEdit);
  const [stage, setStage] = useState(initial?.stage || 'Open');
  const [groupLeaderId, setGroupLeaderId] = useState(initial?.groupLeaderId || '');
  const [groupLeader, setGroupLeader] = useState(initial?.groupLeader || '');
  const [pan, setPan] = useState(initial?.pan || '');
  const [applicant, setApplicant] = useState(initial?.applicant || '');
  const [relatedTo, setRelatedTo] = useState(initial?.relatedTo || '');
  const [nftType, setNftType] = useState(initial?.nftType || '');
  const [otherSpecify, setOtherSpecify] = useState(initial?.otherSpecify || '');
  const [amcs, setAmcs] = useState(Array.isArray(initial?.amcs) ? initial.amcs : []);
  const [assignedBy, setAssignedBy] = useState(initial?.assignedBy || '');
  const [assignedTo, setAssignedTo] = useState(initial?.assignedTo || '');
  const [subPerson, setSubPerson] = useState(initial?.subPerson || '');
  const [dueDate, setDueDate] = useState(initial?.dueDate || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [comments, setComments] = useState(Array.isArray(initial?.comments) ? initial.comments : []);
  const [newComment, setNewComment] = useState('');

  // Group Leaders = the clients themselves (entered as "Self"). The superset.
  const groupLeaders = useMemo(
    () => clients.map(c => ({ id: c.id, name: c.name, pan: c.pan })),
    [clients]
  );

  // The selected group leader's client record (resolve by id, fall back to name)
  const selectedClient = useMemo(
    () => clients.find(c => c.id === groupLeaderId) || clients.find(c => c.name === groupLeader) || null,
    [clients, groupLeaderId, groupLeader]
  );

  // Applicants = the subset: the client (Self) + all their family members.
  const applicantOptions = useMemo(() => {
    if (!selectedClient) return [];
    const opts = [{ name: selectedClient.name, relation: 'Self', pan: selectedClient.pan || '' }];
    (selectedClient.clientDetails?.familyDetails || []).forEach(f => {
      if (f.name) opts.push({ name: f.name, relation: f.relation || 'Member', pan: f.pan || '' });
    });
    return opts;
  }, [selectedClient]);

  // Auto-derive the task name: "<Applicant> - <Related module>"
  const relatedLabel = relatedTo === 'NFT' ? nftType : (relatedTo === 'Others' ? otherSpecify.trim() : '');
  const taskName = applicant && relatedLabel ? `${applicant} - ${relatedLabel}` : '';

  const handleGroupLeader = (gl) => {
    setGroupLeaderId(gl.id);
    setGroupLeader(gl.name);
    // Reset applicant/PAN — default the applicant to the group leader (Self)
    setApplicant(gl.name);
    setPan(gl.pan || '');
  };

  const handleApplicant = (name) => {
    setApplicant(name);
    const opt = applicantOptions.find(o => o.name === name);
    setPan(opt ? opt.pan : '');
  };

  const handleRelatedTo = (val) => {
    setRelatedTo(val);
    if (val !== 'NFT') { setNftType(''); setAmcs([]); }
    if (val !== 'Others') setOtherSpecify('');
  };

  const toggleAmc = (amc) => {
    setAmcs(prev => prev.includes(amc) ? prev.filter(a => a !== amc) : [...prev, amc]);
  };

  const addComment = () => {
    const text = newComment.trim();
    if (!text) return;

    let newCommentsList = [...comments];

    // Check if the stage has changed and we haven't logged the stage change in comments yet
    const hasStageChanged = isEdit && stage !== (initial?.stage || 'Open');
    const alreadyLoggedStageChange = comments.some(c => c.text === `Stage changed from ${initial?.stage || 'Open'} to ${stage}`);

    if (hasStageChanged && !alreadyLoggedStageChange) {
      newCommentsList.push({
        at: new Date().toISOString(),
        text: `Stage changed from ${initial?.stage || 'Open'} to ${stage}`
      });
    }

    // Add user's comment
    newCommentsList.push({
      at: new Date().toISOString(),
      text
    });

    setComments(newCommentsList);
    setNewComment('');

    if (!isEditingMode) {
      const task = {
        id: initial?.id || uid(),
        taskName,
        stage: isEdit ? stage : 'Open',
        groupLeader,
        groupLeaderId,
        pan,
        applicant,
        relatedTo,
        nftType: relatedTo === 'NFT' ? nftType : '',
        otherSpecify: relatedTo === 'Others' ? otherSpecify.trim() : '',
        amcs: relatedTo === 'NFT' ? amcs : [],
        assignedBy,
        assignedTo,
        subPerson,
        dueDate,
        description,
        comments: newCommentsList,
        createdAt: initial?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onSave(task);
    }
  };

  const handleCancel = () => {
    if (isEdit) {
      // Revert edits to initial
      setStage(initial?.stage || 'Open');
      setGroupLeaderId(initial?.groupLeaderId || '');
      setGroupLeader(initial?.groupLeader || '');
      setPan(initial?.pan || '');
      setApplicant(initial?.applicant || '');
      setRelatedTo(initial?.relatedTo || '');
      setNftType(initial?.nftType || '');
      setOtherSpecify(initial?.otherSpecify || '');
      setAmcs(Array.isArray(initial?.amcs) ? initial.amcs : []);
      setAssignedBy(initial?.assignedBy || '');
      setAssignedTo(initial?.assignedTo || '');
      setSubPerson(initial?.subPerson || '');
      setDueDate(initial?.dueDate || '');
      setDescription(initial?.description || '');
      setComments(Array.isArray(initial?.comments) ? initial.comments : []);
      setIsEditingMode(false);
    } else {
      onClose();
    }
  };

  const hasStageChanged = isEdit && stage !== (initial?.stage || 'Open');
  const newCommentsCount = comments.length - (initial?.comments?.length || 0);
  const logEntryCompulsory = hasStageChanged && newCommentsCount <= 0;

  const canSave = !isViewer && groupLeader && applicant && relatedTo && relatedLabel;

  const handleSubmit = () => {
    if (logEntryCompulsory) {
      alert("A comment/log entry is compulsory when changing the task stage. Please add a log entry explaining the change.");
      return;
    }
    if (!canSave) return;
    const task = {
      id: initial?.id || uid(),
      taskName,
      stage: isEdit ? stage : 'Open', // Stage is fixed Open on creation
      groupLeader,
      groupLeaderId,
      pan,
      applicant,
      relatedTo,
      nftType: relatedTo === 'NFT' ? nftType : '',
      otherSpecify: relatedTo === 'Others' ? otherSpecify.trim() : '',
      amcs: relatedTo === 'NFT' ? amcs : [],
      assignedBy,
      assignedTo,
      subPerson,
      dueDate,
      description,
      comments,
      createdAt: initial?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(task);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl shadow-2xl my-8 border border-slate-200/50 dark:border-slate-800/80 animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              {isEditingMode ? (isEdit ? <Pencil size={15} /> : <Plus size={16} />) : <ListChecks size={15} />}
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {isEditingMode ? (isEdit ? 'Edit Task' : 'New Task') : 'Task Details'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Auto-generated Task Name */}
          <div className="md:col-span-2">
            <Field label="Task Name" hint="Auto-generated from Applicant + Related module">
              <div className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 font-semibold text-slate-800 dark:text-slate-200">
                {taskName || <span className="text-slate-400 dark:text-slate-600 font-normal italic">Select applicant &amp; related module…</span>}
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Group Leader *" hint="The client (entered as Self) — the family/group head">
              <GroupLeaderSelect options={groupLeaders} value={groupLeader} pan={selectedClient?.pan} onSelect={handleGroupLeader} disabled={!isEditingMode} />
            </Field>
            <Field label="Applicant *" hint="A member of the selected group">
              <select value={applicant} onChange={(e) => handleApplicant(e.target.value)} disabled={!selectedClient || !isEditingMode} className={selectCls + (!selectedClient || !isEditingMode ? ' opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-950/20' : '')}>
                <option value="">{selectedClient ? 'Select applicant…' : 'Select a group leader first'}</option>
                {applicantOptions.map(o => <option key={o.name} value={o.name}>{o.name} — {o.relation}</option>)}
                {applicant && !applicantOptions.some(o => o.name === applicant) && <option value={applicant}>{applicant}</option>}
              </select>
            </Field>
            <Field label="PAN" hint="Auto-fetched from applicant">
              <input value={pan} readOnly placeholder="Auto" className={inputCls + ' font-mono tracking-widest uppercase bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400'} />
            </Field>

            {isEdit ? (
              <Field label="Stage">
                <select value={stage} onChange={(e) => setStage(e.target.value)} className={selectCls}>
                  {TASK_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            ) : (
              <Field label="Stage" hint="New tasks always start as Open">
                <div className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950">
                  <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ring-1 ${STAGE_THEME['Open']}`}>Open</span>
                </div>
              </Field>
            )}

            {/* Related to */}
            <Field label="Related To *">
              <select value={relatedTo} onChange={(e) => handleRelatedTo(e.target.value)} disabled={!isEditingMode} className={selectCls + (!isEditingMode ? ' opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-955/20' : '')}>
                <option value="">Select…</option>
                {RELATED_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            {relatedTo === 'NFT' && (
              <Field label="NFT Type *">
                <select value={nftType} onChange={(e) => setNftType(e.target.value)} disabled={!isEditingMode} className={selectCls + (!isEditingMode ? ' opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-950/20' : '')}>
                  <option value="">Select NFT type…</option>
                  {NFT_TYPES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
            )}
            {relatedTo === 'Others' && (
              <Field label="Please Specify *">
                <input value={otherSpecify} onChange={(e) => setOtherSpecify(e.target.value)} disabled={!isEditingMode} placeholder="Specify the request…" className={inputCls + (!isEditingMode ? ' bg-slate-50 dark:bg-slate-950/20 cursor-not-allowed text-slate-500' : '')} />
              </Field>
            )}

            {/* AMC multi-select (only for NFT) */}
            {relatedTo === 'NFT' && (
              <div className="md:col-span-2">
                <Field label={`Select AMC ${amcs.length ? `(${amcs.length} selected)` : '(multi-select)'}`}>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                    {AMC_LIST.map(amc => {
                      const on = amcs.includes(amc);
                      return (
                        <button
                          key={amc}
                          type="button"
                          disabled={!isEditingMode}
                          onClick={() => toggleAmc(amc)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            on
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-blue-400'
                          } ${!isEditingMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          {on && <Check size={11} />} {amc}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            )}

            <Field label="Created Date & Time" hint="Set automatically">
              <div className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 tabular-nums">
                {initial?.createdAt ? fmtTaskStamp(initial.createdAt) : 'On save'}
              </div>
            </Field>
            <Field label="Due Date">
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={!isEditingMode} className={inputCls + (!isEditingMode ? ' bg-slate-50 dark:bg-slate-950/20 cursor-not-allowed text-slate-500' : '')} />
            </Field>

            <Field label="Assigned By">
              <select value={assignedBy} onChange={(e) => setAssignedBy(e.target.value)} disabled={!isEditingMode} className={selectCls + (!isEditingMode ? ' opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-950/20' : '')}>
                <option value="">Select…</option>
                {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Assigned To">
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} disabled={!isEditingMode} className={selectCls + (!isEditingMode ? ' opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-950/20' : '')}>
                <option value="">Select…</option>
                {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Sub Person">
              <select value={subPerson} onChange={(e) => setSubPerson(e.target.value)} disabled={!isEditingMode} className={selectCls + (!isEditingMode ? ' opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-950/20' : '')}>
                <option value="">Select…</option>
                {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>

            <div className="md:col-span-2">
              <Field label="Description">
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={!isEditingMode} rows={3} placeholder="Details of the task…" className={inputCls + ' resize-y' + (!isEditingMode ? ' bg-slate-50 dark:bg-slate-950/20 cursor-not-allowed text-slate-500' : '')} />
              </Field>
            </div>
          </div>

          {/* Comments / Logs */}
          {isEdit && (
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare size={14} /> Comments &amp; Logs
              </h4>
              {comments.length > 0 ? (
                <ol className="space-y-3 max-h-48 overflow-y-auto pl-3 pr-1">
                  {comments.map((c, i) => (
                    <li key={i} className="relative pl-5 border-l-2 border-slate-200 dark:border-slate-800">
                      <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-900" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                        {fmtTaskStamp(c.at)}
                        {c.by && <span className="text-blue-500 dark:text-blue-400 font-semibold ml-1.5">• {c.by}</span>}
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words break-all leading-relaxed">{c.text}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">No comments yet.</p>
              )}
              {!isViewer && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addComment(); } }}
                    placeholder="Add a comment / log entry…"
                    className={inputCls + ' flex-1'}
                  />
                  <button onClick={addComment} className={btnSecondary + ' shrink-0'} type="button">
                    <Send size={14} /> Add
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-b-2xl flex justify-end items-center gap-2">
          {logEntryCompulsory && (
            <span className="text-xs text-rose-500 font-semibold mr-auto">
              * Log entry required for stage change
            </span>
          )}
          {isEditingMode || hasStageChanged ? (
            <>
              <button onClick={handleCancel} className={btnGhost}>Cancel</button>
              <button onClick={handleSubmit} disabled={!canSave} className={btnPrimary}>
                {isEdit ? 'Save Changes' : 'Create Task'}
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} className={btnGhost}>Close</button>
              {!isViewer && (
                <button onClick={() => setIsEditingMode(true)} className={btnPrimary}>
                  Edit Task
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
