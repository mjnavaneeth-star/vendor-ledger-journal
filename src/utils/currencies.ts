export interface CurrencyInfo {
  currencyCode: string; // ISO 4217 code (e.g. INR, USD, GBP, NGN, KES, PHP, EUR, JPY)
  currencySymbol: string; // e.g. ₹, $, £, ₦, KSh, ₱, €, ¥
  currencyName: string; // e.g. Indian Rupee, US Dollar, Euro
  defaultLocale: string; // e.g. en-IN, en-US, en-GB, en-NG, sw-KE, fil-PH, de-DE
}

export interface CountryItem {
  name: string;
  code: string; // ISO 3166-1 alpha-2
  currency: CurrencyInfo;
}

/**
 * Standard ISO 4217 Country-to-Currency mapping covering all global jurisdictions.
 */
export const COUNTRY_CURRENCY_MAP: Record<string, CurrencyInfo> = {
  // Asia & Indian Subcontinent
  india: { currencyCode: "INR", currencySymbol: "₹", currencyName: "Indian Rupee", defaultLocale: "en-IN" },
  pakistan: { currencyCode: "PKR", currencySymbol: "₨", currencyName: "Pakistani Rupee", defaultLocale: "ur-PK" },
  bangladesh: { currencyCode: "BDT", currencySymbol: "৳", currencyName: "Bangladeshi Taka", defaultLocale: "bn-BD" },
  sri_lanka: { currencyCode: "LKR", currencySymbol: "Rs", currencyName: "Sri Lankan Rupee", defaultLocale: "si-LK" },
  nepal: { currencyCode: "NPR", currencySymbol: "रू", currencyName: "Nepalese Rupee", defaultLocale: "ne-NP" },
  bhutan: { currencyCode: "BTN", currencySymbol: "Nu.", currencyName: "Bhutanese Ngultrum", defaultLocale: "dz-BT" },
  myanmar: { currencyCode: "MMK", currencySymbol: "K", currencyName: "Myanmar Kyat", defaultLocale: "my-MM" },
  philippines: { currencyCode: "PHP", currencySymbol: "₱", currencyName: "Philippine Peso", defaultLocale: "fil-PH" },
  indonesia: { currencyCode: "IDR", currencySymbol: "Rp", currencyName: "Indonesian Rupiah", defaultLocale: "id-ID" },
  malaysia: { currencyCode: "MYR", currencySymbol: "RM", currencyName: "Malaysian Ringgit", defaultLocale: "ms-MY" },
  singapore: { currencyCode: "SGD", currencySymbol: "S$", currencyName: "Singapore Dollar", defaultLocale: "en-SG" },
  thailand: { currencyCode: "THB", currencySymbol: "฿", currencyName: "Thai Baht", defaultLocale: "th-TH" },
  vietnam: { currencyCode: "VND", currencySymbol: "₫", currencyName: "Vietnamese Dong", defaultLocale: "vi-VN" },
  cambodia: { currencyCode: "KHR", currencySymbol: "៛", currencyName: "Cambodian Riel", defaultLocale: "km-KH" },
  laos: { currencyCode: "LAK", currencySymbol: "₭", currencyName: "Lao Kip", defaultLocale: "lo-LA" },
  china: { currencyCode: "CNY", currencySymbol: "¥", currencyName: "Chinese Yuan", defaultLocale: "zh-CN" },
  hong_kong: { currencyCode: "HKD", currencySymbol: "HK$", currencyName: "Hong Kong Dollar", defaultLocale: "zh-HK" },
  taiwan: { currencyCode: "TWD", currencySymbol: "NT$", currencyName: "New Taiwan Dollar", defaultLocale: "zh-TW" },
  japan: { currencyCode: "JPY", currencySymbol: "¥", currencyName: "Japanese Yen", defaultLocale: "ja-JP" },
  south_korea: { currencyCode: "KRW", currencySymbol: "₩", currencyName: "South Korean Won", defaultLocale: "ko-KR" },

  // Africa
  nigeria: { currencyCode: "NGN", currencySymbol: "₦", currencyName: "Nigerian Naira", defaultLocale: "en-NG" },
  kenya: { currencyCode: "KES", currencySymbol: "KSh", currencyName: "Kenyan Shilling", defaultLocale: "sw-KE" },
  south_africa: { currencyCode: "ZAR", currencySymbol: "R", currencyName: "South African Rand", defaultLocale: "en-ZA" },
  ghana: { currencyCode: "GHS", currencySymbol: "GH₵", currencyName: "Ghanaian Cedi", defaultLocale: "en-GH" },
  tanzania: { currencyCode: "TZS", currencySymbol: "TSh", currencyName: "Tanzanian Shilling", defaultLocale: "sw-TZ" },
  uganda: { currencyCode: "UGX", currencySymbol: "USh", currencyName: "Ugandan Shilling", defaultLocale: "en-UG" },
  ethiopia: { currencyCode: "ETB", currencySymbol: "Br", currencyName: "Ethiopian Birr", defaultLocale: "am-ET" },
  rwanda: { currencyCode: "RWF", currencySymbol: "FRw", currencyName: "Rwandan Franc", defaultLocale: "rw-RW" },
  egypt: { currencyCode: "EGP", currencySymbol: "E£", currencyName: "Egyptian Pound", defaultLocale: "ar-EG" },
  morocco: { currencyCode: "MAD", currencySymbol: "DH", currencyName: "Moroccan Dirham", defaultLocale: "ar-MA" },
  algeria: { currencyCode: "DZD", currencySymbol: "DA", currencyName: "Algerian Dinar", defaultLocale: "ar-DZ" },
  tunisia: { currencyCode: "TND", currencySymbol: "DT", currencyName: "Tunisian Dinar", defaultLocale: "ar-TN" },
  senegal: { currencyCode: "XOF", currencySymbol: "CFA", currencyName: "West African CFA Franc", defaultLocale: "fr-SN" },
  ivory_coast: { currencyCode: "XOF", currencySymbol: "CFA", currencyName: "West African CFA Franc", defaultLocale: "fr-CI" },
  cameroon: { currencyCode: "XAF", currencySymbol: "FCFA", currencyName: "Central African CFA Franc", defaultLocale: "fr-CM" },
  zambia: { currencyCode: "ZMW", currencySymbol: "ZK", currencyName: "Zambian Kwacha", defaultLocale: "en-ZM" },
  zimbabwe: { currencyCode: "ZWL", currencySymbol: "Z$", currencyName: "Zimbabwean Dollar", defaultLocale: "en-ZW" },

  // Americas
  united_states: { currencyCode: "USD", currencySymbol: "$", currencyName: "US Dollar", defaultLocale: "en-US" },
  canada: { currencyCode: "CAD", currencySymbol: "CA$", currencyName: "Canadian Dollar", defaultLocale: "en-CA" },
  mexico: { currencyCode: "MXN", currencySymbol: "MX$", currencyName: "Mexican Peso", defaultLocale: "es-MX" },
  brazil: { currencyCode: "BRL", currencySymbol: "R$", currencyName: "Brazilian Real", defaultLocale: "pt-BR" },
  colombia: { currencyCode: "COP", currencySymbol: "COL$", currencyName: "Colombian Peso", defaultLocale: "es-CO" },
  argentina: { currencyCode: "ARS", currencySymbol: "AR$", currencyName: "Argentine Peso", defaultLocale: "es-AR" },
  chile: { currencyCode: "CLP", currencySymbol: "CLP$", currencyName: "Chilean Peso", defaultLocale: "es-CL" },
  peru: { currencyCode: "PEN", currencySymbol: "S/.", currencyName: "Peruvian Sol", defaultLocale: "es-PE" },
  ecuador: { currencyCode: "USD", currencySymbol: "$", currencyName: "US Dollar", defaultLocale: "es-EC" },
  guatemala: { currencyCode: "GTQ", currencySymbol: "Q", currencyName: "Guatemalan Quetzal", defaultLocale: "es-GT" },
  costa_rica: { currencyCode: "CRC", currencySymbol: "₡", currencyName: "Costa Rican Colón", defaultLocale: "es-CR" },
  panama: { currencyCode: "PAB", currencySymbol: "B/.", currencyName: "Panamanian Balboa", defaultLocale: "es-PA" },
  dominican_republic: { currencyCode: "DOP", currencySymbol: "RD$", currencyName: "Dominican Peso", defaultLocale: "es-DO" },
  jamaica: { currencyCode: "JMD", currencySymbol: "J$", currencyName: "Jamaican Dollar", defaultLocale: "en-JM" },

  // Europe & UK
  united_kingdom: { currencyCode: "GBP", currencySymbol: "£", currencyName: "British Pound", defaultLocale: "en-GB" },
  germany: { currencyCode: "EUR", currencySymbol: "€", currencyName: "Euro", defaultLocale: "de-DE" },
  france: { currencyCode: "EUR", currencySymbol: "€", currencyName: "Euro", defaultLocale: "fr-FR" },
  spain: { currencyCode: "EUR", currencySymbol: "€", currencyName: "Euro", defaultLocale: "es-ES" },
  italy: { currencyCode: "EUR", currencySymbol: "€", currencyName: "Euro", defaultLocale: "it-IT" },
  netherlands: { currencyCode: "EUR", currencySymbol: "€", currencyName: "Euro", defaultLocale: "nl-NL" },
  belgium: { currencyCode: "EUR", currencySymbol: "€", currencyName: "Euro", defaultLocale: "nl-BE" },
  ireland: { currencyCode: "EUR", currencySymbol: "€", currencyName: "Euro", defaultLocale: "en-IE" },
  portugal: { currencyCode: "EUR", currencySymbol: "€", currencyName: "Euro", defaultLocale: "pt-PT" },
  austria: { currencyCode: "EUR", currencySymbol: "€", currencyName: "Euro", defaultLocale: "de-AT" },
  greece: { currencyCode: "EUR", currencySymbol: "€", currencyName: "Euro", defaultLocale: "el-GR" },
  switzerland: { currencyCode: "CHF", currencySymbol: "CHF", currencyName: "Swiss Franc", defaultLocale: "de-CH" },
  poland: { currencyCode: "PLN", currencySymbol: "zł", currencyName: "Polish Zloty", defaultLocale: "pl-PL" },
  sweden: { currencyCode: "SEK", currencySymbol: "kr", currencyName: "Swedish Krona", defaultLocale: "sv-SE" },
  norway: { currencyCode: "NOK", currencySymbol: "kr", currencyName: "Norwegian Krone", defaultLocale: "no-NO" },
  denmark: { currencyCode: "DKK", currencySymbol: "kr.", currencyName: "Danish Krone", defaultLocale: "da-DK" },
  czech_republic: { currencyCode: "CZK", currencySymbol: "Kč", currencyName: "Czech Koruna", defaultLocale: "cs-CZ" },
  hungary: { currencyCode: "HUF", currencySymbol: "Ft", currencyName: "Hungarian Forint", defaultLocale: "hu-HU" },
  romania: { currencyCode: "RON", currencySymbol: "lei", currencyName: "Romanian Leu", defaultLocale: "ro-RO" },
  turkey: { currencyCode: "TRY", currencySymbol: "₺", currencyName: "Turkish Lira", defaultLocale: "tr-TR" },
  ukraine: { currencyCode: "UAH", currencySymbol: "₴", currencyName: "Ukrainian Hryvnia", defaultLocale: "uk-UA" },
  russia: { currencyCode: "RUB", currencySymbol: "₽", currencyName: "Russian Ruble", defaultLocale: "ru-RU" },

  // Middle East
  united_arab_emirates: { currencyCode: "AED", currencySymbol: "AED", currencyName: "UAE Dirham", defaultLocale: "ar-AE" },
  saudi_arabia: { currencyCode: "SAR", currencySymbol: "SAR", currencyName: "Saudi Riyal", defaultLocale: "ar-SA" },
  qatar: { currencyCode: "QAR", currencySymbol: "QR", currencyName: "Qatari Riyal", defaultLocale: "ar-QA" },
  kuwait: { currencyCode: "KWD", currencySymbol: "KD", currencyName: "Kuwaiti Dinar", defaultLocale: "ar-KW" },
  oman: { currencyCode: "OMR", currencySymbol: "OMR", currencyName: "Omani Rial", defaultLocale: "ar-OM" },
  israel: { currencyCode: "ILS", currencySymbol: "₪", currencyName: "Israeli Shekel", defaultLocale: "he-IL" },
  jordan: { currencyCode: "JOD", currencySymbol: "JD", currencyName: "Jordanian Dinar", defaultLocale: "ar-JO" },

  // Oceania
  australia: { currencyCode: "AUD", currencySymbol: "A$", currencyName: "Australian Dollar", defaultLocale: "en-AU" },
  new_zealand: { currencyCode: "NZD", currencySymbol: "NZ$", currencyName: "New Zealand Dollar", defaultLocale: "en-NZ" },
  fiji: { currencyCode: "FJD", currencySymbol: "FJ$", currencyName: "Fijian Dollar", defaultLocale: "en-FJ" },
};

