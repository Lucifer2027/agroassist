'use client';

import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      bg: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100',
      icon: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    },
    error: {
      bg: 'bg-rose-950/90 border-rose-500/50 text-rose-100',
      icon: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-950/90 border-amber-500/50 text-amber-100',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    },
    info: {
      bg: 'bg-slate-900/90 border-slate-700 text-slate-100',
      icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
    },
  };

  const active = config[type] || config.info;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md text-sm animate-slide-up ${active.bg}`}
    >
      {active.icon}
      <span className="flex-1 font-medium text-xs">{message}</span>
      <button onClick={onClose} aria-label="Dismiss notification" className="p-1 text-slate-400 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
