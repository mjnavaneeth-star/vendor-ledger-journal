import React, { useState, useEffect, useMemo } from "react";
import { MapPin, Clock, Globe, ShieldCheck, X, Check, Languages, Coins } from "lucide-react";
import { UserProfile } from "../types";
import { GLOBAL_COUNTRIES, getCurrencyForCountry } from "../utils/currencies";
import { COMPREHENSIVE_LANGUAGES, LanguageItem, getLanguageByCode } from "../utils/languages";
import { LanguagePickerModal } from "./LanguagePickerModal";

interface JurisdictionModalProps {
  isOpen: boolean;
  initialProfile: UserProfile | null;
  onSave: (profile: UserProfile) => Promise<void>;
  onClose: () => void;
  isFirstTimePrompt?: boolean;
}

const TRADING_DURATIONS = [
  "Less than 6 months",
  "6 months to 1 year",
  "1 to 3 years",
  "3 to 5 years",
  "Over 5 years",
];

export const JurisdictionModal: React.FC<JurisdictionModalProps> = ({
  isOpen,
  initialProfile,
  onSave,
  onClose,
  isFirstTimePrompt = false,
}) => {
  const [country, setCountry] = useState(initialProfile?.country || "India");
  const [customCountry, setCustomCountry] = useState("");
  const [region, setRegion] = useState(initialProfile?.region || "");
  const [tradingDuration, setTradingDuration] = useState(
    initialProfile?.tradingDuration || "1 to 3 years"
  );
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageItem>(() => {
    return getLanguageByCode(initialProfile?.languageCode || "en");
  });
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProfile) {
      const match = GLOBAL_COUNTRIES.find(
        (c) => c.name.toLowerCase() === initialProfile.country?.toLowerCase()
      );
      if (match) {
        setCountry(match.name);
        setCustomCountry("");
      } else if (initialProfile.country) {
        setCountry("Other");
        setCustomCountry(initialProfile.country);
      }
      setRegion(initialProfile.region || "");
      setTradingDuration(initialProfile.tradingDuration || "1 to 3 years");
      if (initialProfile.languageCode) {
        setSelectedLanguage(getLanguageByCode(initialProfile.languageCode));
      }
    }
  }, [initialProfile, isOpen]);

  const activeCountryName = country === "Other" ? customCountry : country;
  const derivedCurrency = useMemo(() => {
    return getCurrencyForCountry(activeCountryName);
  }, [activeCountryName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCountry = country === "Other" ? customCountry.trim() : country;
    const finalRegion = region.trim();

    if (!finalCountry) {
      setError("Please specify your operating country.");
      return;
    }
    if (!finalRegion) {
      setError("Please specify your state, province, or city.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave({
        country: finalCountry,
        region: finalRegion,
        tradingDuration,
        languageCode: selectedLanguage.code,
        languageName: `${selectedLanguage.name} (${selectedLanguage.nativeName})`,
        currencyCode: derivedCurrency.currencyCode,
        currencySymbol: derivedCurrency.currencySymbol,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save jurisdiction settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        id="jurisdiction-modal-backdrop"
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto"
      >
        <div
          id="jurisdiction-modal-dialog"
          className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isFirstTimePrompt ? "Vendor Jurisdiction & Language Setup" : "Update Operating Jurisdiction"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tailors grounded legal guidance, currency, and voice in your language
                </p>
              </div>
            </div>

            {!isFirstTimePrompt && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Form with scrollable body and fixed footer */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Scrollable Form Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
              {/* Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start space-x-2.5 text-xs text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Saved securely in <code className="font-mono text-amber-950 font-semibold">users/{'{uid}'}</code>.
                  Powers local tax threshold lookups and native voice journaling.
                </span>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
              )}

            {/* Language Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Languages className="w-3.5 h-3.5 text-amber-600" />
                  <span>Primary Language & Native Script</span>
                </span>
                <span className="text-[11px] text-amber-700 font-medium">Any world language</span>
              </label>
              <button
                type="button"
                id="open-language-picker-btn"
                onClick={() => setIsLanguageModalOpen(true)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition text-left"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono font-bold text-xs uppercase">
                    {selectedLanguage.code}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {selectedLanguage.nativeName}
                    </span>
                    {selectedLanguage.nativeName !== selectedLanguage.name && (
                      <span className="text-[10px] text-slate-500">
                        {selectedLanguage.name}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-amber-600 hover:underline font-medium">
                  Change
                </span>
              </button>
            </div>

            {/* Country Selection */}
            <div>
              <label
                htmlFor="country-select"
                className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Operating Country</span>
              </label>
              <select
                id="country-select"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                {GLOBAL_COUNTRIES.map((c) => (
                  <option key={c.key} value={c.name}>
                    {c.name} ({c.currencyCode} - {c.symbol})
                  </option>
                ))}
                <option value="Other">Other Country...</option>
              </select>

              {country === "Other" && (
                <input
                  id="custom-country-input"
                  type="text"
                  placeholder="Enter country name (e.g. Costa Rica, Tanzania, Nepal)"
                  value={customCountry}
                  onChange={(e) => setCustomCountry(e.target.value)}
                  className="mt-2 w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              )}
            </div>

            {/* Currency Auto-Derivation Badge */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-slate-600">
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>Auto-Derived Currency (ISO 4217):</span>
              </div>
              <div className="flex items-center space-x-1.5 font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                <span className="text-emerald-700">{derivedCurrency.currencySymbol}</span>
                <span>{derivedCurrency.currencyCode}</span>
                <span className="text-slate-400 text-[10px] font-sans font-normal">
                  ({derivedCurrency.currencyName})
                </span>
              </div>
            </div>

            {/* State / Region */}
            <div>
              <label
                htmlFor="region-input"
                className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>State, Province, or City</span>
              </label>
              <input
                id="region-input"
                type="text"
                placeholder="e.g. Kerala, Lagos, California, Nairobi, Manila, Bogota"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Used to look up specific state/provincial tax thresholds and municipal vendor licensing.
              </p>
            </div>

            {/* Trading Duration */}
            <div>
              <label
                htmlFor="duration-select"
                className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Roughly How Long Have You Been Trading?</span>
              </label>
              <select
                id="duration-select"
                value={tradingDuration}
                onChange={(e) => setTradingDuration(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {TRADING_DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end space-x-2 shrink-0">
              {!isFirstTimePrompt && (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
              )}
              <button
                id="save-jurisdiction-btn"
                type="submit"
                disabled={saving}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-amber-400" />
                <span>{saving ? "Saving..." : "Save Settings & Proceed"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <LanguagePickerModal
        isOpen={isLanguageModalOpen}
        currentLanguageCode={selectedLanguage.code}
        onSelectLanguage={(lang) => setSelectedLanguage(lang)}
        onClose={() => setIsLanguageModalOpen(false)}
      />
    </>
  );
};