/**
 * Standard list of countries for searchable picker
 */
export const GLOBAL_COUNTRIES: Array<{ name: string; key: string; currencyCode: string; symbol: string }> = [
  { name: "India", key: "india", currencyCode: "INR", symbol: "₹" },
  { name: "United States", key: "united_states", currencyCode: "USD", symbol: "$" },
  { name: "United Kingdom", key: "united_kingdom", currencyCode: "GBP", symbol: "£" },
  { name: "Nigeria", key: "nigeria", currencyCode: "NGN", symbol: "₦" },
  { name: "Kenya", key: "kenya", currencyCode: "KES", symbol: "KSh" },
  { name: "Philippines", key: "philippines", currencyCode: "PHP", symbol: "₱" },
  { name: "South Africa", key: "south_africa", currencyCode: "ZAR", symbol: "R" },
  { name: "Mexico", key: "mexico", currencyCode: "MXN", symbol: "MX$" },
  { name: "Ghana", key: "ghana", currencyCode: "GHS", symbol: "GH₵" },
  { name: "Canada", key: "canada", currencyCode: "CAD", symbol: "CA$" },
  { name: "Australia", key: "australia", currencyCode: "AUD", symbol: "A$" },
  { name: "Indonesia", key: "indonesia", currencyCode: "IDR", symbol: "Rp" },
  { name: "Pakistan", key: "pakistan", currencyCode: "PKR", symbol: "₨" },
  { name: "Bangladesh", key: "bangladesh", currencyCode: "BDT", symbol: "৳" },
  { name: "Vietnam", key: "vietnam", currencyCode: "VND", symbol: "₫" },
  { name: "Brazil", key: "brazil", currencyCode: "BRL", symbol: "R$" },
  { name: "Germany", key: "germany", currencyCode: "EUR", symbol: "€" },
  { name: "France", key: "france", currencyCode: "EUR", symbol: "€" },
  { name: "Spain", key: "spain", currencyCode: "EUR", symbol: "€" },
  { name: "Italy", key: "italy", currencyCode: "EUR", symbol: "€" },
  { name: "United Arab Emirates", key: "united_arab_emirates", currencyCode: "AED", symbol: "AED" },
  { name: "Saudi Arabia", key: "saudi_arabia", currencyCode: "SAR", symbol: "SAR" },
  { name: "Egypt", key: "egypt", currencyCode: "EGP", symbol: "E£" },
  { name: "Thailand", key: "thailand", currencyCode: "THB", symbol: "฿" },
  { name: "Malaysia", key: "malaysia", currencyCode: "MYR", symbol: "RM" },
  { name: "Singapore", key: "singapore", currencyCode: "SGD", symbol: "S$" },
  { name: "Japan", key: "japan", currencyCode: "JPY", symbol: "¥" },
  { name: "South Korea", key: "south_korea", currencyCode: "KRW", symbol: "₩" },
  { name: "Colombia", key: "colombia", currencyCode: "COP", symbol: "COL$" },
  { name: "Argentina", key: "argentina", currencyCode: "ARS", symbol: "AR$" },
  { name: "Chile", key: "chile", currencyCode: "CLP", symbol: "CLP$" },
  { name: "Peru", key: "peru", currencyCode: "PEN", symbol: "S/." },
  { name: "Tanzania", key: "tanzania", currencyCode: "TZS", symbol: "TSh" },
  { name: "Uganda", key: "uganda", currencyCode: "UGX", symbol: "USh" },
  { name: "Ethiopia", key: "ethiopia", currencyCode: "ETB", symbol: "Br" },
  { name: "Rwanda", key: "rwanda", currencyCode: "RWF", symbol: "FRw" },
  { name: "Morocco", key: "morocco", currencyCode: "MAD", symbol: "DH" },
  { name: "Turkey", key: "turkey", currencyCode: "TRY", symbol: "₺" },
  { name: "Netherlands", key: "netherlands", currencyCode: "EUR", symbol: "€" },
  { name: "Ireland", key: "ireland", currencyCode: "EUR", symbol: "€" },
  { name: "Poland", key: "poland", currencyCode: "PLN", symbol: "zł" },
  { name: "New Zealand", key: "new_zealand", currencyCode: "NZD", symbol: "NZ$" },
  { name: "Nepal", key: "nepal", currencyCode: "NPR", symbol: "रू" },
  { name: "Sri Lanka", key: "sri_lanka", currencyCode: "LKR", symbol: "Rs" },
];

