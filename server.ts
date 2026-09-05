// @ts-ignore
import express, { Request, Response } from "express";
import * as path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Body parsing with safe size bounds
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Defensive payload ingestion helper
function getSafeBody<T extends Record<string, any>>(req: Request, defaultVal: T = {} as T): T {
  if (req.body && typeof req.body === "object" && !Array.isArray(req.body)) {
    return req.body as T;
  }
  return defaultVal;
}

// Strict undefined-stripping utility (zero-crash payload hygiene)
export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => stripUndefined(item)) as unknown as T;
  }
  if (typeof obj === "object") {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        clean[key] = stripUndefined(value);
      }
    }
    return clean as T;
  }
  return obj;
}

// Gemini Client initialization (Server-side Secret Manager / Environment only)
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-vendor-ledger",
        },
      },
    });
  }
  return geminiClient;
}

// Resilient Model Fallback Ladder (prioritizing stable high-availability flash models)
const MODEL_FALLBACK_LADDER = [
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
] as const;

interface CallGeminiOptions {
  systemInstruction?: string;
  responseSchemaJson?: boolean;
  tools?: any[];
}

interface CallGeminiResult {
  text: string;
  modelUsed: string;
  groundingSources?: Array<{ title?: string; uri?: string }>;
  searchQueries?: string[];
}

// Helper to call Gemini with resilient fallback and search grounding metadata extraction
async function callGeminiResilient(
  prompt: string,
  optionsOrSystemInstruction?: string | CallGeminiOptions,
  responseSchemaJson?: boolean
): Promise<CallGeminiResult> {
  let options: CallGeminiOptions = {};
  if (typeof optionsOrSystemInstruction === "string") {
    options = {
      systemInstruction: optionsOrSystemInstruction,
      responseSchemaJson: Boolean(responseSchemaJson),
    };
  } else if (optionsOrSystemInstruction) {
    options = optionsOrSystemInstruction;
  }

  // 1. Try only ONE Gemini model first
  const client = getGeminiClient();
  const primaryModel = MODEL_FALLBACK_LADDER[0] || "gemini-3.6-flash";

  if (client) {
    try {
      const config: any = {};
      if (options.systemInstruction) config.systemInstruction = options.systemInstruction;
      if (options.responseSchemaJson) {
        config.responseMimeType = "application/json";
      }
      if (options.tools && options.tools.length > 0) {
        config.tools = options.tools;
      }

      const response = await client.models.generateContent({
        model: primaryModel,
        contents: prompt,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      if (response && response.text) {
        const candidate = response.candidates?.[0];
        const groundingMetadata = candidate?.groundingMetadata;
        const groundingChunks = groundingMetadata?.groundingChunks || [];
        const searchQueries = groundingMetadata?.webSearchQueries || [];

        const sources: Array<{ title?: string; uri?: string }> = [];
        const seenUris = new Set<string>();
        for (const chunk of groundingChunks) {
          if (chunk.web?.uri && !seenUris.has(chunk.web.uri)) {
            seenUris.add(chunk.web.uri);
            sources.push({
              title: chunk.web.title || chunk.web.uri,
              uri: chunk.web.uri,
            });
          }
        }

        return {
          text: response.text,
          modelUsed: primaryModel,
          groundingSources: sources,
          searchQueries,
        };
      }
    } catch (err: any) {
      console.warn(`Primary Gemini model (${primaryModel}) failed: ${err?.message || err}. Immediately falling back to OpenRouter...`);
    }
  } else {
    console.warn("Gemini client not configured or key missing. Immediately falling back to OpenRouter...");
  }

  // 2. If single Gemini attempt fails for any reason, immediately call OpenRouter
  const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.Open_Router;
  if (!openRouterKey) {
    throw new Error("Gemini attempt failed and OPENROUTER_API_KEY is not configured.");
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (options.systemInstruction) {
    messages.push({ role: "system", content: options.systemInstruction });
  }
  messages.push({ role: "user", content: prompt });

  const openRouterBody: any = {
    model: "google/gemini-3.8-flash",
    messages,
    max_tokens: 1500,
  };

  if (options.responseSchemaJson) {
    openRouterBody.response_format = { type: "json_object" };
  }

  const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openRouterKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL || "https://ai.studio",
      "X-Title": "Vendor Ledger Journal",
    },
    body: JSON.stringify(openRouterBody),
  });

  if (!openRouterRes.ok) {
    const errorText = await openRouterRes.text();
    throw new Error(`OpenRouter API failed with status ${openRouterRes.status}: ${errorText}`);
  }

  const openRouterData = await openRouterRes.json();
  const content = openRouterData.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter response did not contain content.");
  }

  return {
    text: content,
    modelUsed: "openrouter/google/gemini-3.8-flash",
    groundingSources: [],
    searchQueries: [],
  };
}

// =========================================================================
// API ENDPOINTS
// =========================================================================

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    app: "Vendor Ledger Journal",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
  });
});

interface DraftInput {
  date?: string | null;
  itemsSold?: string | null;
  totalSales?: number | null;
  totalExpenses?: number | null;
  notes?: string | null;
  isComplete?: boolean;
}

/**
 * Language dictionary and resolver for API endpoints
 */
const LANGUAGE_NAME_MAP: Record<string, string> = {
  en: "English",
  ml: "Malayalam (മലയാളം)",
  hi: "Hindi (हिन्दी)",
  es: "Spanish (Español)",
  ta: "Tamil (தமிழ்)",
  te: "Telugu (తెలుగు)",
  kn: "Kannada (ಕನ್ನಡ)",
  bn: "Bengali (বাংলা)",
  mr: "Marathi (मराठी)",
  gu: "Gujarati (ગુજરાતી)",
  pa: "Punjabi (ਪੰਜਾਬੀ)",
  ur: "Urdu (اردو)",
  ar: "Arabic (العربية)",
  sw: "Swahili (Kiswahili)",
  fr: "French (Français)",
  pt: "Portuguese (Português)",
  tl: "Tagalog (Wikang Filipino)",
  id: "Indonesian (Bahasa Indonesia)",
  ms: "Malay (Bahasa Melayu)",
  vi: "Vietnamese (Tiếng Việt)",
  th: "Thai (ไทย)",
  zh: "Chinese (中文)",
  ja: "Japanese (日本語)",
  ko: "Korean (한국어)",
  de: "German (Deutsch)",
  it: "Italian (Italiano)",
  ru: "Russian (Русский)",
  tr: "Turkish (Türkçe)",
};

function resolveLanguage(code?: string, name?: string): { code: string; name: string } {
  const normalizedCode = (code || "").trim().toLowerCase();
  if (normalizedCode && normalizedCode !== "en" && LANGUAGE_NAME_MAP[normalizedCode]) {
    return { code: normalizedCode, name: LANGUAGE_NAME_MAP[normalizedCode] };
  }
  if (name && name.trim() && name.trim().toLowerCase() !== "english") {
    return { code: normalizedCode || "other", name: name.trim() };
  }
  if (normalizedCode && LANGUAGE_NAME_MAP[normalizedCode]) {
    return { code: normalizedCode, name: LANGUAGE_NAME_MAP[normalizedCode] };
  }
  if (name && name.trim()) {
    return { code: normalizedCode || "en", name: name.trim() };
  }
  return { code: "en", name: "English" };
}

