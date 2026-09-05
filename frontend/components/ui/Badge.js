import React from 'react';

export function Badge({ children, variant = 'info', size = 'md', className = '' }) {
  const variants = {
    low: 'badge-low',
    success: 'badge-low',
    medium: 'badge-medium',
    warning: 'badge-medium',
    high: 'badge-high',
    critical: 'badge-critical',
    danger: 'badge-critical',
    info: 'badge-info',
    secondary: 'bg-slate-800 border border-slate-700 text-slate-300',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 rounded',
    md: 'text-xs px-2.5 py-1 rounded-md font-medium',
    lg: 'text-sm px-3 py-1 rounded-lg font-semibold',
  };

  return (
    <span className={`inline-flex items-center gap-1 shrink-0 ${variants[variant] || variants.info} ${sizes[size] || sizes.md} ${className}`}>
      {children}
    </span>
  );
}
