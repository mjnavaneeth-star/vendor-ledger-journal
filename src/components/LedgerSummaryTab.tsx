import React, { useState, useMemo, useEffect } from "react";
import { User } from "firebase/auth";
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Calendar,
  Sparkles,
  Trash2,
  RefreshCw,
  FileCheck2,
  Info,
  MapPin,
  Edit3,
  AlertTriangle
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { LedgerEntry, UserProfile, ComplianceOrientationResponse } from "../types";
import { fetchUserProfile, saveUserProfile } from "../firebase";
import { JurisdictionModal } from "./JurisdictionModal";
import { ComplianceOrientationView } from "./ComplianceOrientationView";
import { useI18n } from "../utils/i18n";

interface LedgerSummaryTabProps {
  user: User;
  entries: LedgerEntry[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
  onNavigateToJournal?: () => void;
}

export const LedgerSummaryTab: React.FC<LedgerSummaryTabProps> = ({
  user,
  entries,
  loading,
  onRefresh,
  onDeleteEntry,
  onNavigateToJournal,
}) => {
  const { t, language } = useI18n();
  const [period, setPeriod] = useState<"30" | "90" | "365" | "all">("30");
  const [generatingOrientation, setGeneratingOrientation] = useState(false);
  const [orientationData, setOrientationData] = useState<ComplianceOrientationResponse | null>(null);
  const [orientationError, setOrientationError] = useState<string | null>(null);

  // User Profile / Jurisdiction State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isJurisdictionModalOpen, setIsJurisdictionModalOpen] = useState(false);
  const [isFirstTimePrompt, setIsFirstTimePrompt] = useState(false);
  const [pendingGenerate, setPendingGenerate] = useState(false);

  // Load user profile on mount
  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      setLoadingProfile(true);
      try {
        const prof = await fetchUserProfile(user.uid);
        if (isMounted) {
          setUserProfile(prof);
        }
      } catch (err) {
        console.warn("Failed to load user profile:", err);
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    }
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [user.uid]);

  // Filter entries according to period
  const filteredEntries = useMemo(() => {
    if (period === "all") return entries;

    const days = Number(period);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffIso = cutoffDate.toISOString().split("T")[0];

    return entries.filter((e) => e.date >= cutoffIso);
  }, [entries, period]);

  // Aggregate metrics
  const aggregates = useMemo(() => {
    let totalSales = 0;
    let totalExpenses = 0;

    for (const entry of filteredEntries) {
      totalSales += Number(entry.totalSales) || 0;
      totalExpenses += Number(entry.totalExpenses) || 0;
    }

    const netAmount = totalSales - totalExpenses;
    const entryCount = filteredEntries.length;
    const averageDailySales = entryCount > 0 ? totalSales / entryCount : 0;
    const marginPct = totalSales > 0 ? Math.round((netAmount / totalSales) * 100) : 0;

    return {
      totalSales,
      totalExpenses,
      netAmount,
      entryCount,
      averageDailySales,
      marginPct,
    };
  }, [filteredEntries]);

  // Format data for Recharts (chronological order)
  const chartData = useMemo(() => {
    const sorted = [...filteredEntries].sort((a, b) => (a.date > b.date ? 1 : -1));
    return sorted.map((item) => ({
      date: item.date.slice(5), // MM-DD for clean axis
      fullDate: item.date,
      sales: item.totalSales,
      expenses: item.totalExpenses,
      net: item.netAmount,
      notes: item.notes,
    }));
  }, [filteredEntries]);

  // Derive active currency symbol based on vendor country
  const currencySymbol = useMemo(() => {
    const c = (userProfile?.country || "").toLowerCase();
    if (c.includes("india")) return "₹";
    if (c.includes("united kingdom") || c.includes("uk") || c.includes("england") || c.includes("scotland") || c.includes("wales")) return "£";
    if (c.includes("nigeria")) return "₦";
    if (c.includes("kenya")) return "KSh";
    if (c.includes("philippines")) return "₱";
    if (c.includes("south africa")) return "R";
    if (c.includes("europe") || c.includes("germany") || c.includes("france") || c.includes("spain") || c.includes("italy")) return "€";
    return "$";
  }, [userProfile?.country]);

