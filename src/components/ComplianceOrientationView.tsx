import React from "react";
import Markdown from "react-markdown";
import {
  ShieldAlert,
  ExternalLink,
  Search,
  BookOpen,
  Calendar,
  CheckCircle2,
  Building2,
  TrendingUp
} from "lucide-react";
import { ComplianceOrientationResponse } from "../types";

interface ComplianceOrientationViewProps {
  orientation: ComplianceOrientationResponse;
  currencySymbol?: string;
  onEditJurisdiction: () => void;
}

export const ComplianceOrientationView: React.FC<ComplianceOrientationViewProps> = ({
  orientation,
  currencySymbol = "$",
  onEditJurisdiction,
}) => {
  const stats = orientation.statsSummary;

  return (
    <div id="compliance-orientation-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Jurisdiction & Run-Rate Header Strip */}
      {stats && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-100 flex items-center space-x-2">
                <span>Jurisdiction: {stats.jurisdiction || "Recorded Region"}</span>
                <span className="text-[10px] bg-slate-800 text-amber-300 font-mono px-2 py-0.5 rounded-full">
                  {stats.tradingDuration || "Active Vendor"}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Evaluated against {stats.period} of logged transactions
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 font-mono">
              <span className="text-slate-400 text-[10px] block">Extrapolated Monthly Net</span>
              <span className="text-emerald-400 font-bold">
                ~{currencySymbol}
                {Math.round((stats.netAmount / (stats.period === "all" ? 1 : 1)) * (26 / 30)).toLocaleString()}
                <span className="text-slate-400 text-[10px] font-sans font-normal"> / mo</span>
              </span>
            </div>

            <button
              type="button"
              onClick={onEditJurisdiction}
              className="text-xs text-amber-300 hover:text-amber-200 underline font-medium px-2 py-1"
            >
              Change Location
            </button>
          </div>
        </div>
      )}

      {/* Main CPA Analysis Text (Rendered Markdown) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              CPA & Regulatory Orientation Analysis
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(orientation.timestamp).toLocaleDateString()}</span>
            <span className="bg-slate-100 text-slate-600 font-mono px-1.5 py-0.5 rounded text-[10px]">
              {orientation.modelUsed}
            </span>
          </div>
        </div>

        {/* Markdown Content Container */}
        <div className="prose prose-slate prose-sm max-w-none text-xs text-slate-800 leading-relaxed font-sans space-y-4 [&>h3]:text-sm [&>h3]:font-bold [&>h3]:text-slate-900 [&>h3]:mt-6 [&>h3]:mb-2 [&>h3]:pb-1 [&>h3]:border-b [&>h3]:border-slate-100 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ul>li]:mb-1 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol>li]:mb-1 [&>strong]:text-slate-900 [&>blockquote]:border-l-2 [&>blockquote]:border-amber-400 [&>blockquote]:pl-3 [&>blockquote]:text-slate-600 [&>blockquote]:italic">
          <Markdown>{orientation.orientationText}</Markdown>
        </div>
      </div>

      {/* Grounding Sources & Search References */}
      {orientation.groundingSources && orientation.groundingSources.length > 0 && (
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <Search className="w-3.5 h-3.5 text-blue-600" />
            <span>Grounding References & Public Regulatory Sources</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">
              Google Search Grounded
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            The advisor researched current tax rules, municipal codes, and statutory small business thresholds from these live public sources:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {orientation.groundingSources.map((source, index) => (
              <a
                key={index}
                href={source.uri}
                target="_blank"
                rel="noreferrer noopener"
                className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition flex items-start justify-between group shadow-2xs"
              >
                <div className="min-w-0 pr-2">
                  <span className="block text-xs font-semibold text-slate-900 group-hover:text-blue-700 truncate">
                    {source.title || "Regulatory Information"}
                  </span>
                  <span className="block text-[10px] font-mono text-slate-400 truncate mt-0.5">
                    {source.uri}
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 mt-0.5" />
              </a>
            ))}
          </div>

          {orientation.searchQueries && orientation.searchQueries.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold text-slate-400 mr-1">Queries:</span>
              {orientation.searchQueries.map((query, qIdx) => (
                <span
                  key={qIdx}
                  className="inline-flex items-center text-[10px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-md"
                >
                  {query}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Advisory Nudge & Legal Protective Boundary Checkpoint */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs flex items-start space-x-3 shadow-2xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-amber-950 text-xs">
            Regulatory Boundary & Informed Orientation Notice
          </h4>
          <p className="text-amber-800 leading-relaxed text-[11px]">
            This orientation is an educational synthesis of public statutory guidelines, local seller ordinances, and bookkeeping standards. It does <strong>not</strong> constitute an official legal ruling or individual tax determination on your specific business, as private factors such as household deductions, prior loss carryovers, or municipal street vendor lot permits cannot be fully audited via automated conversation.
          </p>
          <div className="pt-1 flex items-center space-x-1.5 text-amber-900 font-semibold text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Always verify final permit numbers and due dates directly with your regional revenue service.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
