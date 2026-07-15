/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Document, DocType, DocStatus, Priority } from '../types';
import { 
  X, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  Mail, 
  Send, 
  CalendarDays, 
  AlertTriangle, 
  CheckCircle2, 
  BellRing,
  Volume2,
  FileDown
} from 'lucide-react';

interface DocumentDetailProps {
  document: Document | null;
  onClose: () => void;
  onEditClick: (doc: Document) => void;
  onDeleteClick: (docId: string) => void;
  onToggleStatus: (docId: string, status: DocStatus) => void;
}

export default function DocumentDetail({ 
  document, 
  onClose, 
  onEditClick, 
  onDeleteClick, 
  onToggleStatus 
}: DocumentDetailProps) {
  if (!document) return null;

  const todayStr = '2026-07-15';
  const today = new Date(todayStr);

  const getDaysDifference = (dateStr1: string, dateStr2: string): number => {
    const [y1, m1, d1] = dateStr1.split('-').map(Number);
    const [y2, m2, d2] = dateStr2.split('-').map(Number);
    const utc1 = Date.UTC(y1, m1 - 1, d1);
    const utc2 = Date.UTC(y2, m2 - 1, d2);
    return Math.round((utc1 - utc2) / (1000 * 60 * 60 * 24));
  };

  const docTypeConfig: Record<DocType, { label: string; color: string; bg: string; text: string; border: string; icon: any }> = {
    NOTA_DINAS: { label: 'Nota Dinas', color: 'emerald', bg: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-700', border: 'border-emerald-200/60', icon: FileText },
    SURAT_MASUK: { label: 'Surat Masuk', color: 'indigo', bg: 'bg-indigo-50 text-indigo-700', text: 'text-indigo-700', border: 'border-indigo-200/60', icon: Mail },
    SURAT_KELUAR: { label: 'Surat Keluar', color: 'sky', bg: 'bg-sky-50 text-sky-700', text: 'text-sky-700', border: 'border-sky-200/60', icon: Send },
    UNDANGAN_MASUK: { label: 'Undangan Masuk', color: 'amber', bg: 'bg-amber-50 text-amber-700', text: 'text-amber-700', border: 'border-amber-200/60', icon: CalendarDays },
    UNDANGAN_KELUAR: { label: 'Undangan Keluar', color: 'rose', bg: 'bg-rose-50 text-rose-700', text: 'text-rose-700', border: 'border-rose-200/60', icon: CalendarDays },
    KEGIATAN_ACARA: { label: 'Kegiatan / Acara', color: 'violet', bg: 'bg-violet-50 text-violet-700', text: 'text-violet-700', border: 'border-violet-200/60', icon: Calendar },
  };

  const config = docTypeConfig[document.type];
  const Icon = config.icon;

  const getStatusDisplay = (status: DocStatus) => {
    switch (status) {
      case 'SELESAI':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Selesai / Diarsipkan</span>;
      case 'SEDANG_DIPROSES':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 animate-pulse">Sedang Diproses</span>;
      case 'BELUM_DIPROSES':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">Baru / Belum Diproses</span>;
      case 'TERLAMBAT':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Terlambat ditindaklanjuti</span>;
    }
  };

  const getPriorityDisplay = (priority: Priority) => {
    switch (priority) {
      case 'SANGAT_PENTING':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Sangat Penting</span>;
      case 'PENTING':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Penting</span>;
      case 'BIASA':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200">Biasa</span>;
    }
  };

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

  // Play a mock reminder notification alarm using the browser Web Audio API
  const playAlarmSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Ring sequence: two quick high-pitched beeps
      const playBeep = (delay: number, duration: number, frequency: number) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.value = frequency;
        
        // Volume envelope
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + delay + 0.02);
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime + delay + duration - 0.02);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + delay + duration);
        
        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + duration);
      };

      // Play double chime
      playBeep(0, 0.15, 880); // A5 note
      playBeep(0.2, 0.35, 1109); // C#6 note
    } catch (e) {
      console.warn('Audio Context is not allowed or supported on this browser', e);
    }
  };

  // Calculate dynamic days left
  const getDaysLeftText = () => {
    if (!document.dueDate) return null;
    const diffDays = getDaysDifference(document.dueDate, todayStr);

    if (diffDays === 0) {
      return <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Hari ini</span>;
    } else if (diffDays === 1) {
      return <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Besok</span>;
    } else if (diffDays > 1) {
      return <span className="text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded">{diffDays} hari lagi</span>;
    } else {
      return <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Terlambat {Math.abs(diffDays)} hari</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Banner header containing icon */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${config.bg} border ${config.border} shadow-inner`}>
              <Icon size={24} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">{config.label}</span>
              {document.regNumber && <h2 className="text-xs font-bold text-slate-500 font-mono mt-0.5">{document.regNumber}</h2>}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Detail Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Document Title / Perihal */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {document.type === 'KEGIATAN_ACARA' ? 'Nama Kegiatan / Acara' : 'Perihal / Judul Dokumen'}
            </p>
            <h1 className="text-lg font-black text-slate-800 leading-snug">{document.title}</h1>
          </div>

          {/* Core Info Boxes */}
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tingkat Prioritas</p>
            <div className="mt-1">{getPriorityDisplay(document.priority)}</div>
          </div>

          {/* Dates & Timeline */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alur & Jadwal Waktu</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-xs">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Tanggal Dokumen</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{formatDateIndo(document.dateCreated)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-xs">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">
                    {document.type === 'KEGIATAN_ACARA' ? 'Tanggal Agenda' : document.type.endsWith('MASUK') ? 'Tanggal Diterima' : 'Tanggal Dikirim'}
                  </p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{formatDateIndo(document.dateReceivedOrSent)}</p>
                </div>
              </div>
            </div>

            {document.dueDate && (
              <div className="p-4 bg-indigo-50/30 border border-indigo-100/60 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="text-indigo-600" size={16} />
                    <span className="text-xs font-bold text-slate-700">
                      {(document.type.startsWith('UNDANGAN') || document.type === 'KEGIATAN_ACARA') ? 'Jadwal Pelaksanaan Kegiatan' : 'Batas Waktu Penyelesaian'}
                    </span>
                  </div>
                  {getDaysLeftText()}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block">Hari & Tanggal</span>
                    <span className="font-bold text-slate-700 block mt-0.5">{formatDateIndo(document.dueDate)}</span>
                  </div>
                  {document.dueTime && (
                    <div>
                      <span className="text-slate-400 font-semibold block">Waktu Mulai</span>
                      <span className="font-bold text-slate-700 block mt-0.5">Pukul {document.dueTime} WIB</span>
                    </div>
                  )}
                </div>

                {document.locationOrRoom && (
                  <div className="flex items-start gap-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5 mt-1">
                    <MapPin size={14} className="text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-400 font-semibold block">Lokasi / Ruangan</span>
                      <span className="font-bold text-slate-700 mt-0.5 block">{document.locationOrRoom}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Alarm Details */}
          {document.dueDate && (
            <div className="bg-amber-50/30 border border-amber-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl ${document.reminderActive ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                  <BellRing size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-700">Alarm Pengingat Otomatis</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {document.reminderActive 
                      ? `Aktif: Berbunyi ${document.reminderDaysBefore} hari sebelum batas waktu.`
                      : 'Nonaktif: Tidak ada pemicu alarm peringatan.'}
                  </p>
                </div>
              </div>

              {document.reminderActive && (
                <button 
                  onClick={playAlarmSound}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-amber-200 hover:bg-amber-50 text-amber-700 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                  title="Tes suara sirine pengingat"
                >
                  <Volume2 size={14} />
                  Tes Suara Alarm
                </button>
              )}
            </div>
          )}

          {/* Description Notes */}
          {document.description && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ringkasan Berkas / Catatan Catatan</p>
              <div className="p-3.5 bg-slate-50 border border-slate-200/50 rounded-xl text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                {document.description}
              </div>
            </div>
          )}

          {/* Current Status display & modification */}
          <div className="space-y-2 border-t border-slate-100 pt-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Saat Ini & Pembaruan Cepat</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>{getStatusDisplay(document.status)}</div>
              
              <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
                {[
                  { key: 'BELUM_DIPROSES', label: 'Belum' },
                  { key: 'SEDANG_DIPROSES', label: 'Proses' },
                  { key: 'SELESAI', label: 'Selesai' }
                ].map(st => (
                  <button
                    key={st.key}
                    onClick={() => onToggleStatus(document.id, st.key as DocStatus)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      document.status === st.key 
                        ? 'bg-white text-slate-800 shadow-xs' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <button
            onClick={() => {
              onDeleteClick(document.id);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer p-2 rounded-xl hover:bg-rose-50 transition-all"
          >
            <Trash2 size={14} />
            Hapus Dokumen
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onEditClick(document);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
            >
              <Edit size={14} />
              Ubah Informasi
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-indigo-500/20 cursor-pointer active:scale-95 transition-all"
            >
              Tutup Detail
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
