import React, { useState, useEffect } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import {
  auth,
  fetchUserLedgerEntries,
  deleteUserLedgerEntry,
  saveLedgerEntryToFirestore,
  subscribeSyncStatus,
  retrySyncLocalEntries,
  SyncNotification,
} from "./firebase";
import { Navbar } from "./components/Navbar";
import { SignInView } from "./components/SignInView";
import { ConversationalJournalTab } from "./components/ConversationalJournalTab";
import { LedgerSummaryTab } from "./components/LedgerSummaryTab";
import { LanguagePickerModal } from "./components/LanguagePickerModal";
import { useI18n } from "./utils/i18n";
import { LedgerEntry } from "./types";
import { CheckCircle2, AlertCircle, X, ShieldCheck, AlertTriangle, RefreshCw, CloudOff } from "lucide-react";

export default function App() {
  const { language, setLanguage } = useI18n();
  const [hasPickedLanguage, setHasPickedLanguage] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"journal" | "summary">("journal");
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [syncIssue, setSyncIssue] = useState<SyncNotification | null>(null);
  const [retryingSync, setRetryingSync] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Subscribe to Cloud Sync status from firebase.ts
  useEffect(() => {
    const unsub = subscribeSyncStatus((issue) => {
      setSyncIssue(issue);
    });
    return () => unsub();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch entries when user is authenticated
  const loadEntries = async (currentUserId: string) => {
    setEntriesLoading(true);
    try {
      const data = await fetchUserLedgerEntries(currentUserId);
      
      // If brand new user with 0 entries, provide 2 sample initial records for easy exploration
      if (data.length === 0 && user) {
        const today = new Date();
        const d1 = new Date(today);
        d1.setDate(d1.getDate() - 1);
        const d2 = new Date(today);
        d2.setDate(d2.getDate() - 2);

        const sample1: Omit<LedgerEntry, "id" | "createdAt"> = {
          userId: currentUserId,
          date: d1.toISOString().split("T")[0],
          totalSales: 165,
          totalExpenses: 42,
          netAmount: 123,
          notes: "35 fruit bowls & bottled agua fresca, ice and produce restock",
        };
        const sample2: Omit<LedgerEntry, "id" | "createdAt"> = {
          userId: currentUserId,
          date: d2.toISOString().split("T")[0],
          totalSales: 140,
          totalExpenses: 38,
          netAmount: 102,
          notes: "30 taco plates, tortilla & cilantro bulk purchase",
        };

        const created1 = await saveLedgerEntryToFirestore(sample1, user);
        const created2 = await saveLedgerEntryToFirestore(sample2, user);
        setEntries([created1, created2]);
      } else {
        setEntries(data);
      }
    } catch (err) {
      console.warn("Error fetching ledger entries:", err);
    } finally {
      setEntriesLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadEntries(user.uid);
    } else {
      setEntries([]);
    }
  }, [user]);

  const handleEntrySaved = (newEntry: LedgerEntry) => {
    setEntries((prev) => [newEntry, ...prev.filter((e) => e.id !== newEntry.id)]);
    if (newEntry.isLocalOnly) {
      showToast(
        `⚠️ Cloud Sync Failed: Entry for ${newEntry.date} saved locally only and may be lost!`,
        "error"
      );
    } else {
      showToast(`Committed ${newEntry.date} entry to Firestore!`, "success");
    }
  };

  const handleRetrySync = async () => {
    if (!user || retryingSync) return;
    setRetryingSync(true);
    try {
      const result = await retrySyncLocalEntries(user);
      if (result.syncedCount > 0) {
        showToast(`Successfully synced ${result.syncedCount} entry to Cloud Firestore!`, "success");
        await loadEntries(user.uid);
      } else if (result.remainingUnsynced > 0) {
        showToast(
          `Sync retry failed for ${result.remainingUnsynced} entry. Please check your network connection.`,
          "error"
        );
      }
    } catch (err: any) {
      showToast(`Retry sync error: ${err.message}`, "error");
    } finally {
      setRetryingSync(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    try {
      await deleteUserLedgerEntry(entryId, user.uid);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      showToast("Ledger entry removed.", "success");
    } catch (err: any) {
      showToast("Failed to delete entry: " + err.message, "error");
    }
  };

  if (!hasPickedLanguage) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LanguagePickerModal
          isOpen={true}
          currentLanguageCode={language?.code || "en"}
          onSelectLanguage={(lang) => {
            try {
              localStorage.setItem("vendor_selected_language_code", lang.code);
            } catch (e) {
              console.warn("Could not save language to localStorage:", e);
            }
            setLanguage(lang);
            setHasPickedLanguage(true);
          }}
          onClose={() => {
            setHasPickedLanguage(true);
          }}
        />
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-500">Checking Firebase credentials...</p>
        </div>
      </div>
    );
  }

  const hasUnsyncedEntries = entries.some((e) => e.isLocalOnly || e.id.startsWith("loc_"));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* App Header / Navigation */}
      <Navbar
        user={user}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {/* Cloud Sync Warning Banner (Prominently alerts vendor when data didn't sync to Firestore) */}
      {user && (syncIssue || hasUnsyncedEntries) && (
        <div
          id="cloud-sync-warning-banner"
          className="bg-amber-500 border-b border-amber-600 text-slate-950 px-4 py-2.5 sm:px-6 shadow-sm"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-slate-950 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold leading-snug">
                  Warning: Ledger Entry Saved Locally Only (Cloud Sync Failed)
                </p>
                <p className="text-[11px] text-slate-900 leading-tight mt-0.5">
                  {syncIssue?.message ||
                    "One or more entries did NOT sync to your Firestore cloud account and are stored in local browser memory. They may be lost if browser cache is cleared or if you change devices."}
                </p>
                {syncIssue?.errorDetails && (
                  <p className="text-[10px] font-mono text-slate-900 bg-amber-400/60 rounded px-1.5 py-0.5 mt-1 inline-block">
                    Error: {syncIssue.errorDetails}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                id="retry-cloud-sync-btn"
                disabled={retryingSync}
                onClick={handleRetrySync}
                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition shadow-xs disabled:opacity-50 flex items-center space-x-1.5"
              >
                {retryingSync ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>Retry Cloud Sync</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!user ? (
          <SignInView />
        ) : activeTab === "journal" ? (
          <ConversationalJournalTab
            user={user}
            onEntrySaved={handleEntrySaved}
            onNavigateToSummary={() => setActiveTab("summary")}
          />
        ) : (
          <LedgerSummaryTab
            user={user}
            entries={entries}
            loading={entriesLoading}
            onRefresh={() => loadEntries(user.uid)}
            onDeleteEntry={handleDeleteEntry}
            onNavigateToJournal={() => setActiveTab("journal")}
          />
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium ${
              toast.type === "success"
                ? "bg-emerald-900 text-emerald-100 border-emerald-700"
                : "bg-rose-900 text-rose-100 border-rose-700"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">Vendor Ledger Journal</span>
            <span>&bull;</span>
            <span>Empowering informal micro-entrepreneurs</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Scoped UID Rule Protection</span>
            </span>
            <span>&bull;</span>
            <span>Server-side Secret Manager</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