/**
 * 1. Conversational Daily Journal Assistant
 * Gemini asks one question at a time:
 * - What date
 * - What they sold today
 * - How much they earned (sales)
 * - How much they spent (expenses)
 * Extracts structured fields and returns current draft status
 */
app.post("/api/chat", async (req: Request, res: Response) => {
  const body = getSafeBody<{
    messages: any[];
    currentDraft: DraftInput;
    languageCode?: string;
    languageName?: string;
  }>(req, {
    messages: [],
    currentDraft: {},
  });
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const currentDraft: DraftInput = body.currentDraft || {};
  const lang = resolveLanguage(body.languageCode, body.languageName);
  const userLanguage = lang.name;
  const isNonEnglish = lang.code !== "en" && !lang.name.toLowerCase().startsWith("english");

  // Formulate prompt history for Gemini
  const conversationHistory = messages
    .map((m: any) => `${m.sender === "user" ? "Vendor" : "Journal Assistant"}: ${m.text}`)
    .join("\n");

  const todayIso = new Date().toISOString().split("T")[0];

  const systemInstruction = `You are the friendly, encouraging "Vendor Ledger Assistant" specifically designed for informal street vendors, market stall holders, food cart operators, and artisan sellers.
Your goal: Guide the vendor step-by-step to record today's business numbers in their ledger.

CRITICAL CONVERSATIONAL RULES:
1. Ask ONE simple question at a time. Never overwhelm them with multiple questions at once.
2. Order of inquiry:
   Step 1: Date (Default to today: "${todayIso}" if they say "today", "yesterday", or just start talking about their sales).
   Step 2: What items or goods did they sell today? (e.g. tacos, fruit cups, drinks, handmade jewelry, shirts).
   Step 3: Total earnings/sales (How much cash & digital payments came in total today?). If they say items and prices (e.g. "40 meals at $5 and 10 waters at $1"), compute the total ($210).
   Step 4: Total expenses (What did they spend on stock/ingredients, cart fuel, stall fees, transport, packaging, ice?).
3. Once all 3 core numbers are known (date, totalSales, totalExpenses):
   - Summarize the numbers warmly.
   - Show the net profit (Sales - Expenses).
   - Congratulate them on wrapping up the day and ask if they would like to save this to their ledger.
4. Keep replies brief, warm, simple, supportive, and completely jargon-free. No accounting jargon (no "accruals", "liabilities", "balance sheets").
5. MANDATORY LANGUAGE DIRECTIVE:
   The vendor communicates in ${userLanguage}.
   You MUST write your conversational "reply" and all items in "suggestedReplies" in ${userLanguage}.
   Even if the conversation transcript or user message contains English or numbers, your "reply" MUST be completely written in ${userLanguage}.
   Do NOT output "reply" in English (unless ${userLanguage} is English). Keep only the JSON object schema keys in English ("reply", "extracted", "date", "itemsSold", "totalSales", "totalExpenses", "notes", "isComplete", "suggestedReplies"), but the string values inside "reply" and "suggestedReplies" MUST be in ${userLanguage}.

You MUST return a JSON object with this exact schema:
{
  "reply": "Your brief conversational response in ${userLanguage} asking the NEXT single question or summarizing the completed day",
  "extracted": {
    "date": "YYYY-MM-DD or null if not yet determined",
    "itemsSold": "Brief text summary of products sold, or null if unknown",
    "totalSales": number or null if unknown,
    "totalExpenses": number or null if unknown,
    "notes": "Short helpful note of items sold and expenses mentioned, or null",
    "isComplete": boolean (true ONLY when date, totalSales, and totalExpenses are all known numbers)
  },
  "suggestedReplies": ["short quick reply 1 in ${userLanguage}", "short quick reply 2 in ${userLanguage}"]
}`;

  const prompt = `${isNonEnglish ? `CRITICAL LANGUAGE INSTRUCTION:
You MUST reply strictly in ${userLanguage}. Your "reply" field and all items in "suggestedReplies" must be written in ${userLanguage}.

` : ""}Current recorded draft:
Date: ${currentDraft.date || "Not yet known"}
Items: ${currentDraft.itemsSold || "Not yet known"}
Total Sales: ${currentDraft.totalSales ?? "Not yet known"}
Total Expenses: ${currentDraft.totalExpenses ?? "Not yet known"}
Notes: ${currentDraft.notes || "None"}

Conversation Transcript:
${conversationHistory}

Based on this conversation, extract any newly mentioned figures (combining with the existing draft), choose the next friendly question to ask, and output the JSON response.
${isNonEnglish ? `MANDATORY: Formulate the conversational "reply" and all "suggestedReplies" in ${userLanguage}. Do NOT reply in English.` : ""}`;

  try {
    const { text, modelUsed } = await callGeminiResilient(prompt, systemInstruction, true);
    
    // Parse JSON safely
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Clean up markdown block if present
      const cleaned = text.replace(/```json\s*/i, "").replace(/```\s*$/, "").trim();
      parsed = JSON.parse(cleaned);
    }

    // Merge with currentDraft defensively
    const finalDraft = {
      date: parsed.extracted?.date || currentDraft.date || todayIso,
      itemsSold: parsed.extracted?.itemsSold || currentDraft.itemsSold || null,
      totalSales: parsed.extracted?.totalSales !== null && parsed.extracted?.totalSales !== undefined
        ? Number(parsed.extracted.totalSales)
        : currentDraft.totalSales ?? null,
      totalExpenses: parsed.extracted?.totalExpenses !== null && parsed.extracted?.totalExpenses !== undefined
        ? Number(parsed.extracted.totalExpenses)
        : currentDraft.totalExpenses ?? null,
      notes: parsed.extracted?.notes || currentDraft.notes || parsed.extracted?.itemsSold || "",
      isComplete: false,
    };

    finalDraft.isComplete =
      finalDraft.date !== null &&
      finalDraft.totalSales !== null &&
      finalDraft.totalExpenses !== null &&
      !isNaN(finalDraft.totalSales) &&
      !isNaN(finalDraft.totalExpenses);

    res.json({
      reply: parsed.reply,
      extracted: finalDraft,
      suggestedReplies: parsed.suggestedReplies || [],
      modelUsed,
    });
  } catch (err: any) {
    console.warn("Gemini call fell back to local conversational heuristic:", err.message);

    // Heuristic fallback for offline / mock testing
    const lastUserMsg = messages
      .filter((m: any) => m.sender === "user")
      .slice(-1)[0]?.text || "";

    const fallbackResponse = generateHeuristicChatResponse(lastUserMsg, currentDraft, todayIso, lang);
    res.json(fallbackResponse);
  }
});

