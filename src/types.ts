/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DocType = 'NOTA_DINAS' | 'SURAT_MASUK' | 'SURAT_KELUAR' | 'UNDANGAN_MASUK' | 'UNDANGAN_KELUAR' | 'KEGIATAN_ACARA';

export type Priority = 'BIASA' | 'PENTING' | 'SANGAT_PENTING';

export type DocStatus = 'BELUM_DIPROSES' | 'SEDANG_DIPROSES' | 'SELESAI' | 'TERLAMBAT';

export interface Document {
  id: string;
  type: DocType;
  regNumber: string; // Nomor Surat / Nota Dinas
  title: string; // Perihal / Judul
  senderOrReceiver: string; // Pengirim (untuk masuk) atau Tujuan (untuk keluar)
  dateCreated: string; // Tanggal Dokumen (YYYY-MM-DD)
  dateReceivedOrSent: string; // Tanggal Diterima / Dikirim (YYYY-MM-DD)
  dueDate?: string; // Batas Waktu Tindak Lanjut / Pelaksanaan (YYYY-MM-DD)
  dueTime?: string; // Waktu pelaksanaan (khusus undangan, e.g. "09:00")
  description?: string; // Ringkasan / Catatan
  status: DocStatus;
  priority: Priority;
  reminderActive: boolean; // Status Pengingat Aktif/Tidak
  reminderDaysBefore: number; // Ingatkan berapa hari sebelum jatuh tempo
  locationOrRoom?: string; // Ruang / Link Virtual (khusus Undangan)
  createdAt: string;
}

export interface AppSettings {
  userName: string;
  userRole: string;
  userDivision: string;
  enableSoundNotification: boolean;
  enableBrowserNotification: boolean;
  defaultReminderDays: number;
}
