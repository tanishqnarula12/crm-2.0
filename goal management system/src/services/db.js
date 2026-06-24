import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { CURRENT_YEAR, CURRENT_MONTH } from '../utils/calc';

const seedData = {
  clients: [
    { id: 'c1', name: 'Aarav Sharma', pan: 'ABCPS1234A', age: 34, assumptions: '', clientDetails: { mobile: '+91 98765 43210', email: 'aarav@example.com', clientType: 'HNI', dob: '1992-05-15', profession: 'Salaried – Private Sector', status: 'Active', familyDetails: [{ name: 'Nisha Sharma', relation: 'Spouse', pan: 'XYZPN5678B', dob: '1994-08-22' }] }, goals: [
      { id: 'g1', name: 'Financial Freedom', amount: 50000000, targetMonth: 4, targetYear: CURRENT_YEAR + 25, createdMonth: CURRENT_MONTH, createdYear: CURRENT_YEAR, inflation: 6, expectedReturn: 12, sipIncRate: 10, currentInv: 500000, currentSip: 25000 },
      { id: 'g2', name: 'Kids Education', amount: 4000000, targetMonth: 6, targetYear: CURRENT_YEAR + 12, createdMonth: CURRENT_MONTH, createdYear: CURRENT_YEAR, inflation: 8, expectedReturn: 11, sipIncRate: 8, currentInv: 200000, currentSip: 15000, kidName: 'Aanya', history: [] },
    ]},
    { id: 'c2', name: 'Priya Patel', pan: 'BXYPP5678B', age: 41, assumptions: '', clientDetails: { mobile: '+91 91234 56789', email: 'priya@example.com', clientType: 'Ultra HNI', dob: '1985-03-10', profession: 'Business', status: 'Active', familyDetails: [] }, goals: [
      { id: 'g3', name: 'Financial Freedom', amount: 80000000, targetMonth: 3, targetYear: CURRENT_YEAR + 19, createdMonth: CURRENT_MONTH, createdYear: CURRENT_YEAR, inflation: 6, expectedReturn: 11, sipIncRate: 10, currentInv: 1500000, currentSip: 40000 },
      { id: 'g4', name: 'Dream Home', amount: 15000000, targetMonth: 10, targetYear: CURRENT_YEAR + 5, createdMonth: CURRENT_MONTH, createdYear: CURRENT_YEAR, inflation: 7, expectedReturn: 9, sipIncRate: 5, currentInv: 3000000, currentSip: 50000 },
    ]},
    { id: 'c3', name: 'Rohan Mehta', pan: 'CQRPM9012C', age: 28, assumptions: '', clientDetails: { mobile: '+91 99887 76655', email: 'rohan@example.com', clientType: 'Retail', dob: '1998-11-05', profession: 'Self-Employed', status: 'Active', familyDetails: [] }, goals: [
      { id: 'g5', name: 'Financial Freedom', amount: 30000000, targetMonth: 4, targetYear: CURRENT_YEAR + 32, createdMonth: CURRENT_MONTH, createdYear: CURRENT_YEAR, inflation: 6, expectedReturn: 13, sipIncRate: 12, currentInv: 100000, currentSip: 10000 },
    ]},
    { id: 'c4', name: 'Sneha Iyer', pan: 'DLMPI3456D', age: 38, assumptions: '', clientDetails: { mobile: '+91 95432 10987', email: 'sneha@example.com', clientType: 'HNI', dob: '1988-07-20', profession: 'Professional', status: 'Active', familyDetails: [] }, goals: []},
    { id: 'c5', name: 'Vikram Singh', pan: 'EFGPS7890E', age: 45, assumptions: '', clientDetails: { mobile: '+91 90123 45678', email: 'vikram@example.com', clientType: 'Ultra HNI', dob: '1981-12-01', profession: 'Business', status: 'Active', familyDetails: [] }, goals: [
      { id: 'g6', name: 'Kids Education', amount: 6000000, targetMonth: 7, targetYear: CURRENT_YEAR + 8, createdMonth: CURRENT_MONTH, createdYear: CURRENT_YEAR, inflation: 8, expectedReturn: 11, sipIncRate: 8, currentInv: 800000, currentSip: 30000, kidName: 'Reyansh', history: [] },
      { id: 'g7', name: 'Vacation', amount: 2000000, targetMonth: 12, targetYear: CURRENT_YEAR + 3, createdMonth: CURRENT_MONTH, createdYear: CURRENT_YEAR, inflation: 5, expectedReturn: 8, sipIncRate: 0, currentInv: 500000, currentSip: 25000 },
    ]},
  ],
};

