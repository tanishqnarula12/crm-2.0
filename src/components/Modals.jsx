import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, CheckCircle2, Upload, AlertCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Field, inputCls, selectCls, btnPrimary, btnGhost } from './UI';
import { 
  calcGoal, monthsBetween, monthLabel, fmtFull, fmtINR, fmtSip, nv, parseNum, GOAL_PRESETS, CURRENT_MONTH, CURRENT_YEAR, MONTH_NAMES 
} from '../utils/calc';

function Modal({ title, onClose, children, footer, maxWidth = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in" onClick={onClose}>
      <div className={`bg-white rounded-2xl w-full ${maxWidth} shadow-2xl my-8 border border-slate-200/50 animate-scale-up`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
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

export function ClientFormModal({ initial, onClose, onSave }) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial ? initial.name : '');
  const [pan, setPan] = useState(initial ? initial.pan : '');
  const [age, setAge] = useState(initial ? initial.age : '');
  const panValid = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);

  return (
    <Modal
      title={isEdit ? "Edit Client Details" : "Add New Client"}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={btnGhost}>Cancel</button>
          <button 
            onClick={() => name.trim() && panValid && onSave(name, pan, age)} 
            disabled={!name.trim() || !panValid} 
            className={btnPrimary}
          >
            {isEdit ? "Save Changes" : "Save Client"}
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
            className={inputCls + ' font-mono tracking-widest uppercase'}
          />
        </Field>
        <Field label="Age">
          <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className={inputCls} placeholder="e.g. 35" />
        </Field>
      </div>
    </Modal>
  );
}

