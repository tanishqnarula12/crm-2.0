import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, CheckCircle2, Upload, AlertCircle, FileSpreadsheet, ChevronDown, Lock, UserCog } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Field, inputCls, selectCls, btnPrimary, btnGhost } from './UI';
import {
  calcGoal, monthsBetween, fmtFull, fmtINR, fmtSip, nv, parseNum, GOAL_PRESETS, CURRENT_MONTH, CURRENT_YEAR, MONTH_NAMES, needsKidName
} from '../utils/calc';
import { TEAM_MEMBERS, FIXED_ROLES } from '../utils/team';

// Relationship options for family / applicant details
const RELATIONS = [
  'Self', 'Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister',
  'Grandfather', 'Grandmother', 'Grandson', 'Granddaughter',
  'Father-in-law', 'Mother-in-law', 'Son-in-law', 'Daughter-in-law',
  'Nephew', 'Niece', 'Uncle', 'Aunt', 'Cousin',
  'Legal Guardian', 'Relative', 'Friend', 'Business Partner',
  'Employee', 'Employer', 'Trustee',
];

// Profession options for personal details
const PROFESSIONS = [
  'Salaried – Private Sector', 'Salaried – Government Sector', 'Business',
  'Self-Employed', 'Professional', 'Agriculturist / Farmer', 'Retired',
  'Homemaker', 'Student', 'Defence Personnel', 'NRI', 'Other',
];

// Client Type options
const CLIENT_TYPES = [
  'Retail', 'HNI', 'Ultra HNI',
];

