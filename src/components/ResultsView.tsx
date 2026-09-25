import React, { useState, useMemo } from 'react';
import { ScoredCV } from '../lib/types';
import CandidateCard from './CandidateCard';
import { SCORE_THRESHOLDS } from '../lib/constants';
import { useToast } from './Toast';

interface ResultsViewProps {
  results: ScoredCV[];
  isProcessing: boolean;
  fileCount: number;
  jobTitle: string;
  onBack: () => void;
}

export default function ResultsView({ results, isProcessing, fileCount, jobTitle, onBack }: ResultsViewProps) {
  const [processingMsgIdx, setProcessingMsgIdx] = useState(0);
  const [filter, setFilter] = useState<'all' | 'strong' | 'review' | 'poor'>('all');
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const processingMessages = ["Parsing documents...", "Scoring against requirements...", "Ranking candidates..."];

  React.useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      setProcessingMsgIdx((i) => (i + 1) % processingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const filteredResults = useMemo(() => {
    let filtered = results;
    
    // Band filter
    if (filter !== 'all') {
      filtered = filtered.filter(r => {
        if (!r.result) return false; // failures don't show up in these filters
        if (filter === 'strong') return r.result.score >= SCORE_THRESHOLDS.STRONG;
        if (filter === 'review') return r.result.score >= SCORE_THRESHOLDS.REVIEW && r.result.score < SCORE_THRESHOLDS.STRONG;
        if (filter === 'poor') return r.result.score < SCORE_THRESHOLDS.REVIEW;
        return true;
      });
    }
    
    // Search filter
    const q = search.toLowerCase();
    if (q) {
      filtered = filtered.filter(r => {
        if (!r.result) return r.filename.toLowerCase().includes(q);
        const nameMatch = r.result.candidate_name.toLowerCase().includes(q) || r.filename.toLowerCase().includes(q);
        const reqMatch = r.result.requirements?.some(req => req.requirement.toLowerCase().includes(q));
        const oldMatchedMatch = r.result.matched?.some(m => m.toLowerCase().includes(q));
        return nameMatch || reqMatch || oldMatchedMatch;
      });
    }

    return filtered;
  }, [results, filter, search]);

  const counts = useMemo(() => {
    const valid = results.filter(r => r.result);
    return {
      all: results.length,
      strong: valid.filter(r => r.result!.score >= SCORE_THRESHOLDS.STRONG).length,
      review: valid.filter(r => r.result!.score >= SCORE_THRESHOLDS.REVIEW && r.result!.score < SCORE_THRESHOLDS.STRONG).length,
      poor: valid.filter(r => r.result!.score < SCORE_THRESHOLDS.REVIEW).length,
    };
  }, [results]);

  const handleCopySummary = () => {
    const text = results.map((r, i) => {
      if (!r.result) return `${i + 1}. ${r.filename}: Failed to parse`;
      return `${i + 1}. ${r.result.candidate_name} (${r.filename}) - Score: ${r.result.score}\nSummary: ${r.result.summary}`;
    }).join('\n\n');
    navigator.clipboard.writeText(text);
    toast('Summary copied to clipboard', 'success');
  };

  const handleExportCSV = () => {
    const header = ['Rank', 'Candidate', 'Filename', 'Score', 'Band', 'Matched Requirements', 'Missing Requirements', 'Summary'];
    const rows = results.map((r, i) => {
      if (!r.result) return [i + 1, '-', r.filename, '-', 'Error', '-', '-', r.error || 'Unknown error'];
      const score = r.result.score;
      const band = score >= SCORE_THRESHOLDS.STRONG ? 'Strong' : score >= SCORE_THRESHOLDS.REVIEW ? 'Review' : 'Poor';
      let matchedCount = r.result.requirements?.filter(req => req.status === 'matched').length || r.result.matched?.length || 0;
      let missingCount = r.result.requirements?.filter(req => req.status === 'missing').length || r.result.missing?.length || 0;
      return [
        i + 1,
        r.result.candidate_name,
        r.filename,
        score,
        band,
        matchedCount,
        missingCount,
        `"${r.result.summary.replace(/"/g, '""')}"`
      ];
    });
    
    const csvContent = [header, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'cv-screening-results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('CSV downloaded', 'success');
  };

  const FilterPill = ({ id, label, count }: { id: 'all' | 'strong' | 'review' | 'poor', label: string, count: number }) => {
    const active = filter === id;
    return (
      <button 
        onClick={() => setFilter(id)}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${active ? 'bg-on-surface text-surface border-on-surface' : 'bg-surface-container text-on-surface-variant border-surface-container-high hover:bg-surface-container-high'}`}
      >
        {label} ({count})
      </button>
    );
  };

  return (
    <main className="w-full flex-1 flex flex-col px-gutter-desktop py-space-xl max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-space-lg mb-space-lg gap-space-md border-b border-surface-container-high">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm text-on-surface-variant text-[12px] font-medium">
              <button onClick={onBack} disabled={isProcessing} className="hover:text-primary disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none p-0">
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Back to Job & Resumes</span>
              </button>
              <span className="text-outline-variant">•</span>
              <span className="text-on-surface">{isProcessing ? "Evaluating..." : "Evaluation Complete"}</span>
            </div>
            <div className="flex items-center gap-space-sm flex-wrap">
              <h1 className="text-[24px] font-semibold text-on-surface tracking-tight">{jobTitle || "Match Results"}</h1>
              <span className="bg-surface-container text-on-surface-variant text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                {isProcessing ? `Processing ${fileCount} candidates` : `${results.length} candidates evaluated`}
              </span>
            </div>
          </div>
          {isProcessing ? (
            <div className="flex items-center gap-2 text-primary font-medium text-[14px]">
              <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
              {processingMessages[processingMsgIdx]}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={handleCopySummary} className="px-3 py-1.5 rounded text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">content_copy</span> Copy Summary
              </button>
              <button onClick={handleExportCSV} className="px-3 py-1.5 rounded text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">download</span> Export CSV
              </button>
            </div>
          )}
        </div>

        {!isProcessing && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <FilterPill id="all" label="All Candidates" count={counts.all} />
              <FilterPill id="strong" label="Strong Matches" count={counts.strong} />
              <FilterPill id="review" label="Review Needed" count={counts.review} />
              <FilterPill id="poor" label="Poor Fit" count={counts.poor} />
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
              <input 
                type="text" 
                placeholder="Search candidates or requirements..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3 py-1.5 rounded border border-surface-container-high bg-surface-container-lowest text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-shadow"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-space-md">
          {isProcessing ? (
            Array.from({ length: Math.min(fileCount, 4) }).map((_, i) => (
              <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded p-space-md sm:p-space-lg flex flex-col md:flex-row md:items-center justify-between gap-space-md animate-pulse">
                <div className="flex items-center gap-space-md min-w-0 w-full">
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-8 h-6 bg-surface-container rounded"></div>
                    <div className="w-10 h-10 rounded-full bg-surface-container-high"></div>
                  </div>
                  <div className="min-w-0 flex flex-col gap-2 w-full max-w-sm">
                    <div className="h-5 bg-surface-container rounded w-3/4"></div>
                    <div className="h-4 bg-surface-container-low rounded w-1/2"></div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="w-16 h-8 bg-surface-container rounded"></div>
                  <div className="w-20 h-4 bg-surface-container-low rounded"></div>
                </div>
              </div>
            ))
          ) : filteredResults.length > 0 ? (
            filteredResults.map((c, i) => (
               <CandidateCard key={i} data={c} rank={results.indexOf(c) + 1} style={{ animation: `cardEnter 0.3s ease-out ${i * 0.08}s both` }} />
            ))
          ) : (
            <div className="text-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] mb-2 text-outline-variant">search_off</span>
              <p>No candidates match the current filters.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
