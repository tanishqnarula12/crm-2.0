import React from 'react';
import { Users, UserPlus, ListChecks, FolderOpen, UserCheck, Sun, Moon, LogOut } from 'lucide-react';
import logoImg from '../assets/logo.png';

const NAV = [
  { id: 'leads', label: 'Leads', icon: UserPlus },
  { id: 'clients', label: 'Client', icon: Users },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'documents', label: 'Docs', icon: FolderOpen },
  { id: 'prospects', label: 'Prospect', icon: UserCheck },
];

export default function Sidebar({ view, setView, theme, setTheme, onLogout }) {
  return (
    <aside
      style={{
        width: '64px',
      }}
      className="no-print sticky top-0 h-screen flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/70 dark:border-slate-800/70 z-30 overflow-hidden shrink-0 shadow-md dark:shadow-none"
    >
      <div className="flex flex-col h-full w-full py-6 justify-between items-center">
        {/* Top Section: Brand Logo */}
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="relative flex flex-col items-center justify-center">
            <img
              src={logoImg}
              className="h-10 w-10 object-contain rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-800 shadow-sm"
              alt="Team Fintness"
            />
          </div>

          {/* Navigation Links */}
          <nav className="w-full px-2 space-y-4 flex flex-col items-center">
            {NAV.map(({ id, label, icon: Icon }) => {
              const active = view === id;
              return (
                <div key={id} className="dock-item-container relative flex items-center justify-center w-full">
                  <button
                    onClick={() => setView(id)}
                    className={`dock-item w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                      active
                        ? 'bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-[9px] font-bold mt-1 tracking-wide leading-none">{label}</span>
                    {active && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                  </button>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Footer controls */}
        <div className="w-full px-2 flex flex-col items-center gap-4">
          {/* Switch Theme Button */}
          <div className="dock-item-container relative flex items-center justify-center w-full">
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="dock-item w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border border-slate-200/40 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-white shadow-sm"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span className="text-[9px] font-bold mt-1 tracking-wide leading-none">Theme</span>
            </button>
          </div>

          {/* Logout Button */}
          <div className="dock-item-container relative flex items-center justify-center w-full">
            <button
              onClick={onLogout}
              className="dock-item w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border border-slate-200/40 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-455 hover:border-rose-200 dark:hover:border-rose-900/30 shadow-sm"
            >
              <LogOut size={18} />
              <span className="text-[9px] font-bold mt-1 tracking-wide leading-none">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
