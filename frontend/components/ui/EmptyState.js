import React from 'react';
import { Leaf } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  icon = <Leaf className="w-10 h-10 text-emerald-500/60" />,
  title = 'No Data Found',
  description = 'There are no items recorded in this section yet.',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center glass-panel rounded-2xl border border-slate-800/80 my-4 ${className}`}>
      <div className="p-4 rounded-full bg-slate-900/80 border border-slate-800 mb-3 shadow-inner">
        {icon}
      </div>
      <h4 className="text-base font-semibold text-slate-100 mb-1">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
