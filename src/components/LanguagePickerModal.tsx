import React, { useState, useMemo } from "react";
import { Search, Globe, Check, X, Sparkles } from "lucide-react";
import { COMPREHENSIVE_LANGUAGES, LanguageItem, getLanguageByCode } from "../utils/languages";

interface LanguagePickerModalProps {
  isOpen: boolean;
  currentLanguageCode: string;
  onSelectLanguage: (language: LanguageItem) => void;
  onClose: () => void;
}

export const LanguagePickerModal: React.FC<LanguagePickerModalProps> = ({
  isOpen,
  currentLanguageCode,
  onSelectLanguage,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COMPREHENSIVE_LANGUAGES;

    return COMPREHENSIVE_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q) ||
        lang.bcp47.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelect = (lang: LanguageItem) => {
    onSelectLanguage(lang);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const customLang = getLanguageByCode(searchQuery.trim());
      handleSelect(customLang);
    }
  };

  return (
    <div
      id="language-picker-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="language-picker-dialog"
        className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Select Your Language / ഭാഷ തിരഞ്ഞെടുക്കുക
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full conversational voice, ledger guidance, and legal orientation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <form onSubmit={handleCustomSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="language-search-input"
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in English or native script (e.g. മലയാളം, हिन्दी, Español, Kiswahili)..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 placeholder:text-slate-400"
            />
          </form>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400 px-1">
            <span>{filteredLanguages.length} languages available</span>
            <span>Type any language name or script</span>
          </div>
        </div>

        {/* Language Grid / List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1 divide-y divide-slate-100">
          {filteredLanguages.map((lang) => {
            const isSelected =
              lang.code.toLowerCase() === currentLanguageCode.toLowerCase();
            return (
              <button
                key={lang.code}
                type="button"
                id={`lang-btn-${lang.code}`}
                onClick={() => handleSelect(lang)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition text-left group ${
                  isSelected
                    ? "bg-amber-50/80 border border-amber-200 text-amber-950"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-amber-100/50 flex items-center justify-center text-xs font-mono font-bold text-slate-600 uppercase shrink-0">
                    {lang.code}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slate-900 tracking-tight">
                        {lang.nativeName}
                      </span>
                      {lang.nativeName !== lang.name && (
                        <span className="text-xs text-slate-500 font-medium">
                          ({lang.name})
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      BCP-47: {lang.bcp47}
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition font-medium">
                    Select
                  </span>
                )}
              </button>
            );
          })}

          {filteredLanguages.length === 0 && (
            <div className="py-8 text-center space-y-3">
              <Globe className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">
                No matching pre-indexed language for "{searchQuery}"
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Gemini can communicate in any world language. You can use "{searchQuery}" as your custom language:
              </p>
              <button
                type="button"
                onClick={() =>
                  handleSelect({
                    code: searchQuery.trim().toLowerCase().slice(0, 5),
                    name: searchQuery.trim(),
                    nativeName: searchQuery.trim(),
                    bcp47: "en-US",
                  })
                }
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Use "{searchQuery.trim()}"
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 text-center flex items-center justify-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Gemini will speak, listen, and explain statutory rules in this language</span>
        </div>
      </div>
    </div>
  );
};
