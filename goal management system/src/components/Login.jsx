import React, { useState } from 'react';
import { LogIn, Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';
import { Card, inputCls, btnPrimary } from './UI';
import { findAccount } from '../utils/auth';
import logoImg from '../assets/logo.png';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const account = findAccount(email, password);
    if (account) {
      setError('');
      onLogin(account.role);
    } else {
      setError('Invalid email or password. Access is restricted to authorised accounts only.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/40 dark:bg-slate-950 px-4 antialiased font-sans transition-colors">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src={logoImg} className="h-14 w-14 object-contain rounded-2xl shadow-md mb-4" alt="Team Fintness Logo" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Team Fintness</h1>
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Customer Relationship Management System</p>
        </div>

        <Card className="p-7 border border-slate-200/60 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Lock size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Advisor Sign In</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Restricted access workspace</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="you@fintness.in"
                autoComplete="username"
                className={inputCls}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={inputCls + ' pr-11'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs font-medium border border-rose-200/50 dark:border-rose-900/40 animate-fade-in">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" className={btnPrimary + ' w-full'}>
              <LogIn size={15} /> Sign In
            </button>
          </form>
        </Card>

        <p className="text-center text-[11px] text-slate-400 dark:text-slate-600 mt-6 font-medium">
          © {new Date().getFullYear()} Team Fintness · Authorised personnel only
        </p>
      </div>
    </div>
  );
}
