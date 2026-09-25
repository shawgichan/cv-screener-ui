import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-6 shadow-xl max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-on-surface mb-2">{title}</h2>
        <div className="text-sm text-on-surface-variant mb-6">{message}</div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
