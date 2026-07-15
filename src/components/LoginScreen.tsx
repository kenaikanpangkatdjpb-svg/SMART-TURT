/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KeyRound, User, Lock, FileClock, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (username: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username tidak boleh kosong');
      return;
    }
    if (!password) {
      setError('Password tidak boleh kosong');
      return;
    }

    setIsLoading(true);

    // Simulate network delay for extreme polish
    setTimeout(() => {
      // Allow any combination for demo, but validate specific credentials for formal feel
      const validUsername = 'turt';
      const validPassword = 'password123';

      if (
        (username.toLowerCase() === validUsername && password === validPassword) || 
        (username.toLowerCase() === 'admin' && password === 'admin123') ||
        // Also allow generic for ease of use but with feedback
        (username.length >= 3 && password.length >= 5)
      ) {
        onLoginSuccess(username);
      } else {
        setError('Kombinasi Username & Password salah. Gunakan kredensial demo di bawah.');
        setIsLoading(false);
      }
    }, 800);
  };

  const handleQuickLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      onLoginSuccess('Subbag TURT');
    }, 500);
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-8 min-h-full bg-slate-50 animate-in fade-in duration-300">
      <div className="w-full max-w-sm space-y-8">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex w-16 h-16 rounded-3xl bg-indigo-600 items-center justify-center text-white shadow-xl shadow-indigo-600/25 animate-bounce">
            <FileClock size={32} />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-slate-800">SMART-TURT Portal</h2>
            <p className="text-sm font-semibold text-indigo-600">Subbag TURT</p>
            <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
              Sistem Monitoring Agenda, Reminder, dan Tugas TURT
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-slate-100/40 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Masuk ke Akun</h3>
            <p className="text-xs text-slate-400">Silakan masukkan username dan password Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-2 text-rose-800 text-xs animate-shake">
                <ShieldAlert size={16} className="shrink-0 mt-0.5 text-rose-600" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: turt"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Password</label>
                <span className="text-[10px] font-semibold text-indigo-500 hover:underline cursor-pointer">Lupa Password?</span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 rounded-md text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs text-slate-500 font-semibold">Ingat Saya</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold text-xs py-3 rounded-2xl shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Memvalidasi...</span>
                </>
              ) : (
                <>
                  <KeyRound size={16} />
                  <span>Masuk Aplikasi</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Login / Demo Helper */}
          <div className="border-t border-slate-100 pt-4 text-center">
            <button
              onClick={handleQuickLogin}
              disabled={isLoading}
              className="w-full py-2 border border-dashed border-indigo-200 hover:border-indigo-400 text-indigo-600 rounded-2xl text-xs font-extrabold transition-all hover:bg-indigo-50/30 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={14} className="text-indigo-500" />
              <span>Masuk Instan (Tanpa Sandi)</span>
            </button>
          </div>
        </div>

        {/* Demo Credentials Info */}
        <div className="bg-slate-100/50 border border-slate-200/40 rounded-2xl p-4 text-center space-y-1">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Kredensial Demo</p>
          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-600">
            <div>
              <span className="text-slate-400">User:</span> <code className="bg-white px-1.5 py-0.5 rounded border text-[11px] font-mono">turt</code>
            </div>
            <div>
              <span className="text-slate-400">Pass:</span> <code className="bg-white px-1.5 py-0.5 rounded border text-[11px] font-mono">password123</code>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
