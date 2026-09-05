import React from 'react';

export function PageHeader({
  title,
  subtitle,
  icon,
  action,
  breadcrumbs = [],
  className = '',
}) {
  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 mb-6 border-b border-slate-800/80 ${className}`}>
      <div className="flex flex-col gap-1">
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span>/</span>}
                <span className={idx === breadcrumbs.length - 1 ? 'text-emerald-400 font-medium' : 'hover:text-slate-200 cursor-pointer'}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-3">
          {icon && <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 shrink-0">{icon}</div>}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
}