export function GoalFormModal({ initial, onClose, onSave }) {
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
      title={isEdit ? 'Edit Goal' : 'Add Goal'}
      onClose={onClose}
      maxWidth="max-w-3xl"
      footer={
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          {isEdit && (
            <p className="text-xs text-slate-400">
              Started in {monthLabel(initial.createdMonth || CURRENT_MONTH, initial.createdYear || CURRENT_YEAR)} — projections remain anchored
            </p>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={onClose} className={btnGhost}>Cancel</button>
            <button onClick={handleSave} disabled={!effectiveName || targetBeforeStart || !form.amount} className={btnPrimary}>
              {isEdit ? 'Save Changes' : 'Save Goal'}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Goal name">
          <select value={nameChoice} onChange={(e) => setNameChoice(e.target.value)} className={selectCls}>
            <option value="" disabled>Select a goal preset…</option>
            {GOAL_PRESETS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          {nameChoice === 'Others' && (
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter custom goal name"
              className={inputCls + ' mt-2'}
            />
          )}
        </Field>
        <Field label="Goal amount (in today's values)">
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

        <Field label="Future goal value (inflation-adjusted)">
          <div className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-bold tabular-nums">{fmtFull(previewCalc.futureValue)}</div>
        </Field>
        <Field label="Time to goal">
          <div className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700">
            {targetBeforeStart ? <span className="text-rose-600 font-bold">Target must be in future</span> : <span className="tabular-nums font-semibold">{previewCalc.months} months ({previewCalc.years.toFixed(2)} yrs)</span>}
          </div>
        </Field>

        <Field label="Inflation rate (%)">
          <input type="number" step="0.1" value={nv(form.inflation)} onChange={(e) => upd('inflation', parseNum(e))} className={inputCls} />
        </Field>
        <Field label="Expected return (%)">
          <input type="number" step="0.1" value={nv(form.expectedReturn)} onChange={(e) => upd('expectedReturn', parseNum(e))} className={inputCls} />
        </Field>
        <Field label="SIP step-up rate (annual % increase)">
          <input type="number" step="0.1" value={nv(form.sipIncRate)} onChange={(e) => upd('sipIncRate', parseNum(e))} className={inputCls} />
        </Field>
        <Field label="Current accumulated corpus (if any)">
          <input type="number" value={nv(form.currentInv)} onChange={(e) => upd('currentInv', parseNum(e, 0))} className={inputCls} placeholder="₹" />
        </Field>
        <div className="md:col-span-2">
          <Field label="Current monthly SIP (if any)">
            <input type="number" value={nv(form.currentSip)} onChange={(e) => upd('currentSip', parseNum(e, 0))} className={inputCls} placeholder="₹" />
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 p-4 bg-gradient-to-br from-blue-50/50 to-sky-50/50 ring-1 ring-blue-100 rounded-xl">
        <PreviewTile label="Total SIP needed" value={fmtSip(previewCalc.sipRequired) + '/mo'} />
        <PreviewTile label="Additional SIP" value={previewCalc.sipOnTrack ? null : (fmtSip(previewCalc.additionalSip) + '/mo')} pill={previewCalc.sipOnTrack ? 'On track' : null} />
        <PreviewTile label="Lump-sum required" value={fmtINR(previewCalc.lumpSumRequired)} />
        <PreviewTile label="Achievement" value={previewCalc.achievementPct.toFixed(1) + '%'} />
      </div>
    </Modal>
  );
}

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

function findCol(header, ...candidates) {
  const h = header.toLowerCase().replace(/[\s.]/g, '');
  for (const c of candidates) if (h === c) return true;
  return false;
}

export function ExcelImportModal({ onClose, onImport }) {
  const fileRef = useRef();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setRows(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!data.length) { setError('The sheet appears to be empty.'); return; }

        const headers = Object.keys(data[0]);
        const nameKey = headers.find(h => findCol(h, 'name', 'clientname', 'fullname'));
        const panKey  = headers.find(h => findCol(h, 'pan', 'panno', 'pannumber', 'pancard'));

        if (!nameKey) { setError('Could not find a "Name" column in the sheet.'); return; }
        if (!panKey)  { setError('Could not find a "PAN" column in the sheet.'); return; }

        const parsed = data
          .map((r, i) => ({
            rowNum: i + 2,
            name: String(r[nameKey] || '').trim(),
            pan: String(r[panKey] || '').toUpperCase().trim(),
          }))
          .filter(r => r.name || r.pan);

        if (!parsed.length) { setError('No data rows found after the header.'); return; }
        setRows(parsed);
      } catch {
        setError('Failed to read the file. Make sure it is a valid .xlsx or .xls file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validRows = rows ? rows.filter(r => r.name && PAN_RE.test(r.pan)) : [];

  const handleImport = async () => {
    setImporting(true);
    try {
      await onImport(validRows);
      onClose();
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      title="Import Clients from Excel"
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex justify-between items-center gap-2">
          <span className="text-xs text-slate-500">
            {rows ? `${validRows.length} of ${rows.length} rows valid` : 'Upload a .xlsx / .xls file'}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className={btnGhost}>Cancel</button>
            <button
              onClick={handleImport}
              disabled={!validRows.length || importing}
              className={btnPrimary}
            >
              {importing ? 'Importing…' : `Import ${validRows.length} client${validRows.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Drop zone */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 rounded-xl p-8 flex flex-col items-center gap-2 transition-colors text-slate-500 hover:text-blue-600"
        >
          <FileSpreadsheet size={32} />
          <span className="font-semibold text-sm">Click to upload Excel sheet</span>
          <span className="text-xs text-slate-400">Expects columns: Name, PAN — .xlsx or .xls</span>
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-200">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {rows && (
          <div className="overflow-auto max-h-64 rounded-lg border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">PAN</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const nameOk = !!r.name;
                  const panOk = PAN_RE.test(r.pan);
                  const ok = nameOk && panOk;
                  return (
                    <tr key={i} className={`border-t border-slate-100 ${ok ? '' : 'bg-rose-50/50'}`}>
                      <td className="px-3 py-1.5 text-slate-400">{r.rowNum}</td>
                      <td className={`px-3 py-1.5 font-medium ${nameOk ? 'text-slate-800' : 'text-rose-600'}`}>
                        {r.name || <em className="font-normal">empty</em>}
                      </td>
                      <td className={`px-3 py-1.5 font-mono tracking-wider ${panOk ? 'text-slate-800' : 'text-rose-600'}`}>
                        {r.pan || <em className="font-normal font-sans tracking-normal">empty</em>}
                      </td>
                      <td className="px-3 py-1.5">
                        {ok
                          ? <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold"><CheckCircle2 size={12} /> Valid</span>
                          : <span className="inline-flex items-center gap-1 text-rose-600 font-semibold"><AlertCircle size={12} /> {!nameOk ? 'Missing name' : 'Invalid PAN'}</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}

function PreviewTile({ label, value, pill }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">{label}</p>
      {pill ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50 rounded-full">
          <CheckCircle2 size={11} /> {pill}
        </span>
      ) : (
        <p className="text-sm font-bold text-slate-900 tabular-nums">{value}</p>
      )}
    </div>
  );
}
