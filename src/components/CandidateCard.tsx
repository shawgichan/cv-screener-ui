import React from 'react';
import { ScoredCV } from '../lib/types';
import { SCORE_THRESHOLDS } from '../lib/constants';
import { useToast } from './Toast';

interface CandidateCardProps {
  data: ScoredCV;
  rank: number;
  style?: React.CSSProperties;
}

export default function CandidateCard({ data, rank, style }: CandidateCardProps) {
  const [expanded, setExpanded] = React.useState(rank === 1);
  const { toast } = useToast();
  const { result, filename, error } = data;
  
  if (error || !result) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded p-4 text-rose-800" style={style}>
        <p className="font-semibold">{filename}</p>
        <p className="text-sm">Failed to process: {error || 'Unknown error'}</p>
      </div>
    )
  }

  const scoreToLabel = (score: number) => {
    if (score >= SCORE_THRESHOLDS.STRONG) return "Strong Match";
    if (score >= SCORE_THRESHOLDS.REVIEW) return "Review Needed";
    return "Poor Fit";
  };

  const getScoreColor = (score: number) => {
    if (score >= SCORE_THRESHOLDS.STRONG) return "emerald";
    if (score >= SCORE_THRESHOLDS.REVIEW) return "amber";
    return "rose";
  };

  const color = getScoreColor(result.score);
  
  const displayName = filename.replace(/\.[^/.]+$/, "").replace(/_/g, " ").replace(/-/g, " ");
  
  const initials = displayName
    .split(' ')
    .filter(n => n.length > 0)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || '??';

  const colorMap: Record<string, { badge: string; label: string }> = {
    emerald: { badge: "border-emerald-300 bg-emerald-50 text-emerald-800", label: "text-emerald-700" },
    amber:   { badge: "border-amber-300 bg-amber-50 text-amber-800",     label: "text-amber-700" },
    rose:    { badge: "border-rose-300 bg-rose-50 text-rose-800",         label: "text-rose-700" },
  };
  const theme = colorMap[color];

  const handleCopyNotes = (e: React.MouseEvent) => {
    e.stopPropagation();
    let text = `${displayName} - Match Score: ${result.score}\nSummary: ${result.summary}\n\n`;
    if (result.requirements) {
      text += result.requirements.map(r => `[${r.status.toUpperCase()}] ${r.requirement}\nEvidence: ${r.evidence}`).join('\n\n');
    } else {
      text += `Matched: ${result.matched?.join(', ')}\nMissing: ${result.missing?.join(', ')}`;
    }
    navigator.clipboard.writeText(text);
    toast('Match notes copied', 'success');
  };

  const matchedCount = result.requirements?.filter(r => r.status === 'matched').length ?? result.matched?.length ?? 0;
  const missingCount = result.requirements?.filter(r => r.status === 'missing').length ?? result.missing?.length ?? 0;

  return (
    <div style={style} className="bg-surface-container-lowest border border-outline-variant rounded transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div onClick={() => setExpanded(!expanded)} className="p-space-md sm:p-space-lg flex flex-col md:flex-row md:items-center justify-between gap-space-md cursor-pointer select-none">
        <div className="flex items-start md:items-center gap-space-md min-w-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className={`text-[12px] font-semibold px-2 py-1 rounded ${rank===1 ? 'text-primary bg-primary/10' : 'text-outline bg-surface-container'}`}>#{rank}</span>
            <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center text-[16px] font-semibold tracking-tight">{initials}</div>
          </div>
          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="text-[16px] text-on-surface font-semibold">{displayName}</span>
            </div>
            <div className={`transition-opacity duration-200 ${expanded ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 mt-1'}`}>
               <p className="text-[13px] text-on-surface-variant truncate">
                 Matched: {matchedCount} • Missing: {missingCount}
               </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-space-md self-end md:self-auto shrink-0">
          <div className="flex flex-col items-end">
            <span className={`text-[20px] font-bold px-3 py-0.5 rounded border ${theme.badge}`}>{result.score}</span>
            <span className={`text-[11px] ${theme.label} mt-0.5 font-medium`}>
              {scoreToLabel(result.score)}
            </span>
          </div>
          <button className={`p-1 text-outline hover:text-on-surface transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
            <span className="material-symbols-outlined text-[22px]">keyboard_arrow_down</span>
          </button>
        </div>
      </div>
      
      <div className={`accordion-body ${expanded ? 'open' : ''}`}>
        <div className="px-space-md sm:px-space-lg pb-space-lg pt-0 border-t border-surface-container-high mt-1">
          <div className="pt-space-md flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <h4 className="text-[12px] font-medium uppercase tracking-wider text-outline">Requirement Match Breakdown</h4>
              <span className="text-[11px] font-semibold text-on-surface-variant">Parsed from {filename}</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2.5 text-[13px]">
              {result.requirements ? (
                result.requirements.map((req, idx) => (
                  <div key={idx} className={`flex items-start gap-2.5 p-2.5 rounded ${req.status === 'matched' ? 'bg-surface-container-low/40' : req.status === 'unclear' ? 'bg-amber-50/50 border border-amber-200/50' : 'bg-rose-50/50 border border-rose-200/50'}`}>
                    <span className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${req.status === 'matched' ? 'text-emerald-600' : req.status === 'unclear' ? 'text-amber-600' : 'text-rose-600'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {req.status === 'matched' ? 'check_circle' : req.status === 'unclear' ? 'warning' : 'cancel'}
                    </span>
                    <div className="flex-1">
                      <div className={`font-semibold ${req.status === 'matched' ? 'text-on-surface' : req.status === 'unclear' ? 'text-amber-900' : 'text-rose-900'}`}>{req.requirement}</div>
                      <div className="text-on-surface-variant text-xs mt-1">{req.evidence}</div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {result.matched?.map((m, idx) => (
                    <div key={`m-${idx}`} className="flex items-start gap-2.5 p-2.5 rounded bg-surface-container-low/40">
                      <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <div className="flex-1">
                        <span className="font-semibold text-on-surface">{m}</span>
                      </div>
                    </div>
                  ))}
                  {result.unclear?.map((u, idx) => (
                    <div key={`u-${idx}`} className="flex items-start gap-2.5 p-2.5 rounded bg-amber-50/50 border border-amber-200/50">
                      <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                      <div className="flex-1">
                        <span className="font-semibold text-amber-900">{u}</span>
                      </div>
                    </div>
                  ))}
                  {result.missing?.map((m, idx) => (
                    <div key={`x-${idx}`} className="flex items-start gap-2.5 p-2.5 rounded bg-rose-50/50 border border-rose-200/50">
                      <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                      <div className="flex-1">
                        <span className="font-semibold text-rose-900">{m}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            <p className="text-sm mt-2">{result.summary}</p>
            <div className="flex justify-end mt-2">
              <button onClick={handleCopyNotes} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">content_copy</span> Copy Match Notes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
