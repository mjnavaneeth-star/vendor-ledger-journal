import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { LanguageItem, getLanguageByCode, DEFAULT_LANGUAGE } from "./languages";
import { CurrencyInfo, getCurrencyForCountry, formatCurrency } from "./currencies";
import { UserProfile } from "../types";

export interface CoreUIStrings {
  appTitle: string;
  appSubtitle: string;
  vendorEdition: string;
  dailyJournal: string;
  myLedgerSummary: string;
  signIn: string;
  signOut: string;
  startNewDay: string;
  todaysLedgerTicket: string;
  readyToSave: string;
  inProgress: string;
  saveToLedger: string;
  savingToLedger: string;
  committedToCloud: string;
  transactionDate: string;
  itemsSoldAndNotes: string;
  totalSales: string;
  totalExpenses: string;
  dailyNetProfit: string;
  operatingMargin: string;
  averageDailySales: string;
  changeLanguage: string;
  operatingLocation: string;
  complianceOrientationTitle: string;
  generateOrientation: string;
  regenerating: string;
  selectLanguage: string;
  searchLanguage: string;
  nativeScript: string;
  voiceListening: string;
  tapToSpeak: string;
  doneSpeaking: string;
  deleteEntry: string;
  emptyChartMessage: string;
  retrySync: string;
  signInTagline: string;
  signInFeature1Title: string;
  signInFeature1Desc: string;
  signInFeature2Title: string;
  signInFeature2Desc: string;
  signInFeature3Title: string;
  signInFeature3Desc: string;
  connectingWithGoogle: string;
  signInFooterNote: string;
  totalGrossSales: string;
  totalStockAndCosts: string;
  netAmountProfit: string;
  dailyAverage: string;
  period30Days: string;
  period90Days: string;
  period365Days: string;
  periodAllTime: string;
  colDate: string;
  colItemsSoldNotes: string;
  colSales: string;
  colExpenses: string;
  colNetAmount: string;
  colAction: string;
  recordedJournalEntries: string;
}

export const BASE_EN_STRINGS: CoreUIStrings = {
  appTitle: "Vendor Ledger Journal",
  appSubtitle: "Conversational bookkeeping & compliant ledger for market traders",
  vendorEdition: "Street Vendor Edition",
  dailyJournal: "Daily Journal",
  myLedgerSummary: "My Ledger Summary",
  signIn: "Sign In",
  signOut: "Sign Out",
  startNewDay: "New Day",
  todaysLedgerTicket: "Today's Ledger Ticket",
  readyToSave: "Ready to Save",
  inProgress: "In Progress",
  saveToLedger: "Save to Cloud Ledger",
  savingToLedger: "Saving...",
  committedToCloud: "Committed to Firestore",
  transactionDate: "Transaction Date",
  itemsSoldAndNotes: "Items Sold & Notes",
  totalSales: "Total Gross Sales",
  totalExpenses: "Total Expenses",
  dailyNetProfit: "Daily Net Profit",
  operatingMargin: "Operating Margin",
  averageDailySales: "Average Daily Sales",
  changeLanguage: "Change Language",
  operatingLocation: "Operating Jurisdiction",
  complianceOrientationTitle: "CPA & Regulatory Orientation Analysis",
  generateOrientation: "Generate Jurisdiction Orientation",
  regenerating: "Researching...",
  selectLanguage: "Select Your Language",
  searchLanguage: "Search any language or script...",
  nativeScript: "Language in Native Script",
  voiceListening: "Microphone active: Speak your sales, expenses, or items now...",
  tapToSpeak: "Tap to speak (Live voice transcription)",
  doneSpeaking: "Done speaking",
  deleteEntry: "Delete entry",
  emptyChartMessage: "No chart records for this period",
  retrySync: "Retry Cloud Sync",
  signInTagline: "A conversational daily ledger built for street vendors, food carts, and market stalls. No passwords to remember.",
  signInFeature1Title: "One question at a time:",
  signInFeature1Desc: "Chat with Gemini to log what you sold, your income, and stock costs.",
  signInFeature2Title: "Zero spreadsheets:",
  signInFeature2Desc: "Automatically calculates daily net earnings and organizes trends.",
  signInFeature3Title: "Private & Isolated:",
  signInFeature3Desc: "Firestore rules guarantee zero cross-user leakage (only your account sees your data).",
  connectingWithGoogle: "Connecting with Google...",
  signInFooterNote: "Direct Google Sign-In & Firebase Auth integration. No passwords stored.",
  totalGrossSales: "Total Gross Sales",
  totalStockAndCosts: "Total Stock & Costs",
  netAmountProfit: "Net Amount (Profit)",
  dailyAverage: "Daily Average",
  period30Days: "30 Days",
  period90Days: "90 Days",
  period365Days: "365 Days",
  periodAllTime: "All Time",
  colDate: "Date",
  colItemsSoldNotes: "Items Sold & Notes",
  colSales: "Sales",
  colExpenses: "Expenses",
  colNetAmount: "Net Amount",
  colAction: "Action",
  recordedJournalEntries: "Recorded Journal Entries",
};

