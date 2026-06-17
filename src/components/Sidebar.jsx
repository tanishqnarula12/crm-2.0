import React, { useState } from 'react';
import {
  LayoutDashboard, UserPlus, Users, Briefcase, ListChecks, CalendarDays,
  MessageSquare, ShieldCheck, FileText, FileBarChart, Settings, LifeBuoy,
  Search, ChevronsLeft, ChevronsRight, Plus
} from 'lucide-react';

// Sidebar nav. Items with a `view` are wired to a real app section; the rest
// are visual placeholders for the planned CRM product (non-functional for now).
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
  { id: 'leads', label: 'Leads', icon: UserPlus },
  { id: 'clients', label: 'Clients', icon: Users, view: 'clients' },
  { id: 'prospects', label: 'Business Prospects', icon: Briefcase },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'meeting', label: 'Meeting', icon: CalendarDays },
  { id: 'chats', label: 'Chats', icon: MessageSquare },
  { id: 'insurance', label: 'Insurance', icon: ShieldCheck },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'reports', label: 'Reports', icon: FileBarChart, view: 'reports' },
];

function NavItem({ icon: Icon, label, active, collapsed, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
        collapsed ? 'justify-center' : ''
      } ${
        active
          ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
          : disabled
            ? 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            : 'text-slate-300 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}

export default function Sidebar({ tab, onNavigate, onAddClient, isViewer }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`shrink-0 bg-slate-950 border-r border-slate-800/80 flex flex-col h-screen sticky top-0 transition-all duration-300 ${collapsed ? 'w-[76px]' : 'w-64'}`}>
      {/* Top: collapse toggle */}
      <div className={`flex items-center px-3 pt-4 pb-2 ${collapsed ? 'justify-center' : 'justify-end'}`}>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>

      {/* + New Client */}
      {!isViewer && (
        <div className="px-3 pb-3">
          <button
            onClick={onAddClient}
            className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold uppercase tracking-wider bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/15 transition-all cursor-pointer ${collapsed ? '!px-0' : ''}`}
            title="New client"
          >
            <Plus size={14} />
            {!collapsed && 'New Client'}
          </button>
        </div>
      )}

      {/* Search (visual only) */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              disabled
              placeholder="Search…"
              className="w-full pl-8 pr-3 py-2 text-xs bg-white/5 border border-slate-800 rounded-xl text-slate-300 placeholder-slate-500 cursor-not-allowed"
            />
          </div>
        </div>
      )}

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1 [scrollbar-width:thin]">
        {NAV_ITEMS.map(item => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={item.view && tab === item.view}
            collapsed={collapsed}
            disabled={!item.view}
            onClick={() => item.view && onNavigate(item.view)}
          />
        ))}
      </div>

      {/* Bottom: Settings / Support (visual only) */}
      <div className="px-3 py-3 border-t border-slate-800/80 space-y-1">
        <NavItem icon={Settings} label="Settings" collapsed={collapsed} disabled onClick={() => {}} />
        <NavItem icon={LifeBuoy} label="Support" collapsed={collapsed} disabled onClick={() => {}} />
      </div>
    </aside>
  );
}
