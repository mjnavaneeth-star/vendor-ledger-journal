import React from "react";
import { User } from "firebase/auth";
import { BookOpen, LogOut, Sparkles, UserCheck } from "lucide-react";
import { signOutCurrentUser } from "../firebase";
import { useI18n } from "../utils/i18n";

interface NavbarProps {
  user: User | null;
  activeTab: "journal" | "summary";
  onTabChange: (tab: "journal" | "summary") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, activeTab, onTabChange }) => {
  const { t } = useI18n();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center text-white shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {t("appTitle")}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {t("vendorEdition")}
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-500">
                {t("appSubtitle")}
              </p>
            </div>
          </div>

          {/* Tab Navigation (visible when signed in) */}
          {user && (
            <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                id="tab-daily-journal-btn"
                onClick={() => onTabChange("journal")}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "journal"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{t("dailyJournal")}</span>
              </button>
              <button
                type="button"
                id="tab-my-summary-btn"
                onClick={() => onTabChange("summary")}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "summary"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t("myLedgerSummary")}</span>
              </button>
            </nav>
          )}

          {/* User Profile / Auth State */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="User avatar"
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover border border-slate-300"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                      {user.displayName ? user.displayName[0].toUpperCase() : "V"}
                    </div>
                  )}
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-medium text-slate-900 leading-tight truncate max-w-[120px]">
                      {user.displayName || "Vendor User"}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono leading-tight truncate max-w-[120px]">
                      {user.email || user.uid.substring(0, 10)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="sign-out-btn"
                  onClick={signOutCurrentUser}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition"
                  title={t("signOut")}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t("signOut")}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Secure Firestore Auth</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