/**
 * High-frequency pre-compiled translations table for instant zero-latency loading.
 */
export const CORE_UI_TABLE: Record<string, CoreUIStrings> = {
  en: BASE_EN_STRINGS,

  // Malayalam (മലയാളം)
  ml: {
    appTitle: "വെണ്ടർ ലെഡ്ജർ ജേണൽ",
    appSubtitle: "മാർക്കറ്റ് കച്ചവടക്കാർക്കായുള്ള ലളിതമായ കണക്കെഴുത്തും ഔദ്യോഗിക ലെഡ്ജറും",
    vendorEdition: "തെരുവ് കച്ചവട എഡിഷൻ",
    dailyJournal: "ദിവസേനയുള്ള കണക്ക്",
    myLedgerSummary: "എന്റെ ലെഡ്ജർ സംഗ്രഹം",
    signIn: "സൈൻ ഇൻ ചെയ്യുക",
    signOut: "പുറത്തുകടക്കുക",
    startNewDay: "പുതിയ ദിവസം",
    todaysLedgerTicket: "ഇന്നത്തെ ലെഡ്ജർ ടിക്കറ്റ്",
    readyToSave: "സേവ് ചെയ്യാൻ തയ്യാർ",
    inProgress: "പൂർത്തിയാക്കുന്നു",
    saveToLedger: "ക്ലൗഡ് ലെഡ്ജറിലേക്ക് സേവ് ചെയ്യുക",
    savingToLedger: "സേവ് ചെയ്യുന്നു...",
    committedToCloud: "ഫയർസ്റ്റോറിലേക്ക് സേവ് ചെയ്തു",
    transactionDate: "വ്യാപാര തീയതി",
    itemsSoldAndNotes: "വിറ്റ സാധനങ്ങളും കുറിപ്പുകളും",
    totalSales: "ആകെ വരുമാനം (വിൽപ്പന)",
    totalExpenses: "ആകെ ചെലവുകൾ",
    dailyNetProfit: "ദിവസേനയുള്ള അറ്റാദായം (ലാഭം)",
    operatingMargin: "ലാഭ മാർജിൻ",
    averageDailySales: "പ്രതിദിന ശരാശരി വിൽപ്പന",
    changeLanguage: "ഭാഷ മാറ്റുക",
    operatingLocation: "പ്രവർത്തന പ്രദേശം",
    complianceOrientationTitle: "നികുതി & സർക്കാർ മാർഗ്ഗനിർദ്ദേശ വിശകലനം",
    generateOrientation: "മാർഗ്ഗനിർദ്ദേശം തയ്യാറാക്കുക",
    regenerating: "പരിശോധിക്കുന്നു...",
    selectLanguage: "നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക",
    searchLanguage: "ഏതെങ്കിലും ഭാഷയോ ലിപിയോ തിരയുക...",
    nativeScript: "മാതൃഭാഷാ ലിപിയിൽ",
    voiceListening: "മൈക്രോഫോൺ പ്രവർത്തിക്കുന്നു: നിങ്ങളുടെ വിൽപ്പനയോ ചെലവുകളോ പറയുക...",
    tapToSpeak: "സംസാരിക്കാൻ ടാപ്പ് ചെയ്യുക (ശബ്ദരേഖ)",
    doneSpeaking: "സംസാരം പൂർത്തിയായി",
    deleteEntry: "രേഖ നീക്കം ചെയ്യുക",
    emptyChartMessage: "ഈ കാലയളവിലെ കണക്കുകൾ ലഭ്യമല്ല",
    retrySync: "ക്ലൗഡ് സമന്വയം വീണ്ടും ശ്രമിക്കുക",
    signInTagline: "തെരുവ് കച്ചവടക്കാർക്കും ചായക്കടക്കാർക്കും മാർക്കറ്റ് സ്റ്റാളുകൾക്കുമായുള്ള ലളിതമായ കണക്കെഴുത്ത്. പാസ്‌വേഡ് ആവശ്യമില്ല.",
    signInFeature1Title: "ഓരോ ചോദ്യങ്ങളിലൂടെ:",
    signInFeature1Desc: "നിങ്ങൾ വിറ്റ സാധനങ്ങളും വരുമാനവും സാധനങ്ങൾ വാങ്ങിയ ചെലവും എളുപ്പത്തിൽ രേഖപ്പെടുത്താം.",
    signInFeature2Title: "കണക്ക് പുസ്തകങ്ങൾ വേണ്ട:",
    signInFeature2Desc: "ദിവസേനയുള്ള ലാഭവും വരുമാന പ്രവണതകളും സ്വയമേവ കണക്കാക്കുന്നു.",
    signInFeature3Title: "പൂർണ്ണ സ്വകാര്യത:",
    signInFeature3Desc: "നിങ്ങളുടെ കണക്കുകൾ നിങ്ങളുടെ അക്കൗണ്ടിൽ മാത്രം സുരക്ഷിതമായിരിക്കും.",
    connectingWithGoogle: "ഗൂഗിളുമായി ബന്ധിപ്പിക്കുന്നു...",
    signInFooterNote: "നേരിട്ടുള്ള ഗൂഗിൾ സൈൻ ഇൻ. പാസ്‌വേഡുകൾ സൂക്ഷിക്കുന്നില്ല.",
    totalGrossSales: "ആകെ മൊത്ത വിൽപ്പന",
    totalStockAndCosts: "ആകെ സ്റ്റോക്കും ചെലവുകളും",
    netAmountProfit: "അറ്റാദായം (ലാഭം)",
    dailyAverage: "പ്രതിദിന ശരാശരി",
    period30Days: "30 ദിവസങ്ങൾ",
    period90Days: "90 ദിവസങ്ങൾ",
    period365Days: "365 ദിവസങ്ങൾ",
    periodAllTime: "എല്ലാ സമയത്തെയും",
    colDate: "തീയതി",
    colItemsSoldNotes: "വിറ്റ സാധനങ്ങളും കുറിപ്പുകളും",
    colSales: "വിൽപ്പന",
    colExpenses: "ചെലവുകൾ",
    colNetAmount: "അറ്റാദായം",
    colAction: "നടപടി",
    recordedJournalEntries: "രേഖപ്പെടുത്തിയ ജേണൽ വിവരങ്ങൾ",
  },

  // Hindi (हिन्दी)
  hi: {
    appTitle: "वेंडर लेज़र जर्नल",
    appSubtitle: "रेहड़ी-पटरी और बाज़ार व्यापारियों के लिए सरल खाता-बही",
    vendorEdition: "स्ट्रीट वेंडर संस्करण",
    dailyJournal: "दैनिक रोज़नामचा",
    myLedgerSummary: "मेरा लेज़र सारांश",
    signIn: "साइन इन करें",
    signOut: "साइन आउट",
    startNewDay: "नया दिन",
    todaysLedgerTicket: "आज का लेज़र टिकट",
    readyToSave: "सहेजने के लिए तैयार",
    inProgress: "प्रगति पर",
    saveToLedger: "क्लाउड लेज़र में सहेजें",
    savingToLedger: "सहेजा जा रहा है...",
    committedToCloud: "क्लाउड में सुरक्षित",
    transactionDate: "लेन-देन की तारीख",
    itemsSoldAndNotes: "बिक्री का सामान व विवरण",
    totalSales: "कुल सकल बिक्री (कमाई)",
    totalExpenses: "कुल खर्च (लागत)",
    dailyNetProfit: "दैनिक शुद्ध लाभ (बचत)",
    operatingMargin: "ऑपरेटिंग मार्जिन",
    averageDailySales: "औसत दैनिक बिक्री",
    changeLanguage: "भाषा बदलें",
    operatingLocation: "व्यापार स्थल",
    complianceOrientationTitle: "कर व विनियामक अनुपालन विश्लेषण",
    generateOrientation: "अनुपालन मार्गदर्शन तैयार करें",
    regenerating: "अनुसंधान जारी है...",
    selectLanguage: "अपनी भाषा चुनें",
    searchLanguage: "कोई भी भाषा या लिपि खोजें...",
    nativeScript: "मातृभाषा में",
    voiceListening: "माइक चालू है: अपनी बिक्री या खर्च बोलें...",
    tapToSpeak: "बोलने के लिए टैप करें (वॉइस इनपुट)",
    doneSpeaking: "बोलना समाप्त",
    deleteEntry: "प्रविष्टि हटाएं",
    emptyChartMessage: "इस अवधि के लिए कोई चार्ट रिकॉर्ड नहीं है",
    retrySync: "क्लाउड सिंक पुनः प्रयास करें",
    signInTagline: "रेहड़ी-पटरी, ठेले और बाज़ार व्यापारियों के लिए सरल दैनिक खाता-बही। पासवर्ड याद रखने की जरूरत नहीं।",
    signInFeature1Title: "एक बार में एक सवाल:",
    signInFeature1Desc: "बिक्री, कुल कमाई और सामान की लागत सरलता से बातचीत करके दर्ज करें।",
    signInFeature2Title: "खाता-बही का कोई झंझट नहीं:",
    signInFeature2Desc: "दैनिक शुद्ध कमाई और मुनाफे की स्वचालित गणना।",
    signInFeature3Title: "पूर्णतः सुरक्षित व निजी:",
    signInFeature3Desc: "आपका डेटा केवल आपके ही खाते में पूर्णतः सुरक्षित रहता है।",
    connectingWithGoogle: "गूगल से कनेक्ट हो रहा है...",
    signInFooterNote: "सीधा गूगल साइन-इन। कोई पासवर्ड स्टोर नहीं किया जाता।",
    totalGrossSales: "कुल सकल बिक्री",
    totalStockAndCosts: "कुल स्टॉक व लागत",
    netAmountProfit: "शुद्ध आय (लाभ)",
    dailyAverage: "दैनिक औसत",
    period30Days: "30 दिन",
    period90Days: "90 दिन",
    period365Days: "365 दिन",
    periodAllTime: "समस्त समय",
    colDate: "तारीख",
    colItemsSoldNotes: "बिक्री का सामान व विवरण",
    colSales: "बिक्री",
    colExpenses: "खर्च",
    colNetAmount: "शुद्ध राशि",
    colAction: "कार्रवाई",
    recordedJournalEntries: "दर्ज लेज़र प्रविष्टियां",
  },

  // Spanish (Español)
  es: {
    appTitle: "Diario del Vendedor",
    appSubtitle: "Contabilidad conversacional y libro mayor para comerciantes",
    vendorEdition: "Edición Vendedor Ambulante",
    dailyJournal: "Diario de Ventas",
    myLedgerSummary: "Mi Resumen Financiero",
    signIn: "Iniciar sesión",
    signOut: "Cerrar sesión",
    startNewDay: "Nuevo Día",
    todaysLedgerTicket: "Boleto del Día",
    readyToSave: "Listo para Guardar",
    inProgress: "En progreso",
    saveToLedger: "Guardar en Libro Mayor",
    savingToLedger: "Guardando...",
    committedToCloud: "Guardado en Firestore",
    transactionDate: "Fecha de Transacción",
    itemsSoldAndNotes: "Artículos Vendidos y Notas",
    totalSales: "Ventas Totales Brutas",
    totalExpenses: "Gastos Totales",
    dailyNetProfit: "Ganancia Neta Diaria",
    operatingMargin: "Margen Operativo",
    averageDailySales: "Venta Diaria Promedio",
    changeLanguage: "Cambiar Idioma",
    operatingLocation: "Jurisdicción Operativa",
    complianceOrientationTitle: "Análisis Regulatorio y Fiscal",
    generateOrientation: "Generar Orientación Fiscal",
    regenerating: "Consultando...",
    selectLanguage: "Seleccione su Idioma",
    searchLanguage: "Buscar idioma o escritura...",
    nativeScript: "En escritura nativa",
    voiceListening: "Micrófono activo: Diga sus ventas o gastos ahora...",
    tapToSpeak: "Tocar para hablar (transcripción en vivo)",
    doneSpeaking: "Listo",
    deleteEntry: "Eliminar registro",
    emptyChartMessage: "Sin registros para este período",
    retrySync: "Reintentar Sincronización",
    signInTagline: "Un libro diario conversacional creado para vendedores ambulantes, puestos de comida y mercados. Sin contraseñas.",
    signInFeature1Title: "Una pregunta a la vez:",
    signInFeature1Desc: "Chatea para registrar lo que vendiste, tus ingresos y costos de inventario.",
    signInFeature2Title: "Cero hojas de cálculo:",
    signInFeature2Desc: "Calcula automáticamente las ganancias netas diarias y tendencias.",
    signInFeature3Title: "Privado y Seguro:",
    signInFeature3Desc: "Tus datos financieros solo son accesibles desde tu propia cuenta.",
    connectingWithGoogle: "Conectando con Google...",
    signInFooterNote: "Inicio de sesión directo con Google. Sin contraseñas almacenadas.",
    totalGrossSales: "Ventas Totales Brutas",
    totalStockAndCosts: "Total de Stock y Costos",
    netAmountProfit: "Monto Neto (Ganancia)",
    dailyAverage: "Promedio Diario",
    period30Days: "30 Días",
    period90Days: "90 Días",
    period365Days: "365 Días",
    periodAllTime: "Todo el Período",
    colDate: "Fecha",
    colItemsSoldNotes: "Artículos Vendidos y Notas",
    colSales: "Ventas",
    colExpenses: "Gastos",
    colNetAmount: "Monto Neto",
    colAction: "Acción",
    recordedJournalEntries: "Asientos Registrados en el Libro",
  },

  // Tamil (தமிழ்)
  ta: {
    appTitle: "வியாபாரி கணக்கு புத்தகம்",
    appSubtitle: "சந்தை வியாபாரிகளுக்கான எளிய வரவு-செலவு கணக்கு",
    vendorEdition: "சிறு வணிகர் பதிப்பு",
    dailyJournal: "தினசரி கணக்கு",
    myLedgerSummary: "கணக்கு விவரச் சுருக்கம்",
    signIn: "உள்நுழையவும்",
    signOut: "வெளியேறு",
    startNewDay: "புதிய நாள்",
    todaysLedgerTicket: "இன்றைய கணக்கு சீட்டு",
    readyToSave: "சேமிக்க தயார்",
    inProgress: "செயல்பாட்டில்",
    saveToLedger: "கிளவுடில் சேமிக்கவும்",
    savingToLedger: "சேமிக்கிறது...",
    committedToCloud: "கிளவுடில் சேமிக்கப்பட்டது",
    transactionDate: "வியாபார தேதி",
    itemsSoldAndNotes: "விற்பனை பொருட்கள் & குறிப்புகள்",
    totalSales: "மொத்த விற்பனை (வருமானம்)",
    totalExpenses: "மொத்த செலவுகள்",
    dailyNetProfit: "தினசரி நிகர லாபம்",
    operatingMargin: "லாப வரம்பு",
    averageDailySales: "சராசரி தினசரி விற்பனை",
    changeLanguage: "மொழியை மாற்றவும்",
    operatingLocation: "செயல்பாட்டு பகுதி",
    complianceOrientationTitle: "வரி மற்றும் சட்ட வழிகாட்டுதல்",
    generateOrientation: "வழிகாட்டுதலை பெறுக",
    regenerating: "ஆராய்கிறது...",
    selectLanguage: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
    searchLanguage: "மொழியைத் தேடுங்கள்...",
    nativeScript: "தாய்மொழியில்",
    voiceListening: "மைக் செயல்படுகிறது: உங்கள் விற்பனை அல்லது செலவுகளைப் பேசுங்கள்...",
    tapToSpeak: "பேச தொடவும்",
    doneSpeaking: "பேசி முடிந்தது",
    deleteEntry: "நீக்கு",
    emptyChartMessage: "பதிவுகள் இல்லை",
    retrySync: "மீண்டும் முயற்சிக்கவும்",
    signInTagline: "தெரு வியாபாரிகள் மற்றும் சந்தை கடைகளுக்கான உரையாடல் வரவு-செலவு கணக்கு. கடவுச்சொல் தேவையில்லை.",
    signInFeature1Title: "ஒரு நேரத்தில் ஒரு கேள்வி:",
    signInFeature1Desc: "உங்கள் விற்பனை, வருமானம் மற்றும் செலவுகளை எளிய உரையாடல் மூலம் பதிவு செய்யுங்கள்.",
    signInFeature2Title: "கணக்கு நோட்டுகள் தேவையில்லை:",
    signInFeature2Desc: "தினசரி நிகர லாபம் மற்றும் வணிக போக்கினை தானாகவே கணக்கிடுகிறது.",
    signInFeature3Title: "முழு தனிப்பட்ட பாதுகாப்பு:",
    signInFeature3Desc: "உங்கள் கணக்கு விவரங்கள் உங்கள் கணக்கில் மட்டுமே பாதுகாப்பாக இருக்கும்.",
    connectingWithGoogle: "கூகிள் உடன் இணைகிறது...",
    signInFooterNote: "நேரடி கூகிள் உள்நுழைவு. கடவுச்சொற்கள் சேமிக்கப்படுவதில்லை.",
    totalGrossSales: "மொத்த விற்பனை வருமானம்",
    totalStockAndCosts: "சரக்கு மற்றும் செலவுகள்",
    netAmountProfit: "நிகர தொகை (லாபம்)",
    dailyAverage: "தினசரி சராசரி",
    period30Days: "30 நாட்கள்",
    period90Days: "90 நாட்கள்",
    period365Days: "365 நாட்கள்",
    periodAllTime: "அனைத்து காலமும்",
    colDate: "தேதி",
    colItemsSoldNotes: "விற்பனை பொருட்கள் & குறிப்புகள்",
    colSales: "விற்பனை",
    colExpenses: "செலவுகள்",
    colNetAmount: "நிகர தொகை",
    colAction: "செயல்",
    recordedJournalEntries: "பதிவு செய்யப்பட்ட கணக்குகள்",
  },

  // Swahili (Kiswahili)
  sw: {
    appTitle: "Daftari la Mchuuzi",
    appSubtitle: "Uhasibu wa mazungumzo kwa wachuuzi wa mitaani",
    vendorEdition: "Toleo la Mchuuzi wa Mtaani",
    dailyJournal: "Daftari la Kila Siku",
    myLedgerSummary: "Muhtasari wa Daftari Langu",
    signIn: "Ingia",
    signOut: "Toka",
    startNewDay: "Siku Mpya",
    todaysLedgerTicket: "Tiketi ya Hesabu ya Leo",
    readyToSave: "Tayari Kuhifadhi",
    inProgress: "Inaendelea",
    saveToLedger: "Hifadhi kwenye Daftari",
    savingToLedger: "Inahifadhi...",
    committedToCloud: "Imehifadhiwa kwenye Cloud",
    transactionDate: "Tarehe ya Biashara",
    itemsSoldAndNotes: "Bidhaa Zilizouzwa na Maelezo",
    totalSales: "Jumla ya Mauzo Ghafi",
    totalExpenses: "Jumla ya Gharama",
    dailyNetProfit: "Faida Halisi ya Kila Siku",
    operatingMargin: "Upeo wa Faida",
    averageDailySales: "Wastani wa Mauzo kwa Siku",
    changeLanguage: "Badilisha Lugha",
    operatingLocation: "Eneo la Biashara",
    complianceOrientationTitle: "Uchambuzi wa Ushuru na Sheria za Biashara",
    generateOrientation: "Tengeneza Mwongozo wa Kisheria",
    regenerating: "Inatafiti...",
    selectLanguage: "Chagua Lugha Yako",
    searchLanguage: "Tafuta lugha yoyote...",
    nativeScript: "Kwa herufi za asili",
    voiceListening: "Kipaza sauti kinafanya kazi: Ongea mauzo au matumizi yako...",
    tapToSpeak: "Gusa ili kuongea (sauti kwa maandishi)",
    doneSpeaking: "Nimemaliza kuongea",
    deleteEntry: "Futa rekodi",
    emptyChartMessage: "Hakuna rekodi za kipindi hiki",
    retrySync: "Jaribu Kusawazisha Tena",
    signInTagline: "Daftari la kila siku la mazungumzo kwa wachuuzi wa mitaani na vibanda vya sokoni. Hakuna nenosiri la kukariri.",
    signInFeature1Title: "Swali moja kwa wakati:",
    signInFeature1Desc: "Ongea kurekodi ulichouza, mapato yako, na gharama za bidhaa.",
    signInFeature2Title: "Bila mahesabu magumu:",
    signInFeature2Desc: "Huhesabu faida halisi ya kila siku na kuonyesha mwenendo wa biashara.",
    signInFeature3Title: "Faragha na Usalama:",
    signInFeature3Desc: "Taarifa zako za kifedha zinaonekana kwenye akaunti yako pekee.",
    connectingWithGoogle: "Inaunganisha na Google...",
    signInFooterNote: "Kuingia moja kwa moja kwa Google. Hakuna nenosiri linalohifadhiwa.",
    totalGrossSales: "Jumla ya Mauzo Ghafi",
    totalStockAndCosts: "Jumla ya Bidhaa na Gharama",
    netAmountProfit: "Kiasi Halisi (Faida)",
    dailyAverage: "Wastani wa Kila Siku",
    period30Days: "Siku 30",
    period90Days: "Siku 90",
    period365Days: "Siku 365",
    periodAllTime: "Muda Wote",
    colDate: "Tarehe",
    colItemsSoldNotes: "Bidhaa Zilizouzwa na Maelezo",
    colSales: "Mauzo",
    colExpenses: "Gharama",
    colNetAmount: "Kiasi Halisi",
    colAction: "Kitendo",
    recordedJournalEntries: "Kumbukumbu Zilizohifadhiwa",
  },

  // French (Français)
  fr: {
    appTitle: "Livre Journal du Vendeur",
    appSubtitle: "Comptabilité conversationnelle pour commerçants et marchés",
    vendorEdition: "Édition Vendeur de Rue",
    dailyJournal: "Journal Quotidien",
    myLedgerSummary: "Mon Grand Livre",
    signIn: "Se connecter",
    signOut: "Se déconnecter",
    startNewDay: "Nouveau Jour",
    todaysLedgerTicket: "Ticket du Jour",
    readyToSave: "Prêt à Enregistrer",
    inProgress: "En cours",
    saveToLedger: "Enregistrer dans le Grand Livre",
    savingToLedger: "Enregistrement...",
    committedToCloud: "Enregistré dans Firestore",
    transactionDate: "Date de Transaction",
    itemsSoldAndNotes: "Articles Vendus & Notes",
    totalSales: "Ventes Totales Brutes",
    totalExpenses: "Dépenses Totales",
    dailyNetProfit: "Bénéfice Net Quotidien",
    operatingMargin: "Marge Opérationnelle",
    averageDailySales: "Ventes Quotidiennes Moyennes",
    changeLanguage: "Changer de Langue",
    operatingLocation: "Juridiction d'Activité",
    complianceOrientationTitle: "Analyse Fiscale et Réglementaire",
    generateOrientation: "Générer l'Orientation Fiscale",
    regenerating: "Recherche en cours...",
    selectLanguage: "Sélectionnez votre langue",
    searchLanguage: "Rechercher une langue...",
    nativeScript: "Dans la graphie d'origine",
    voiceListening: "Microphone actif : Indiquez vos ventes ou dépenses...",
    tapToSpeak: "Appuyez pour parler (dictée vocale)",
    doneSpeaking: "Terminé",
    deleteEntry: "Supprimer",
    emptyChartMessage: "Aucun enregistrement pour cette période",
    retrySync: "Réessayer la synchronisation",
    signInTagline: "Un grand livre quotidien conversationnel pour commerçants de rue et étals de marché. Aucun mot de passe.",
    signInFeature1Title: "Une question à la fois :",
    signInFeature1Desc: "Discutez pour enregistrer vos ventes, recettes et dépenses de réapprovisionnement.",
    signInFeature2Title: "Zéro tableur :",
    signInFeature2Desc: "Calcule automatiquement les bénéfices nets quotidiens et les tendances.",
    signInFeature3Title: "Privé et Sécurisé :",
    signInFeature3Desc: "Vos données financières ne sont accessibles que par votre propre compte.",
    connectingWithGoogle: "Connexion avec Google...",
    signInFooterNote: "Connexion directe avec Google. Aucun mot de passe stocké.",
    totalGrossSales: "Ventes Totales Brutes",
    totalStockAndCosts: "Total Stock & Coûts",
    netAmountProfit: "Montant Net (Bénéfice)",
    dailyAverage: "Moyenne Quotidienne",
    period30Days: "30 Jours",
    period90Days: "90 Jours",
    period365Days: "365 Jours",
    periodAllTime: "Tout l'Historique",
    colDate: "Date",
    colItemsSoldNotes: "Articles Vendus & Notes",
    colSales: "Ventes",
    colExpenses: "Dépenses",
    colNetAmount: "Montant Net",
    colAction: "Action",
    recordedJournalEntries: "Écritures Journalières Enregistrées",
  },
};

