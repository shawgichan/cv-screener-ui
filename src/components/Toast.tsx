import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';

type ToastType = 'info' | 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let toastId = 0;

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => {
          let icon = 'info';
          let colorClass = 'bg-primary text-white';
          if (t.type === 'error') {
            icon = 'error';
            colorClass = 'bg-rose-600 text-white';
          } else if (t.type === 'success') {
            icon = 'check_circle';
            colorClass = 'bg-emerald-600 text-white';
          }
          return (
            <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded shadow-lg animate-fade-in ${colorClass}`}>
              <span className="material-symbols-outlined">{icon}</span>
              <span className="text-sm font-medium">{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
