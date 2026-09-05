'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';

export function Alert({
  type = 'info',
  title,
  children,
  onClose,
  className = '',
}) {
  const styles = {
    success: {
      container: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200',
      icon: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    },
    warning: {
      container: 'bg-amber-950/40 border-amber-500/40 text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    },
    error: {
      container: 'bg-rose-950/40 border-rose-500/40 text-rose-200',
      icon: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    },
    info: {
      container: 'bg-sky-950/40 border-sky-500/40 text-sky-200',
      icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
    },
  };

  const current = styles[type] || styles.info;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md text-sm ${current.container} ${className}`}
    >
      {current.icon}
      <div className="flex-1">
        {title && <h4 className="font-semibold text-slate-100 mb-0.5">{title}</h4>}
        <div className="text-xs opacity-90 leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss alert"
          className="p-1 rounded hover:bg-black/20 text-slate-400 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
