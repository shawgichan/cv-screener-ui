"use client";

import React, { useState } from "react";
import { extractTextFromFile } from "./parser";
import { ScoredCV } from "../lib/types";
import { MAX_FILES, MAX_FILE_SIZE_MB } from "../lib/constants";
import UploadView from "../components/UploadView";
import ResultsView from "../components/ResultsView";
import Footer from "../components/Footer";
import ConfirmDialog from "../components/ConfirmDialog";
import { ToastProvider, useToast } from "../components/Toast";

function HomeContent() {
  const [view, setView] = useState<"upload" | "results">("upload");
  const [jd, setJd] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ScoredCV[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [jdError, setJdError] = useState(false);
  
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; failedFiles: string[]; resolve?: (val: boolean) => void }>({ open: false, failedFiles: [] });
  
  const { toast } = useToast();

  const handleAddFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(f => f.size <= MAX_FILE_SIZE_MB * 1024 * 1024);
    if (validFiles.length < newFiles.length) {
      toast(`Some files were skipped because they exceed ${MAX_FILE_SIZE_MB}MB.`, 'error');
    }
    if (files.length + validFiles.length > MAX_FILES) {
      toast(`You can only upload up to ${MAX_FILES} CVs at a time.`, 'error');
      return;
    }
    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAll = () => {
    setFiles([]);
  };

  const handleAnalyze = async () => {
    if (!jd.trim()) {
      setJdError(true);
      document.getElementById('jdTextarea')?.focus();
      setTimeout(() => setJdError(false), 2000);
      return;
    }
    if (files.length === 0) {
      toast("Please upload at least one CV.", 'error');
      return;
    }

    // Extract Job Title from JD
    const firstLine = jd.split('\n').find(l => l.trim().length > 0) || "Match Results";
    const titleMatch = jd.match(/Job Title:\s*(.*)/i);
    setJobTitle(titleMatch ? titleMatch[1].trim() : firstLine.substring(0, 50));

    setIsProcessing(true);
    setView("results");
    
    try {
      const cvInputs: any[] = [];
      const failedFiles: string[] = [];
      
      for (const f of files) {
        try {
          const text = await extractTextFromFile(f);
          cvInputs.push({ filename: f.name, cv_text: text });
          await new Promise(r => setTimeout(r, 10));
        } catch (err: any) {
          cvInputs.push({ filename: f.name, cv_text: "", error: err.message });
          failedFiles.push(f.name);
        }
      }

      const validCvs = cvInputs.filter(c => !c.error);
      
      if (failedFiles.length > 0) {
        const proceed = await new Promise<boolean>((resolve) => {
          setConfirmDialog({ open: true, failedFiles, resolve });
        });
        setConfirmDialog({ open: false, failedFiles: [] });
        if (!proceed) {
          setView("upload");
          setIsProcessing(false);
          return;
        }
      }

      if (validCvs.length === 0) {
        toast("Failed to parse any of the provided documents.", 'error');
        setView("upload");
        setIsProcessing(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8083";
      const res = await fetch(`${API_URL}/api/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd_text: jd, cvs: validCvs }),
      });

      if (!res.ok) {
        throw new Error("Backend evaluation failed: " + res.statusText);
      }

      const data = await res.json();
      
      const combined = [
         ...data,
         ...cvInputs.filter(c => c.error).map(c => ({ filename: c.filename, error: c.error, result: null }))
      ];
      
      setResults(combined);
    } catch (error) {
      console.error(error);
      toast("An error occurred during analysis.", 'error');
      setView("upload");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {view === "upload" ? (
        <UploadView 
          jd={jd} 
          setJd={setJd} 
          files={files} 
          onAddFiles={handleAddFiles}
          onRemoveFile={handleRemoveFile}
          onRemoveAll={handleRemoveAll}
          onAnalyze={handleAnalyze} 
          isProcessing={isProcessing}
          jdError={jdError}
        />
      ) : (
        <ResultsView 
          results={results} 
          isProcessing={isProcessing}
          fileCount={files.length}
          jobTitle={jobTitle}
          onBack={() => {
            setView("upload");
            setResults([]);
            setFiles([]);
          }} 
        />
      )}
      
      <Footer />
      
      <ConfirmDialog 
        open={confirmDialog.open}
        title="Failed to parse some files"
        message={
          <>
            <p>The following files could not be parsed:</p>
            <ul className="list-disc pl-5 mt-2 max-h-32 overflow-y-auto">
              {confirmDialog.failedFiles.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            <p className="mt-2">Do you want to continue evaluating the valid files?</p>
          </>
        }
        confirmLabel="Continue"
        cancelLabel="Cancel"
        onConfirm={() => confirmDialog.resolve && confirmDialog.resolve(true)}
        onCancel={() => confirmDialog.resolve && confirmDialog.resolve(false)}
      />
    </>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <HomeContent />
    </ToastProvider>
  );
}
