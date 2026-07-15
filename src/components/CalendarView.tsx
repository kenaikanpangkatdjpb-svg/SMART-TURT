/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Document, DocType } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  FileText, 
  Mail, 
  Send, 
  CalendarDays,
  Clock,
  MapPin,
  HelpCircle
} from 'lucide-react';

interface CalendarViewProps {
  documents: Document[];
  onViewDocClick: (doc: Document) => void;
}

export default function CalendarView({ documents, onViewDocClick }: CalendarViewProps) {
  // We can navigate months dynamically
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // 0-indexed, so 6 is July

  const monthsIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // Document icons & colors mapper
  const docTypeConfig: Record<DocType, { label: string; bg: string; text: string; border: string; dot: string; icon: any }> = {
    NOTA_DINAS: { label: 'Nota Dinas', bg: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-700', icon: FileText },
    SURAT_MASUK: { label: 'Surat Masuk', bg: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500', text: 'text-indigo-700', icon: Mail },
    SURAT_KELUAR: { label: 'Surat Keluar', bg: 'bg-sky-50 text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500', text: 'text-sky-700', icon: Send },
    UNDANGAN_MASUK: { label: 'Undangan Masuk', bg: 'bg-amber-50 text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', text: 'text-amber-700', icon: CalendarDays },
    UNDANGAN_KELUAR: { label: 'Undangan Keluar', bg: 'bg-rose-50 text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', text: 'text-rose-700', icon: CalendarDays },
    KEGIATAN_ACARA: { label: 'Kegiatan / Acara', bg: 'bg-violet-50 text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500', text: 'text-violet-700', icon: Calendar },
  };

  // Generate days for the grid
  const calendarDays = useMemo(() => {
    // First day of current month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
    
    // Total days in current month
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Total days in previous month
    const totalDaysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{ day: number; isCurrentMonth: boolean; dateString: string }> = [];

    // Previous month filler days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const dayNum = totalDaysInPrevMonth - i;
      const monthStr = String(prevMonth + 1).padStart(2, '0');
      const dayStr = String(dayNum).padStart(2, '0');
      
      days.push({
        day: dayNum,
        isCurrentMonth: false,
        dateString: `${prevMonthYear}-${monthStr}-${dayStr}`
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(i).padStart(2, '0');
      
      days.push({
        day: i,
        isCurrentMonth: true,
        dateString: `${currentYear}-${monthStr}-${dayStr}`
      });
    }

    // Next month filler days to complete standard 6-row grid (42 cells)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const monthStr = String(nextMonth + 1).padStart(2, '0');
      const dayStr = String(i).padStart(2, '0');
      
      days.push({
        day: i,
        isCurrentMonth: false,
        dateString: `${nextMonthYear}-${monthStr}-${dayStr}`
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Group documents by due date
  const docsByDate = useMemo(() => {
    const map: Record<string, Document[]> = {};
    documents.forEach(doc => {
      if (doc.dueDate) {
        if (!map[doc.dueDate]) {
          map[doc.dueDate] = [];
        }
        map[doc.dueDate].push(doc);
      }
    });
    return map;
  }, [documents]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleGoToToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(6); // July
  };

  const todayStr = '2026-07-15';

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
      
      {/* Calendar Header / Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
            <Calendar size={20} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-800">Kalender Batas Waktu & Kegiatan</h2>
            <p className="text-xs text-slate-400">Visualisasi jadwal pelaksanaan undangan dan batas akhir penyelesaian dokumen</p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleGoToToday}
            className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            Hari Ini
          </button>
          
          <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
            <button 
              onClick={handlePrevMonth}
              className="p-1 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-xs font-bold text-slate-700 select-none min-w-[120px] text-center">
              {monthsIndo[currentMonth]} {currentYear}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-1 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
        <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] mr-1">Petunjuk Warna:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Nota Dinas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
          <span>Surat Masuk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
          <span>Surat Keluar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Undangan Masuk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Undangan Keluar</span>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50 shadow-inner">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-100 text-center py-2 text-xs font-extrabold text-slate-600 uppercase tracking-wider">
          {daysOfWeek.map(day => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 gap-px bg-slate-200/80">
          {calendarDays.map((cell, index) => {
            const dayDocs = docsByDate[cell.dateString] || [];
            const isToday = cell.dateString === todayStr;
            const hasDocs = dayDocs.length > 0;

            return (
              <div 
                key={index} 
                className={`min-h-[100px] p-2 flex flex-col justify-between transition-colors bg-white ${
                  cell.isCurrentMonth ? 'text-slate-800' : 'text-slate-300 bg-slate-50/40'
                } ${isToday ? 'bg-indigo-50/20' : ''}`}
              >
                {/* Date number tag */}
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                    isToday 
                      ? 'bg-indigo-600 text-white shadow-sm ring-4 ring-indigo-100 font-extrabold' 
                      : cell.isCurrentMonth ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    {cell.day}
                  </span>
                  {hasDocs && (
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md border border-slate-200/60">
                      {dayDocs.length} berkas
                    </span>
                  )}
                </div>

                {/* Day Documents listed inside the cell */}
                <div className="flex-1 space-y-1 overflow-y-auto max-h-[80px] pr-0.5 custom-scrollbar">
                  {dayDocs.map(doc => {
                    const cfg = docTypeConfig[doc.type];
                    const isCompleted = doc.status === 'SELESAI';

                    return (
                      <div 
                        key={doc.id}
                        onClick={() => onViewDocClick(doc)}
                        className={`text-[10px] p-1.5 rounded-lg border cursor-pointer select-none truncate font-semibold leading-tight flex items-center gap-1.5 transition-all ${
                          isCompleted 
                            ? 'bg-slate-50 text-slate-400 border-slate-100 line-through decoration-slate-300' 
                            : `${cfg.bg} ${cfg.text} ${cfg.border} hover:scale-[1.02] hover:shadow-xs`
                        }`}
                        title={`${cfg.label}: ${doc.title}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCompleted ? 'bg-slate-300' : cfg.dot}`}></span>
                        <span className="truncate flex-1">{doc.title}</span>
                        {doc.dueTime && (
                          <span className="text-[8px] font-bold text-slate-400 bg-slate-100/50 px-0.5 rounded shrink-0">{doc.dueTime}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
