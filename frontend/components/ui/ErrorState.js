import React from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from './Button';

export function ErrorState({
  title = 'Failed to Load Data',
  message = 'An unexpected error occurred while fetching data from the server.',
  onRetry,
  fallbackHref = '/dashboard',
  fallbackLabel = 'Return to Dashboard',
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center glass-panel rounded-2xl border border-rose-950/40 bg-rose-950/10 my-4 ${className}`}>
      <div className="p-3.5 rounded-full bg-rose-950/40 border border-rose-900/50 mb-3">
        <AlertCircle className="w-8 h-8 text-rose-400" />
      </div>
      <h4 className="text-base font-semibold text-slate-100 mb-1">{title}</h4>
      <p className="text-xs text-rose-300/80 max-w-md mb-4 leading-relaxed">{message}</p>
      
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button size="sm" variant="secondary" onClick={onRetry} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Retry Request
          </Button>
        )}
        {fallbackHref && (
          <Link href={fallbackHref}>
            <Button size="sm" variant="outline" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              {fallbackLabel}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