function generateHeuristicChatResponse(
  lastMsg: string,
  currentDraft: any,
  todayIso: string,
  lang: { code: string; name: string } = { code: "en", name: "English" }
) {
  const lower = lastMsg.toLowerCase();
  const draft = { ...currentDraft };
  const langCode = lang.code || "en";

  // Parse numbers from message
  const numbers = lastMsg.match(/\$?\b\d+(\.\d{1,2})?\b/g)?.map((n) => Number(n.replace("$", ""))) || [];

  let reply = "";
  let suggestions = ["Today's sales", "Sold food & drinks", "Spent $30 on ingredients"];

  if (!draft.date) {
    draft.date = todayIso;
  }

  if (draft.totalSales === null || draft.totalSales === undefined) {
    if (numbers.length > 0 && (lower.includes("earn") || lower.includes("sold") || lower.includes("made") || lower.includes("sales") || lower.includes("$") || lower.includes("രൂപ") || lower.includes("₹"))) {
      draft.totalSales = numbers[0];
      if (!draft.itemsSold) {
        draft.itemsSold = lastMsg.replace(/\$?\b\d+(\.\d{1,2})?\b/g, "").trim() || "Daily goods";
      }
      if (langCode === "ml") {
        reply = `ശരി! ആകെ ${draft.totalSales} രൂപ വിൽപ്പന രേഖപ്പെടുത്തി. ഇന്ന് സാധനങ്ങൾ വാങ്ങാനും മറ്റ് ആവശ്യങ്ങൾക്കുമായി എത്ര രൂപ ചെലവായി?`;
        suggestions = ["ചെലവുകളൊന്നുമില്ല (0)", "സാധനങ്ങൾക്ക് 25 രൂപ", "ഐസിനും സ്റ്റോക്കിനും 40 രൂപ"];
      } else if (langCode === "hi") {
        reply = `समझ गया! आपने कुल ₹${draft.totalSales} की बिक्री दर्ज की। आज स्टॉक, सामग्री, किराया या परिवहन पर कितना खर्च हुआ?`;
        suggestions = ["कोई खर्च नहीं (0)", "सामान पर ₹25", "स्टॉक पर ₹40"];
      } else if (langCode === "es") {
        reply = `¡Entendido! Registraste $${draft.totalSales} en ventas totales. ¿Cuánto gastaste hoy en mercancía, ingredientes, transporte o puesto?`;
        suggestions = ["$0 en gastos", "$25 en insumos", "$40 en stock"];
      } else {
        reply = `Got it! You recorded $${draft.totalSales} in total sales. Now, how much did you spend on stock, ingredients, cart fees, or transport today?`;
        suggestions = ["$0 expenses", "$25 for ingredients", "$40 for stock & ice"];
      }
    } else {
      if (lastMsg && !draft.itemsSold) {
        draft.itemsSold = lastMsg;
        if (langCode === "ml") {
          reply = `വളരെ നല്ലത്! ${lastMsg} വിറ്റതിലൂടെ ഇന്ന് ആകെ എത്ര രൂപയുടെ കച്ചവടം നടന്നു?`;
          suggestions = ["120 രൂപ", "85 രൂപ", "150 രൂപ"];
        } else if (langCode === "hi") {
          reply = `बहुत बढ़िया! आज ${lastMsg} बेचकर कुल कितने रुपये की बिक्री हुई?`;
          suggestions = ["₹120 की कमाई", "₹85 मिले", "लगभग ₹150"];
        } else if (langCode === "es") {
          reply = `¡Excelente! ¿Aproximadamente cuánto dinero o pago recibiste hoy vendiendo ${lastMsg}?`;
          suggestions = ["Obtuve $120", "$85 en total", "Alrededor de $150"];
        } else {
          reply = `Sounds delicious and busy! About how much total cash or payment did you take in from selling ${lastMsg} today?`;
          suggestions = ["Made $120", "Earned $85", "Sold about $150"];
        }
      } else {
        if (langCode === "ml") {
          reply = `നമസ്കാരം! ഇന്നത്തെ കണക്കുകൾ രേഖപ്പെടുത്താം. ഇന്ന് സ്റ്റാളിൽ എന്തെല്ലാം സാധനങ്ങളാണ് വിറ്റത്?`;
          suggestions = ["ഭക്ഷണവും ചായയും", "പഴങ്ങൾ", "കൈകൊണ്ട് ഉണ്ടാക്കിയ കരകൗശലങ്ങൾ"];
        } else if (langCode === "hi") {
          reply = `नमस्ते! आइए आज का हिसाब दर्ज करें। आज आपने अपनी दुकान या ठेले पर क्या सामान बेचा?`;
          suggestions = ["चाय व समोसा", "ताजे फल", "हस्तशिल्प व कपड़े"];
        } else if (langCode === "es") {
          reply = `¡Hola! Registremos tu jornada. Primero, ¿qué productos o artículos vendiste hoy en tu puesto?`;
          suggestions = ["Comida y bebidas", "Frutas frescas", "Artesanías y accesorios"];
        } else {
          reply = `Hello! Let's record your day. First, what goods or items did you sell at your stall or cart today?`;
          suggestions = ["Tacos & cold sodas", "Fresh fruit cups", "Handmade crafts & accessories"];
        }
      }
    }
  } else if (draft.totalExpenses === null || draft.totalExpenses === undefined) {
    if (numbers.length > 0 || lower.includes("none") || lower.includes("zero") || lower.includes("nothing") || lower.includes("ഒന്നുമില്ല") || lower.includes("ഇല്ല") || lower.includes("कुछ नहीं")) {
      draft.totalExpenses = numbers.length > 0 ? numbers[0] : 0;
      const net = draft.totalSales - draft.totalExpenses;
      if (langCode === "ml") {
        reply = `എല്ലാം കൃത്യമായി രേഖപ്പെടുത്തി! ഇന്ന് വിൽപ്പന ${draft.totalSales}, ചെലവ് ${draft.totalExpenses}, ലാഭം ${net} രൂപയാണ്. ഇത് ലെഡ്ജറിലേക്ക് സേവ് ചെയ്യണോ?`;
        suggestions = ["അതെ, സേവ് ചെയ്യുക!", "ചെലവ് മാറ്റുക", "കുറിപ്പ് ചേർക്കുക"];
      } else if (langCode === "hi") {
        reply = `सब तैयार है! आज आपकी कुल बिक्री ₹${draft.totalSales} और खर्च ₹${draft.totalExpenses} रहा, जिससे शुद्ध बचत ₹${net} हुई। क्या इसे लेज़र में सुरक्षित करें?`;
        suggestions = ["हाँ, लेज़र में सहेजें!", "खर्च बदलें", "विवरण जोड़ें"];
      } else if (langCode === "es") {
        reply = `¡Todo listo! Hoy ingresaste $${draft.totalSales} con $${draft.totalExpenses} en gastos, dejando una ganancia neta de $${net}. ¿Quieres guardar esto en tu diario?`;
        suggestions = ["Sí, guardar registro", "Cambiar gastos", "Agregar una nota"];
      } else {
        reply = `All set! Today you took in $${draft.totalSales} with $${draft.totalExpenses} in expenses, leaving a net of $${net}. Would you like to save this to your ledger now?`;
        suggestions = ["Yes, save entry!", "Change expenses", "Add a note"];
      }
      draft.isComplete = true;
    } else {
      if (langCode === "ml") {
        reply = `വിൽപ്പന ${draft.totalSales} രൂപ രേഖപ്പെടുത്തി. ഇനി സാധനങ്ങൾ വാങ്ങിയതിനോ യാത്രയ്ക്കോ മറ്റോ ഉള്ള ഇന്നത്തെ ചെലവ് എത്രയാണ്?`;
        suggestions = ["20 രൂപ ചെലവായി", "ഇന്ന് ചെലവുകളൊന്നുമില്ല", "45 രൂപ ചെലവായി"];
      } else if (langCode === "hi") {
        reply = `आपकी बिक्री ₹${draft.totalSales} दर्ज हो गई है। अब बताएं कि आज स्टॉक, सामग्री या भाड़े पर क्या खर्च हुआ?`;
        suggestions = ["₹20 का खर्च", "आज कोई खर्च नहीं", "सामग्री पर ₹45"];
      } else if (langCode === "es") {
        reply = `Anotadas tus ventas de $${draft.totalSales}. ¿Y cuáles fueron tus gastos de hoy en mercancía, puesto o transporte?`;
        suggestions = ["Gasté $20 en stock", "Sin gastos hoy", "Gasté $45 en insumos"];
      } else {
        reply = `Got your sales of $${draft.totalSales}. And what were your expenses today for inventory, ingredients, stall fees, or transport?`;
        suggestions = ["Spent $20 on stock", "Zero expenses today", "Spent $45 on supplies"];
      }
    }
  } else {
    draft.isComplete = true;
    const net = draft.totalSales - draft.totalExpenses;
    if (langCode === "ml") {
      reply = `ഇന്നത്തെ കണക്ക് തയ്യാറാണ്: വിൽപ്പന: ${draft.totalSales}, ചെലവ്: ${draft.totalExpenses}, അറ്റാദായം: ${net}. സേവ് ചെയ്യാം!`;
      suggestions = ["ലെഡ്ജറിൽ സേവ് ചെയ്യുക", "പുതിയ ദിവസം തുടങ്ങുക"];
    } else if (langCode === "hi") {
      reply = `आपकी प्रविष्टि तैयार है: बिक्री: ₹${draft.totalSales}, खर्च: ₹${draft.totalExpenses}, शुद्ध लाभ: ₹${net}। जब चाहें सहेजें!`;
      suggestions = ["लेज़र में सहेजें", "नया दिन शुरू करें"];
    } else if (langCode === "es") {
      reply = `Tu registro está listo: Ventas: $${draft.totalSales}, Gastos: $${draft.totalExpenses}, Ganancia Neta: $${net}. ¡Haz clic en guardar cuando quieras!`;
      suggestions = ["Guardar en Libro Mayor", "Iniciar nuevo registro"];
    } else {
      reply = `Your entry is ready: Sales: $${draft.totalSales}, Expenses: $${draft.totalExpenses}, Net Profit: $${net}. Click "Save to Ledger" whenever you're ready!`;
      suggestions = ["Save to Ledger", "Start new entry"];
    }
  }

  draft.notes = draft.notes || draft.itemsSold || "Daily street sales";

  return {
    reply,
    extracted: draft,
    suggestedReplies: suggestions,
    modelUsed: "local-heuristic-engine",
  };
}

