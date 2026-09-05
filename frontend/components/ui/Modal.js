'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  isOpen = false,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose?.();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${sizes[size] || sizes.md} glass-panel-glow rounded-2xl p-6 shadow-2xl z-10 animate-slide-up my-auto flex flex-col gap-5`}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 id="modal-title" className="text-lg font-semibold text-slate-100">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-100 transition-colors p-1.5 rounded-lg hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto max-h-[70vh] pr-1">{children}</div>

        {/* Modal Footer */}
        {footer && <div className="border-t border-slate-800 pt-4 flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

