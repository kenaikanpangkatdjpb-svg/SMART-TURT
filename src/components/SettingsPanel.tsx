/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppSettings, Document } from '../types';
import { 
  Settings, 
  User, 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  Volume2, 
  Sparkles, 
  ShieldAlert,
  BellRing,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface SettingsPanelProps {
  settings: AppSettings;
  documents: Document[];
  onSaveSettings: (settings: AppSettings) => void;
  onImportData: (importedDocs: Document[]) => void;
  onResetData: () => void;
}

export default function SettingsPanel({ 
  settings, 
  documents,
  onSaveSettings, 
  onImportData, 
  onResetData 
}: SettingsPanelProps) {
  // Local state for settings form
  const [userName, setUserName] = useState(settings.userName);
  const [userRole, setUserRole] = useState(settings.userRole);
  const [userDivision, setUserDivision] = useState(settings.userDivision);
  const [enableSound, setEnableSound] = useState(settings.enableSoundNotification);
  const [defaultReminderDays, setDefaultReminderDays] = useState(settings.defaultReminderDays);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      userName: userName.trim(),
      userRole: userRole.trim(),
      userDivision: userDivision.trim(),
      enableSoundNotification: enableSound,
      enableBrowserNotification: false,
      defaultReminderDays,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Export data as json file
  const handleExportJSON = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: {
        userName,
        userRole,
        userDivision,
        enableSoundNotification: enableSound,
        defaultReminderDays,
      },
      documents
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Backup_Pengingat_Dokumen_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  // Import data from json file
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.documents)) {
          onImportData(parsed.documents);
          setImportSuccess(true);
          setImportError('');
          setTimeout(() => setImportSuccess(false), 4000);
        } else {
          setImportError('Struktur berkas tidak sesuai. Pastikan berkas cadangan diunduh dari aplikasi ini.');
        }
      } catch (err) {
        setImportError('Format berkas tidak valid. Harap unggah berkas .json yang sah.');
      }
    };
    reader.readAsText(file);
  };

  const playChimeTest = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.value = 587.33; // D5 note, gentle chime
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.65);
    } catch (e) {
      console.warn('AudioContext not supported/allowed', e);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Profile Settings (7 Cols) */}
      <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
            <User size={20} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-800">Profil & Instansi Pengguna</h2>
            <p className="text-xs text-slate-400">Sesuaikan data diri Anda untuk disematkan di cetakan atau dokumen ekspor</p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
              <input 
                type="text" 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Rian Setyawan"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Jabatan Pekerjaan</label>
              <input 
                type="text" 
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                placeholder="Staf Administrasi Kepegawaian"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Unit Kerja / Seksi / Divisi</label>
            <input 
              type="text" 
              value={userDivision}
              onChange={(e) => setUserDivision(e.target.value)}
              placeholder="Subbagian Tata Usaha & Kepatuhan Internal"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            />
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Konfigurasi Pengingat Bawaan</h3>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg mt-0.5">
                  <BellRing size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Waktu Pengingat Bawaan</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Selisih hari sebelum batas waktu untuk memicu alarm dokumen baru</p>
                </div>
              </div>

              <select
                value={defaultReminderDays}
                onChange={(e) => setDefaultReminderDays(parseInt(e.target.value, 10))}
                className="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold cursor-pointer"
              >
                <option value={1}>1 Hari Sebelum Batas Akhir</option>
                <option value={2}>2 Hari Sebelum Batas Akhir</option>
                <option value={3}>3 Hari Sebelum Batas Akhir</option>
                <option value={5}>5 Hari Sebelum Batas Akhir</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg mt-0.5">
                  <Volume2 size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Bunyi Lonceng Pengingat</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Mainkan suara indikator lonceng ketika alarm mendesak dipicu</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={playChimeTest}
                  className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Tes Suara
                </button>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableSound}
                    onChange={(e) => setEnableSound(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            {saveSuccess && (
              <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 size={14} /> Pengaturan berhasil disimpan!
              </span>
            )}
            <button 
              type="submit"
              className="ml-auto inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg hover:shadow-indigo-500/10 cursor-pointer active:scale-95 transition-all"
            >
              <Save size={14} />
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Backup, Import, and Maintenance (5 Cols) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Backup & Import Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
              <Download size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Cadangan & Impor Data</h2>
              <p className="text-xs text-slate-400">Amankan data pengingat Anda dengan mengekspor berkas</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Aplikasi ini menyimpan semua data pengingat secara lokal di peramban Anda. Untuk mencegah kehilangan data akibat pembersihan cache, lakukan ekspor cadangan secara berkala.
          </p>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
            >
              <Download size={16} />
              Unduh Berkas Cadangan (.JSON)
            </button>

            {/* Hidden Input File */}
            <div className="relative">
              <input
                type="file"
                accept=".json"
                id="import-backup-file"
                onChange={handleImportFileChange}
                className="hidden"
              />
              <label
                htmlFor="import-backup-file"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
              >
                <Upload size={16} className="text-slate-400" />
                Unggah & Pulihkan Data Cadangan
              </label>
            </div>

            {importSuccess && (
              <p className="text-emerald-600 text-xs font-bold text-center flex items-center justify-center gap-1 mt-1">
                <CheckCircle2 size={14} /> Berhasil memulihkan data cadangan!
              </p>
            )}

            {importError && (
              <p className="text-rose-500 text-xs font-semibold text-center flex items-center justify-center gap-1 mt-1 leading-snug">
                <AlertCircle size={14} className="shrink-0" /> {importError}
              </p>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white border border-rose-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-rose-50 pb-4">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Danger Zone / Reset</h2>
              <p className="text-xs text-rose-500 font-semibold">Tindakan tidak dapat dibatalkan</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Jika Anda ingin menghapus seluruh catatan dokumen kustom Anda dan mengembalikan sistem ke kondisi data simulasi awal, Anda dapat melakukan reset penuh di bawah ini.
          </p>

          <button
            onClick={() => {
              onResetData();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer border border-rose-100"
          >
            <Trash2 size={16} />
            Hapus Semua Catatan & Atur Ulang
          </button>
        </div>
      </div>
    </div>
  );
}
