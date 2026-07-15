/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Document, DocType, DocStatus, Priority, AppSettings } from './types';
import { INITIAL_DOCUMENTS, INITIAL_SETTINGS } from './data/mockData';
import Dashboard from './components/Dashboard';
import DocumentList from './components/DocumentList';
import DocumentForm from './components/DocumentForm';
import DocumentDetail from './components/DocumentDetail';
import CalendarView from './components/CalendarView';
import SettingsPanel from './components/SettingsPanel';
import KegiatanPanel from './components/KegiatanPanel';
import { 
  Home, 
  Layers, 
  Calendar, 
  Settings as SettingsIcon, 
  Bell, 
  Clock, 
  Plus, 
  Volume2, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  FileClock,
  Sparkles,
  Search,
  X,
  LogOut,
  Cloud,
  CloudOff,
  Database
} from 'lucide-react';
import LoginScreen from './components/LoginScreen';
import {
  subscribeToDocuments,
  saveDocumentToFirestore,
  deleteDocumentFromFirestore,
  getSettingsFromFirestore,
  saveSettingsToFirestore
} from './lib/firebase';

export default function App() {
  // --- Persistent Storage State ---
  const [documents, setDocuments] = useState<Document[]>(() => {
    const saved = localStorage.getItem('pengingat_documents');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Gagal memuat dokumen dari localStorage, memuat data awal.', e);
      }
    }
    return INITIAL_DOCUMENTS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('pengingat_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Gagal memuat pengaturan dari localStorage, memuat data awal.', e);
      }
    }
    return INITIAL_SETTINGS;
  });

  // --- Authentication State ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('sinat_authenticated') === 'true';
  });
  const [loggedInUser, setLoggedInUser] = useState<string>(() => {
    return localStorage.getItem('sinat_username') || '';
  });

  const handleLogin = (username: string) => {
    setIsAuthenticated(true);
    setLoggedInUser(username);
    localStorage.setItem('sinat_authenticated', 'true');
    localStorage.setItem('sinat_username', username);
    
    // Sync the userName inside settings too, to make it feel deeply integrated!
    setSettings(prev => {
      const updated = { ...prev, userName: username };
      localStorage.setItem('pengingat_settings', JSON.stringify(updated));
      return updated;
    });

    setNotificationToast({
      id: `login-${Date.now()}`,
      title: 'Login Berhasil',
      text: `Selamat datang kembali, ${username}! SMART-TURT siap digunakan.`,
      type: 'INFO'
    });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoggedInUser('');
    localStorage.removeItem('sinat_authenticated');
    localStorage.removeItem('sinat_username');
    setNotificationToast({
      id: `logout-${Date.now()}`,
      title: 'Keluar Berhasil',
      text: 'Anda telah keluar dari sistem secara aman.',
      type: 'WARNING'
    });
  };

  // --- UI Routing / Navigation States ---
  const [activeTab, setActiveTab] = useState<string>('dashboard'); // dashboard, semua, kalender, settings
  const [docFilterContext, setDocFilterContext] = useState<string>('ALL'); // context to pass to DocumentList

  // --- Modal / Focus states ---
  const [activeDocDetail, setActiveDocDetail] = useState<Document | null>(null);
  const [activeDocEdit, setActiveDocEdit] = useState<Document | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [preferredFormType, setPreferredFormType] = useState<DocType | null>(null);

  // --- Notification Toast banner ---
  const [notificationToast, setNotificationToast] = useState<{ id: string; title: string; text: string; type: 'URGENT' | 'WARNING' | 'INFO' } | null>(null);

  // Reference date context (simulated today)
  const todayStr = '2026-07-15';
  const today = new Date(todayStr);

  const getDaysDifference = (dateStr1: string, dateStr2: string): number => {
    const [y1, m1, d1] = dateStr1.split('-').map(Number);
    const [y2, m2, d2] = dateStr2.split('-').map(Number);
    const utc1 = Date.UTC(y1, m1 - 1, d1);
    const utc2 = Date.UTC(y2, m2 - 1, d2);
    return Math.round((utc1 - utc2) / (1000 * 60 * 60 * 24));
  };

  // Ticking time for the header
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Firebase Synchronization States ---
  const [isSyncingWithFirebase, setIsSyncingWithFirebase] = useState<boolean>(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // --- Custom Confirmation Dialog States ---
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  // Real-time synchronization of documents with Firestore
  useEffect(() => {
    setIsSyncingWithFirebase(true);
    const unsubscribe = subscribeToDocuments(
      (firestoreDocs) => {
        if (firestoreDocs.length > 0) {
          setDocuments(firestoreDocs);
          localStorage.setItem('sinat_seeded', 'true');
        } else {
          // If firestore database is empty AND we haven't seeded yet (or resetting)
          const hasSeeded = localStorage.getItem('sinat_seeded') === 'true';
          if (!hasSeeded) {
            console.log('Firestore is empty and not seeded yet. Seeding INITIAL_DOCUMENTS...');
            INITIAL_DOCUMENTS.forEach(async (doc) => {
              try {
                await saveDocumentToFirestore(doc);
              } catch (err) {
                console.error('Failed to seed document:', err);
              }
            });
            localStorage.setItem('sinat_seeded', 'true');
          } else {
            // It was seeded before, but now it is empty because the user deleted all docs!
            setDocuments([]);
          }
        }
        setIsSyncingWithFirebase(false);
        setFirebaseError(null);
      },
      (error) => {
        console.error('Firebase error:', error);
        setFirebaseError(error.message || 'Gagal tersambung ke Firebase.');
        setIsSyncingWithFirebase(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch or sync settings with Firestore when user is authenticated
  useEffect(() => {
    if (isAuthenticated && loggedInUser) {
      getSettingsFromFirestore(loggedInUser).then((firestoreSettings) => {
        if (firestoreSettings) {
          setSettings(firestoreSettings);
        } else {
          saveSettingsToFirestore(loggedInUser, settings).catch(err => {
            console.error('Error saving initial settings to Firestore:', err);
          });
        }
      }).catch(err => {
        console.error('Error fetching settings from Firestore:', err);
      });
    }
  }, [isAuthenticated, loggedInUser]);

  // --- Auto Save to localStorage ---
  useEffect(() => {
    localStorage.setItem('pengingat_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('pengingat_settings', JSON.stringify(settings));
  }, [settings]);

  // --- Auto Overdue Scanning ---
  // Automatically scans documents at mount/update and marks non-resolved past-due items as TERLAMBAT
  useEffect(() => {
    let changed = false;
    const scanned = documents.map(doc => {
      if (doc.status !== 'SELESAI' && doc.dueDate) {
        const diffDays = getDaysDifference(doc.dueDate, todayStr);
        if (diffDays < 0 && doc.status !== 'TERLAMBAT') {
          changed = true;
          return { ...doc, status: 'TERLAMBAT' as DocStatus };
        }
      }
      return doc;
    });

    if (changed) {
      setDocuments(scanned);
    }
  }, [documents, today]);

  // --- Active Alert calculations for notifications pane ---
  const activeAlerts = useMemo(() => {
    return documents.filter(doc => {
      if (doc.status === 'SELESAI') return false;
      if (!doc.dueDate) return false;

      const diffDays = getDaysDifference(doc.dueDate, todayStr);

      return doc.reminderActive && (diffDays < 0 || (diffDays >= 0 && diffDays <= doc.reminderDaysBefore));
    });
  }, [documents]);

  // Toast notification showing system state at start
  useEffect(() => {
    const count = activeAlerts.length;
    if (count > 0) {
      setNotificationToast({
        id: 'init-toast',
        title: 'Alarm Peringatan Aktif!',
        text: `Terdapat ${count} dokumen mendesak atau terlambat yang membutuhkan tinjauan Anda segera.`,
        type: 'URGENT'
      });
      
      // Play a subtle chime if sound notifications are enabled
      if (settings.enableSoundNotification) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          osc.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          osc.type = 'sine';
          osc.frequency.value = 659.25; // E5 note
          gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.55);
        } catch (e) {
          // Ignore audio failures if browser blocks
        }
      }
    }
  }, [settings.enableSoundNotification]);

  // --- CRUD Callback Handlers ---
  const handleSaveDocument = useCallback((docData: any) => {
    let targetId = docData.id;
    let isEdit = !!targetId;
    
    const docToSave: Document = {
      ...docData,
      id: targetId || `doc-${Date.now()}`,
      createdAt: docData.createdAt || new Date().toISOString()
    };

    // Optimistically update local state
    setDocuments(prev => {
      if (isEdit) {
        return prev.map(d => d.id === docToSave.id ? docToSave : d);
      } else {
        return [docToSave, ...prev];
      }
    });

    // Save to Firestore
    saveDocumentToFirestore(docToSave).catch(err => {
      console.error('Error saving to Firestore:', err);
    });

    if (activeDocDetail && activeDocDetail.id === docToSave.id) {
      setActiveDocDetail(docToSave);
    }

    setNotificationToast({
      id: `${isEdit ? 'edit' : 'create'}-${Date.now()}`,
      title: isEdit ? 'Dokumen Diperbarui' : 'Dokumen Dicatat',
      text: `Dokumen "${docToSave.title}" berhasil disimpan ke awan (Firestore).`,
      type: 'INFO'
    });

    setIsFormOpen(false);
    setActiveDocEdit(null);
  }, [activeDocDetail]);

  const handleDeleteDocument = useCallback((docId: string) => {
    setDeleteTargetId(docId);
  }, []);

  const executeDeleteDocument = useCallback((docId: string) => {
    const docToDelete = documents.find(d => d.id === docId);
    
    // Optimistic local update
    setDocuments(prev => prev.filter(d => d.id !== docId));
    
    if (activeDocDetail && activeDocDetail.id === docId) {
      setActiveDocDetail(null);
    }

    // Delete from Firestore
    deleteDocumentFromFirestore(docId).catch(err => {
      console.error('Error deleting from Firestore:', err);
    });

    if (docToDelete) {
      setNotificationToast({
        id: `delete-${Date.now()}`,
        title: 'Dokumen Dihapus',
        text: `Dokumen "${docToDelete.title}" telah dihapus dari sistem.`,
        type: 'WARNING'
      });
    }
    setDeleteTargetId(null);
  }, [documents, activeDocDetail]);

  const handleToggleStatus = useCallback((docId: string, customStatus?: DocStatus) => {
    const docToToggle = documents.find(d => d.id === docId);
    if (!docToToggle) return;

    let nextStatus: DocStatus = 'SELESAI';
    if (customStatus) {
      nextStatus = customStatus;
    } else {
      if (docToToggle.status === 'BELUM_DIPROSES') nextStatus = 'SEDANG_DIPROSES';
      else if (docToToggle.status === 'SEDANG_DIPROSES') nextStatus = 'SELESAI';
      else nextStatus = 'BELUM_DIPROSES';
    }

    const updatedDoc = { ...docToToggle, status: nextStatus };

    // Optimistic local update
    setDocuments(prev => prev.map(d => d.id === docId ? updatedDoc : d));

    // Save to Firestore
    saveDocumentToFirestore(updatedDoc).catch(err => {
      console.error('Error saving status update to Firestore:', err);
    });
  }, [documents]);

  const handleToggleStatusFromDetail = useCallback((docId: string, newStatus: DocStatus) => {
    handleToggleStatus(docId, newStatus);
    // Update active details viewport to sync
    setActiveDocDetail(prev => prev && prev.id === docId ? { ...prev, status: newStatus } : prev);
  }, [handleToggleStatus]);

  // Quick link from dashboard to pre-filtered lists
  const handleSetActiveTabAndFilter = useCallback((tabContext: string) => {
    setActiveTab('semua');
    setDocFilterContext(tabContext);
  }, []);

  // --- Setting Custom Profile Actions ---
  const handleSaveSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    if (isAuthenticated && loggedInUser) {
      saveSettingsToFirestore(loggedInUser, newSettings).catch(err => {
        console.error('Error saving settings to Firestore:', err);
      });
    }
  }, [isAuthenticated, loggedInUser]);

  const handleImportData = useCallback((importedDocs: Document[]) => {
    // Import all documents to Firestore
    importedDocs.forEach(async (doc) => {
      try {
        await saveDocumentToFirestore(doc);
      } catch (err) {
        console.error('Failed to import document to Firestore:', err);
      }
    });
    setDocuments(importedDocs);
    setActiveTab('semua');
  }, []);

  const handleResetData = useCallback(() => {
    setIsResetConfirmOpen(true);
  }, []);

  const executeResetData = useCallback(() => {
    // Clean local storage
    localStorage.removeItem('pengingat_documents');
    localStorage.removeItem('pengingat_settings');
    localStorage.removeItem('sinat_seeded');
    
    // Reset by deleting existing docs and seeding initials
    documents.forEach(async (doc) => {
      try {
        await deleteDocumentFromFirestore(doc.id);
      } catch (err) {
        console.error('Failed to delete during reset:', err);
      }
    });

    INITIAL_DOCUMENTS.forEach(async (doc) => {
      try {
        await saveDocumentToFirestore(doc);
      } catch (err) {
        console.error('Failed to seed during reset:', err);
      }
    });

    if (isAuthenticated && loggedInUser) {
      saveSettingsToFirestore(loggedInUser, INITIAL_SETTINGS).catch(err => {
        console.error('Failed to reset settings:', err);
      });
    }

    setDocuments(INITIAL_DOCUMENTS);
    setSettings(INITIAL_SETTINGS);
    setActiveTab('dashboard');
    setIsResetConfirmOpen(false);
    setNotificationToast({
      id: 'reset-toast',
      title: 'Sistem Diatur Ulang',
      text: 'Semua dokumen telah diatur ulang dan dikembalikan ke data awal di Firestore.',
      type: 'WARNING'
    });
  }, [documents, isAuthenticated, loggedInUser]);

  // Format digital clock
  const formattedTime = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased flex flex-col justify-between">
      {isAuthenticated ? (
        renderMainApp()
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-100 py-12 px-4">
          <LoginScreen onLoginSuccess={handleLogin} />
        </div>
      )}
    </div>
  );

  function renderMainApp() {
    return (
      <div className="flex-1 flex flex-col justify-between bg-slate-50">
        
        {/* Outer Layout Container */}
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
          
          {/* Top Header Navigation Dashboard */}
          <header className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-slate-100 rounded-3xl p-5 shadow-xs">
            
            {/* Logo Title section */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/10">
                <FileClock size={24} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-lg font-black tracking-tight text-slate-800">SMART-TURT</h1>
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border border-indigo-100">v1.1</span>
                </div>
                <p className="text-xs text-slate-400 font-medium">Sistem Monitoring Agenda, Reminder, dan Tugas TURT</p>
                
                {/* Cloud Sync Status Indicator */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  {firebaseError ? (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-bold border border-rose-100">
                      <CloudOff size={10} className="text-rose-500 animate-pulse" />
                      Lokal (Gagal Tersambung)
                    </span>
                  ) : isSyncingWithFirebase ? (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold border border-amber-100">
                      <Database size={10} className="text-amber-500 animate-spin" />
                      Sinkronisasi Awan...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold border border-emerald-100">
                      <Cloud size={10} className="text-emerald-500 animate-pulse" />
                      Tersambung Ke Awan (Firestore)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Time references & Profile references */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Referensi Tanggal (Simulasi & Nyata) */}
              <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-2.5 flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
                <div className="text-left font-mono">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Simulasi Sistem</span>
                  <span className="text-xs font-bold text-slate-700">14 Juli 2026</span>
                </div>
                <span className="text-slate-200">|</span>
                <div className="text-left font-mono">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Jam PC</span>
                  <span className="text-xs font-bold text-slate-700">{formattedTime} WIB</span>
                </div>
              </div>

              {/* Quick Profile Overview */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/50 rounded-2xl p-2 px-3">
                <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm shrink-0">
                  {settings.userName.charAt(0)}
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block font-semibold leading-tight">{settings.userRole}</span>
                  <span className="text-xs font-bold text-slate-700 block leading-tight">{settings.userName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Keluar Aplikasi"
                  className="ml-2 p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <LogOut size={14} />
                </button>
              </div>

            </div>
          </header>

          {/* Dynamic Alert Banner (Toast details or warnings) */}
          {notificationToast && (
            <div className={`p-4 rounded-2xl border flex items-start justify-between gap-3 shadow-xs animate-in slide-in-from-top-4 duration-200 ${
              notificationToast.type === 'URGENT' ? 'bg-rose-50 border-rose-100 text-rose-800' :
              notificationToast.type === 'WARNING' ? 'bg-amber-50 border-amber-100 text-amber-800' :
              'bg-slate-900 border-slate-900 text-slate-100'
            }`}>
              <div className="flex gap-2.5">
                <div className="mt-0.5 shrink-0">
                  {notificationToast.type === 'URGENT' ? <AlertTriangle className="text-rose-600 animate-bounce" size={18} /> :
                   notificationToast.type === 'WARNING' ? <AlertTriangle className="text-amber-600" size={18} /> :
                   <CheckCircle2 className="text-indigo-400" size={18} />}
                </div>
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider">{notificationToast.title}</h4>
                  <p className="text-xs mt-0.5 opacity-90 leading-relaxed font-medium">{notificationToast.text}</p>
                </div>
              </div>
              <button 
                onClick={() => setNotificationToast(null)}
                className="p-1 hover:bg-slate-200/20 rounded-lg cursor-pointer transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Sticky-like Tab Bar Navigation inside page wrapper */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
            
            {/* Main Navigation tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl self-start">
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setDocFilterContext('ALL');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === 'dashboard' 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Home size={14} />
                Beranda
              </button>

              <button
                onClick={() => {
                  setActiveTab('semua');
                  setDocFilterContext('ALL');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === 'semua' && docFilterContext === 'ALL'
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers size={14} />
                Semua Berkas
                <span className="bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                  {documents.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('kalender');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === 'kalender' 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Calendar size={14} />
                Agenda Kalender
              </button>

              <button
                onClick={() => {
                  setActiveTab('kegiatan');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === 'kegiatan' 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Bell size={14} />
                Pengingat Kegiatan
                <span className="bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                  {documents.filter(d => d.type === 'KEGIATAN_ACARA').length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('settings');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === 'settings' 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <SettingsIcon size={14} />
                Konfigurasi
              </button>
            </div>

            {/* Create Button in Sidebar area */}
            <button
              onClick={() => {
                setPreferredFormType(null);
                setActiveDocEdit(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md hover:shadow-indigo-500/15 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={16} />
              Catat Berkas Baru
            </button>
          </div>

          {/* Dynamic Navigational view display */}
          <main className="min-h-[450px]">
            {activeTab === 'dashboard' && (
              <Dashboard 
                documents={documents}
                onAddDocClick={(type) => {
                  setPreferredFormType(type || null);
                  setActiveDocEdit(null);
                  setIsFormOpen(true);
                }}
                onViewDocClick={(doc) => setActiveDocDetail(doc)}
                onSetActiveTab={handleSetActiveTabAndFilter}
              />
            )}

            {activeTab === 'semua' && (
              <DocumentList 
                documents={documents}
                onEditDocClick={(doc) => {
                  setActiveDocEdit(doc);
                  setIsFormOpen(true);
                }}
                onDeleteDocClick={handleDeleteDocument}
                onViewDocClick={(doc) => setActiveDocDetail(doc)}
                onToggleStatus={handleToggleStatus}
                activeFilterType={docFilterContext}
              />
            )}

            {activeTab === 'kalender' && (
              <CalendarView 
                documents={documents}
                onViewDocClick={(doc) => setActiveDocDetail(doc)}
              />
            )}

            {activeTab === 'kegiatan' && (
              <KegiatanPanel 
                documents={documents}
                onEditDocClick={(doc) => {
                  setActiveDocEdit(doc);
                  setIsFormOpen(true);
                }}
                onDeleteDocClick={handleDeleteDocument}
                onViewDocClick={(doc) => setActiveDocDetail(doc)}
                onToggleStatus={handleToggleStatus}
                onAddDocClick={(type) => {
                  setPreferredFormType(type || 'KEGIATAN_ACARA');
                  setActiveDocEdit(null);
                  setIsFormOpen(true);
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPanel 
                settings={settings}
                documents={documents}
                onSaveSettings={handleSaveSettings}
                onImportData={handleImportData}
                onResetData={handleResetData}
              />
            )}
          </main>

        </div>

        {/* Persistent Page Footer */}
        <footer className="mt-12 bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 shrink-0">
          <div className="max-w-7xl w-full mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="font-medium">
              © 2026 SMART-TURT • Sistem Monitoring Agenda, Reminder, dan Tugas TURT
            </p>
            <div className="flex items-center gap-4">
              <span className="font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">100% Offline-First</span>
              <span className="font-bold text-indigo-600 cursor-pointer hover:underline" onClick={() => setActiveTab('settings')}>Ekspor Cadangan</span>
            </div>
          </div>
        </footer>

        {/* --- POPUP MODALS VIEWPORTS --- */}

        {/* 1. Document Detail Modal Drawer */}
        {activeDocDetail && (
          <DocumentDetail 
            document={activeDocDetail}
            onClose={() => setActiveDocDetail(null)}
            onEditClick={(doc) => {
              setActiveDocDetail(null);
              setActiveDocEdit(doc);
              setIsFormOpen(true);
            }}
            onDeleteClick={handleDeleteDocument}
            onToggleStatus={handleToggleStatusFromDetail}
          />
        )}

        {/* 2. Document Add / Edit Form Modal Drawer */}
        {isFormOpen && (
          <DocumentForm 
            documentToEdit={activeDocEdit}
            preferredType={preferredFormType}
            onSave={handleSaveDocument}
            onClose={() => {
              setIsFormOpen(false);
              setActiveDocEdit(null);
            }}
          />
        )}

        {/* 3. Custom Delete Confirmation Modal */}
        {deleteTargetId && (() => {
          const docToDelete = documents.find(d => d.id === deleteTargetId);
          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 p-6 space-y-5 animate-in zoom-in-95 duration-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 shrink-0">
                    <AlertTriangle size={24} className="animate-pulse" />
                  </div>
                  <div className="space-y-1 text-left">
                    <h3 className="text-base font-extrabold text-slate-800">Konfirmasi Hapus</h3>
                    <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus dokumen berikut?</p>
                  </div>
                </div>

                {docToDelete && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-left">
                    <span className="text-[9px] font-extrabold bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {docToDelete.type.replace('_', ' ')}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-2">{docToDelete.title}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold font-mono">{docToDelete.regNumber}</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    onClick={() => setDeleteTargetId(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl cursor-pointer active:scale-95 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => executeDeleteDocument(deleteTargetId)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-rose-500/20 cursor-pointer active:scale-95 transition-all"
                  >
                    Ya, Hapus Dokumen
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 4. Custom Reset System Confirmation Modal */}
        {isResetConfirmOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 p-6 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 shrink-0">
                  <AlertTriangle size={24} className="animate-bounce" />
                </div>
                <div className="space-y-1 text-left">
                  <h3 className="text-base font-extrabold text-slate-800">Atur Ulang Sistem?</h3>
                  <p className="text-xs text-slate-400">PERINGATAN: Seluruh dokumen kustom Anda akan dihapus secara permanen dari awan (Firestore) dan dikembalikan ke data simulasi awal.</p>
                </div>
              </div>

              <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100 text-left">
                <p className="text-[10px] text-rose-700 font-bold leading-relaxed">
                  * Tindakan ini membutuhkan koneksi internet untuk memperbarui Firestore database. Pastikan Anda telah mengunduh berkas cadangan jika diperlukan.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl cursor-pointer active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={executeResetData}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-rose-500/20 cursor-pointer active:scale-95 transition-all"
                >
                  Ya, Atur Ulang Penuh
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }
}
