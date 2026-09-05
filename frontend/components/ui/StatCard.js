import React from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendType = 'positive',
  glow = false,
  className = '',
}) {
  return (
    <Card glow={glow} className={`flex flex-col justify-between ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-400">{title}</span>
          <span className="text-2xl font-extrabold text-slate-100 tracking-tight">{value}</span>
        </div>
        {icon && (
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-emerald-400 shrink-0 shadow-inner">
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded text-[11px] ${
                trendType === 'positive'
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
              }`}
            >
              {trendType === 'positive' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend}
            </span>
          )}
          {subtitle && <span className="text-slate-400 truncate">{subtitle}</span>}
        </div>
      )}
    </Card>
  );
}
