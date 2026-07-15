/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Document, DocType, DocStatus, Priority } from '../types';
import { 
  FileText, 
  Mail, 
  Send, 
  CalendarDays, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Plus, 
  TrendingUp, 
  BellRing,
  MapPin,
  HelpCircle,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  documents: Document[];
  onAddDocClick: (preferredType?: DocType) => void;
  onViewDocClick: (doc: Document) => void;
  onSetActiveTab: (tab: string) => void;
}

export default function Dashboard({ documents, onAddDocClick, onViewDocClick, onSetActiveTab }: DashboardProps) {
  // Current time representation for calculations
  const todayStr = '2026-07-15';
  const today = new Date(todayStr);

  const getDaysDifference = (dateStr1: string, dateStr2: string): number => {
    const [y1, m1, d1] = dateStr1.split('-').map(Number);
    const [y2, m2, d2] = dateStr2.split('-').map(Number);
    const utc1 = Date.UTC(y1, m1 - 1, d1);
    const utc2 = Date.UTC(y2, m2 - 1, d2);
    return Math.round((utc1 - utc2) / (1000 * 60 * 60 * 24));
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = documents.length;
    let pending = 0; // BELUM_DIPROSES + SEDANG_DIPROSES
    let completed = 0; // SELESAI
    let overdue = 0; // TERLAMBAT atau (pending dan melewati due date)
    
    const types: Record<DocType, number> = {
      NOTA_DINAS: 0,
      SURAT_MASUK: 0,
      SURAT_KELUAR: 0,
      UNDANGAN_MASUK: 0,
      UNDANGAN_KELUAR: 0,
      KEGIATAN_ACARA: 0,
    };

    const priorities: Record<Priority, number> = {
      SANGAT_PENTING: 0,
      PENTING: 0,
      BIASA: 0,
    };

    documents.forEach(doc => {
      // Type counting
      types[doc.type]++;

      // Priority counting
      priorities[doc.priority]++;

      // Status counting & Overdue evaluation
      if (doc.status === 'SELESAI') {
        completed++;
      } else {
        pending++;
        if (doc.dueDate) {
          const dueDateObj = new Date(doc.dueDate);
          if (dueDateObj < today) {
            overdue++;
          }
        }
      }

      // Explicitly marked as Terlambat
      if (doc.status === 'TERLAMBAT') {
        overdue++;
      }
    });

    return { total, pending, completed, overdue, types, priorities };
  }, [documents]);

  // Urgent alerts (Reminders active, pending status, due within 3 days)
  const urgentReminders = useMemo(() => {
    return documents.filter(doc => {
      if (doc.status === 'SELESAI') return false;
      if (!doc.dueDate) return false;

      const diffDays = getDaysDifference(doc.dueDate, todayStr);
      
      // Overdue (diffDays < 0) or Due soon (0 <= diffDays <= doc.reminderDaysBefore)
      const isDueSoon = diffDays >= 0 && diffDays <= doc.reminderDaysBefore;
      const isOverdue = diffDays < 0;

      return doc.reminderActive && (isDueSoon || isOverdue);
    }).sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return dateA - dateB; // earliest deadline first
    });
  }, [documents]);

  // Type configuration helper
  const docTypeConfig: Record<DocType, { label: string; color: string; bg: string; text: string; icon: any }> = {
    NOTA_DINAS: { label: 'Nota Dinas', color: 'emerald', bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', icon: FileText },
    SURAT_MASUK: { label: 'Surat Masuk', color: 'indigo', bg: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-700', icon: Mail },
    SURAT_KELUAR: { label: 'Surat Keluar', color: 'sky', bg: 'bg-sky-50 border-sky-100', text: 'text-sky-700', icon: Send },
    UNDANGAN_MASUK: { label: 'Undangan Masuk', color: 'amber', bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', icon: CalendarDays },
    UNDANGAN_KELUAR: { label: 'Undangan Keluar', color: 'rose', bg: 'bg-rose-50 border-rose-100', text: 'text-rose-700', icon: CalendarDays },
    KEGIATAN_ACARA: { label: 'Kegiatan / Acara', color: 'violet', bg: 'bg-violet-50 border-violet-100', text: 'text-violet-700', icon: Calendar },
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'SANGAT_PENTING':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">Sangat Penting</span>;
      case 'PENTING':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Penting</span>;
      case 'BIASA':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">Biasa</span>;
    }
  };

  const formatDaysLeft = (dueDateStr: string) => {
    const diffDays = getDaysDifference(dueDateStr, todayStr);

    if (diffDays === 0) {
      return <span className="font-semibold text-amber-600">Hari ini</span>;
    } else if (diffDays === 1) {
      return <span className="font-semibold text-amber-600">Besok</span>;
    } else if (diffDays > 1) {
      return <span className="text-slate-600">{diffDays} hari lagi</span>;
    } else {
      return <span className="font-bold text-rose-600">Terlambat {Math.abs(diffDays)} hari</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <BellRing size={200} className="transform rotate-12" />
        </div>
        <div className="z-10 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Rangkuman Aktivitas</p>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Portal Dokumen Subbagian TURT Kanwil DJPb Provinsi Riau</h1>
          <p className="text-sm text-indigo-100 max-w-xl">
            Hari ini adalah <span className="font-medium text-amber-300">Rabu, 15 Juli 2026</span>. Anda memiliki <span className="font-bold underline decoration-amber-400">{stats.pending} dokumen tertunda</span> dan <span className="font-bold underline decoration-rose-400">{stats.overdue} dokumen terlambat</span> yang memerlukan tindakan segera.
          </p>
        </div>
        <div className="z-10 flex gap-2 self-start md:self-center">
          <button 
            onClick={() => onAddDocClick()} 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg hover:shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer text-sm"
          >
            <Plus size={18} />
            Catat Dokumen Baru
          </button>
        </div>
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          whileHover={{ y: -3 }}
          onClick={() => onSetActiveTab('semua')}
          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-start gap-4"
        >
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Dokumen</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</h3>
            <span className="text-[10px] text-slate-400">Terdaftar di sistem</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3 }}
          onClick={() => onSetActiveTab('terlambat')}
          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-start gap-4"
        >
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Terlambat</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{stats.overdue}</h3>
            <span className="text-[10px] text-rose-500 font-medium">Perlu tindak lanjut segera</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3 }}
          onClick={() => onSetActiveTab('belum_selesai')}
          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-start gap-4"
        >
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Belum Selesai</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</h3>
            <span className="text-[10px] text-amber-500 font-medium">Sedang & Belum diproses</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3 }}
          onClick={() => onSetActiveTab('selesai')}
          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-start gap-4"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Selesai</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed}</h3>
            <span className="text-[10px] text-emerald-500 font-medium">Tuntas diarsipkan</span>
          </div>
        </motion.div>
      </div>

      {/* Main Content Dashboard Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Urgent Reminders & Quick Actions (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Dynamic Reminders Box */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BellRing className="text-amber-500" size={20} />
                <h2 className="text-base font-bold text-slate-800">Alarm Pengingat Terdekat</h2>
              </div>
              <span className="bg-rose-50 text-rose-700 text-xs px-2.5 py-1 rounded-full font-semibold">
                {urgentReminders.length} Pengingat Aktif
              </span>
            </div>

            {urgentReminders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="text-slate-300 mb-2" size={32} />
                <p className="text-sm font-medium text-slate-600">Semua aman!</p>
                <p className="text-xs text-slate-400 mt-0.5">Tidak ada pengingat mendesak saat ini.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {urgentReminders.map(doc => {
                  const config = docTypeConfig[doc.type];
                  const Icon = config.icon;
                  
                  return (
                    <div 
                      key={doc.id}
                      onClick={() => onViewDocClick(doc)}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/60 transition-all cursor-pointer hover:border-slate-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg mt-0.5 ${config.bg} ${config.text}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">{config.label}</span>
                            {getPriorityBadge(doc.priority)}
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 line-clamp-1 mt-0.5 group-hover:text-indigo-600 transition-colors">
                            {doc.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="font-medium text-slate-600">{doc.regNumber}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 mt-3 sm:mt-0 border-t sm:border-t-0 border-slate-200/50 pt-2 sm:pt-0">
                        {doc.locationOrRoom && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-md">
                            <MapPin size={11} className="text-slate-400" />
                            <span className="max-w-[80px] truncate">{doc.locationOrRoom}</span>
                          </div>
                        )}
                        <div className="text-right sm:text-right">
                          <p className="text-xs text-slate-400">Jatuh Tempo</p>
                          <p className="text-xs font-semibold mt-0.5">
                            {formatDaysLeft(doc.dueDate!)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Document Type Distribution Blocks */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-600" />
              Statistik Dokumen Berdasarkan Jenis
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {(Object.keys(docTypeConfig) as DocType[]).map(type => {
                const config = docTypeConfig[type];
                const count = stats.types[type] || 0;
                const Icon = config.icon;
                const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

                return (
                  <div 
                    key={type}
                    onClick={() => {
                      onSetActiveTab(type.toLowerCase());
                    }}
                    className={`p-4 rounded-xl border flex flex-row sm:flex-col justify-between items-center sm:items-start gap-2 cursor-pointer hover:shadow-sm transition-all bg-white border-slate-100 hover:border-slate-200`}
                  >
                    <div className="flex sm:flex-col items-center sm:items-start gap-3 w-full">
                      <div className={`p-2.5 rounded-lg ${config.bg} ${config.text}`}>
                        <Icon size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{config.label}</p>
                        <h4 className="text-xl font-extrabold text-slate-800 mt-0.5">{count}</h4>
                      </div>
                    </div>
                    <div className="w-full mt-1 hidden sm:block">
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            type === 'NOTA_DINAS' ? 'bg-emerald-500' :
                            type === 'SURAT_MASUK' ? 'bg-indigo-500' :
                            type === 'SURAT_KELUAR' ? 'bg-sky-500' :
                            type === 'UNDANGAN_MASUK' ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">{percentage}% dari total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Visual Progress & Quick Shortcuts (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Add Shortcut Panel */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold">Pencatatan Cepat</h2>
              <p className="text-xs text-slate-400 mt-0.5">Pilih kategori dokumen yang ingin dicatat secara langsung</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => onAddDocClick('NOTA_DINAS')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 text-left cursor-pointer transition-all hover:border-emerald-500/50 group"
              >
                <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:bg-emerald-500/20">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold">Nota Dinas</p>
                  <p className="text-[9px] text-slate-400">Internal Memo</p>
                </div>
              </button>

              <button 
                onClick={() => onAddDocClick('SURAT_MASUK')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 text-left cursor-pointer transition-all hover:border-indigo-500/50 group"
              >
                <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:bg-indigo-500/20">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold">Surat Masuk</p>
                  <p className="text-[9px] text-slate-400">Penerimaan</p>
                </div>
              </button>

              <button 
                onClick={() => onAddDocClick('SURAT_KELUAR')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 text-left cursor-pointer transition-all hover:border-sky-500/50 group"
              >
                <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg group-hover:bg-sky-500/20">
                  <Send size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold">Surat Keluar</p>
                  <p className="text-[9px] text-slate-400">Pengiriman</p>
                </div>
              </button>

              <button 
                onClick={() => onAddDocClick('UNDANGAN_MASUK')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 text-left cursor-pointer transition-all hover:border-amber-500/50 group"
              >
                <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg group-hover:bg-amber-500/20">
                  <CalendarDays size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold">Undangan M.</p>
                  <p className="text-[9px] text-slate-400">Kegiatan Masuk</p>
                </div>
              </button>
            </div>
          </div>

          {/* Productivity Radial & Progress Panel */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-6">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-500" />
              Persentase Penyelesaian
            </h2>

            {/* Custom SVG gauge chart */}
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Outer Background Circle */}
                  <circle 
                    cx="72" 
                    cy="72" 
                    r="60" 
                    className="stroke-slate-100" 
                    strokeWidth="10" 
                    fill="transparent" 
                  />
                  {/* Progress Circle with nice gradient color */}
                  <circle 
                    cx="72" 
                    cy="72" 
                    r="60" 
                    className="stroke-indigo-600" 
                    strokeWidth="10" 
                    fill="transparent" 
                    strokeDasharray={377}
                    strokeDashoffset={377 - (377 * (stats.total > 0 ? (stats.completed / stats.total) : 0))}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
                {/* Absolute Centered Text */}
                <div className="absolute text-center">
                  <p className="text-3xl font-extrabold text-slate-800">
                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tuntas</p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm font-bold text-slate-700">
                  {stats.completed} dari {stats.total} Dokumen Diarsipkan
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Laju penyelesaian berkas meningkat minggu ini. Keep it up!
                </p>
              </div>
            </div>

            {/* Micro progress bars for Priorities */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prioritas Dokumen Aktif</p>
              
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>Sangat Penting</span>
                    <span className="text-rose-600">{stats.priorities.SANGAT_PENTING} Dokumen</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full" 
                      style={{ width: `${stats.total > 0 ? (stats.priorities.SANGAT_PENTING / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>Penting</span>
                    <span className="text-amber-600">{stats.priorities.PENTING} Dokumen</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full" 
                      style={{ width: `${stats.total > 0 ? (stats.priorities.PENTING / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>Biasa</span>
                    <span className="text-slate-600">{stats.priorities.BIASA} Dokumen</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-slate-400 h-full rounded-full" 
                      style={{ width: `${stats.total > 0 ? (stats.priorities.BIASA / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
