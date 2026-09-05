export interface LedgerEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  totalSales: number;
  totalExpenses: number;
  netAmount: number;
  notes: string;
  createdAt: number | any;
  isLocalOnly?: boolean;
  syncError?: string;
}

export interface LedgerDraft {
  date?: string | null;
  itemsSold?: string | null;
  totalSales?: number | null;
  totalExpenses?: number | null;
  notes?: string | null;
  isComplete?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "assistant" | "user";
  text: string;
  timestamp: number;
  extractedDraft?: LedgerDraft;
  suggestedQuickReplies?: string[];
}

export interface UserProfile {
  country: string;
  region: string;
  tradingDuration: string;
  languageCode?: string;
  languageName?: string;
  currencyCode?: string;
  currencySymbol?: string;
  updatedAt?: number | any;
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface ComplianceOrientationRequest {
  period: "30" | "90" | "365" | "all";
  totalSales: number;
  totalExpenses: number;
  netAmount: number;
  entryCount: number;
  averageDailySales: number;
  currencySymbol?: string;
  userProfile: UserProfile;
}

export interface ComplianceOrientationResponse {
  orientationText: string;
  timestamp: string;
  modelUsed: string;
  groundingSources?: GroundingSource[];
  searchQueries?: string[];
  statsSummary?: {
    period: string;
    totalSales: number;
    totalExpenses: number;
    netAmount: number;
    marginPct: number;
    jurisdiction?: string;
    tradingDuration?: string;
  };
}