  // Perform orientation API request with user profile
  const executeGenerateOrientation = async (profileToUse: UserProfile) => {
    setGeneratingOrientation(true);
    setOrientationError(null);

    const resolvedSymbol = (() => {
      const c = (profileToUse.country || "").toLowerCase();
      if (c.includes("india")) return "₹";
      if (c.includes("united kingdom") || c.includes("uk") || c.includes("england") || c.includes("scotland") || c.includes("wales")) return "£";
      if (c.includes("nigeria")) return "₦";
      if (c.includes("kenya")) return "KSh";
      if (c.includes("philippines")) return "₱";
      if (c.includes("south africa")) return "R";
      if (c.includes("europe") || c.includes("germany") || c.includes("france") || c.includes("spain") || c.includes("italy")) return "€";
      return "$";
    })();

    try {
      const response = await fetch("/api/compliance-orientation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period,
          totalSales: aggregates.totalSales,
          totalExpenses: aggregates.totalExpenses,
          netAmount: aggregates.netAmount,
          entryCount: aggregates.entryCount,
          averageDailySales: aggregates.averageDailySales,
          currencySymbol: resolvedSymbol,
          userProfile: {
            ...profileToUse,
            languageCode: language?.code || profileToUse.languageCode || "en",
            languageName: (language ? `${language.name} (${language.nativeName})` : undefined) || profileToUse.languageName || "English",
          },
          languageCode: language?.code || profileToUse.languageCode || "en",
          languageName: (language ? `${language.name} (${language.nativeName})` : undefined) || profileToUse.languageName || "English",
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data: ComplianceOrientationResponse = await response.json();
      setOrientationData(data);
    } catch (err: any) {
      console.warn("Orientation error:", err);
      setOrientationError(err.message || "Failed to generate compliance orientation.");
    } finally {
      setGeneratingOrientation(false);
    }
  };

  // Triggered when user clicks "Generate Compliance Orientation"
  const handleGenerateComplianceOrientation = async () => {
    // If user profile is missing country or region, prompt user first
    if (!userProfile || !userProfile.country || !userProfile.region) {
      setIsFirstTimePrompt(true);
      setPendingGenerate(true);
      setIsJurisdictionModalOpen(true);
      return;
    }

    await executeGenerateOrientation(userProfile);
  };

  // Save profile handler from modal
  const handleSaveProfile = async (newProfile: UserProfile) => {
    await saveUserProfile(user.uid, newProfile);
    setUserProfile(newProfile);
    if (pendingGenerate) {
      setPendingGenerate(false);
      await executeGenerateOrientation(newProfile);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            My Ledger Summary
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated financials for vendor UID:{" "}
            <code className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
              {user.uid.substring(0, 12)}...
            </code>
          </p>
        </div>

        {/* Period Selector & Refresh */}
        <div className="flex items-center space-x-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-semibold">
            {(["30", "90", "365", "all"] as const).map((p) => (
              <button
                key={p}
                type="button"
                id={`period-btn-${p}`}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg transition ${
                  period === p
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {p === "30"
                  ? t("period30Days")
                  : p === "90"
                  ? t("period90Days")
                  : p === "365"
                  ? t("period365Days")
                  : t("periodAllTime")}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh Entries"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Aggregate Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("totalGrossSales")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              {currencySymbol}
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-emerald-700">
              {currencySymbol}{aggregates.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="block text-[11px] text-slate-400 mt-1">
              From {aggregates.entryCount} recorded days
            </span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("totalStockAndCosts")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-amber-700">
              {currencySymbol}{aggregates.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="block text-[11px] text-slate-400 mt-1">
              Inventory, fuel, stall & supplies
            </span>
          </div>
        </div>

        {/* Net Earnings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("netAmountProfit")}
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                aggregates.netAmount >= 0
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-2xl font-bold font-mono ${
                aggregates.netAmount >= 0 ? "text-emerald-700" : "text-rose-600"
              }`}
            >
              {currencySymbol}{aggregates.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="block text-[11px] text-slate-400 mt-1">
              Operating Margin: <strong>{aggregates.marginPct}%</strong>
            </span>
          </div>
        </div>

        {/* Daily Average Intake */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("dailyAverage")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {currencySymbol}{Math.round(aggregates.averageDailySales).toLocaleString()}
              <span className="text-xs text-slate-400 font-sans font-normal"> / day</span>
            </span>
            <span className="block text-[11px] text-slate-400 mt-1">
              {aggregates.entryCount === 0 ? "No records yet" : `Across ${aggregates.entryCount} logged trading days`}
            </span>
          </div>
        </div>
      </div>

      {/* Simple Trend Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Sales, Costs & Net Margin Trend
            </h3>
            <p className="text-xs text-slate-500">
              Daily performance trajectory over the selected period
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-700">Sales</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-700">Expenses</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span className="text-slate-700">Net Profit</span>
            </div>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs font-mono shadow-md border border-slate-800 space-y-1">
                          <p className="text-slate-400 font-bold">{item.fullDate}</p>
                          {item.notes && <p className="text-slate-300 text-[11px] font-sans pb-1">{item.notes}</p>}
                          <p className="text-emerald-400">Sales: ${item.sales}</p>
                          <p className="text-amber-400">Expenses: ${item.expenses}</p>
                          <p className="text-indigo-300 font-bold">Net: ${item.net}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Sales"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="#fff"
                  fillOpacity={0}
                />
                <Area
                  type="monotone"
                  dataKey="net"
                  name="Net"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#netGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-44 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <TrendingUp className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-medium text-slate-600">No chart records for this period</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Log daily sales and expenses via the chat journal to see your financial curve.
            </p>
          </div>
        )}
      </div>

      {/* Compliance Orientation Section (Requirement 5 - Grounded CPA Orientation) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  CPA Compliance & Financial Orientation
                </h3>
                {userProfile?.region && userProfile?.country ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsFirstTimePrompt(false);
                      setIsJurisdictionModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium border border-slate-200 transition"
                    title="Click to edit your operating jurisdiction"
                  >
                    <MapPin className="w-3 h-3 text-amber-600" />
                    <span>
                      {userProfile.region}, {userProfile.country} ({userProfile.tradingDuration})
                    </span>
                    <Edit3 className="w-2.5 h-2.5 ml-1 text-slate-400" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsFirstTimePrompt(true);
                      setIsJurisdictionModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold border border-amber-200 transition"
                  >
                    <MapPin className="w-3 h-3 text-amber-600" />
                    <span>Set Location (Required)</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Google Search grounded analysis of local thresholds, seller permits & record-keeping standards
              </p>
            </div>
          </div>

          <button
            id="generate-compliance-orientation-btn"
            type="button"
            disabled={generatingOrientation || aggregates.entryCount === 0}
            onClick={handleGenerateComplianceOrientation}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition shadow-xs disabled:opacity-50 shrink-0"
          >
            {generatingOrientation ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Grounding Local Regulations...</span>
              </>
            ) : (
              <>
                <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
                <span>{orientationData ? "Re-evaluate Orientation" : "Generate Compliance Orientation"}</span>
              </>
            )}
          </button>
        </div>

        <div className="p-6">
          {aggregates.entryCount === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Please record at least one day in your journal to generate an operational compliance orientation based on your numbers.
              </span>
            </div>
          ) : generatingOrientation ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-900">
                  Consulting Live Regulations with Search Grounding
                </p>
                <p className="text-[11px] text-slate-500 max-w-sm">
                  Looking up small business thresholds, vendor licenses, and tax filing cadences for{" "}
                  <strong>{userProfile?.region || "your area"}, {userProfile?.country || ""}</strong>...
                </p>
              </div>
            </div>
          ) : orientationData ? (
            <ComplianceOrientationView
              orientation={orientationData}
              currencySymbol={currencySymbol}
              onEditJurisdiction={() => {
                setIsFirstTimePrompt(false);
                setIsJurisdictionModalOpen(true);
              }}
            />
          ) : (
            <div className="text-center py-8 text-slate-500 space-y-3 max-w-lg mx-auto">
              <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <MapPin className="w-5 h-5 text-slate-500" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Click <strong>"Generate Compliance Orientation"</strong> to review a seasoned CPA-level walkthrough of your numbers, statutory self-employment thresholds, state and municipal permits, and mandatory record-keeping standards grounded in your specific jurisdiction.
              </p>
              {userProfile?.region && userProfile?.country ? (
                <p className="text-[11px] text-slate-400">
                  Ready to research: <span className="font-semibold text-slate-700">{userProfile.region}, {userProfile.country}</span>
                </p>
              ) : (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 inline-block">
                  You will be prompted once to provide your operating country and region.
                </p>
              )}
            </div>
          )}

          {orientationError && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {orientationError}
            </div>
          )}
        </div>
      </div>

      {/* Structured Ledger Entries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {t("recordedJournalEntries")} ({filteredEntries.length})
            </h3>
            <p className="text-xs text-slate-500">
              Stored securely in Firestore under <code className="font-mono">ledgerEntries/</code>
            </p>
          </div>

          {onNavigateToJournal && (
            <button
              type="button"
              onClick={onNavigateToJournal}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline"
            >
              + Record Another Day
            </button>
          )}
        </div>

        {/* Local Unsynced Warning Banner */}
        {filteredEntries.some((e) => e.isLocalOnly || e.id.startsWith("loc_")) && (
          <div className="mx-5 my-3 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Unsynced Entries Detected:</span> Entries marked with the{" "}
                <span className="font-semibold text-amber-900 underline">Unsynced</span> badge failed to reach Cloud Firestore and exist solely in temporary browser storage. They will be lost if your browser cache is cleared.
              </div>
            </div>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="self-end sm:self-center px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shrink-0 transition"
              >
                Refresh Cloud Data
              </button>
            )}
          </div>
        )}

        {filteredEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">{t("colDate")}</th>
                  <th className="py-3 px-4 font-semibold">{t("colItemsSoldNotes")}</th>
                  <th className="py-3 px-4 font-semibold text-right">{t("colSales")}</th>
                  <th className="py-3 px-4 font-semibold text-right">{t("colExpenses")}</th>
                  <th className="py-3 px-4 font-semibold text-right">{t("colNetAmount")}</th>
                  <th className="py-3 px-4 font-semibold text-center">{t("colAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span>{entry.date}</span>
                        {(entry.isLocalOnly || entry.id.startsWith("loc_")) && (
                          <span
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                            title={
                              entry.syncError
                                ? `Unsynced: ${entry.syncError}`
                                : "Saved in local browser memory only — did not sync to Firestore and may be lost!"
                            }
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Unsynced (Local)</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                      {entry.notes || "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-700 font-semibold text-right whitespace-nowrap">
                      {currencySymbol}{Number(entry.totalSales).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-700 font-medium text-right whitespace-nowrap">
                      {currencySymbol}{Number(entry.totalExpenses).toFixed(2)}
                    </td>
                    <td
                      className={`py-3 px-4 font-mono font-bold text-right whitespace-nowrap ${
                        Number(entry.netAmount) >= 0 ? "text-emerald-700" : "text-rose-600"
                      }`}
                    >
                      {currencySymbol}{Number(entry.netAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            <p className="text-xs">No entries found for this period.</p>
            {onNavigateToJournal && (
              <button
                type="button"
                onClick={onNavigateToJournal}
                className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition"
              >
                <span>Open Daily Journal</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Jurisdiction & Trading Tenure Modal */}
      <JurisdictionModal
        isOpen={isJurisdictionModalOpen}
        initialProfile={userProfile}
        isFirstTimePrompt={isFirstTimePrompt}
        onSave={handleSaveProfile}
        onClose={() => {
          setIsJurisdictionModalOpen(false);
          setPendingGenerate(false);
        }}
      />
    </div>
  );
};
