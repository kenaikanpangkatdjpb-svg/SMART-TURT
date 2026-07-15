/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Document, DocType, DocStatus, Priority } from '../types';
import { 
  X, 
  Save, 
  Calendar, 
  Clock, 
  FileText, 
  Mail, 
  Send, 
  CalendarDays, 
  AlertCircle,
  MapPin,
  BellRing
} from 'lucide-react';

interface DocumentFormProps {
  documentToEdit?: Document | null;
  preferredType?: DocType | null;
  onSave: (docData: any) => void;
  onClose: () => void;
}

export default function DocumentForm({ documentToEdit, preferredType, onSave, onClose }: DocumentFormProps) {
  // Current local date in Indonesian timezone context (YYYY-MM-DD)
  const todayStr = '2026-07-15';

  // Form Fields State
  const [type, setType] = useState<DocType>('NOTA_DINAS');
  const [regNumber, setRegNumber] = useState('');
  const [title, setTitle] = useState('');
  const [senderOrReceiver, setSenderOrReceiver] = useState('');
  const [dateCreated, setDateCreated] = useState(todayStr);
  const [dateReceivedOrSent, setDateReceivedOrSent] = useState(todayStr);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [locationOrRoom, setLocationOrRoom] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<DocStatus>('BELUM_DIPROSES');
  const [priority, setPriority] = useState<Priority>('BIASA');
  const [reminderActive, setReminderActive] = useState(true);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(2);

  // Error validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (documentToEdit) {
      setType(documentToEdit.type);
      setRegNumber(documentToEdit.regNumber);
      setTitle(documentToEdit.title);
      setSenderOrReceiver(documentToEdit.senderOrReceiver);
      setDateCreated(documentToEdit.dateCreated);
      setDateReceivedOrSent(documentToEdit.dateReceivedOrSent);
      setDueDate(documentToEdit.dueDate || '');
      setDueTime(documentToEdit.dueTime || '');
      setLocationOrRoom(documentToEdit.locationOrRoom || '');
      setDescription(documentToEdit.description || '');
      setStatus(documentToEdit.status);
      setPriority(documentToEdit.priority);
      setReminderActive(documentToEdit.reminderActive);
      setReminderDaysBefore(documentToEdit.reminderDaysBefore);
    } else if (preferredType) {
      setType(preferredType);
    }
  }, [documentToEdit, preferredType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields
    const newErrors: Record<string, string> = {};
    if (type !== 'KEGIATAN_ACARA' && !regNumber.trim()) {
      newErrors.regNumber = 'Nomor Registrasi/Surat wajib diisi';
    }
    if (!title.trim()) {
      newErrors.title = type === 'KEGIATAN_ACARA' ? 'Nama Kegiatan/Acara wajib diisi' : 'Perihal/Judul wajib diisi';
    }
    if (type !== 'KEGIATAN_ACARA' && reminderActive && dueDate && !dateCreated) {
      newErrors.dateCreated = 'Tanggal dokumen diperlukan';
    }

    // Special validation for invitations and events
    if ((type.startsWith('UNDANGAN') || type === 'KEGIATAN_ACARA') && !dueDate) {
      newErrors.dueDate = 'Tanggal pelaksanaan kegiatan wajib diisi';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Save
    const docPayload = {
      id: documentToEdit ? documentToEdit.id : undefined,
      type,
      regNumber: type === 'KEGIATAN_ACARA' ? '' : regNumber.trim(),
      title: title.trim(),
      senderOrReceiver: '',
      dateCreated,
      dateReceivedOrSent,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      locationOrRoom: locationOrRoom ? locationOrRoom.trim() : undefined,
      description: description ? description.trim() : undefined,
      status,
      priority,
      reminderActive,
      reminderDaysBefore,
    };

    onSave(docPayload);
  };

  const isInvitation = type === 'UNDANGAN_MASUK' || type === 'UNDANGAN_KELUAR';
  const isEvent = type === 'KEGIATAN_ACARA';
  const hasEventDetails = isInvitation || isEvent;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl text-indigo-700 bg-indigo-50 border border-indigo-100`}>
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                {documentToEdit ? 'Ubah Informasi Dokumen' : 'Catat Dokumen Baru'}
              </h2>
              <p className="text-xs text-slate-400">Pastikan informasi diisi secara akurat untuk pengingat otomatis</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Document Type Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Jenis Dokumen</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { val: 'NOTA_DINAS', label: 'Nota Dinas', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50' },
                { val: 'SURAT_MASUK', label: 'Surat Masuk', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/50' },
                { val: 'SURAT_KELUAR', label: 'Surat Keluar', color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100/50' },
                { val: 'UNDANGAN_MASUK', label: 'Undangan M.', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/50' },
                { val: 'UNDANGAN_KELUAR', label: 'Undangan K.', color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/50' },
                { val: 'KEGIATAN_ACARA', label: 'Kegiatan/Acara', color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100/50' }
              ].map(item => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setType(item.val as DocType)}
                  className={`px-3 py-2 text-xs font-bold border rounded-xl transition-all cursor-pointer text-center ${
                    type === item.val 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-900/10' 
                      : item.color
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields Row 1 */}
          {type !== 'KEGIATAN_ACARA' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Nomor Registrasi / Surat <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={regNumber}
                onChange={(e) => {
                  setRegNumber(e.target.value);
                  if (errors.regNumber) setErrors(prev => ({ ...prev, regNumber: '' }));
                }}
                placeholder="Contoh: ND-102/WPB/2026 atau S-821/..."
                className={`w-full px-4 py-2 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.regNumber 
                    ? 'border-rose-400 focus:ring-rose-500/20' 
                    : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}
              />
              {errors.regNumber && (
                <p className="text-rose-500 text-xs font-medium mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.regNumber}
                </p>
              )}
            </div>
          )}

          {/* Form Fields Row 2: Perihal */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {type === 'KEGIATAN_ACARA' ? 'Nama Kegiatan / Acara' : 'Perihal / Judul Dokumen'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
              }}
              placeholder={type === 'KEGIATAN_ACARA' ? "Contoh: Rapat Kerja Nasional (Rakernas) DJPb 2026" : "Contoh: Usulan Kenaikan Pangkat Staf Periode II"}
              className={`w-full px-4 py-2 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                errors.title 
                  ? 'border-rose-400 focus:ring-rose-500/20' 
                  : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
              }`}
            />
            {errors.title && (
              <p className="text-rose-500 text-xs font-medium mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.title}
              </p>
            )}
          </div>

          {/* Form Dates Section */}
          {type !== 'KEGIATAN_ACARA' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tanggal Dokumen</label>
                <input
                  type="date"
                  value={dateCreated}
                  onChange={(e) => setDateCreated(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {type.endsWith('MASUK') ? 'Tanggal Diterima' : 'Tanggal Dikirim'}
                </label>
                <input
                  type="date"
                  value={dateReceivedOrSent}
                  onChange={(e) => setDateReceivedOrSent(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                />
              </div>
            </div>
          )}

          {/* Invitation Specific Fields OR Deadline fields */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isInvitation 
              ? 'bg-amber-50/30 border-amber-100/70' 
              : isEvent
              ? 'bg-violet-50/30 border-violet-100/70'
              : 'bg-indigo-50/30 border-indigo-100/70'
          }`}>
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              {isInvitation ? (
                <>
                  <CalendarDays className="text-amber-600" size={16} />
                  <span>Jadwal Pelaksanaan Kegiatan {type === 'UNDANGAN_MASUK' ? 'Masuk' : 'Keluar'}</span>
                </>
              ) : isEvent ? (
                <>
                  <Calendar className="text-violet-600" size={16} />
                  <span>Jadwal Pelaksanaan Kegiatan / Acara</span>
                </>
              ) : (
                <>
                  <Calendar className="text-indigo-600" size={16} />
                  <span>Batas Waktu Pelaporan / Tindak Lanjut</span>
                </>
              )}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Tanggal {hasEventDetails ? 'Pelaksanaan' : 'Jatuh Tempo'} {hasEventDetails && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    if (errors.dueDate) setErrors(prev => ({ ...prev, dueDate: '' }));
                  }}
                  className={`w-full px-3 py-1.5 border rounded-xl text-sm focus:outline-none focus:ring-2 bg-white ${
                    errors.dueDate 
                      ? 'border-rose-400 focus:ring-rose-500/20' 
                      : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                  }`}
                />
                {errors.dueDate && (
                  <p className="text-rose-500 text-[10px] font-medium mt-1">{errors.dueDate}</p>
                )}
              </div>

              {hasEventDetails ? (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Waktu Mulai</label>
                    <input
                      type="text"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      placeholder="Contoh: 09:00 atau 13:30"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                      <MapPin size={11} className={isEvent ? "text-violet-600" : "text-amber-600"} />
                      <span>Tempat / Ruang</span>
                    </label>
                    <input
                      type="text"
                      value={locationOrRoom}
                      onChange={(e) => setLocationOrRoom(e.target.value)}
                      placeholder="Contoh: Aula KPPN / Zoom"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    />
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2 flex items-center">
                  <span className="text-xs text-slate-400 italic">
                    Batas waktu digunakan untuk memicu alarm pengingat sebelum batas akhir berkas terlewati.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields Row 3: Priority & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={type === 'KEGIATAN_ACARA' ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tingkat Prioritas</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white cursor-pointer"
              >
                <option value="BIASA">Biasa (Harian/Umum)</option>
                <option value="PENTING">Penting (Mendesak)</option>
                <option value="SANGAT_PENTING">Sangat Penting (Prioritas Utama)</option>
              </select>
            </div>

            {type !== 'KEGIATAN_ACARA' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status Pengurusan</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DocStatus)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white cursor-pointer"
                >
                  <option value="BELUM_DIPROSES">Baru / Belum Diproses</option>
                  <option value="SEDANG_DIPROSES">Sedang Diproses</option>
                  <option value="SELESAI">Selesai / Sudah Diarsipkan</option>
                  <option value="TERLAMBAT">Terlambat</option>
                </select>
              </div>
            )}
          </div>

          {/* Reminder Trigger Controls */}
          {dueDate && (
            <div className="bg-amber-50/20 border border-amber-200/50 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl mt-0.5">
                  <BellRing size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Aktifkan Alarm Pengingat</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Kirim notifikasi pemicu sebelum batas waktu pelaksanaan</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderActive}
                    onChange={(e) => setReminderActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>

                {reminderActive && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500 font-semibold">Ingatkan</span>
                    <select
                      value={reminderDaysBefore}
                      onChange={(e) => setReminderDaysBefore(parseInt(e.target.value, 10))}
                      className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    >
                      <option value={1}>1 hari</option>
                      <option value={2}>2 hari</option>
                      <option value={3}>3 hari</option>
                      <option value={5}>5 hari</option>
                    </select>
                    <span className="text-xs text-slate-500 font-semibold">sebelumnya</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description Catatan */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ringkasan Isi / Catatan Catatan</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Berkas fisik ada di laci meja Rian. Perlu ditandatangani oleh Kasi Kepatuhan sebelum dikirim..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            ></textarea>
          </div>

        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-indigo-500/20 cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Save size={16} />
            Simpan Dokumen
          </button>
        </div>

      </div>
    </div>
  );
}