/**
 * 2. Compliance Orientation Generator
 * Summarizes general patterns for informal traders at that scale.
 * Strictly adheres to:
 * - Never definitive legal/tax advice
 * - Never fabricated jurisdiction-specific thresholds
 * - Always ending with a nudge to consult a real accountant or local authority
 */
interface JurisdictionComplianceSpec {
  country: string;
  region: string;
  resolvedCurrencySymbol: string;
  searchQueries: string[];
  taxSystemName: string;
  indirectTaxName: string;
  localPermitName: string;
  keyAuthorities: string[];
  keyThresholds: string[];
  prohibitedForeignTerms: string[];
  generateFallbackText: (params: {
    periodLabel: string;
    entryCount: number;
    totalSales: number;
    totalExpenses: number;
    netAmount: number;
    marginPct: number;
    dailyAvg: number;
    monthlyEstGross: number;
    monthlyEstNet: number;
    annualEstGross: number;
    annualEstNet: number;
    tradingDuration: string;
    sym: string;
  }) => string;
}

function getJurisdictionComplianceSpec(
  countryInput: string,
  regionInput: string,
  passedCurrency?: string
): JurisdictionComplianceSpec {
  const country = (countryInput || "").trim() || "India";
  const region = (regionInput || "").trim() || "Kerala";
  const c = country.toLowerCase();

  // India (e.g. Kerala)
  if (c.includes("india")) {
    const sym = passedCurrency && passedCurrency !== "$" ? passedCurrency : "₹";
    return {
      country,
      region,
      resolvedCurrencySymbol: sym,
      searchQueries: [
        "GST registration threshold India small business",
        `${region} street vendor license requirements`,
        "India presumptive taxation Section 44AD small traders",
        "Kerala Street Vendors Protection of Livelihood Town Vending Committee rules",
        "FSSAI registration petty food business operator 12 lakh threshold India",
      ],
      taxSystemName: "Income Tax Act, 1961 (Section 44AD Presumptive Taxation Scheme, Basic Exemption Limit under New Tax Regime)",
      indirectTaxName: "Goods and Services Tax (GST - Central GST and Kerala State GST)",
      localPermitName: "Street Vending Certificate / ID Card from Town Vending Committee (TVC), Local Body D&O Trade License (Grama Panchayat / Municipality / Corporation under LSGD), FSSAI Basic Registration",
      keyAuthorities: [
        "Local Self Government Department (LSGD) Kerala / Town Vending Committee (TVC)",
        "State Goods and Services Tax (SGST) Department Kerala / CBIC",
        "Income Tax Department (Assessing Officer)",
        "Food Safety and Standards Authority of India (FSSAI)",
      ],
      keyThresholds: [
        "Mandatory GST registration threshold for supply of goods: ₹40,00,000 (₹40 Lakh) annual aggregate turnover (exempt below ₹40 Lakh for intra-state goods trade)",
        "Presumptive Taxation under Section 44AD of the Income Tax Act: Available for turnover up to ₹2 Crore (₹2,00,00,000), declaring deemed net profit of 8% (cash) or 6% (digital/UPI) without audited books of account",
        "Income Tax Basic Exemption Limit: ₹3,00,000 under the New Tax Regime, with Section 87A rebate providing zero tax liability up to ₹7,00,000 taxable income",
        "FSSAI Basic Food Business Registration (Form A): For petty food stallholders with annual turnover under ₹12 Lakh (₹100/year nominal fee)",
      ],
      prohibitedForeignTerms: [
        "US IRS",
        "Internal Revenue Service",
        "Schedule C",
        "Form 1040",
        "1099",
        "self-employment tax of $400",
        "$400",
        "400 dollar",
        "UK HMRC",
        "HM Revenue & Customs",
        "trading allowance of £1,000",
        "£1,000",
        "1,000 pound",
        "sales tax permit",
        "municipal clerk",
        "CDTFA",
        "National Insurance",
      ],
      generateFallbackText: ({
        periodLabel,
        entryCount,
        totalSales,
        totalExpenses,
        netAmount,
        marginPct,
        dailyAvg,
        monthlyEstGross,
        monthlyEstNet,
        annualEstGross,
        annualEstNet,
        tradingDuration,
        sym,
      }) => `### 1. Financial Scale & Run-Rate Assessment
Across your ${periodLabel} (${entryCount} logged trading days), you generated ${sym}${totalSales.toLocaleString()} in gross intake against ${sym}${totalExpenses.toLocaleString()} in stock and operating costs, delivering ${sym}${netAmount.toLocaleString()} in net profit (${marginPct}% operating margin).
- **Daily Pace:** Averaging ${sym}${Math.round(dailyAvg).toLocaleString()} gross per trading day.
- **Estimated Run-Rate:** On a standard 26-day monthly schedule, your pace projects to approximately ${sym}${monthlyEstGross.toLocaleString()} gross (~${sym}${monthlyEstNet.toLocaleString()} net profit), which scales to an annualized run-rate of ~${sym}${annualEstGross.toLocaleString()} gross (~${sym}${annualEstNet.toLocaleString()} net).

### 2. Statutory Thresholds & Legal Classification (${region}, ${country})
At an annualized turnover run-rate of ~${sym}${annualEstGross.toLocaleString()} and net earnings of ~${sym}${annualEstNet.toLocaleString()}:
- **GST Exemption Status (CGST & Kerala SGST):** Under Section 22 of the Central Goods and Services Tax Act and Kerala State GST Act, mandatory GST registration for businesses supplying goods intra-state is triggered only when annual aggregate turnover exceeds ₹40,00,000 (₹40 Lakh). At your annualized pace of ~${sym}${annualEstGross.toLocaleString()}, you operate comfortably beneath this threshold and are legally exempt from mandatory GST registration. You do not need to register for a GSTIN or collect GST.
- **Income Tax & Section 44AD Presumptive Taxation:** Under the Income Tax Act, 1961, micro-enterprises and small retailers with turnover under ₹2 Crore are eligible for the Presumptive Taxation Scheme under Section 44AD. Under Section 44AD, you are not required to maintain complex audited accounting books; instead, you declare a minimum deemed profit of 8% of cash turnover (or 6% of digital/UPI turnover). Under the default New Tax Regime, income up to ₹3,00,000 has zero tax, and with the Section 87A rebate, individual taxable income up to ₹7,00,000 results in zero net tax liability.
- **Trading Tenure Context:** Operating for ${tradingDuration} in ${region} establishes your micro-enterprise as an ongoing local trade. Maintaining clear records of stock purchases protects your true ${marginPct}% margin against arbitrary turnover estimates.

### 3. Bookkeeping & Document Retention Standards
To safeguard your margin and prepare for official review in ${country}, implement these three core practices:
1. **Digital Payment & UPI Statements:** Retain monthly statement PDFs from your merchant QR / UPI providers (PhonePe, Google Pay, Paytm, BHIM). As digital transactions are visible in the Income Tax Department's Annual Information Statement (AIS), reconciling daily UPI receipts with cash intake is vital.
2. **Purchase Invoice & Mandi Receipts:** Preserve all wholesale bills, ingredient purchase invoices, and vendor receipts in a monthly file. Under Section 44AD or standard assessment, valid expense documentation proves genuine business outlay.
3. **Dedicated Banking Separation:** Maintain a dedicated savings or current bank account linked to your UPI QR to keep stall cash flows distinct from personal household expenditures.

### 4. Formalization Roadmap & Filing Cadence
- **Town Vending Committee (TVC) Registration:** Under the Street Vendors (Protection of Livelihood and Regulation of Street Vending) Act, 2014 and Kerala Street Vendors Rules, register with the local Town Vending Committee (TVC) established under your local body (Corporation, Municipality, or Grama Panchayat under the Local Self Government Department - LSGD). Participate in the street vendor biometric survey to obtain a Vending Certificate and Vendor Identity Card, securing your right to trade in a designated Vending Zone.
- **Local Body Trade License:** Obtain your local trade license (D&O license) from the Secretary of your Grama Panchayat, Municipality, or Municipal Corporation via the LSGD citizen portal (e.g. K-Smart in Kerala).
- **FSSAI Basic Registration (if selling food/tea/snacks):** If your stall sells prepared food, snacks, or beverages, obtain a Basic Registration (Form A) from the Food Safety and Standards Authority of India (FSSAI), which applies to petty food business operators with turnover up to ₹12 Lakh per year (nominal fee of ₹100/year).
- **Annual Tax Cadence:** File your annual Income Tax Return (ITR-4 Sugam under Section 44AD) by July 31 following the close of each financial year (April 1 to March 31).

### 5. Practical Risk Watchouts for Informal Traders
- **Digital Transaction Visibility:** With the rapid adoption of QR/UPI payments, the Income Tax Department's AIS (Annual Information Statement) automatically captures merchant digital inflows. Neglecting to record cash expenses could make digital turnover look like 100% untaxed profit.
- **Vending Zone Adherence:** Operating outside demarcated vending zones without a TVC certificate leaves vendors vulnerable to eviction drives or local body confiscations.

### 6. Regulatory Verification Checkpoint
Confirm your exact street vending zone classification and TVC certificate status with your local Town Vending Committee under the Local Self Government Department (LSGD) in ${region}, and verify your Section 44AD filing eligibility with a local Chartered Accountant (CA) or Tax Practitioner in ${region}, ${country}.`,
    };
  }

  // United States
  if (c.includes("united states") || c.includes("usa") || c === "us") {
    const sym = passedCurrency || "$";
    return {
      country,
      region,
      resolvedCurrencySymbol: sym,
      searchQueries: [
        `IRS Schedule C self employment tax threshold small business 400`,
        `${region} seller permit sales tax requirements small business`,
        `${region} street vendor permit municipal licensing health permit`,
      ],
      taxSystemName: "Federal Income Tax (Schedule C, Form 1040-ES) & Self-Employment (SE) Tax",
      indirectTaxName: `State and Local Sales and Use Tax (${region})`,
      localPermitName: `State Seller's Permit / Resale License, City Business Tax Certificate, County Environmental Health Permit`,
      keyAuthorities: [
        "Internal Revenue Service (IRS)",
        `${region} Department of Revenue / Tax Administration`,
        "Local City / County Business Licensing Clerk",
        "County Department of Public Health",
      ],
      keyThresholds: [
        "Self-Employment Tax threshold: Net earnings of $400 or more trigger mandatory Schedule C and SE tax reporting",
        "State Seller's Permit: Required for tangible retail goods / taxable food sales from day one of operation",
        "Quarterly Estimated Tax: Form 1040-ES due quarterly (April 15, June 15, September 15, January 15)",
      ],
      prohibitedForeignTerms: [
        "GST",
        "CGST",
        "SGST",
        "Section 44AD",
        "HMRC",
        "Trading Allowance of £1,000",
        "Lakh",
        "Crore",
        "FSSAI",
        "Town Vending Committee",
      ],
      generateFallbackText: ({
        periodLabel,
        entryCount,
        totalSales,
        totalExpenses,
        netAmount,
        marginPct,
        dailyAvg,
        monthlyEstGross,
        monthlyEstNet,
        annualEstGross,
        annualEstNet,
        tradingDuration,
        sym,
      }) => `### 1. Financial Scale & Run-Rate Assessment
Across your ${periodLabel} (${entryCount} logged trading days), you generated ${sym}${totalSales.toLocaleString()} in gross intake against ${sym}${totalExpenses.toLocaleString()} in stock and operating costs, delivering ${sym}${netAmount.toLocaleString()} in net profit (${marginPct}% operating margin).
- **Daily Pace:** Averaging ${sym}${Math.round(dailyAvg).toLocaleString()} gross per trading day.
- **Estimated Run-Rate:** On a standard 26-day monthly schedule, your pace projects to approximately ${sym}${monthlyEstGross.toLocaleString()} gross (~${sym}${monthlyEstNet.toLocaleString()} net profit), which scales to an annualized run-rate of ~${sym}${annualEstGross.toLocaleString()} gross (~${sym}${annualEstNet.toLocaleString()} net).

### 2. Statutory Thresholds & Legal Classification (${region}, ${country})
At an annualized net earnings run-rate of ~${sym}${annualEstNet.toLocaleString()}:
- **Federal Self-Employment Tax Threshold:** Under IRS guidelines, net self-employment earnings of $400 or more trigger mandatory Schedule C and Self-Employment (SE) tax filing (Schedule SE). At an annualized trajectory of ~${sym}${annualEstNet.toLocaleString()}, you clearly meet this statutory threshold.
- **Sales Tax Nexus:** In ${region}, retailing tangible personal goods or prepared foods requires an active Seller's Permit from the state tax department from day one of sales.
- **Trading Tenure Context:** Operating for ${tradingDuration} establishes an ongoing trade. Accurate expense logs ensure you are only taxed on net profit (${sym}${netAmount.toLocaleString()}), not gross intake.

### 3. Bookkeeping & Document Retention Standards
1. **Itemized Expense Documentation:** Retain supplier receipts, ingredient bills, packaging, and commercial equipment receipts.
2. **Daily Reconciliation:** Reconcile cash and credit card payments daily.
3. **Dedicated Banking Separation:** Keep a separate commercial checking account.

### 4. Formalization Roadmap & Filing Cadence
- **State Seller's Permit:** Register with the ${region} Department of Revenue / Tax Administration.
- **City / County Vending Permit:** Obtain a street vending permit and public health certificate.
- **Filing Cadence:** Pay quarterly estimated taxes (Form 1040-ES) and file state sales tax returns according to your assigned cadence.

### 5. Practical Risk Watchouts for Informal Traders
- **Gross vs. Net Risk:** Form 1099-K reporting from card processors displays gross intake; unsubstantiated expenses risk being disallowed.
- **Local Sidewalk Vending Ordinances:** Verify designated sidewalk vending zones and buffer distances.

### 6. Regulatory Verification Checkpoint
Confirm your exact seller's permit requirements, local municipal vending license rules, and quarterly estimated tax deadlines with the ${region} Department of Revenue and local city clerk in ${region}, ${country}.`,
    };
  }

  // United Kingdom
  if (c.includes("united kingdom") || c.includes("uk") || c.includes("england") || c.includes("scotland") || c.includes("wales")) {
    const sym = passedCurrency || "£";
    return {
      country,
      region,
      resolvedCurrencySymbol: sym,
      searchQueries: [
        `HMRC self assessment trading allowance small business sole trader`,
        `UK VAT registration threshold 90000`,
        `street trading license local council ${region} UK`,
      ],
      taxSystemName: "HMRC Self Assessment (Income Tax & Class 2/4 National Insurance)",
      indirectTaxName: "Value Added Tax (VAT)",
      localPermitName: "Street Trading Consent / Licence from Local Council, Food Business Registration",
      keyAuthorities: [
        "HM Revenue & Customs (HMRC)",
        `${region} Local Council (Licensing Department)`,
        "Food Standards Agency (FSA)",
      ],
      keyThresholds: [
        "Trading Allowance: £1,000 gross trading income per tax year (income exceeding £1,000 requires HMRC registration and Self Assessment)",
        "VAT Registration Threshold: £90,000 rolling 12-month taxable turnover",
        "Self Assessment filing deadline: January 31 following the tax year for online submissions",
      ],
      prohibitedForeignTerms: [
        "IRS",
        "Schedule C",
        "1040",
        "GST",
        "Section 44AD",
        "Lakh",
        "Crore",
        "$400",
      ],
      generateFallbackText: ({
        periodLabel,
        entryCount,
        totalSales,
        totalExpenses,
        netAmount,
        marginPct,
        dailyAvg,
        monthlyEstGross,
        monthlyEstNet,
        annualEstGross,
        annualEstNet,
        tradingDuration,
        sym,
      }) => `### 1. Financial Scale & Run-Rate Assessment
Across your ${periodLabel} (${entryCount} logged trading days), you generated ${sym}${totalSales.toLocaleString()} in gross intake against ${sym}${totalExpenses.toLocaleString()} in stock and operating costs, delivering ${sym}${netAmount.toLocaleString()} in net profit (${marginPct}% operating margin).
- **Daily Pace:** Averaging ${sym}${Math.round(dailyAvg).toLocaleString()} gross per trading day.
- **Estimated Run-Rate:** On a standard 26-day monthly schedule, your pace projects to approximately ${sym}${monthlyEstGross.toLocaleString()} gross (~${sym}${monthlyEstNet.toLocaleString()} net profit), which scales to an annualized run-rate of ~${sym}${annualEstGross.toLocaleString()} gross (~${sym}${annualEstNet.toLocaleString()} net).

### 2. Statutory Thresholds & Legal Classification (${region}, ${country})
At an annualized gross pace of ~${sym}${annualEstGross.toLocaleString()}:
- **HMRC Trading Allowance:** Under HMRC rules, gross trading income exceeding the £1,000 trading allowance requires registration as a sole trader and filing an annual Self Assessment tax return. At ~${sym}${annualEstGross.toLocaleString()} annualized, you must be registered with HMRC.
- **VAT Threshold:** Mandatory VAT registration is set at £90,000 annual turnover; at your current pace, you remain well below this threshold.
- **Trading Tenure Context:** Operating for ${tradingDuration} in ${region} indicates ongoing trade requiring proper expense substantiation.

### 3. Bookkeeping & Document Retention Standards
1. **Receipts & Invoices:** Retain all purchase invoices and receipts for at least 5 years after the January 31 submission deadline.
2. **Daily Takings Log:** Reconcile cash and contactless card payments daily.
3. **Dedicated Business Account:** Segregate business takings from personal finances.

### 4. Formalization Roadmap & Filing Cadence
- **HMRC Sole Trader Registration:** Register for Self Assessment and obtain a Unique Taxpayer Reference (UTR).
- **Council Street Trading Licence:** Apply to your local council in ${region} for a Street Trading Consent or Licence.
- **Filing Cadence:** Submit Self Assessment and pay Income Tax and Class 4 NICs by January 31.

### 5. Practical Risk Watchouts for Informal Traders
- **Unlicensed Pitch Enforcement:** Trading on public highways or designated streets without local council consent risks prosecution and fines.
- **Expense Disallowance:** Failure to retain receipts can lead to HMRC disallowing deductions.

### 6. Regulatory Verification Checkpoint
Confirm your exact street trading consent and local licensing requirements with your local council licensing department in ${region}, and verify your Self Assessment obligations with HM Revenue & Customs (HMRC) in the UK.`,
    };
  }

  // General / Other countries
  const sym = passedCurrency || "$";
  return {
    country,
    region,
    resolvedCurrencySymbol: sym,
    searchQueries: [
      `${country} small business tax registration threshold informal trader`,
      `${region} ${country} street vendor licensing local municipality requirements`,
      `${country} micro enterprise presumptive tax turnover threshold`,
    ],
    taxSystemName: `National Small Business Revenue System of ${country}`,
    indirectTaxName: `Value Added Tax / Commercial Turnover Tax of ${country}`,
    localPermitName: `Municipal Street Trading Permit in ${region}, ${country}`,
    keyAuthorities: [
      `National Revenue / Tax Authority of ${country}`,
      `Local Municipal Council / Government of ${region}`,
    ],
    keyThresholds: [
      `Statutory micro-enterprise and informal trader registration thresholds under the national laws of ${country}`,
      `Municipal vending permit and market trading bylaws in ${region}`,
    ],
    prohibitedForeignTerms: [
      "IRS",
      "Schedule C",
      "Form 1040",
      "$400",
      "HMRC",
      "£1,000 trading allowance",
      "GST registration threshold 40 lakh",
      "Section 44AD",
    ],
    generateFallbackText: ({
      periodLabel,
      entryCount,
      totalSales,
      totalExpenses,
      netAmount,
      marginPct,
      dailyAvg,
      monthlyEstGross,
      monthlyEstNet,
      annualEstGross,
      annualEstNet,
      tradingDuration,
      sym,
    }) => `### 1. Financial Scale & Run-Rate Assessment
Across your ${periodLabel} (${entryCount} logged trading days), you generated ${sym}${totalSales.toLocaleString()} in gross intake against ${sym}${totalExpenses.toLocaleString()} in stock and operating costs, delivering ${sym}${netAmount.toLocaleString()} in net profit (${marginPct}% operating margin).
- **Daily Pace:** Averaging ${sym}${Math.round(dailyAvg).toLocaleString()} gross per trading day.
- **Estimated Run-Rate:** On a standard 26-day monthly schedule, your pace projects to approximately ${sym}${monthlyEstGross.toLocaleString()} gross (~${sym}${monthlyEstNet.toLocaleString()} net profit), which scales to an annualized run-rate of ~${sym}${annualEstGross.toLocaleString()} gross (~${sym}${annualEstNet.toLocaleString()} net).

### 2. Statutory Thresholds & Legal Classification (${region}, ${country})
At an annualized gross pace of ~${sym}${annualEstGross.toLocaleString()} and net profit of ~${sym}${annualEstNet.toLocaleString()}:
- **National Tax Authority Standing:** Under the revenue laws of ${country}, ongoing commercial trade at this scale requires evaluation against national micro-business registration criteria and turnover thresholds.
- **Local Municipal Licensing:** Street and stall vending in ${region} is governed by municipal trade licensing and public space bylaws.
- **Trading Tenure Context:** Operating for ${tradingDuration} demonstrates sustained micro-entrepreneurship.

### 3. Bookkeeping & Document Retention Standards
1. **Invoice & Receipt Storage:** Keep physical and digital records of all wholesale and operating purchases.
2. **Daily Takings Ledger:** Record daily gross intake, cash count, and digital payments.
3. **Account Separation:** Maintain a dedicated financial account for trading transactions.

### 4. Formalization Roadmap & Filing Cadence
- **Local Municipal Permit:** Apply to the local council or municipal administration in ${region} for an authorized market stall or street trader permit.
- **National Tax Registration:** Obtain your tax identification number from the national revenue department in ${country}.
- **Filing Cadence:** Adhere to local annual or quarterly filing requirements established by ${country} tax law.

### 5. Practical Risk Watchouts for Informal Traders
- **Unpermitted Vending Fines:** Operating in unzoned public areas without municipal registration risks administrative fines.
- **Expense Invalidation:** Without documented purchase receipts, tax authorities may assess liability against gross intake rather than net income.

### 6. Regulatory Verification Checkpoint
Confirm your exact municipal vendor permit requirements and tax registration thresholds directly with the local municipal authority in ${region} and the national revenue department of ${country}.`,
  };
}