// Map database goal row to frontend goal object
function mapDbGoal(g) {
  return {
    id: g.id,
    name: g.name,
    amount: Number(g.amount),
    targetMonth: g.target_month,
    targetYear: g.target_year,
    createdMonth: g.created_month,
    createdYear: g.created_year,
    inflation: Number(g.inflation),
    expectedReturn: Number(g.expected_return),
    sipIncRate: Number(g.sip_inc_rate),
    currentInv: Number(g.current_inv),
    currentSip: Number(g.current_sip),
    kidName: g.kid_name || '',
    history: Array.isArray(g.history) ? g.history : [],
    actuals: Array.isArray(g.actuals) ? g.actuals : [],
    createdAt: g.created_at || null
  };
}

// Map frontend goal object to database goal row
function mapFrontendGoal(g, clientId) {
  return {
    id: g.id,
    client_id: clientId,
    name: g.name,
    amount: g.amount,
    target_month: g.targetMonth,
    target_year: g.targetYear,
    created_month: g.createdMonth,
    created_year: g.createdYear,
    inflation: g.inflation,
    expected_return: g.expectedReturn,
    sip_inc_rate: g.sipIncRate,
    current_inv: g.currentInv,
    current_sip: g.currentSip,
    kid_name: g.kidName || null,
    history: Array.isArray(g.history) ? g.history : [],
    actuals: Array.isArray(g.actuals) ? g.actuals : [],
    ...(g.createdAt ? { created_at: g.createdAt } : {})
  };
}

// Global flag to fall back to Local Storage if Supabase tables are not created/initialized yet
let useLocalStorageFallback = false;

// Fetch helper to sync and seed if empty
export async function getClients() {
  if (!isSupabaseConfigured) {
    useLocalStorageFallback = true;
    return getClientsLocal();
  }

  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*, goals(*), moms(*)');
    
    if (error) {
      // If tables are missing, fallback to Local Storage
      if (error.code === '42P01') {
        console.warn("Supabase 'clients' or 'moms' table is missing. Falling back to Local Storage.", error);
        useLocalStorageFallback = true;
        return getClientsLocal();
      }
      throw error;
    }

    useLocalStorageFallback = false;
    return data.map(client => ({
      id: client.id,
      name: client.name,
      pan: client.pan,
      age: client.age,
      assumptions: client.assumptions || '',
      assetAllocation: client.asset_allocation || null,
      clientDetails: client.client_details || {},
      goals: (client.goals || []).map(mapDbGoal),
      moms: (client.moms || []).map(m => ({
        id: m.id,
        meetingNumber: m.meeting_number || '',
        meetingDate: m.meeting_date || '',
        data: m.data || {},
        createdAt: m.created_at || null
      }))
    }));
  } catch (err) {
    // Graceful fallback for relation missing or connection errors
    if (err.code === '42P01' || err.message?.includes('relation') || err.message?.includes('fetch')) {
      console.warn("Supabase load failed. Falling back to Local Storage.", err);
      useLocalStorageFallback = true;
      return getClientsLocal();
    }
    throw err;
  }
}

function getClientsLocal() {
  const local = localStorage.getItem('app-state');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (parsed.clients && parsed.clients.length > 0) {
        return parsed.clients.map(c => ({
          ...c,
          goals: c.goals || [],
          moms: c.moms || []
        }));
      }
    } catch (e) {
      console.error('Failed to parse local storage, using seeds', e);
    }
  }
  // Seed local storage if empty
  localStorage.setItem('app-state', JSON.stringify(seedData));
  return seedData.clients.map(c => ({ ...c, goals: c.goals || [], moms: c.moms || [] }));
}

// Write helper for local storage updates
function saveToLocalStorage(clients) {
  localStorage.setItem('app-state', JSON.stringify({ clients }));
}

// Core Operations
export async function addClient(client) {
  if (isSupabaseConfigured && !useLocalStorageFallback) {
    const { error } = await supabase.from('clients').insert({
      id: client.id,
      name: client.name,
      pan: client.pan,
      age: client.age,
      assumptions: '',
      client_details: client.clientDetails || {}
    });
    if (error) throw error;
  } else {
    const clients = await getClientsLocal();
    clients.push({ ...client, assumptions: '', clientDetails: client.clientDetails || {}, goals: [], moms: [] });
    saveToLocalStorage(clients);
  }
}

export async function updateClient(clientId, updates) {
  if (isSupabaseConfigured && !useLocalStorageFallback) {
    // Translate frontend (camelCase) keys to DB column names
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.pan !== undefined) dbUpdates.pan = updates.pan;
    if (updates.age !== undefined) dbUpdates.age = updates.age;
    if (updates.assumptions !== undefined) dbUpdates.assumptions = updates.assumptions;
    if (updates.assetAllocation !== undefined) dbUpdates.asset_allocation = updates.assetAllocation;
    if (updates.clientDetails !== undefined) dbUpdates.client_details = updates.clientDetails;

    const { error } = await supabase
      .from('clients')
      .update(dbUpdates)
      .eq('id', clientId);
    if (error) throw error;
  } else {
    const clients = await getClientsLocal();
    const updated = clients.map(c => c.id === clientId ? { ...c, ...updates } : c);
    saveToLocalStorage(updated);
  }
}

