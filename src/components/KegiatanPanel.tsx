/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Document, DocStatus, Priority, DocType } from '../types';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Search, 
  Bell, 
  BellRing, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Edit2, 
  Eye, 
  Check, 
  Volume2, 
  Info,
  CalendarDays
} from 'lucide-react';

interface KegiatanPanelProps {
  documents: Document[];
  onEditDocClick: (doc: Document) => void;
  onDeleteDocClick: (docId: string) => void;
  onViewDocClick: (doc: Document) => void;
  onToggleStatus: (docId: string, status?: DocStatus) => void;
  onAddDocClick: (type?: DocType) => void;
}

export default function KegiatanPanel({
  documents,
  onEditDocClick,
  onDeleteDocClick,
  onViewDocClick,
  onToggleStatus,
  onAddDocClick
}: KegiatanPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MENDATANG' | 'SELESAI' | 'TERLAMBAT'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'BIASA' | 'PENTING' | 'SANGAT_PENTING'>('ALL');

  const todayStr = '2026-07-15';
  const today = new Date(todayStr);

  // Filter only KEGIATAN_ACARA type documents
  const kegiatanDocs = useMemo(() => {
    return documents.filter(doc => doc.type === 'KEGIATAN_ACARA');
  }, [documents]);

  // Statistics
  const stats = useMemo(() => {
    let total = kegiatanDocs.length;
    let upcoming = 0;
    let alarmActive = 0;
    let completed = 0;

    kegiatanDocs.forEach(doc => {
      if (doc.status === 'SELESAI') {
        completed++;
      } else {
        upcoming++;
      }

      if (doc.reminderActive && doc.status !== 'SELESAI') {
        alarmActive++;
      }
    });

    return { total, upcoming, alarmActive, completed };
  }, [kegiatanDocs]);

  // Filtered & Sorted events
  const filteredKegiatan = useMemo(() => {
    return kegiatanDocs
      .filter(doc => {
        // Search
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          doc.title.toLowerCase().includes(searchLower) ||
          doc.regNumber.toLowerCase().includes(searchLower) ||
          (doc.locationOrRoom && doc.locationOrRoom.toLowerCase().includes(searchLower)) ||
          (doc.description && doc.description.toLowerCase().includes(searchLower));

        // Status Filter
        let matchesStatus = true;
        if (statusFilter === 'MENDATANG') {
          matchesStatus = doc.status !== 'SELESAI' && doc.status !== 'TERLAMBAT';
        } else if (statusFilter === 'SELESAI') {
          matchesStatus = doc.status === 'SELESAI';
        } else if (statusFilter === 'TERLAMBAT') {
          matchesStatus = doc.status === 'TERLAMBAT';
        }

        // Priority Filter
        const matchesPriority = priorityFilter === 'ALL' || doc.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        // Sort by event date (dueDate) ascending (soonest first)
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [kegiatanDocs, searchTerm, statusFilter, priorityFilter]);

  // Helper date formatter
  const formatDateIndo = (dateStr?: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
  };

  const getCalendarSheet = (dateStr?: string) => {
    if (!dateStr) return { day: '-', month: '-' };
    const parts = dateStr.split('-');
    if (parts.length !== 3) return { day: '-', month: '-' };
    const monthsShort = [
      'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN',
      'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'
    ];
    return {
      day: parseInt(parts[2], 10),
      month: monthsShort[parseInt(parts[1], 10) - 1]
    };
  };

  const getDaysDifference = (dateStr1: string, dateStr2: string): number => {
    const [y1, m1, d1] = dateStr1.split('-').map(Number);
    const [y2, m2, d2] = dateStr2.split('-').map(Number);
    const utc1 = Date.UTC(y1, m1 - 1, d1);
    const utc2 = Date.UTC(y2, m2 - 1, d2);
    return Math.round((utc1 - utc2) / (1000 * 60 * 60 * 24));
  };

  const getCountdownText = (doc: Document) => {
    if (!doc.dueDate) return null;
    if (doc.status === 'SELESAI') {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-xl">
          <CheckCircle2 size={12} /> Selesai
        </span>
      );
    }

    const diffDays = getDaysDifference(doc.dueDate, todayStr);

    if (diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-rose-600 font-extrabold bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200/50 animate-pulse">
          <AlertTriangle size={12} /> Hari ini!
        </span>
      );
    } else if (diffDays === 1) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/50">
          <Clock size={12} /> Besok
        </span>
      );
    } else if (diffDays > 1) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-1 rounded-xl">
          <Calendar size={12} /> {diffDays} hari lagi
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-rose-600 font-extrabold bg-rose-100 px-2.5 py-1 rounded-xl border border-rose-300/50">
          <AlertTriangle size={12} /> Terlewat {Math.abs(diffDays)} hari
        </span>
      );
    }
  };

  // Play a beautiful bell test chime sound
  const playTestChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.value = 523.25; // C5 note
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.85);
    } catch (e) {
      // Sound blocked by browser security
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Info */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Abstract design blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/5 rounded-full blur-xl -ml-12 -mb-12"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
              <CalendarDays size={12} className="text-violet-200" />
              <span>Direktori Agenda TURT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pengingat Kegiatan & Acara
            </h1>
            <p className="text-xs sm:text-sm text-violet-100/90 leading-relaxed">
              Kelola jadwal rapat, sosialisasi, senam, dan berbagai agenda kegiatan kedinasan. Sistem akan membunyikan alarm visual & audio untuk menjamin kehadiran tepat waktu.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={playTestChime}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-extrabold text-xs px-4 py-3 rounded-2xl border border-white/15 cursor-pointer transition-all shadow-sm"
              title="Uji coba suara alarm pengingat"
            >
              <Volume2 size={15} />
              Tes Alarm
            </button>
            <button
              onClick={() => onAddDocClick('KEGIATAN_ACARA')}
              className="inline-flex items-center gap-1.5 bg-white text-indigo-950 hover:bg-indigo-50 active:scale-95 font-extrabold text-xs px-5 py-3 rounded-2xl cursor-pointer transition-all shadow-lg"
            >
              <Plus size={16} className="stroke-[3]" />
              Catat Agenda Baru
            </button>
          </div>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Agenda Kegiatan', val: stats.total, color: 'border-slate-100 text-slate-800 bg-white' },
          { label: 'Agenda Mendatang', val: stats.upcoming, color: 'border-violet-100 text-violet-800 bg-violet-50/25' },
          { label: 'Alarm Pengingat Aktif', val: stats.alarmActive, color: 'border-amber-100 text-amber-800 bg-amber-50/25' },
          { label: 'Telah Selesai', val: stats.completed, color: 'border-emerald-100 text-emerald-800 bg-emerald-50/25' },
        ].map((stat, idx) => (
          <div key={idx} className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between ${stat.color}`}>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider leading-snug">{stat.label}</span>
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">{stat.val}</span>
          </div>
        ))}
      </div>

      {/* Filter and Search Controls Row */}
      <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari perihal kegiatan, ruang rapat, nomor agenda..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
          </div>

          {/* Tab Sifters */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-2xl border border-slate-100 self-start">
            {[
              { val: 'ALL', label: 'Semua Agenda' },
              { val: 'MENDATANG', label: 'Mendatang' },
              { val: 'SELESAI', label: 'Selesai' },
              { val: 'TERLAMBAT', label: 'Terlambat' },
            ].map(tab => (
              <button
                key={tab.val}
                onClick={() => setStatusFilter(tab.val as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.val
                    ? 'bg-white text-violet-700 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Priority dropdown */}
          <div className="relative self-start sm:self-auto min-w-[150px]">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 text-xs rounded-2xl pl-3.5 pr-8 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all cursor-pointer font-semibold"
            >
              <option value="ALL">Semua Prioritas</option>
              <option value="SANGAT_PENTING">Sangat Penting</option>
              <option value="PENTING">Penting</option>
              <option value="BIASA">Biasa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Cards Grid */}
      {filteredKegiatan.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
          <div className="p-4 bg-slate-50 text-slate-300 rounded-2xl mb-3">
            <Calendar size={40} className="stroke-1" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Tidak ada agenda kegiatan</h3>
          <p className="text-sm text-slate-400 max-w-sm mt-1">
            {kegiatanDocs.length === 0 
              ? 'Belum ada agenda kegiatan yang dicatat. Mulailah mencatat agenda kegiatan/acara kedinasan baru.'
              : 'Tidak ada agenda kegiatan yang cocok dengan kriteria saringan pencarian Anda.'}
          </p>
          <button 
            onClick={() => {
              if (kegiatanDocs.length === 0) {
                onAddDocClick('KEGIATAN_ACARA');
              } else {
                setSearchTerm('');
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
              }
            }}
            className="mt-4 inline-flex items-center bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-violet-500/10"
          >
            {kegiatanDocs.length === 0 ? 'Catat Agenda Pertama' : 'Reset Saringan'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredKegiatan.map(doc => {
            const cal = getCalendarSheet(doc.dueDate);
            const isResolved = doc.status === 'SELESAI';
            const isOverdue = doc.status === 'TERLAMBAT';

            return (
              <div 
                key={doc.id}
                className={`bg-white border rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                  isResolved 
                    ? 'border-slate-100 opacity-80' 
                    : isOverdue 
                    ? 'border-rose-100 bg-rose-50/5' 
                    : 'border-slate-100'
                }`}
              >
                {/* Header section with calendar and countdown */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Calendar visual badge */}
                    <div className={`w-12 h-14 rounded-2xl flex flex-col items-center justify-center border font-sans select-none shrink-0 ${
                      isResolved 
                        ? 'bg-slate-50 border-slate-200 text-slate-400' 
                        : isOverdue 
                        ? 'bg-rose-50 border-rose-100 text-rose-600'
                        : 'bg-violet-50/50 border-violet-100 text-violet-700'
                    }`}>
                      <span className="text-[9px] font-extrabold tracking-wider">{cal.month}</span>
                      <span className="text-lg font-black leading-none mt-0.5">{cal.day}</span>
                    </div>

                    {/* Right action badges */}
                    <div className="flex flex-col items-end gap-1.5">
                      {getCountdownText(doc)}
                      
                      {/* Priority Tag */}
                      {doc.priority === 'SANGAT_PENTING' && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-rose-50 text-rose-600 border border-rose-100">
                          SANGAT PENTING
                        </span>
                      )}
                      {doc.priority === 'PENTING' && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-50 text-amber-600 border border-amber-100">
                          PENTING
                        </span>
                      )}
                      {doc.priority === 'BIASA' && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200">
                          BIASA
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Details */}
                  <div className="space-y-2">
                    <h3 
                      onClick={() => onViewDocClick(doc)}
                      className={`font-extrabold text-sm text-slate-800 hover:text-violet-700 cursor-pointer transition-colors leading-snug line-clamp-2 ${
                        isResolved ? 'line-through text-slate-400' : ''
                      }`}
                      title={doc.title}
                    >
                      {doc.title}
                    </h3>
                    
                    {doc.regNumber && (
                      <span className="inline-block text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        {doc.regNumber}
                      </span>
                    )}

                    {doc.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed pt-1">
                        {doc.description}
                      </p>
                    )}
                  </div>

                  {/* Venue & Time Fields */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-50 text-xs">
                    {doc.dueTime && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock size={14} className="text-slate-400 shrink-0" />
                        <span className="font-semibold">Mulai Pukul {doc.dueTime} WIB</span>
                      </div>
                    )}
                    
                    {doc.locationOrRoom && (
                      <div className="flex items-start gap-2 text-slate-500">
                        <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                        <span className="font-semibold text-slate-600 line-clamp-1" title={doc.locationOrRoom}>
                          {doc.locationOrRoom}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card footer controls & toggles */}
                <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3">
                  {/* Reminder Alarm state */}
                  <div className="flex items-center gap-1.5 text-slate-400">
                    {doc.reminderActive && !isResolved ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600" title={`Mengingatkan ${doc.reminderDaysBefore} hari sebelumnya`}>
                        <BellRing size={12} className="animate-swing shrink-0" />
                        Ingat-{doc.reminderDaysBefore}H
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400" title="Alarm dinonaktifkan">
                        <Bell size={12} className="shrink-0" />
                        Mati
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {/* View Details */}
                    <button
                      onClick={() => onViewDocClick(doc)}
                      className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 text-slate-500 hover:text-slate-700 rounded-xl cursor-pointer transition-all active:scale-90"
                      title="Lihat Detail Agenda"
                    >
                      <Eye size={14} />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => onEditDocClick(doc)}
                      className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 text-indigo-600 hover:text-indigo-700 rounded-xl cursor-pointer transition-all active:scale-90"
                      title="Ubah Agenda"
                    >
                      <Edit2 size={14} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteDocClick(doc.id)}
                      className="p-1.5 hover:bg-white border border-transparent hover:border-rose-200 text-rose-500 hover:text-rose-600 rounded-xl cursor-pointer transition-all active:scale-90"
                      title="Hapus Agenda"
                    >
                      <Trash2 size={14} />
                    </button>

                    {/* Mark as Completed */}
                    {!isResolved && (
                      <button
                        onClick={() => onToggleStatus(doc.id, 'SELESAI')}
                        className="ml-1 inline-flex items-center gap-0.5 px-2.5 py-1 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white text-[10px] font-extrabold rounded-xl shadow-xs cursor-pointer transition-all"
                        title="Tandai kegiatan ini telah dilaksanakan / selesai"
                      >
                        <Check size={11} className="stroke-[3]" />
                        Selesai
                      </button>
                    )}

                    {isResolved && (
                      <button
                        onClick={() => onToggleStatus(doc.id, 'BELUM_DIPROSES')}
                        className="ml-1 inline-flex items-center gap-0.5 px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 active:scale-95 text-slate-600 text-[10px] font-extrabold rounded-xl cursor-pointer transition-all"
                        title="Kembalikan status kegiatan ke aktif"
                      >
                        Aktifkan
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