/**
 * 2. Compliance Orientation Generator (Grounded CPA-grade Analysis)
 * Employs Google Search grounding with jurisdiction-specific queries and zero cross-country contamination.
 */
app.post("/api/compliance-orientation", async (req: Request, res: Response) => {
  const body = getSafeBody<{
    period: string;
    totalSales: number;
    totalExpenses: number;
    netAmount: number;
    entryCount: number;
    averageDailySales: number;
    currencySymbol: string;
    userProfile?: {
      country?: string;
      region?: string;
      tradingDuration?: string;
      languageCode?: string;
      languageName?: string;
    };
  }>(req, {
    period: "30",
    totalSales: 0,
    totalExpenses: 0,
    netAmount: 0,
    entryCount: 0,
    averageDailySales: 0,
    currencySymbol: "₹",
    userProfile: {
      country: "India",
      region: "Kerala",
      tradingDuration: "1 to 3 years",
      languageCode: "en",
      languageName: "English",
    },
  });

  const periodLabel =
    body.period === "all"
      ? "All time recorded"
      : `Past ${body.period} days`;

  const country = body.userProfile?.country || "India";
  const region = body.userProfile?.region || "Kerala";
  const tradingDuration = body.userProfile?.tradingDuration || "1 to 3 years";
  const lang = resolveLanguage(
    (body as any).languageCode || body.userProfile?.languageCode,
    (body as any).languageName || body.userProfile?.languageName
  );
  const languageName = lang.name;
  const isNonEnglish = lang.code !== "en" && !lang.name.toLowerCase().startsWith("english");

  const spec = getJurisdictionComplianceSpec(country, region, body.currencySymbol);
  const sym = spec.resolvedCurrencySymbol;

  const marginPct = body.totalSales > 0 ? Math.round((body.netAmount / body.totalSales) * 100) : 0;
  const dailyAvg = body.averageDailySales || 0;
  const daysLogged = body.entryCount > 0 ? body.entryCount : 1;
  const avgDailyNet = body.netAmount / daysLogged;

  // Extrapolations: assuming ~26 active trading days/month and ~300 days/year
  const monthlyEstGross = Math.round(dailyAvg * 26);
  const monthlyEstNet = Math.round(avgDailyNet * 26);
  const annualEstGross = Math.round(dailyAvg * 300);
  const annualEstNet = Math.round(avgDailyNet * 300);

  const systemInstruction = `You are a veteran Certified Public Accountant (CPA) and senior small-business tax advisor specializing in micro-enterprises, sole proprietorships, market stallholders, and street vendors transitioning from informal trading to formal compliance.

Your voice and standards:
- Authoritative, precise, pragmatic, and grounded EXCLUSIVELY in the tax administration and municipal laws of ${spec.country} and ${spec.region}.
- Direct numerical reference: Directly cite and work with the vendor's actual recorded figures (${sym}${body.totalSales.toLocaleString()} gross sales, ${sym}${body.totalExpenses.toLocaleString()} expenses, ${sym}${body.netAmount.toLocaleString()} net profit over ${body.entryCount} trading days) and their monthly (~${sym}${monthlyEstNet.toLocaleString()} net) and annual (~${sym}${annualEstNet.toLocaleString()} net) run rates.
- Compare these specific numbers directly against the statutory reporting, registration, and tax thresholds of their jurisdiction (${spec.region}, ${spec.country}).
- Explain *why* reaching or being below a threshold matters in practical terms (e.g. legitimate income proof for bank accounts or credit, avoiding retroactive penalties or municipal fines, preserving true operating margins).
- Concrete operational steps: Give tangible record-keeping habits, registration processes (agency names, permit names, typical turnaround), and standard filing cadences.

CRITICAL JURISDICTION ACCURACY DIRECTIVE (ZERO FOREIGN CONTAMINATION RULE):
1. The vendor operates EXCLUSIVELY in ${spec.region}, ${spec.country}.
2. You are STRICTLY FORBIDDEN from referencing, benchmarking against, or mentioning other countries' tax frameworks (such as US IRS, Schedule C, 1040, $400 self-employment threshold, UK HMRC, £1,000 trading allowance, etc.) unless the vendor's jurisdiction is genuinely that country.
3. NEVER use foreign countries as "illustrative examples" or "comparisons" — it is misleading, confusing, and completely irrelevant to the vendor.
4. Use the authentic local terminology, statutes, and agencies for ${spec.country} and ${spec.region}:
   - Tax system: ${spec.taxSystemName}
   - Indirect tax / VAT / GST: ${spec.indirectTaxName}
   - Local permits / licensing: ${spec.localPermitName}
   - Key authorities: ${spec.keyAuthorities.join(", ")}
   - Key thresholds: ${spec.keyThresholds.join("; ")}
5. If web search grounding returns no verifiable data for a hyper-local municipal rule in ${spec.region}, state plainly: "Public statutory data for this specific municipal rule in ${spec.region} is not indexed in public registries; verify directly with [Authority]." NEVER substitute a generic or foreign pattern.
6. ABSOLUTE LANGUAGE DIRECTIVE:
   The vendor reads and understands ONLY ${languageName}.
   You MUST write this entire CPA compliance and tax orientation report in ${languageName}.
   Do NOT write in English (unless ${languageName} is English).
   Every section heading, every paragraph, every explanation, and the concluding sentence must be composed in ${languageName}.
   You may mention authentic local agency acronyms and section numbers (e.g. GST, Section 44AD, FSSAI, TVC, LSGD) as proper nouns, but all explanatory text, headers, and advice MUST be in ${languageName}.
7. Concluding Line: You MUST conclude your orientation with exactly ONE clear, non-generic sentence in ${languageName} naming what a local accountant/practitioner or specific tax authority should specifically confirm for them, e.g. "Confirm your exact street vending zone classification and TVC certificate status with your local Town Vending Committee under the Local Self Government Department (LSGD) in ${spec.region}, and verify your Section 44AD filing eligibility with a local Chartered Accountant (CA) or Tax Practitioner in ${spec.region}, ${spec.country}."`;

  const prompt = `${isNonEnglish ? `### CRITICAL LANGUAGE MANDATE:
The vendor reads and understands ONLY ${languageName}. You MUST write this entire compliance and tax orientation analysis in ${languageName}.
- Do NOT output in English.
- Translate all 6 section titles into ${languageName}.
- All numerical explanations, statutory thresholds, and practical advice must be in ${languageName}.
- Retain official statutory terms and agency names (like GST, ITR-4, Section 44AD, FSSAI, TVC, LSGD) alongside ${languageName} script explanations.
- The entire output MUST be in ${languageName}.

` : ""}Conduct a rigorous, grounded CPA compliance and tax orientation for an informal vendor operating EXCLUSIVELY in ${spec.region}, ${spec.country}:

### Vendor Operating Context:
- Country: ${spec.country}
- State / Province / Region: ${spec.region}
- Primary Language: ${languageName}
- Trading History: ${tradingDuration}
- Assessment Window: ${periodLabel} (${body.entryCount} trading days logged)

### Actual Financial Ledger Metrics:
- Total Gross Sales Recorded: ${sym}${body.totalSales.toLocaleString()}
- Total Operating Expenses Recorded: ${sym}${body.totalExpenses.toLocaleString()}
- Net Profit Recorded: ${sym}${body.netAmount.toLocaleString()}
- Operating Margin: ${marginPct}%
- Average Gross Sales: ${sym}${Math.round(dailyAvg).toLocaleString()} per trading day
- Estimated Monthly Run-Rate: ~${sym}${monthlyEstGross.toLocaleString()} Gross / ~${sym}${monthlyEstNet.toLocaleString()} Net Profit
- Estimated Annual Run-Rate: ~${sym}${annualEstGross.toLocaleString()} Gross / ~${sym}${annualEstNet.toLocaleString()} Net Profit

### Mandatory Targeted Grounding Search:
You MUST execute Google Search queries specifically tailored to ${spec.region}, ${spec.country}:
${spec.searchQueries.map((q) => `- "${q}"`).join("\n")}

### Strict Negative Constraints:
- DO NOT mention or compare against US, UK, or other foreign tax regimes. No Schedule C, no $400 threshold, no £1,000 allowance, no IRS, no HMRC (unless the vendor is in those countries).
- Ground every section in ${spec.region}, ${spec.country}.

Structure your review into these 6 clear sections (with section titles translated into ${languageName}):
1. Financial Scale & Run-Rate Assessment (Direct analysis of their actual numbers in ${sym})
2. Jurisdiction-Specific Statutory Thresholds & Classification (${spec.country} & ${spec.region})
3. Bookkeeping & Document Retention Standards (Concrete records to maintain in ${spec.country})
4. Formalization Roadmap & Filing Cadence (Agencies, permits, and timelines in ${spec.region}, ${spec.country})
5. Practical Risk Watchouts for Informal Traders
6. Regulatory Verification Checkpoint (Concluding with the mandatory specific confirmation sentence)

${isNonEnglish ? `### FINAL MANDATORY INSTRUCTION:
Write the entire output in ${languageName}. Do NOT output in English. Ensure all section titles and paragraphs are in ${languageName}.` : ""}`;

  try {
    const { text, modelUsed, groundingSources, searchQueries } = await callGeminiResilient(
      prompt,
      {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      }
    );

    // Sanity check: Ensure no accidental foreign contamination leaked into output for India
    let cleanedText = text;
    if (spec.country.toLowerCase().includes("india")) {
      const forbiddenLeak = /(Schedule C|\$400|HMRC|trading allowance of £1,000|1040-ES)/i;
      if (forbiddenLeak.test(cleanedText)) {
        console.warn("Detected foreign tax terms in India orientation response. Stripping foreign references.");
        cleanedText = cleanedText.replace(/(Schedule C|\$400|HMRC|trading allowance of £1,000|1040-ES)/gi, "");
      }
    }

    res.json({
      orientationText: cleanedText,
      modelUsed,
      timestamp: new Date().toISOString(),
      groundingSources: groundingSources || [],
      searchQueries: searchQueries && searchQueries.length > 0 ? searchQueries : spec.searchQueries,
      statsSummary: {
        period: periodLabel,
        totalSales: body.totalSales,
        totalExpenses: body.totalExpenses,
        netAmount: body.netAmount,
        marginPct,
        jurisdiction: `${spec.region}, ${spec.country}`,
        tradingDuration,
      },
    });
  } catch (err: any) {
    console.warn("Compliance orientation Gemini call fell back to heuristic:", err.message);

    const fallbackOrientation = spec.generateFallbackText({
      periodLabel,
      entryCount: body.entryCount,
      totalSales: body.totalSales,
      totalExpenses: body.totalExpenses,
      netAmount: body.netAmount,
      marginPct,
      dailyAvg,
      monthlyEstGross,
      monthlyEstNet,
      annualEstGross,
      annualEstNet,
      tradingDuration,
      sym,
    });

    res.json({
      orientationText: fallbackOrientation,
      modelUsed: "local-orientation-engine",
      timestamp: new Date().toISOString(),
      groundingSources: [],
      searchQueries: spec.searchQueries,
      statsSummary: {
        period: periodLabel,
        totalSales: body.totalSales,
        totalExpenses: body.totalExpenses,
        netAmount: body.netAmount,
        marginPct,
        jurisdiction: `${spec.region}, ${spec.country}`,
        tradingDuration,
      },
    });
  }
});

// =========================================================================
// VITE & STATIC PRODUCTION MIDDLEWARE
// =========================================================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Vendor Ledger Journal running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