export async function deleteClient(clientId) {
  if (isSupabaseConfigured && !useLocalStorageFallback) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);
    if (error) throw error;
  } else {
    const clients = await getClientsLocal();
    const filtered = clients.filter(c => c.id !== clientId);
    saveToLocalStorage(filtered);
  }
}

export async function addGoal(clientId, goal) {
  if (isSupabaseConfigured && !useLocalStorageFallback) {
    const dbGoal = mapFrontendGoal(goal, clientId);
    const { error } = await supabase.from('goals').insert(dbGoal);
    if (error) throw error;
  } else {
    const clients = await getClientsLocal();
    const updated = clients.map(c => {
      if (c.id === clientId) {
        return { ...c, goals: [...(c.goals || []), goal] };
      }
      return c;
    });
    saveToLocalStorage(updated);
  }
}

export async function updateGoal(clientId, goalId, updates) {
  if (isSupabaseConfigured && !useLocalStorageFallback) {
    // Map updates if they match mapped names
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.targetMonth !== undefined) dbUpdates.target_month = updates.targetMonth;
    if (updates.targetYear !== undefined) dbUpdates.target_year = updates.targetYear;
    if (updates.createdMonth !== undefined) dbUpdates.created_month = updates.createdMonth;
    if (updates.createdYear !== undefined) dbUpdates.created_year = updates.createdYear;
    if (updates.createdAt !== undefined) dbUpdates.created_at = updates.createdAt;
    if (updates.inflation !== undefined) dbUpdates.inflation = updates.inflation;
    if (updates.expectedReturn !== undefined) dbUpdates.expected_return = updates.expectedReturn;
    if (updates.sipIncRate !== undefined) dbUpdates.sip_inc_rate = updates.sipIncRate;
    if (updates.currentInv !== undefined) dbUpdates.current_inv = updates.currentInv;
    if (updates.currentSip !== undefined) dbUpdates.current_sip = updates.currentSip;
    if (updates.kidName !== undefined) dbUpdates.kid_name = updates.kidName || null;
    if (updates.history !== undefined) dbUpdates.history = Array.isArray(updates.history) ? updates.history : [];
    if (updates.actuals !== undefined) dbUpdates.actuals = Array.isArray(updates.actuals) ? updates.actuals : [];

    const { error } = await supabase
      .from('goals')
      .update(dbUpdates)
      .eq('id', goalId);
    if (error) throw error;
  } else {
    const clients = await getClientsLocal();
    const updated = clients.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          goals: c.goals.map(g => g.id === goalId ? { ...g, ...updates } : g)
        };
      }
      return c;
    });
    saveToLocalStorage(updated);
  }
}

export async function deleteGoal(clientId, goalId) {
  if (isSupabaseConfigured && !useLocalStorageFallback) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);
    if (error) throw error;
  } else {
    const clients = await getClientsLocal();
    const updated = clients.map(c => {
      if (c.id === clientId) {
        return { ...c, goals: c.goals.filter(g => g.id !== goalId) };
      }
      return c;
    });
    saveToLocalStorage(updated);
  }
}

export async function addMom(clientId, mom) {
  if (isSupabaseConfigured && !useLocalStorageFallback) {
    const { error } = await supabase.from('moms').insert({
      id: mom.id,
      client_id: clientId,
      meeting_number: mom.meetingNumber,
      meeting_date: mom.meetingDate,
      data: mom.data || {},
    });
    if (error) throw error;
  } else {
    const clients = await getClientsLocal();
    const updated = clients.map(c => {
      if (c.id === clientId) {
        return { ...c, moms: [...(c.moms || []), mom] };
      }
      return c;
    });
    saveToLocalStorage(updated);
  }
}

export async function updateMom(clientId, momId, updates) {
  if (isSupabaseConfigured && !useLocalStorageFallback) {
    const dbUpdates = {};
    if (updates.meetingNumber !== undefined) dbUpdates.meeting_number = updates.meetingNumber;
    if (updates.meetingDate !== undefined) dbUpdates.meeting_date = updates.meetingDate;
    if (updates.data !== undefined) dbUpdates.data = updates.data;

    const { error } = await supabase
      .from('moms')
      .update(dbUpdates)
      .eq('id', momId);
    if (error) throw error;
  } else {
    const clients = await getClientsLocal();
    const updated = clients.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          moms: (c.moms || []).map(m => m.id === momId ? { ...m, ...updates } : m)
        };
      }
      return c;
    });
    saveToLocalStorage(updated);
  }
}

export async function deleteMom(clientId, momId) {
  if (isSupabaseConfigured && !useLocalStorageFallback) {
    const { error } = await supabase
      .from('moms')
      .delete()
      .eq('id', momId);
    if (error) throw error;
  } else {
    const clients = await getClientsLocal();
    const updated = clients.map(c => {
      if (c.id === clientId) {
        return { ...c, moms: (c.moms || []).filter(m => m.id !== momId) };
      }
      return c;
    });
    saveToLocalStorage(updated);
  }
}
