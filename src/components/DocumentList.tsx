/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Document, DocType, DocStatus, Priority } from '../types';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Mail, 
  Send, 
  CalendarDays, 
  X, 
  List, 
  Grid,
  Check,
  Download,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DocumentListProps {
  documents: Document[];
  onEditDocClick: (doc: Document) => void;
  onDeleteDocClick: (docId: string) => void;
  onViewDocClick: (doc: Document) => void;
  onToggleStatus: (docId: string, currentStatus: DocStatus) => void;
  activeFilterType?: string; // Passed from dashboard clicks
}

export default function DocumentList({ 
  documents, 
  onEditDocClick, 
  onDeleteDocClick, 
  onViewDocClick, 
  onToggleStatus,
  activeFilterType
}: DocumentListProps) {
  // Filters & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>(activeFilterType || 'ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('NEWEST'); // NEWEST, OLDEST, DUE_SOON, PRIORITY
  const [viewMode, setViewMode] = useState<'LIST' | 'GRID'>('LIST');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Sync activeFilterType from dashboard if it changes
  React.useEffect(() => {
    if (activeFilterType) {
      if (['nota_dinas', 'surat_masuk', 'surat_keluar', 'undangan_masuk', 'undangan_keluar', 'kegiatan_acara'].includes(activeFilterType)) {
        setTypeFilter(activeFilterType.toUpperCase());
      } else if (activeFilterType === 'terlambat') {
        setStatusFilter('TERLAMBAT');
        setTypeFilter('ALL');
      } else if (activeFilterType === 'belum_selesai') {
        setStatusFilter('BELUM_SELESAI');
        setTypeFilter('ALL');
      } else if (activeFilterType === 'selesai') {
        setStatusFilter('SELESAI');
        setTypeFilter('ALL');
      } else {
        setTypeFilter('ALL');
        setStatusFilter('ALL');
      }
    }
  }, [activeFilterType]);

  const todayStr = '2026-07-15';
  const today = new Date(todayStr);

  // Config mapper
  const docTypeConfig: Record<DocType, { label: string; bg: string; text: string; border: string; icon: any }> = {
    NOTA_DINAS: { label: 'Nota Dinas', bg: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-700', border: 'border-emerald-100', icon: FileText },
    SURAT_MASUK: { label: 'Surat Masuk', bg: 'bg-indigo-50 text-indigo-700', text: 'text-indigo-700', border: 'border-indigo-100', icon: Mail },
    SURAT_KELUAR: { label: 'Surat Keluar', bg: 'bg-sky-50 text-sky-700', text: 'text-sky-700', border: 'border-sky-100', icon: Send },
    UNDANGAN_MASUK: { label: 'Undangan Masuk', bg: 'bg-amber-50 text-amber-700', text: 'text-amber-700', border: 'border-amber-100', icon: CalendarDays },
    UNDANGAN_KELUAR: { label: 'Undangan Keluar', bg: 'bg-rose-50 text-rose-700', text: 'text-rose-700', border: 'border-rose-100', icon: CalendarDays },
    KEGIATAN_ACARA: { label: 'Kegiatan / Acara', bg: 'bg-violet-50 text-violet-700', text: 'text-violet-700', border: 'border-violet-100', icon: Calendar },
  };

  const getStatusBadge = (status: DocStatus) => {
    switch (status) {
      case 'SELESAI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 size={12} /> Selesai
          </span>
        );
      case 'SEDANG_DIPROSES':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 animate-pulse">
            <Clock size={12} /> Diproses
          </span>
        );
      case 'BELUM_DIPROSES':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            <Clock size={12} /> Baru / Belum
          </span>
        );
      case 'TERLAMBAT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <AlertTriangle size={12} /> Terlambat
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'SANGAT_PENTING':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Sangat Penting</span>;
      case 'PENTING':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Penting</span>;
      case 'BIASA':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">Biasa</span>;
    }
  };

  // Filter & sort logic
  const filteredDocuments = useMemo(() => {
    return documents
      .filter(doc => {
        // Search
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          doc.title.toLowerCase().includes(searchLower) ||
          doc.regNumber.toLowerCase().includes(searchLower) ||
          (doc.senderOrReceiver && doc.senderOrReceiver.toLowerCase().includes(searchLower)) ||
          (doc.description && doc.description.toLowerCase().includes(searchLower));

        // Type Filter
        const matchesType = typeFilter === 'ALL' || doc.type === typeFilter;

        // Status Filter
        let matchesStatus = true;
        if (statusFilter !== 'ALL') {
          if (statusFilter === 'BELUM_SELESAI') {
            matchesStatus = doc.status !== 'SELESAI';
          } else if (statusFilter === 'TERLAMBAT') {
            const isActuallyOverdue = doc.status === 'TERLAMBAT' || (doc.status !== 'SELESAI' && doc.dueDate && new Date(doc.dueDate) < today);
            matchesStatus = isActuallyOverdue;
          } else {
            matchesStatus = doc.status === statusFilter;
          }
        }

        // Priority Filter
        const matchesPriority = priorityFilter === 'ALL' || doc.priority === priorityFilter;

        return matchesSearch && matchesType && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        if (sortBy === 'NEWEST') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'OLDEST') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'DUE_SOON') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (sortBy === 'PRIORITY') {
          const priorityWeight = { SANGAT_PENTING: 3, PENTING: 2, BIASA: 1 };
          return priorityWeight[b.priority] - priorityWeight[a.priority];
        }
        return 0;
      });
  }, [documents, searchTerm, typeFilter, statusFilter, priorityFilter, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
  };

  const formatDateIndo = (dateStr?: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const year = parts[0];
    const month = months[parseInt(parts[1], 10) - 1];
    const day = parts[2];
    return `${parseInt(day, 10)} ${month} ${year}`;
  };

  // Quick export file of current table list (JSON / text-based)
  const handleExportCSV = () => {
    const headers = ['Tipe', 'Nomor Dokumen', 'Perihal/Judul', 'Tgl Dokumen', 'Batas Waktu', 'Status', 'Prioritas'];
    const rows = filteredDocuments.map(doc => [
      docTypeConfig[doc.type]?.label || doc.type,
      `"${doc.regNumber}"`,
      `"${doc.title.replace(/"/g, '""')}"`,
      doc.dateCreated,
      doc.dueDate || '-',
      doc.status,
      doc.priority
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Dokumen_Ekspor_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Search & Layout Toggles */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nomor surat, perihal, pengirim, ringkasan catatan..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-start">
            <div className="flex items-center gap-1 border border-slate-200/80 rounded-xl p-1 bg-slate-50">
              <button 
                onClick={() => setViewMode('LIST')}
                className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${viewMode === 'LIST' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <List size={16} />
                <span className="hidden sm:inline">Daftar</span>
              </button>
              <button 
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${viewMode === 'GRID' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Grid size={16} />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>

            <button 
              onClick={handleExportCSV}
              disabled={filteredDocuments.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200/85 hover:bg-slate-50 active:scale-95 text-slate-600 rounded-xl text-sm transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Ekspor Excel</span>
            </button>
          </div>
        </div>

        {/* Detailed Filters row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 text-xs text-slate-400 mr-2">
            <Filter size={14} />
            <span>Saring:</span>
          </div>

          {/* Type dropdown */}
          <div className="relative">
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 text-xs rounded-xl pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <option value="ALL">Semua Jenis Dokumen</option>
              <option value="NOTA_DINAS">Nota Dinas</option>
              <option value="SURAT_MASUK">Surat Masuk</option>
              <option value="SURAT_KELUAR">Surat Keluar</option>
              <option value="UNDANGAN_MASUK">Undangan Masuk</option>
              <option value="UNDANGAN_KELUAR">Undangan Keluar</option>
              <option value="KEGIATAN_ACARA">Kegiatan / Acara</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
          </div>

          {/* Status dropdown */}
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 text-xs rounded-xl pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="BELUM_SELESAI">Belum Selesai (Aktif)</option>
              <option value="BELUM_DIPROSES">Baru / Belum Diproses</option>
              <option value="SEDANG_DIPROSES">Sedang Diproses</option>
              <option value="SELESAI">Selesai / Diarsipkan</option>
              <option value="TERLAMBAT">Terlambat</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
          </div>

          {/* Priority dropdown */}
          <div className="relative">
            <select 
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 text-xs rounded-xl pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <option value="ALL">Semua Prioritas</option>
              <option value="SANGAT_PENTING">Sangat Penting</option>
              <option value="PENTING">Penting</option>
              <option value="BIASA">Biasa</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 text-xs rounded-xl pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <option value="NEWEST">Terbaru Ditambahkan</option>
              <option value="OLDEST">Terlama Ditambahkan</option>
              <option value="DUE_SOON">Batas Waktu Terdekat</option>
              <option value="PRIORITY">Prioritas Tertinggi</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
          </div>

          {/* Active Filters Clear Badge */}
          {(typeFilter !== 'ALL' || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || searchTerm !== '') && (
            <button 
              onClick={clearFilters}
              className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl cursor-pointer transition-all"
            >
              Hapus Saringan
              <X size={12} />
            </button>
          )}

          <div className="ml-auto text-xs font-medium text-slate-400">
            Menampilkan <span className="text-slate-700 font-bold">{filteredDocuments.length}</span> dari {documents.length} dokumen
          </div>
        </div>
      </div>

      {/* Main List Display Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
          <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl mb-3">
            <Search size={40} className="stroke-1" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Tidak ada dokumen ditemukan</h3>
          <p className="text-sm text-slate-400 max-w-sm mt-1">
            Cobalah ubah kata kunci pencarian atau bersihkan saringan untuk melihat daftar dokumen kembali.
          </p>
          <button 
            onClick={clearFilters}
            className="mt-4 inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            Reset Pencarian & Saringan
          </button>
        </div>
      ) : viewMode === 'LIST' ? (
        /* Desktop Table Layout */
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Tipe & Nomor</th>
                  <th className="px-6 py-4">Perihal / Judul</th>
                  <th className="px-6 py-4">Batas Waktu</th>
                  <th className="px-6 py-4">Prioritas</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDocuments.map(doc => {
                  const typeCfg = docTypeConfig[doc.type];
                  const Icon = typeCfg.icon;
                  const isMenuOpen = activeMenuId === doc.id;

                  return (
                    <tr 
                      key={doc.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      {/* Doc Type & Reg Number */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-lg ${typeCfg.bg} border ${typeCfg.border}`}>
                            <Icon size={16} />
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">{typeCfg.label}</span>
                            <p className="font-semibold text-slate-700 font-mono text-xs mt-0.5 max-w-[150px] truncate" title={doc.regNumber}>
                              {doc.regNumber}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Title / Perihal */}
                      <td className="px-6 py-4 max-w-xs">
                        <div 
                          onClick={() => onViewDocClick(doc)}
                          className="font-bold text-slate-800 hover:text-indigo-600 cursor-pointer transition-colors line-clamp-2 leading-snug"
                        >
                          {doc.title}
                        </div>
                        {doc.description && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{doc.description}</p>
                        )}
                      </td>

                      {/* Batas Waktu / Pelaksanaan */}
                      <td className="px-6 py-4">
                        {doc.dueDate ? (
                          <div>
                            <p className="font-semibold text-slate-700 text-xs">
                              {formatDateIndo(doc.dueDate)}
                            </p>
                            {doc.dueTime && (
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Pukul {doc.dueTime} WIB</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Prioritas */}
                      <td className="px-6 py-4">
                        {getPriorityBadge(doc.priority)}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => onToggleStatus(doc.id, doc.status)}
                          title="Klik untuk ubah status cepat"
                          className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                        >
                          {getStatusBadge(doc.status)}
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-4 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => onViewDocClick(doc)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Detail Dokumen"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => onEditDocClick(doc)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Dokumen"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              onDeleteDocClick(doc.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Hapus Dokumen"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Grid Layout (Used on mobile OR when Grid mode is toggled) */}
      <div className={`${viewMode === 'GRID' ? 'grid' : 'flex md:hidden flex-col'} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`}>
        {filteredDocuments.map(doc => {
          const typeCfg = docTypeConfig[doc.type];
          const Icon = typeCfg.icon;

          return (
            <div 
              key={doc.id}
              className="bg-white border border-slate-100 hover:border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col justify-between gap-4 hover:shadow-md transition-all relative group"
            >
              {/* Header inside Card */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${typeCfg.bg} border ${typeCfg.border}`}>
                    <Icon size={12} strokeWidth={2.5} />
                    {typeCfg.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => onToggleStatus(doc.id, doc.status)}
                      className="cursor-pointer"
                    >
                      {getStatusBadge(doc.status)}
                    </button>
                  </div>
                </div>

                <div 
                  onClick={() => onViewDocClick(doc)}
                  className="font-extrabold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2 cursor-pointer pt-1"
                >
                  {doc.title}
                </div>
                <p className="text-xs text-slate-400 font-semibold font-mono">{doc.regNumber}</p>
                {doc.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed pt-1 border-t border-slate-50">{doc.description}</p>
                )}
              </div>

              {/* Footer info inside Card */}
              <div className="border-t border-slate-100 pt-3 mt-1 space-y-2">
                <div className="text-[11px]">
                  <span className="text-slate-400 block font-medium">Batas Waktu</span>
                  <span className="font-bold text-slate-700 block mt-0.5">
                    {doc.dueDate ? formatDateIndo(doc.dueDate) : '-'}
                  </span>
                </div>

                {/* Bottom line: Priority badge and direct Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  {getPriorityBadge(doc.priority)}
                  
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl">
                    <button 
                      onClick={() => onViewDocClick(doc)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                      title="Lihat Detail"
                    >
                      <Eye size={14} />
                    </button>
                    <button 
                      onClick={() => onEditDocClick(doc)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg cursor-pointer"
                      title="Edit"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => {
                        onDeleteDocClick(doc.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
