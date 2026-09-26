import React, { useRef } from 'react';
import { MAX_JD_CHARS } from '../lib/constants';

interface UploadViewProps {
  jd: string;
  setJd: (v: string) => void;
  files: File[];
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onRemoveAll: () => void;
  onAnalyze: () => void;
  isProcessing: boolean;
  jdError: boolean;
}

export default function UploadView({ jd, setJd, files, onAddFiles, onRemoveFile, onRemoveAll, onAnalyze, isProcessing, jdError }: UploadViewProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [processingMsgIdx, setProcessingMsgIdx] = React.useState(0);
  const processingMessages = ["Parsing documents...", "Scoring against requirements...", "Ranking candidates..."];
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      setProcessingMsgIdx((i) => (i + 1) % processingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleJdChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_JD_CHARS) {
      setJd(val);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onAddFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <main className="w-full flex-1 flex flex-col px-gutter-desktop py-space-xl max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-0.5 rounded text-[11px] font-bold tracking-wider mb-2 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              FREE FOR RECRUITERS
            </div>
            <h1 className="text-[32px] font-bold text-on-surface tracking-tight mb-2">CV Screener</h1>
            <p className="text-on-surface-variant text-[16px]">Screen, rank, and match candidate resumes against your job requirements in seconds.</p>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container-low text-on-surface-variant px-3 py-1.5 rounded-md text-[13px] font-medium border border-outline-variant/30">
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            Instant evaluation mode
          </div>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-xl mt-8">
          {/* Left Column - JD */}
          <div className="flex flex-col bg-surface-container-lowest border border-surface-container-high rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-on-surface">Paste job description</h2>
              <div className="flex items-center gap-2">
                <button className="text-on-surface-variant text-[12px] font-medium hover:text-on-surface transition-colors" onClick={() => setJd("")}>Clear</button>
              </div>
            </div>
            <p className="text-[13px] text-on-surface-variant mb-4">Paste full requirements, must-have qualifications, or job description text.</p>
            <textarea
              id="jdTextarea"
              className={`w-full flex-1 min-h-[300px] bg-surface-container-low/50 border-none rounded-lg p-4 text-[14px] text-on-surface placeholder:text-outline/60 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-shadow duration-200 resize-none ${jdError ? 'ring-2 ring-rose-500' : ''}`}
              placeholder="e.g. Senior Frontend Engineer with 5+ years experience in React, TypeScript, modern CSS architecture, state management patterns, and high-scale web performance optimization..."
              value={jd}
              onChange={handleJdChange}
            />
            <div className="flex items-center justify-between mt-4 text-outline text-[12px] font-medium">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">markdown</span>
                Markdown supported
              </div>
              <div>{jd.length} / {MAX_JD_CHARS} characters</div>
            </div>
          </div>

          {/* Right Column - CVs */}
          <div className="flex flex-col bg-surface-container-lowest border border-surface-container-high rounded-xl p-6 shadow-sm">
             <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-on-surface">Candidate resumes</h2>
              <div className="flex gap-2 items-center">
                {files.length > 0 && <button className="text-rose-600 hover:text-rose-700 text-xs font-medium" onClick={onRemoveAll}>Remove all</button>}
                <div className="bg-surface-container text-on-surface-variant px-3 py-1 rounded text-[12px] font-medium">{files.length} / 10 files selected</div>
              </div>
            </div>
            <p className="text-[13px] text-on-surface-variant mb-4">Drop up to 10 CVs (PDF or DOCX)</p>
            <div 
              className={`w-full flex-1 min-h-[300px] bg-surface-container-low/50 border border-dashed rounded-lg flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-surface-container-low/80 transition-all duration-200 ${isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-outline-variant/60'}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                if (e.dataTransfer.files) {
                  onAddFiles(Array.from(e.dataTransfer.files));
                }
              }}
            >
              <input type="file" multiple accept=".pdf,.docx" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              
              {files.length === 0 ? (
                <>
                  <div className="w-12 h-12 bg-surface-container-lowest rounded-xl border border-surface-container-high flex items-center justify-center mb-4 shadow-sm">
                    <span className="material-symbols-outlined text-[24px] text-primary">upload_file</span>
                  </div>
                  <h3 className="text-[16px] font-semibold text-on-surface mb-1">Drag and drop resumes here</h3>
                  <p className="text-[14px] text-on-surface-variant mb-4">or <span className="text-primary underline underline-offset-2">browse files from your computer</span></p>
                  <div className="bg-surface-container-lowest border border-surface-container-high text-outline px-3 py-1 rounded-md text-[11px] font-bold tracking-wider">PDF, DOCX UP TO 5MB EACH</div>
                </>
              ) : (
                <div className="w-full text-left max-h-[300px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <p className="text-sm font-semibold mb-2">Selected files:</p>
                  <ul className="text-xs text-on-surface-variant space-y-1">
                    {files.map((f: File, i: number) => (
                      <li key={i} className="flex justify-between items-center bg-surface-container p-2 rounded animate-file-enter" style={{ animationDelay: `${i * 0.05}s` }}>
                        <span className="truncate flex-1 font-medium">{f.name}</span>
                        <span className="text-[10px] text-outline mx-2">{formatSize(f.size)}</span>
                        <button onClick={() => onRemoveFile(i)} className="text-on-surface-variant hover:text-rose-500">
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 text-center">
                    <button className="text-primary text-sm font-medium hover:underline" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>+ Add more files</button>
                  </div>
                </div>
              )}
            </div>
             <div className="flex items-center justify-between mt-4 text-primary text-[12px] font-medium">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                In-browser parsing engine
              </div>
            </div>
          </div>
        </div>

        {/* Action Bottom */}
        <div className="mt-8 flex flex-col items-center justify-center bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-surface-container-high relative overflow-hidden">
          {isProcessing && (
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
              <div className="h-full bg-primary animate-progress"></div>
            </div>
          )}
          <button 
            onClick={onAnalyze}
            disabled={isProcessing}
            className="bg-primary disabled:opacity-50 text-on-primary px-8 py-3 rounded-lg text-[16px] font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98] shadow-sm mb-4"
          >
            {isProcessing ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                {processingMessages[processingMsgIdx]}
              </>
            ) : (
              <>
                Analyze candidates
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </>
            )}
          </button>
          <div className="flex items-center gap-3 text-[13px] text-outline font-medium max-w-[600px] text-center">
             <div className="flex items-center gap-1.5 text-primary">
                <span className="material-symbols-outlined text-[14px] shrink-0">lock</span>
                CVs are processed in real time to generate a match score and are not stored on our servers. We use a third-party AI provider to perform the analysis. Please avoid uploading CVs with sensitive personal data beyond what's normally on a resume.
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