/**
 * Derives ISO 4217 Currency automatically from Country / Region string
 */
export function getCurrencyForCountry(countryName: string): CurrencyInfo {
  if (!countryName) {
    return COUNTRY_CURRENCY_MAP.united_states;
  }
  const clean = countryName.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");

  // Direct key lookup
  if (COUNTRY_CURRENCY_MAP[clean]) {
    return COUNTRY_CURRENCY_MAP[clean];
  }

  // Alias checks
  if (clean.includes("india") || clean.includes("bharat")) return COUNTRY_CURRENCY_MAP.india;
  if (clean.includes("uk") || clean.includes("britain") || clean.includes("england") || clean.includes("scotland") || clean.includes("wales")) return COUNTRY_CURRENCY_MAP.united_kingdom;
  if (clean.includes("usa") || clean.includes("united_states") || clean === "us") return COUNTRY_CURRENCY_MAP.united_states;
  if (clean.includes("nigeria")) return COUNTRY_CURRENCY_MAP.nigeria;
  if (clean.includes("kenya")) return COUNTRY_CURRENCY_MAP.kenya;
  if (clean.includes("philippines") || clean.includes("filipino")) return COUNTRY_CURRENCY_MAP.philippines;
  if (clean.includes("south_africa") || clean === "rsa") return COUNTRY_CURRENCY_MAP.south_africa;
  if (clean.includes("mexico")) return COUNTRY_CURRENCY_MAP.mexico;
  if (clean.includes("ghana")) return COUNTRY_CURRENCY_MAP.ghana;
  if (clean.includes("canada")) return COUNTRY_CURRENCY_MAP.canada;
  if (clean.includes("australia")) return COUNTRY_CURRENCY_MAP.australia;
  if (clean.includes("indonesia")) return COUNTRY_CURRENCY_MAP.indonesia;
  if (clean.includes("pakistan")) return COUNTRY_CURRENCY_MAP.pakistan;
  if (clean.includes("bangladesh")) return COUNTRY_CURRENCY_MAP.bangladesh;
  if (clean.includes("brazil") || clean.includes("brasil")) return COUNTRY_CURRENCY_MAP.brazil;
  if (clean.includes("japan")) return COUNTRY_CURRENCY_MAP.japan;
  if (clean.includes("korea")) return COUNTRY_CURRENCY_MAP.south_korea;
  if (clean.includes("germany") || clean.includes("france") || clean.includes("spain") || clean.includes("italy") || clean.includes("europe")) return COUNTRY_CURRENCY_MAP.germany;
  if (clean.includes("emirates") || clean.includes("dubai") || clean.includes("uae")) return COUNTRY_CURRENCY_MAP.united_arab_emirates;
  if (clean.includes("saudi")) return COUNTRY_CURRENCY_MAP.saudi_arabia;
  if (clean.includes("egypt")) return COUNTRY_CURRENCY_MAP.egypt;

  // Fallback to USD
  return {
    currencyCode: "USD",
    currencySymbol: "$",
    currencyName: "US Dollar",
    defaultLocale: "en-US",
  };
}

/**
 * Universal monetary amount formatter using standard browser Intl.NumberFormat
 */
export function formatCurrency(
  amount: number | null | undefined,
  currencyCode: string = "USD",
  locale?: string,
  options?: Intl.NumberFormatOptions
): string {
  const numeric = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  const targetLocale = locale || (currencyCode === "INR" ? "en-IN" : undefined);

  try {
    return new Intl.NumberFormat(targetLocale, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
      ...options,
    }).format(numeric);
  } catch (err) {
    // If currencyCode or locale is unsupported, graceful fallback
    const sym = currencyCode === "INR" ? "₹" : currencyCode === "GBP" ? "£" : currencyCode === "EUR" ? "€" : "$";
    return `${sym}${numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

/**
 * Compact currency formatter (useful for trend charts and condensed badges)
 */
export function formatCompactCurrency(
  amount: number | null | undefined,
  currencyCode: string = "USD",
  locale?: string
): string {
  const numeric = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  const targetLocale = locale || (currencyCode === "INR" ? "en-IN" : undefined);

  try {
    return new Intl.NumberFormat(targetLocale, {
      style: "currency",
      currency: currencyCode,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(numeric);
  } catch {
    return `${currencyCode} ${numeric.toLocaleString()}`;
  }
}