function Modal({ title, onClose, children, footer, maxWidth = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in" onClick={onClose}>
      <div className={`bg-white dark:bg-slate-900 rounded-2xl w-full ${maxWidth} shadow-2xl my-8 border border-slate-200/50 dark:border-slate-800/80 animate-scale-up`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}

export function ClientFormModal({ initial, onClose, onSave }) {
  const isEdit = !!initial;
  const [activeTab, setActiveTab] = useState('personal');

  // Load initial values safely
  const initialDetails = initial?.clientDetails || {};

  // 1. Personal Details State
  const [name, setName] = useState(initial ? initial.name : '');
  const [pan, setPan] = useState(initial ? initial.pan : '');
  const [age, setAge] = useState(initial ? (initial.age || '') : '');
  const [mobile, setMobile] = useState(initialDetails.mobile || '');
  const [email, setEmail] = useState(initialDetails.email || '');
  const [address1, setAddress1] = useState(initialDetails.address1 || '');
  const [address2, setAddress2] = useState(initialDetails.address2 || '');
  const [address3, setAddress3] = useState(initialDetails.address3 || '');
  const [city, setCity] = useState(initialDetails.city || '');
  const [stateName, setStateName] = useState(initialDetails.state || '');
  const [pinCode, setPinCode] = useState(initialDetails.pinCode || '');
  const [status, setStatus] = useState(initialDetails.status || 'Active');

  // 2. Internal Details State — editable manager assignments (dropdowns)
  const [relationshipManager, setRelationshipManager] = useState(initialDetails.relationshipManager || '');
  const [portfolioManager, setPortfolioManager] = useState(initialDetails.portfolioManager || '');
  const [insuranceManager, setInsuranceManager] = useState(initialDetails.insuranceManager || '');
  const [serviceManager, setServiceManager] = useState(initialDetails.serviceManager || '');

  // 3. Family Details State (Tabular applicants name & relation & PAN)
  const [familyDetails, setFamilyDetails] = useState(
    Array.isArray(initialDetails.familyDetails) ? initialDetails.familyDetails : []
  );

  // 4. Business Details State (Mutual Funds, Insurance - Term, Medical, Accidental)
  const [mutualFunds, setMutualFunds] = useState(initialDetails.mutualFunds || 'No');
  const [insuranceTerm, setInsuranceTerm] = useState(initialDetails.insuranceTerm || 'No');
  const [insuranceMedical, setInsuranceMedical] = useState(initialDetails.insuranceMedical || 'No');
  const [insuranceAccidental, setInsuranceAccidental] = useState(initialDetails.insuranceAccidental || 'No');

  // 5. Profession (with free-text fallback when "Other" is selected)
  const [profession, setProfession] = useState(initialDetails.profession || '');
  const [professionOther, setProfessionOther] = useState(initialDetails.professionOther || '');

  // 6. Client Type & DOB (for primary applicant)
  const [clientType, setClientType] = useState(initialDetails.clientType || '');
  const [dob, setDob] = useState(initialDetails.dob || '');

  const panValid = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);

  const handleAddFamilyMember = () => {
    setFamilyDetails([...familyDetails, { name: '', relation: '', pan: '', dob: '' }]);
  };

  const handleRemoveFamilyMember = (idx) => {
    setFamilyDetails(familyDetails.filter((_, i) => i !== idx));
  };

  const handleFamilyMemberChange = (idx, field, val) => {
    const updated = familyDetails.map((m, i) => i === idx ? { ...m, [field]: val } : m);
    setFamilyDetails(updated);
  };

  const handleSave = () => {
    if (!name.trim() || !panValid) return;
    const clientDetails = {
      mobile,
      email,
      clientType,
      dob,
      address1,
      address2,
      address3,
      city,
      state: stateName,
      pinCode,
      profession,
      professionOther: profession === 'Other' ? professionOther : '',
      relationshipManager,
      portfolioManager,
      insuranceManager,
      serviceManager,
      familyDetails: familyDetails.filter(f => f.name.trim()),
      mutualFunds,
      insuranceTerm,
      insuranceMedical,
      insuranceAccidental,
      status,
      // Preserve any previously-saved CRM data (editor removed from this form)
      openActivities: initialDetails.openActivities || [],
      closedActivities: initialDetails.closedActivities || [],
      meetingHistory: initialDetails.meetingHistory || [],
      businessProspects: initialDetails.businessProspects || [],
      attachments: initialDetails.attachments || [],
      notes: initialDetails.notes || '',
    };
    onSave(name, pan, Number(age) || 0, clientDetails);
  };

  const tabClass = (tab) => `
    flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer
    ${activeTab === tab 
      ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold' 
      : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:border-slate-300'}
  `;

  return (
    <Modal
      title={isEdit ? "Edit Client Profile" : "Create Client Profile"}
      onClose={onClose}
      maxWidth="max-w-3xl"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={btnGhost}>Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={!name.trim() || !panValid} 
            className={btnPrimary}
          >
            {isEdit ? "Save Changes" : "Create Client"}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button type="button" onClick={() => setActiveTab('personal')} className={tabClass('personal')}>Personal Details</button>
          <button type="button" onClick={() => setActiveTab('internal')} className={tabClass('internal')}>Internal Details</button>
          <button type="button" onClick={() => setActiveTab('familyBusiness')} className={tabClass('familyBusiness')}>Family & Business</button>
        </div>

        {/* Tab 1: Personal Details */}
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            <Field label="Full Name *">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Aarav Sharma" />
            </Field>
            <Field label="Age">
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className={inputCls} placeholder="e.g. 35" />
            </Field>
            <Field label="Date of Birth">
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputCls} />
            </Field>
            <Field label="PAN Card Number *" hint={pan && !panValid ? 'Format must be: 5 letters, 4 digits, 1 letter' : null}>
              <input
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))}
                placeholder="e.g. ABCDE1234F"
                maxLength={10}
                className={inputCls + ' font-mono tracking-widest uppercase'}
              />
            </Field>
            <Field label="Mobile Number">
              <input value={mobile} onChange={(e) => setMobile(e.target.value)} className={inputCls} placeholder="e.g. +91 98765 43210" />
            </Field>
            <Field label="Email Address">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="e.g. aarav@example.com" />
            </Field>
            <Field label="Client Type">
              <div className="relative">
                <select value={clientType} onChange={(e) => setClientType(e.target.value)} className={selectCls}>
                  <option value="">Select client type…</option>
                  {CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </Field>
            <Field label="Client Status">
              <div className="relative">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
                  <option value="Active">Active</option>
                  <option value="Dead">Dead</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </Field>
            <Field label="Profession">
              <div className="relative">
                <select value={profession} onChange={(e) => setProfession(e.target.value)} className={selectCls}>
                  <option value="">Select profession…</option>
                  {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {profession === 'Other' && (
                <input
                  value={professionOther}
                  onChange={(e) => setProfessionOther(e.target.value)}
                  placeholder="Please specify profession"
                  className={inputCls + ' mt-2 animate-fade-in'}
                />
              )}
            </Field>
            <Field label="Address Line 1">
              <input value={address1} onChange={(e) => setAddress1(e.target.value)} className={inputCls} placeholder="Flat/House No, Building Name" />
            </Field>
            <Field label="Address Line 2">
              <input value={address2} onChange={(e) => setAddress2(e.target.value)} className={inputCls} placeholder="Street, Area, Locality" />
            </Field>
            <Field label="Address Line 3">
              <input value={address3} onChange={(e) => setAddress3(e.target.value)} className={inputCls} placeholder="Landmark (Optional)" />
            </Field>
            <Field label="City">
              <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} placeholder="e.g. Mumbai" />
            </Field>
            <Field label="State">
              <input value={stateName} onChange={(e) => setStateName(e.target.value)} className={inputCls} placeholder="e.g. Maharashtra" />
            </Field>
            <Field label="Pin Code">
              <input value={pinCode} onChange={(e) => setPinCode(e.target.value)} className={inputCls} placeholder="e.g. 400001" />
            </Field>
          </div>
        )}

        {/* Tab 2: Internal Details */}
        {activeTab === 'internal' && (
          <div className="space-y-6 animate-fade-in">
            {/* Editable manager assignments */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pl-2 border-l-2 border-blue-500">
                <UserCog size={15} className="text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Manager Assignments</h4>
              </div>
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 pl-3.5">Assign team members from the roster to each managing role for this client.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Relationship Manager">
                  <ManagerSelect value={relationshipManager} onChange={setRelationshipManager} />
                </Field>
                <Field label="Portfolio Manager">
                  <ManagerSelect value={portfolioManager} onChange={setPortfolioManager} />
                </Field>
                <Field label="Insurance Manager">
                  <ManagerSelect value={insuranceManager} onChange={setInsuranceManager} />
                </Field>
                <Field label="Service Manager">
                  <ManagerSelect value={serviceManager} onChange={setServiceManager} />
                </Field>
              </div>
            </div>

            {/* Fixed (non-editable) role holders */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pl-2 border-l-2 border-indigo-500">
                <Lock size={14} className="text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Standing Assignments</h4>
              </div>
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 pl-3.5">These roles are fixed across all clients and cannot be changed here.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FixedRoleField label="Owner" name={FIXED_ROLES.owner} />
                <FixedRoleField label="Operation Manager" name={FIXED_ROLES.operationManager} />
                <FixedRoleField label="Internal Manager" name={FIXED_ROLES.internalManager} />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Family & Business Details */}
        {activeTab === 'familyBusiness' && (
          <div className="space-y-6 animate-fade-in">
            {/* Family Details */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider pl-2 border-l-2 border-blue-500">Family Details</h4>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 shadow-sm">
                <table className="w-full text-xs text-left min-w-[500px]">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Applicant Name</th>
                      <th className="px-4 py-3">PAN</th>
                      <th className="px-4 py-3">Relation</th>
                      <th className="px-4 py-3">Date of Birth</th>
                      <th className="px-4 py-3 w-16 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {familyDetails.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500 italic">No family members added yet.</td>
                      </tr>
                    ) : (
                      familyDetails.map((member, idx) => (
                        <tr key={idx} className="bg-white dark:bg-slate-950">
                          <td className="px-4 py-2">
                            <input 
                              value={member.name} 
                              onChange={(e) => handleFamilyMemberChange(idx, 'name', e.target.value)} 
                              placeholder="Applicant Name" 
                              className={inputCls + ' text-xs py-1.5'} 
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              value={member.pan || ''}
                              onChange={(e) => handleFamilyMemberChange(idx, 'pan', e.target.value.toUpperCase().slice(0, 10))}
                              placeholder="e.g. ABCDE1234F"
                              className={inputCls + ' text-xs py-1.5 font-mono font-semibold uppercase ' + (member.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(member.pan) ? 'border-rose-500 focus:border-rose-500' : '')}
                              maxLength={10}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="relative">
                              <select
                                value={member.relation}
                                onChange={(e) => handleFamilyMemberChange(idx, 'relation', e.target.value)}
                                className={selectCls + ' text-xs py-1.5'}
                              >
                                <option value="">Select relation…</option>
                                {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="date"
                              value={member.dob || ''}
                              onChange={(e) => handleFamilyMemberChange(idx, 'dob', e.target.value)}
                              className={inputCls + ' text-xs py-1.5'}
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button 
                              type="button" 
                              onClick={() => handleRemoveFamilyMember(idx)} 
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <button 
                type="button" 
                onClick={handleAddFamilyMember} 
                className="w-full py-2 border border-dashed border-slate-350 dark:border-slate-800 hover:border-blue-500 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50/10 dark:hover:bg-blue-950/10 transition-all cursor-pointer"
              >
                + Add Family Member
              </button>
            </div>

            {/* Business Details */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider pl-2 border-l-2 border-blue-500">Business Details</h4>
              <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 w-40 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr className="bg-white dark:bg-slate-950">
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Mutual Funds</td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden max-w-[120px] mx-auto">
                          {['Yes', 'No'].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setMutualFunds(val)}
                              className={`flex-1 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                                mutualFunds === val 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-white dark:bg-slate-950 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-white dark:bg-slate-950">
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Term Insurance</td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden max-w-[120px] mx-auto">
                          {['Yes', 'No'].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setInsuranceTerm(val)}
                              className={`flex-1 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                                insuranceTerm === val 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-white dark:bg-slate-950 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-white dark:bg-slate-950">
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Medical Insurance</td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden max-w-[120px] mx-auto">
                          {['Yes', 'No'].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setInsuranceMedical(val)}
                              className={`flex-1 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                                insuranceMedical === val 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-white dark:bg-slate-950 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-white dark:bg-slate-950">
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Accidental Insurance</td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden max-w-[120px] mx-auto">
                          {['Yes', 'No'].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setInsuranceAccidental(val)}
                              className={`flex-1 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                                insuranceAccidental === val 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-white dark:bg-slate-950 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function GoalFormModal({ initial, onClose, onSave }) {
  const isEdit = !!initial;
  const initialIsPreset = initial ? GOAL_PRESETS.includes(initial.name) && initial.name !== 'Others' : true;
  const [nameChoice, setNameChoice] = useState(initial ? (initialIsPreset ? initial.name : 'Others') : '');
  const [customName, setCustomName] = useState(initial && !initialIsPreset ? initial.name : '');
  const [kidName, setKidName] = useState(initial ? (initial.kidName || '') : '');
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
  
  // Editable goal creation/anchor date — lets backdated goals (created before this app existed) compound correctly
  const [createdDate, setCreatedDate] = useState(() => {
    if (initial?.createdAt) {
      const d = new Date(initial.createdAt);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
    if (initial) {
      const m = String(initial.createdMonth || CURRENT_MONTH).padStart(2, '0');
      return `${initial.createdYear || CURRENT_YEAR}-${m}-01`;
    }
    return new Date().toISOString().slice(0, 10);
  });

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleCreatedDateChange = (e) => {
    const v = e.target.value;
    setCreatedDate(v);
    const d = new Date(v + 'T00:00:00');
    if (!isNaN(d.getTime())) {
      setForm(f => ({ ...f, createdMonth: d.getMonth() + 1, createdYear: d.getFullYear() }));
    }
  };
  const effectiveName = nameChoice === 'Others' ? customName.trim() : nameChoice;
  const showKidName = needsKidName(effectiveName);
  const previewCalc = calcGoal({ ...form, name: effectiveName });
  const targetBeforeStart = monthsBetween(form.createdMonth, form.createdYear, form.targetMonth, form.targetYear) <= 0;

  const handleSave = () => {
    if (!effectiveName || targetBeforeStart || !form.amount) return;
    const createdAtDate = new Date(createdDate + 'T00:00:00');
    const createdAt = isNaN(createdAtDate.getTime()) ? (initial?.createdAt || new Date().toISOString()) : createdAtDate.toISOString();
    const normalized = {
      ...form,
      name: effectiveName,
      kidName: showKidName ? kidName.trim() : '',
      amount: Number(form.amount) || 0,
      inflation: Number(form.inflation) || 0,
      expectedReturn: Number(form.expectedReturn) || 0,
      sipIncRate: Number(form.sipIncRate) || 0,
      currentInv: Number(form.currentInv) || 0,
      currentSip: Number(form.currentSip) || 0,
      createdAt,
    };
    onSave(normalized);
  };

  return (
    <Modal
      title={isEdit ? 'Modify Goal parameters' : 'Configure New Goal'}
      onClose={onClose}
      maxWidth="max-w-3xl"
      footer={
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={onClose} className={btnGhost}>Cancel</button>
            <button onClick={handleSave} disabled={!effectiveName || targetBeforeStart || !form.amount} className={btnPrimary}>
              {isEdit ? 'Save Changes' : 'Configure Goal'}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Goal Category Preset">
          <div className="relative">
            <select value={nameChoice} onChange={(e) => setNameChoice(e.target.value)} className={selectCls}>
              <option value="" disabled>Select target goal preset…</option>
              {GOAL_PRESETS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          {nameChoice === 'Others' && (
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter custom goal description"
              className={inputCls + ' mt-2 animate-fade-in'}
            />
          )}
          {showKidName && (
            <div className="mt-2 animate-fade-in">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Kid's Name</label>
              <input
                value={kidName}
                onChange={(e) => setKidName(e.target.value)}
                placeholder="e.g. Aanya"
                className={inputCls}
              />
            </div>
          )}
        </Field>
        <Field label="Target cost today (₹)">
          <input type="number" value={nv(form.amount)} onChange={(e) => upd('amount', parseNum(e, 0))} className={inputCls} placeholder="₹ e.g. 50,00,000" />
        </Field>

        <Field label="Goal Created Date" hint="Backdate this if the goal already existed before using this app">
          <input type="date" value={createdDate} onChange={handleCreatedDateChange} max={new Date().toISOString().slice(0, 10)} className={inputCls} />
        </Field>
        <div className="hidden md:block" />

        <Field label="Target Month">
          <div className="relative">
            <select value={form.targetMonth} onChange={(e) => upd('targetMonth', Number(e.target.value))} className={selectCls}>
              {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
        </Field>
        <Field label="Target Year">
          <input type="number" value={nv(form.targetYear)} onChange={(e) => upd('targetYear', parseNum(e, 0))} className={inputCls} />
        </Field>

        <Field label="Future cost (inflation-adjusted)">
          <div className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold tabular-nums shadow-sm">{fmtFull(previewCalc.futureValue)}</div>
        </Field>
        <Field label="Planning Horizon">
          <div className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-300 shadow-sm">
            {targetBeforeStart ? <span className="text-rose-600 dark:text-rose-400 font-bold">Target date must be in future</span> : <span className="tabular-nums font-semibold">{previewCalc.months} months ({previewCalc.years.toFixed(2)} yrs)</span>}
          </div>
        </Field>

        <Field label="Assumed Inflation Rate (%)">
          <input type="number" step="0.1" value={nv(form.inflation)} onChange={(e) => upd('inflation', parseNum(e))} className={inputCls} />
        </Field>
        <Field label="Expected Portfolio Return (%)">
          <input type="number" step="0.1" value={nv(form.expectedReturn)} onChange={(e) => upd('expectedReturn', parseNum(e))} className={inputCls} />
        </Field>
        <Field label="SIP Annual Step-Up (%)">
          <input type="number" step="0.1" value={nv(form.sipIncRate)} onChange={(e) => upd('sipIncRate', parseNum(e))} className={inputCls} />
        </Field>
        <Field label="Existing Accumulated Corpus (₹)">
          <input type="number" value={nv(form.currentInv)} onChange={(e) => upd('currentInv', parseNum(e, 0))} className={inputCls} placeholder="₹ e.g. 5,00,000" />
        </Field>
        <div className="md:col-span-2">
          <Field label="Current Monthly SIP Allocation (₹)">
            <input type="number" value={nv(form.currentSip)} onChange={(e) => upd('currentSip', parseNum(e, 0))} className={inputCls} placeholder="₹ e.g. 25,000" />
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-slate-950 dark:to-slate-900 border border-blue-100 dark:border-slate-800 rounded-xl shadow-sm">
        <PreviewTile label="Required Monthly SIP" value={fmtSip(previewCalc.sipRequired) + '/mo'} />
        <PreviewTile label="Additional SIP Needed" value={previewCalc.sipOnTrack ? null : (fmtSip(previewCalc.additionalSip) + '/mo')} pill={previewCalc.sipOnTrack ? 'On track' : null} />
        <PreviewTile label="Lump-sum Equivalent" value={fmtINR(previewCalc.lumpSumRequired)} />
        <PreviewTile label="Projected Progress" value={previewCalc.achievementPct.toFixed(1) + '%'} />
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
        const ageKey  = headers.find(h => findCol(h, 'age', 'clientage', 'years'));

        if (!nameKey) { setError('Could not find a "Name" column in the sheet.'); return; }
        if (!panKey)  { setError('Could not find a "PAN" column in the sheet.'); return; }

        const parsed = data
          .map((r, i) => ({
            rowNum: i + 2,
            name: String(r[nameKey] || '').trim(),
            pan: String(r[panKey] || '').toUpperCase().trim(),
            age: ageKey ? (Number(r[ageKey]) || 0) : 0,
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
      title="Import Client Portfolios"
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex justify-between items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {rows ? `${validRows.length} of ${rows.length} rows valid` : 'Upload a .xlsx / .xls file'}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className={btnGhost}>Cancel</button>
            <button
              onClick={handleImport}
              disabled={!validRows.length || importing}
              className={btnPrimary}
            >
              {importing ? 'Importing…' : `Import ${validRows.length} portfolio${validRows.length !== 1 ? 's' : ''}`}
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
          className="w-full border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-600 hover:bg-blue-50/10 dark:hover:bg-blue-950/10 rounded-2xl p-8 flex flex-col items-center gap-2.5 transition-all text-slate-500 dark:text-slate-450 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer shadow-inner"
        >
          <FileSpreadsheet size={32} className="text-slate-400 dark:text-slate-600" />
          <span className="font-bold text-sm uppercase tracking-wider">Click to upload spreadsheet</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-sans font-medium">Accepts Name, PAN Card, and Age columns — .xlsx / .xls formats</span>
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />

        {error && (
          <div className="flex items-start gap-2.5 p-4.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs font-medium border border-rose-200/50 dark:border-rose-900/40 animate-fade-in">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {rows && (
          <div className="overflow-auto max-h-64 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-md">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left w-12">#</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">PAN</th>
                  <th className="px-4 py-3 text-left">Age</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((r, i) => {
                  const nameOk = !!r.name;
                  const panOk = PAN_RE.test(r.pan);
                  const ok = nameOk && panOk;
                  return (
                    <tr key={i} className={`border-t border-slate-100 dark:border-slate-800 ${ok ? 'bg-white dark:bg-slate-900' : 'bg-rose-50/20 dark:bg-rose-950/10'}`}>
                      <td className="px-4 py-2.5 text-slate-400 dark:text-slate-500">{r.rowNum}</td>
                      <td className={`px-4 py-2.5 font-bold ${nameOk ? 'text-slate-800 dark:text-slate-200' : 'text-rose-600 dark:text-rose-400'}`}>
                        {r.name || <em className="font-normal font-sans text-xs opacity-60">empty</em>}
                      </td>
                      <td className={`px-4 py-2.5 font-mono tracking-wider text-xs ${panOk ? 'text-slate-800 dark:text-slate-300' : 'text-rose-600 dark:text-rose-400'}`}>
                        {r.pan || <em className="font-normal font-sans tracking-normal opacity-60">empty</em>}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 tabular-nums">
                        {r.age > 0 ? r.age : <em className="font-normal font-sans text-xs opacity-50">—</em>}
                      </td>
                      <td className="px-4 py-2.5 font-bold uppercase tracking-wider text-[10px]">
                        {ok
                          ? <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={12} /> Valid</span>
                          : <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400"><AlertCircle size={12} /> {!nameOk ? 'Missing name' : 'Invalid PAN'}</span>
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

// Manager assignment dropdown — picks a member from the shared team roster.
function ManagerSelect({ value, onChange }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls + ' pr-9'}>
        <option value="">Unassigned</option>
        {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
    </div>
  );
}

// Read-only display of a fixed (non-editable) role holder.
function FixedRoleField({ label, name }) {
  return (
    <Field label={label}>
      <div className="flex items-center justify-between gap-2 w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 shadow-sm">
        <span className="font-semibold truncate">{name}</span>
        <Lock size={13} className="text-slate-400 dark:text-slate-600 shrink-0" />
      </div>
    </Field>
  );
}

function PreviewTile({ label, value, pill }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">{label}</p>
      {pill ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-250/50 dark:ring-emerald-900/50 rounded-full">
          <CheckCircle2 size={11} /> {pill}
        </span>
      ) : (
        <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
      )}
    </div>
  );
}