// In-memory cache for dynamic translations
const DYNAMIC_TRANSLATION_CACHE: Record<string, CoreUIStrings> = {};

/**
 * Loads UI translations for any language:
 * 1. Pre-compiled table
 * 2. LocalStorage cache
 * 3. Gemini dynamic translation fallback via /api/translate-ui
 */
export async function loadUIStrings(targetLang: LanguageItem): Promise<CoreUIStrings> {
  const code = targetLang.code.toLowerCase();

  // 1. Static table match
  if (CORE_UI_TABLE[code]) {
    return CORE_UI_TABLE[code];
  }

  // 2. Memory cache
  if (DYNAMIC_TRANSLATION_CACHE[code]) {
    return DYNAMIC_TRANSLATION_CACHE[code];
  }

  // 3. LocalStorage cache
  try {
    const cached = localStorage.getItem("vendor_ui_strings_" + code);
    if (cached) {
      const parsed = JSON.parse(cached);
      DYNAMIC_TRANSLATION_CACHE[code] = { ...BASE_EN_STRINGS, ...parsed };
      return DYNAMIC_TRANSLATION_CACHE[code];
    }
  } catch (e) {
    console.warn("Error reading cached UI strings:", e);
  }

  // 4. Dynamic Gemini translation via API
  try {
    const response = await fetch("/api/translate-ui", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetLanguageCode: targetLang.code,
        targetLanguageName: `${targetLang.name} (${targetLang.nativeName})`,
        strings: BASE_EN_STRINGS,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.strings) {
        const result = { ...BASE_EN_STRINGS, ...data.strings };
        DYNAMIC_TRANSLATION_CACHE[code] = result;
        try {
          localStorage.setItem("vendor_ui_strings_" + code, JSON.stringify(result));
        } catch {
          // ignore localStorage quota errors
        }
        return result;
      }
    }
  } catch (err) {
    console.warn("Dynamic UI translation request failed, using base strings:", err);
  }

  return BASE_EN_STRINGS;
}

