export interface LanguageItem {
  code: string; // ISO 639-1 code (e.g. 'en', 'hi', 'ml', 'es')
  name: string; // English name
  nativeName: string; // Endonym in native script
  bcp47: string; // BCP-47 speech recognition tag
  rtl?: boolean;
}

/**
 * Comprehensive standard ISO 639-1 / world languages list.
 * Covers major and regional languages across the globe,
 * each with native script endonyms and BCP-47 speech tags.
 */
export const COMPREHENSIVE_LANGUAGES: LanguageItem[] = [
  { code: "en", name: "English", nativeName: "English", bcp47: "en-US" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", bcp47: "ml-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", bcp47: "hi-IN" },
  { code: "es", name: "Spanish", nativeName: "Español", bcp47: "es-ES" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", bcp47: "ta-IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", bcp47: "te-IN" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", bcp47: "kn-IN" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", bcp47: "bn-IN" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", bcp47: "mr-IN" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", bcp47: "gu-IN" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", bcp47: "pa-IN" },
  { code: "ur", name: "Urdu", nativeName: "اردو", bcp47: "ur-PK", rtl: true },
  { code: "ar", name: "Arabic", nativeName: "العربية", bcp47: "ar-SA", rtl: true },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", bcp47: "sw-KE" },
  { code: "fr", name: "French", nativeName: "Français", bcp47: "fr-FR" },
  { code: "pt", name: "Portuguese", nativeName: "Português", bcp47: "pt-BR" },
  { code: "tl", name: "Tagalog / Filipino", nativeName: "Wikang Filipino", bcp47: "tl-PH" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", bcp47: "id-ID" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", bcp47: "ms-MY" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", bcp47: "vi-VN" },
  { code: "th", name: "Thai", nativeName: "ไทย", bcp47: "th-TH" },
  { code: "zh", name: "Chinese (Simplified)", nativeName: "简体中文", bcp47: "zh-CN" },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文", bcp47: "zh-TW" },
  { code: "ja", name: "Japanese", nativeName: "日本語", bcp47: "ja-JP" },
  { code: "ko", name: "Korean", nativeName: "한국어", bcp47: "ko-KR" },
  { code: "de", name: "German", nativeName: "Deutsch", bcp47: "de-DE" },
  { code: "it", name: "Italian", nativeName: "Italiano", bcp47: "it-IT" },
  { code: "ru", name: "Russian", nativeName: "Русский", bcp47: "ru-RU" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", bcp47: "tr-TR" },
  { code: "fa", name: "Persian / Farsi", nativeName: "فارسی", bcp47: "fa-IR", rtl: true },
  { code: "ha", name: "Hausa", nativeName: "Harshen Hausa", bcp47: "ha-NG" },
  { code: "yo", name: "Yoruba", nativeName: "Èdè Yorùbá", bcp47: "yo-NG" },
  { code: "ig", name: "Igbo", nativeName: "Asụsụ Igbo", bcp47: "ig-NG" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ", bcp47: "am-ET" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", bcp47: "ne-NP" },
  { code: "si", name: "Sinhala", nativeName: "සිංහල", bcp47: "si-LK" },
  { code: "my", name: "Burmese", nativeName: "မြန်မာစာ", bcp47: "my-MM" },
  { code: "km", name: "Khmer", nativeName: "ភាសាខ្មែរ", bcp47: "km-KH" },
  { code: "so", name: "Somali", nativeName: "Af Soomaali", bcp47: "so-SO" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", bcp47: "nl-NL" },
  { code: "pl", name: "Polish", nativeName: "Polski", bcp47: "pl-PL" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", bcp47: "uk-UA" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", bcp47: "el-GR" },
  { code: "he", name: "Hebrew", nativeName: "עברית", bcp47: "he-IL", rtl: true },
  { code: "hu", name: "Hungarian", nativeName: "Magyar", bcp47: "hu-HU" },
  { code: "cs", name: "Czech", nativeName: "Čeština", bcp47: "cs-CZ" },
  { code: "ro", name: "Romanian", nativeName: "Română", bcp47: "ro-RO" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", bcp47: "sv-SE" },
  { code: "da", name: "Danish", nativeName: "Dansk", bcp47: "da-DK" },
  { code: "fi", name: "Finnish", nativeName: "Suomi", bcp47: "fi-FI" },
  { code: "no", name: "Norwegian", nativeName: "Norsk", bcp47: "no-NO" },
  { code: "zu", name: "Zulu", nativeName: "isiZulu", bcp47: "zu-ZA" },
  { code: "xh", name: "Xhosa", nativeName: "isiXhosa", bcp47: "xh-ZA" },
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans", bcp47: "af-ZA" },
  { code: "st", name: "Sesotho", nativeName: "Sesotho", bcp47: "st-ZA" },
  { code: "rw", name: "Kinyarwanda", nativeName: "Ikinyarwanda", bcp47: "rw-RW" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", bcp47: "or-IN" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", bcp47: "as-IN" },
  { code: "ps", name: "Pashto", nativeName: "پښتو", bcp47: "ps-AF", rtl: true },
  { code: "ku", name: "Kurdish", nativeName: "Kurdî", bcp47: "ku-TR" },
  { code: "az", name: "Azerbaijani", nativeName: "Azərbaycan", bcp47: "az-AZ" },
  { code: "uz", name: "Uzbek", nativeName: "Oʻzbekcha", bcp47: "uz-UZ" },
  { code: "kk", name: "Kazakh", nativeName: "Қазақша", bcp47: "kk-KZ" },
  { code: "tg", name: "Tajik", nativeName: "Тоҷикӣ", bcp47: "tg-TJ" },
  { code: "ka", name: "Georgian", nativeName: "ქართული", bcp47: "ka-GE" },
  { code: "hy", name: "Armenian", nativeName: "Հայերեն", bcp47: "hy-AM" },
  { code: "mn", name: "Mongolian", nativeName: "Монгол", bcp47: "mn-MN" },
  { code: "lo", name: "Lao", nativeName: "ພາສາລາວ", bcp47: "lo-LA" },
  { code: "ceb", name: "Cebuano", nativeName: "Sinugboanon", bcp47: "ceb-PH" },
  { code: "jv", name: "Javanese", nativeName: "Basa Jawa", bcp47: "jv-ID" },
  { code: "su", name: "Sundanese", nativeName: "Basa Sunda", bcp47: "su-ID" },
  { code: "mg", name: "Malagasy", nativeName: "Fiteny Malagasy", bcp47: "mg-MG" },
  { code: "sn", name: "Shona", nativeName: "chiShona", bcp47: "sn-ZW" },
  { code: "ny", name: "Chichewa", nativeName: "Chichewa", bcp47: "ny-MW" },
  { code: "ff", name: "Fula", nativeName: "Fulfulde", bcp47: "ff-SN" },
  { code: "wo", name: "Wolof", nativeName: "Wollof", bcp47: "wo-SN" },
  { code: "ht", name: "Haitian Creole", nativeName: "Kreyòl Ayisyen", bcp47: "ht-HT" },
  { code: "ti", name: "Tigrinya", nativeName: "ትግርኛ", bcp47: "ti-ET" },
  { code: "om", name: "Oromo", nativeName: "Afaan Oromoo", bcp47: "om-ET" },
  { code: "ca", name: "Catalan", nativeName: "Català", bcp47: "ca-ES" },
  { code: "eu", name: "Basque", nativeName: "Euskara", bcp47: "eu-ES" },
  { code: "gl", name: "Galician", nativeName: "Galego", bcp47: "gl-ES" },
  { code: "bg", name: "Bulgarian", nativeName: "Български", bcp47: "bg-BG" },
  { code: "sr", name: "Serbian", nativeName: "Српски", bcp47: "sr-RS" },
  { code: "hr", name: "Croatian", nativeName: "Hrvatski", bcp47: "hr-HR" },
  { code: "bs", name: "Bosnian", nativeName: "Bosanski", bcp47: "bs-BA" },
  { code: "sk", name: "Slovak", nativeName: "Slovenčina", bcp47: "sk-SK" },
  { code: "sl", name: "Slovenian", nativeName: "Slovenščina", bcp47: "sl-SI" },
  { code: "lt", name: "Lithuanian", nativeName: "Lietuvių", bcp47: "lt-LT" },
  { code: "lv", name: "Latvian", nativeName: "Latviešu", bcp47: "lv-LV" },
  { code: "et", name: "Estonian", nativeName: "Eesti", bcp47: "et-EE" },
  { code: "sq", name: "Albanian", nativeName: "Shqip", bcp47: "sq-AL" },
  { code: "mk", name: "Macedonian", nativeName: "Македонски", bcp47: "mk-MK" },
];

export const DEFAULT_LANGUAGE: LanguageItem = COMPREHENSIVE_LANGUAGES[0]; // English

/**
 * Finds language info by ISO code or name
 */
export function getLanguageByCode(code: string): LanguageItem {
  if (!code) return DEFAULT_LANGUAGE;
  const normalized = code.toLowerCase().trim();
  const match = COMPREHENSIVE_LANGUAGES.find(
    (l) => l.code.toLowerCase() === normalized || l.code.toLowerCase().startsWith(normalized)
  );
  if (match) return match;

  // Search by name
  const nameMatch = COMPREHENSIVE_LANGUAGES.find(
    (l) => l.name.toLowerCase() === normalized || l.nativeName.toLowerCase() === normalized
  );
  return (
    nameMatch || {
      code: normalized,
      name: code,
      nativeName: code,
      bcp47: normalized + "-US",
    }
  );
}
