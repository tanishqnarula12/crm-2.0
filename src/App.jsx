import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Target, FileBarChart, Plus, ChevronLeft, Trash2, X, TrendingUp, IndianRupee,
  Calendar, Percent, Search, SlidersHorizontal, Pencil, Info, Shield, Plane, Car,
  Home, Heart, GraduationCap, Gift, Sparkles, Wallet, MoreHorizontal, CheckCircle2,
  AlertCircle, Download, RefreshCw, Save, FileText
} from 'lucide-react';

// DB Service & Calculation Utils
import { 
  getClients, addClient, updateClient, deleteClient, addGoal, updateGoal, deleteGoal 
} from './services/db';
import { 
  calcGoal, CURRENT_YEAR, CURRENT_MONTH, uid, monthsBetween 
} from './utils/calc';

// Subcomponents
import ClientList from './components/ClientList';
import ClientDetail from './components/ClientDetail';
import GoalDetail from './components/GoalDetail';
import { GoalsOverview, GoalGroupDetail } from './components/GoalsOverview';
import ReportsView from './components/ReportsView';
import { ClientFormModal, GoalFormModal, ExcelImportModal } from './components/Modals';

// Assets
import logoImg from './assets/logo.png';

export default function App() {
  const [clients, setClients] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState('clients');
  
  // Selection States
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [selectedGoalName, setSelectedGoalName] = useState(null);
  
  // Modal states
  const [showAddClient, setShowAddClient] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showImportExcel, setShowImportExcel] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editingClientId, setEditingClientId] = useState(null);
  
  // Filters & Report view states
  const [reportGoalFilter, setReportGoalFilter] = useState('all');
  const [reportTimeframe, setReportTimeframe] = useState(5);
  
  // Force light mode on mount
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('gms:theme');
  }, []);

  // Load clients on startup
  const loadData = async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedGoal = selectedClient?.goals?.find(g => g.id === selectedGoalId);

  // Group goals for overview tab
  const allGoalNames = useMemo(() => {
    const map = new Map();
    clients.forEach(c => (c.goals || []).forEach(g => {
      const key = g.name.trim();
      if (!map.has(key)) map.set(key, { name: key, count: 0, clients: [] });
      const e = map.get(key);
      e.count++;
      e.clients.push({ id: c.id, name: c.name, goal: g });
    }));
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [clients]);

  // Calculate totals for active client
  const totals = useMemo(() => {
    if (!selectedClient || !selectedClient.goals) return { totalSip: 0, totalAdditional: 0, totalLump: 0 };
    let totalSip = 0, totalAdditional = 0, totalLump = 0;
    selectedClient.goals.forEach(g => {
      const c = calcGoal(g);
      totalSip += c.sipRequired;
      totalAdditional += c.additionalSip;
      totalLump += c.lumpSumRequired;
    });
    return { totalSip, totalAdditional, totalLump };
  }, [selectedClient]);

  // Build rows for Reports timeline tab
  const reportRows = useMemo(() => {
    const cutoffKey = (CURRENT_YEAR + reportTimeframe) * 12 + CURRENT_MONTH;
    const rows = [];
    clients.forEach(c => (c.goals || []).forEach(g => {
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
  }, [clients, reportGoalFilter, reportTimeframe]);

  // Operations wrapped in try-catch and reload triggers
  const handleAddClient = async (name, pan, age) => {
    const newClient = { id: uid(), name, pan, age: Number(age) || 0 };
    try {
      await addClient(newClient);
      await loadData();
    } catch (err) {
      alert('Error adding client: ' + err.message);
    }
  };

  const handleUpdateClient = async (clientId, updates) => {
    try {
      await updateClient(clientId, updates);
      await loadData();
    } catch (err) {
      alert('Error updating client: ' + err.message);
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client and all their goals? This action cannot be undone.')) return;
    try {
      await deleteClient(clientId);
      if (selectedClientId === clientId) setSelectedClientId(null);
      await loadData();
    } catch (err) {
      alert('Error deleting client: ' + err.message);
    }
  };

  const handleAddGoal = async (clientId, goal) => {
    const newGoal = { ...goal, id: uid() };
    try {
      await addGoal(clientId, newGoal);
      await loadData();
    } catch (err) {
      alert('Error adding goal: ' + err.message);
    }
  };

  const handleUpdateGoal = async (clientId, goalId, updates) => {
    try {
      await updateGoal(clientId, goalId, updates);
      await loadData();
    } catch (err) {
      alert('Error updating goal: ' + err.message);
    }
  };

  const handleDeleteGoal = async (clientId, goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    try {
      await deleteGoal(clientId, goalId);
      if (selectedGoalId === goalId) setSelectedGoalId(null);
      await loadData();
    } catch (err) {
      alert('Error deleting goal: ' + err.message);
    }
  };

  const handleSaveAssumptions = async (clientId, text) => {
    await handleUpdateClient(clientId, { assumptions: text });
  };

  const handleImportClients = async (rows) => {
    for (const r of rows) {
      const newClient = { id: uid(), name: r.name, pan: r.pan, age: 0 };
      try {
        await addClient(newClient);
      } catch (err) {
        alert(`Error importing ${r.name}: ${err.message}`);
      }
    }
    await loadData();
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        <span className="font-semibold text-sm animate-pulse">Initializing Financial Workspace...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300">
      {/* App Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImg} className="h-9 w-9 object-contain rounded-lg" alt="Team Fintness Logo" />
            <div className="leading-tight">
              <h1 className="text-base font-bold text-slate-900">Team Fintness</h1>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Goal Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-xs font-bold text-slate-500 bg-slate-150 px-3 py-1 rounded-full">FY {CURRENT_YEAR}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="inline-flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 shadow-sm mb-6 transition-colors">
          {[
            { id: 'clients', label: 'Clients', icon: Users },
            { id: 'goals', label: 'Goals Summary', icon: Target },
            { id: 'reports', label: 'Timeline Reports', icon: FileBarChart }
          ].map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setSelectedClientId(null);
                  setSelectedGoalId(null);
                  setSelectedGoalName(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  active
                    ? 'bg-gradient-to-br from-blue-700 to-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Routing */}
        {tab === 'clients' && !selectedClientId && (
          <ClientList
            clients={clients}
            onSelect={setSelectedClientId}
            onAdd={() => setShowAddClient(true)}
            onDelete={handleDeleteClient}
            onImport={() => setShowImportExcel(true)}
          />
        )}
        
        {tab === 'clients' && selectedClientId && !selectedGoalId && (
          <ClientDetail
            client={selectedClient}
            totals={totals}
            onBack={() => setSelectedClientId(null)}
            onAddGoal={() => { setEditingGoalId(null); setShowGoalForm(true); }}
            onSelectGoal={setSelectedGoalId}
            onDeleteGoal={(gid) => handleDeleteGoal(selectedClientId, gid)}
            onSaveAssumptions={(text) => handleSaveAssumptions(selectedClientId, text)}
            onEditClient={() => { setEditingClientId(selectedClientId); setShowAddClient(true); }}
          />
        )}

        {tab === 'clients' && selectedGoalId && (
          <GoalDetail
            goal={selectedGoal}
            clientName={selectedClient.name}
            onBack={() => setSelectedGoalId(null)}
            onEdit={() => { setEditingGoalId(selectedGoalId); setShowGoalForm(true); }}
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
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-8 text-xs text-slate-400 text-center border-t border-slate-200/40 mt-10">
        © {CURRENT_YEAR} Team Fintness · Building fitter financial futures
      </footer>

      {/* Modals */}
      {showAddClient && (
        <ClientFormModal 
          initial={editingClientId ? clients.find(c => c.id === editingClientId) : null}
          onClose={() => { setShowAddClient(false); setEditingClientId(null); }} 
          onSave={async (name, pan, age) => {
            if (editingClientId) {
              await handleUpdateClient(editingClientId, { name, pan, age: Number(age) || 0 });
            } else {
              await handleAddClient(name, pan, age);
            }
            setShowAddClient(false);
            setEditingClientId(null);
          }} 
        />
      )}
      
      {showImportExcel && (
        <ExcelImportModal
          onClose={() => setShowImportExcel(false)}
          onImport={handleImportClients}
        />
      )}

      {showGoalForm && selectedClient && (
        <GoalFormModal
          initial={editingGoalId ? selectedClient.goals.find(g => g.id === editingGoalId) : null}
          onClose={() => { setShowGoalForm(false); setEditingGoalId(null); }}
          onSave={(g) => {
            if (editingGoalId) handleUpdateGoal(selectedClient.id, editingGoalId, g);
            else handleAddGoal(selectedClient.id, g);
            setShowGoalForm(false);
            setEditingGoalId(null);
          }}
        />
      )}
    </div>
  );
}