interface I18nContextType {
  language: LanguageItem;
  setLanguage: (lang: LanguageItem) => void;
  currency: CurrencyInfo;
  setCountry: (countryName: string) => void;
  t: (key: keyof CoreUIStrings) => string;
  strings: CoreUIStrings;
  formatAmount: (amount: number | null | undefined, options?: Intl.NumberFormatOptions) => string;
  isTranslatingUI: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_LANG_KEY = "vendor_selected_language_code";
const STORAGE_COUNTRY_KEY = "vendor_selected_country";

export const I18nProvider: React.FC<{
  initialProfile?: UserProfile | null;
  onLanguageChange?: (lang: LanguageItem) => void;
  children: ReactNode;
}> = ({ initialProfile, onLanguageChange, children }) => {
  // Determine initial language: profile -> localStorage -> navigator -> default
  const [language, setLanguageState] = useState<LanguageItem>(() => {
    if (initialProfile?.languageCode) {
      return getLanguageByCode(initialProfile.languageCode);
    }
    try {
      const savedCode = localStorage.getItem(STORAGE_LANG_KEY);
      if (savedCode) return getLanguageByCode(savedCode);
    } catch {}
    return DEFAULT_LANGUAGE;
  });

  const [country, setCountryState] = useState<string>(() => {
    if (initialProfile?.country) return initialProfile.country;
    try {
      const savedCountry = localStorage.getItem(STORAGE_COUNTRY_KEY);
      if (savedCountry) return savedCountry;
    } catch {}
    return "India";
  });

  const [strings, setStrings] = useState<CoreUIStrings>(() => {
    return CORE_UI_TABLE[language.code] || BASE_EN_STRINGS;
  });
  const [isTranslatingUI, setIsTranslatingUI] = useState(false);

  // Sync profile changes into local state
  useEffect(() => {
    if (initialProfile?.languageCode) {
      const lang = getLanguageByCode(initialProfile.languageCode);
      setLanguageState(lang);
    }
    if (initialProfile?.country) {
      setCountryState(initialProfile.country);
    }
  }, [initialProfile?.languageCode, initialProfile?.country]);

  // Derive Currency from country
  const currency = useMemo(() => {
    return getCurrencyForCountry(country);
  }, [country]);

  // When language changes, fetch or apply translations
  useEffect(() => {
    let active = true;
    const langCode = language.code.toLowerCase();

    // Check instant static table
    if (CORE_UI_TABLE[langCode]) {
      setStrings(CORE_UI_TABLE[langCode]);
      return;
    }

    setIsTranslatingUI(true);
    loadUIStrings(language).then((loaded) => {
      if (active) {
        setStrings(loaded);
        setIsTranslatingUI(false);
      }
    });

    return () => {
      active = false;
    };
  }, [language]);

  const setLanguage = (newLang: LanguageItem) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, newLang.code);
    } catch {}
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
  };

  const setCountry = (newCountry: string) => {
    setCountryState(newCountry);
    try {
      localStorage.setItem(STORAGE_COUNTRY_KEY, newCountry);
    } catch {}
  };

  const t = (key: keyof CoreUIStrings): string => {
    return strings[key] || BASE_EN_STRINGS[key] || key;
  };

  const formatAmount = (amount: number | null | undefined, options?: Intl.NumberFormatOptions): string => {
    return formatCurrency(amount, currency.currencyCode, currency.defaultLocale, options);
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        currency,
        setCountry,
        t,
        strings,
        formatAmount,
        isTranslatingUI,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}
