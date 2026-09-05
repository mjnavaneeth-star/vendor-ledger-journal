import React, { useState, useRef, useEffect } from "react";
import { User } from "firebase/auth";
import {
  Send,
  Sparkles,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  FileText,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Mic,
  MicOff,
} from "lucide-react";
import { ChatMessage, LedgerDraft, LedgerEntry, UserProfile } from "../types";
import { saveLedgerEntryToFirestore, fetchUserProfile } from "../firebase";
import { useI18n } from "../utils/i18n";

// Web Speech API SpeechRecognition Detection
const SpeechRecognitionAPI: any =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

interface ConversationalJournalTabProps {
  user: User;
  onEntrySaved?: (entry: LedgerEntry) => void;
  onNavigateToSummary?: () => void;
}

export const ConversationalJournalTab: React.FC<ConversationalJournalTabProps> = ({
  user,
  onEntrySaved,
  onNavigateToSummary,
}) => {
  const todayIso = new Date().toISOString().split("T")[0];

  const initialDraft: LedgerDraft = {
    date: todayIso,
    itemsSold: null,
    totalSales: null,
    totalExpenses: null,
    notes: "",
    isComplete: false,
  };

  const initialMessages: ChatMessage[] = [
    {
      id: "msg-welcome",
      sender: "assistant",
      text: `Hello! I'm your Vendor Ledger Assistant. Let's record today's business numbers one step at a time. What items or goods did you sell at your cart or stall today?`,
      timestamp: Date.now(),
      suggestedQuickReplies: [
        "Tacos & cold sodas",
        "Fresh fruit cups & smoothies",
        "Handmade jewelry & crafts",
        "Clothing & accessories",
      ],
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<LedgerDraft>(initialDraft);
  const [savingToFirestore, setSavingToFirestore] = useState(false);
  const [savedSuccessEntry, setSavedSuccessEntry] = useState<LedgerEntry | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // I18n Context and User Profile for language personalization
  const { language } = useI18n();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (user?.uid) {
      fetchUserProfile(user.uid)
        .then((prof) => {
          if (isMounted && prof) {
            setUserProfile(prof);
          }
        })
        .catch((err) => {
          console.warn("Could not fetch user profile in chat:", err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Web Speech State (SpeechRecognition)
  const isSpeechSupported = Boolean(SpeechRecognitionAPI);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const baseInputRef = useRef<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const handleToggleVoiceInput = () => {
    if (!isSpeechSupported) return;

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Error stopping speech recognition:", e);
        }
      }
      setIsListening(false);
      return;
    }

    try {
      setSpeechError(null);
      const recognition = new SpeechRecognitionAPI();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = userProfile?.languageCode || language?.code || navigator.language || "en-US";

      baseInputRef.current = inputText;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            final += res[0].transcript + " ";
          } else {
            interim += res[0].transcript;
          }
        }

        const spokenCombined = (final + interim).trim();
        if (spokenCombined) {
          const prefix = baseInputRef.current ? baseInputRef.current.trim() + " " : "";
          setInputText(prefix + spokenCombined);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setSpeechError(
            "Microphone permission was denied. Please allow microphone access in your browser settings to speak your entries."
          );
        } else if (event.error === "no-speech") {
          // quiet timeout
        } else if (event.error !== "aborted") {
          setSpeechError(`Voice error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.error("Failed to start speech recognition:", err);
      setSpeechError(err.message || "Failed to access microphone.");
      setIsListening(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
    }
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text || loading) return;

    setInputText("");
    const userMsg: ChatMessage = {
      id: "usr-" + Date.now(),
      sender: "user",
      text,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    const activeLangCode = language?.code || userProfile?.languageCode || "en";
    const activeLangName =
      (language ? `${language.name} (${language.nativeName})` : undefined) ||
      userProfile?.languageName ||
      "English";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ sender: m.sender, text: m.text })),
          currentDraft: draft,
          languageCode: activeLangCode,
          languageName: activeLangName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: "ast-" + Date.now(),
        sender: "assistant",
        text: data.reply || "Got that! What was your total intake today?",
        timestamp: Date.now(),
        suggestedQuickReplies: data.suggestedReplies || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (data.extracted) {
        setDraft((prev) => ({
          ...prev,
          ...data.extracted,
          date: data.extracted.date || prev.date || todayIso,
        }));
      }
    } catch (err: any) {
      console.warn("Chat error:", err);
      // Fallback local assistant response
      const assistantMsg: ChatMessage = {
        id: "ast-" + Date.now(),
        sender: "assistant",
        text: "Got it! Could you let me know how much you earned and what you spent today?",
        timestamp: Date.now(),
        suggestedQuickReplies: ["Made $120 today", "Spent $35 on ingredients", "No expenses today"],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  const handleSaveToFirestore = async () => {
    if (savingToFirestore) return;
    setSavingToFirestore(true);
    setSaveError(null);

    const totalSales = Number(draft.totalSales) || 0;
    const totalExpenses = Number(draft.totalExpenses) || 0;
    const netAmount = totalSales - totalExpenses;
    const date = draft.date || todayIso;
    const notes = draft.notes || draft.itemsSold || "Daily stall sales";

    try {
      const saved = await saveLedgerEntryToFirestore(
        {
          userId: user.uid,
          date,
          totalSales,
          totalExpenses,
          netAmount,
          notes,
        },
        user
      );

      setSavedSuccessEntry(saved);
      if (onEntrySaved) {
        onEntrySaved(saved);
      }

      if (saved.isLocalOnly) {
        setSaveError(
          `Cloud Sync Warning: Entry was saved locally on your device only. It did NOT sync to your Firestore cloud account and may be lost if browser cache is cleared. (${saved.syncError || "Firestore write error"})`
        );
        // Add prominent warning message to chat
        setMessages((prev) => [
          ...prev,
          {
            id: "ast-unsynced-" + Date.now(),
            sender: "assistant",
            text: `⚠️ Cloud Sync Failed! Your entry for ${date} could NOT be synced to your Firestore account and was saved to local browser storage only.\n\n⚠️ Warning: This record may be lost if your browser cache is cleared or if you open the app on another device.\n\nDetails: ${saved.syncError || "Cloud Firestore write failed"}`,
            timestamp: Date.now(),
          },
        ]);
      } else {
        // Add confirmation message to chat
        setMessages((prev) => [
          ...prev,
          {
            id: "ast-saved-" + Date.now(),
            sender: "assistant",
            text: `Success! Today's entry for ${date} has been committed to your private Firestore ledger. Total Sales: $${totalSales}, Total Expenses: $${totalExpenses}, Net Profit: $${netAmount}.`,
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (err: any) {
      console.error("Failed to save to Firestore:", err);
      setSaveError(err.message || "Failed to commit record to Firestore.");
    } finally {
      setSavingToFirestore(false);
    }
  };

  const handleResetForNewDay = () => {
    setDraft(initialDraft);
    setSavedSuccessEntry(null);
    setSaveError(null);
    setMessages([
      {
        id: "msg-reset-" + Date.now(),
        sender: "assistant",
        text: "Ready for another entry! What date is this for, and what goods or services did you sell?",
        timestamp: Date.now(),
        suggestedQuickReplies: [
          "Today's business",
          "Yesterday's business",
          "Sold drinks & snacks",
        ],
      },
    ]);
  };

  const netAmount =
    (Number(draft.totalSales) || 0) - (Number(draft.totalExpenses) || 0);

  const canSave =
    draft.date &&
    draft.totalSales !== null &&
    draft.totalExpenses !== null &&
    !isNaN(Number(draft.totalSales)) &&
    !isNaN(Number(draft.totalExpenses));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left / Main Column: Conversational Chat Interface */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Daily Ledger Chat
              </h2>
              <p className="text-[11px] text-slate-500">
                Gemini asks one question at a time to record your day
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetForNewDay}
            className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition"
            title="Start New Day"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Day</span>
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/40">
          {messages.map((msg) => {
            const isAst = msg.sender === "assistant";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isAst ? "items-start" : "items-end"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    isAst
                      ? "bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-xs"
                      : "bg-slate-900 text-white rounded-tr-xs shadow-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {/* Suggested Quick Replies for Assistant messages */}
                {isAst &&
                  msg.suggestedQuickReplies &&
                  msg.suggestedQuickReplies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.suggestedQuickReplies.map((reply, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={loading}
                          onClick={() => handleQuickReply(reply)}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-medium transition active:scale-95 disabled:opacity-50"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start">
              <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl rounded-tl-xs text-xs text-slate-500 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse delay-100" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse delay-200" />
                <span>Gemini is calculating & verifying your ledger...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 bg-white">
          {/* Active Voice Listening Banner */}
          {isListening && (
            <div className="flex items-center justify-between text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 mb-2 animate-pulse">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
                <span className="font-semibold">Microphone active: Speak your sales, expenses, or items now...</span>
              </div>
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                className="font-bold underline hover:text-red-900 ml-2 shrink-0"
              >
                Done speaking
              </button>
            </div>
          )}

          {/* Voice Error Notice */}
          {speechError && (
            <div className="flex items-center justify-between text-[11px] text-amber-900 bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-1.5 mb-2">
              <div className="flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{speechError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSpeechError(null)}
                className="ml-2 font-bold hover:text-amber-950"
              >
                &times;
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              id="vendor-chat-input"
              type="text"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                baseInputRef.current = e.target.value;
              }}
              placeholder={
                isListening
                  ? "Listening... Speak your sales, expenses, or items now..."
                  : "e.g. Sold 45 tacos at $3 each and spent $30 on fresh beef..."
              }
              disabled={loading}
              className={`flex-1 px-3.5 py-2.5 text-xs text-slate-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition ${
                isListening
                  ? "bg-red-50/50 border-red-300 placeholder:text-red-400"
                  : "bg-slate-50 border-slate-200"
              }`}
            />

            {/* Microphone Button: Only rendered if browser supports Web Speech API */}
            {isSpeechSupported && (
              <button
                id="voice-input-mic-btn"
                type="button"
                onClick={handleToggleVoiceInput}
                disabled={loading}
                title={
                  isListening
                    ? "Microphone is listening... tap to stop"
                    : "Tap to speak (Live speech-to-text transcription)"
                }
                className={`inline-flex items-center justify-center p-2.5 rounded-xl transition active:scale-95 shadow-xs disabled:opacity-40 shrink-0 ${
                  isListening
                    ? "bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-300 animate-pulse"
                    : "bg-slate-100 hover:bg-amber-50 hover:text-amber-900 text-slate-700 border border-slate-200"
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            <button
              id="send-chat-msg-btn"
              type="submit"
              disabled={!inputText.trim() || loading}
              className="inline-flex items-center justify-center p-2.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white rounded-xl transition shadow-xs disabled:opacity-40 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Live Extracted Ledger Ticket */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Today's Ledger Ticket
              </h3>
            </div>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                canSave
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {canSave ? "Ready to Save" : "In Progress"}
            </span>
          </div>

          {/* Ticket Body / Extracted Fields */}
          <div className="space-y-3.5">
            {/* Date Field */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                Transaction Date
              </label>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={draft.date || todayIso}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="w-full text-xs font-mono font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Notes / Items Sold */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                Items Sold & Notes
              </label>
              <div className="flex items-start space-x-2">
                <FileText className="w-4 h-4 text-slate-400 mt-1" />
                <textarea
                  rows={2}
                  value={draft.notes || draft.itemsSold || ""}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="e.g. 40 tacos, 15 cold sodas, ice bag"
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Total Sales & Total Expenses Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Total Sales (Earned)
                </span>
                <div className="flex items-center space-x-1 mt-1">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <input
                    id="draft-sales-input"
                    type="number"
                    step="any"
                    value={draft.totalSales ?? ""}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        totalSales: e.target.value === "" ? null : Number(e.target.value),
                      }))
                    }
                    placeholder="0.00"
                    className="w-full text-sm font-bold font-mono text-emerald-900 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                <span className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                  Total Expenses (Spent)
                </span>
                <div className="flex items-center space-x-1 mt-1">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <input
                    id="draft-expenses-input"
                    type="number"
                    step="any"
                    value={draft.totalExpenses ?? ""}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        totalExpenses: e.target.value === "" ? null : Number(e.target.value),
                      }))
                    }
                    placeholder="0.00"
                    className="w-full text-sm font-bold font-mono text-amber-900 bg-transparent focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Net Calculation Strip */}
            <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Daily Net Profit
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`text-base font-bold font-mono ${
                    netAmount >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  ${netAmount.toFixed(2)}
                </span>
                <span className="block text-[10px] text-slate-400">
                  Sales - Expenses
                </span>
              </div>
            </div>
          </div>

          {saveError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Save Status Banner */}
          {savedSuccessEntry && (
            savedSuccessEntry.isLocalOnly ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-500 text-amber-950 text-xs space-y-2">
                <div className="flex items-center space-x-2 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Cloud Sync Failed: Saved to Local Storage Only</span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Your entry for <strong>{savedSuccessEntry.date}</strong> was NOT synced to your Firestore cloud account and <strong>may be lost</strong> if your browser cache is cleared or if you change devices.
                </p>
                {savedSuccessEntry.syncError && (
                  <p className="text-[10px] font-mono text-amber-900 bg-amber-100 p-1.5 rounded border border-amber-200">
                    Reason: {savedSuccessEntry.syncError}
                  </p>
                )}
                {onNavigateToSummary && (
                  <button
                    type="button"
                    onClick={onNavigateToSummary}
                    className="w-full text-center text-xs font-semibold py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition mt-1 shadow-xs"
                  >
                    View in Ledger & Retry Cloud Sync &rarr;
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
                <div className="flex items-center space-x-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Saved to Firestore ({savedSuccessEntry.date})</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Entry ID: <code className="font-mono">{savedSuccessEntry.id}</code> scoped to UID {user.uid}.
                </p>
                {onNavigateToSummary && (
                  <button
                    type="button"
                    onClick={onNavigateToSummary}
                    className="w-full text-center text-xs font-semibold py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition mt-1"
                  >
                    View My Ledger Summary &rarr;
                  </button>
                )}
              </div>
            )
          )}

          {/* Commit Action Button */}
          <button
            id="commit-ledger-entry-btn"
            type="button"
            disabled={!canSave || savingToFirestore}
            onClick={handleSaveToFirestore}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs transition shadow-xs disabled:opacity-40"
          >
            {savingToFirestore ? (
              <span>Saving to Firestore...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Entry to Ledger</span>
              </>
            )}
          </button>

          {/* Security & Firestore Isolation Badge */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Scope: request.auth.uid == userId</span>
            </span>
            <span className="font-mono">ledgerEntries/{`{entryId}`}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
