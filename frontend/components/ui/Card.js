import React from 'react';

export function Card({ children, className = '', glow = false, onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      className={`${glow ? 'glass-panel-glow' : 'glass-panel'} rounded-xl p-5 ${
        onClick
          ? 'cursor-pointer hover:border-emerald-500/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-950/20 active:translate-y-0 transition-all duration-200'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`flex flex-col gap-1 border-b border-slate-800/80 pb-3 mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`text-base font-semibold text-slate-100 ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }) {
  return <p className={`text-xs text-slate-400 ${className}`}>{children}</p>;
}

export function CardContent({ children, className = '' }) {
  return <div className={`flex-1 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`border-t border-slate-800/80 pt-3 mt-4 flex items-center justify-between ${className}`}>{children}</div>;
}

