import React from 'react';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

export function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  emptyState,
  onRowClick,
  className = '',
}) {
  if (isLoading) {
    return (
      <div className="w-full space-y-3 glass-panel p-4 rounded-xl">
        <Skeleton variant="rectangular" height="40px" />
        <Skeleton variant="rectangular" height="48px" />
        <Skeleton variant="rectangular" height="48px" />
        <Skeleton variant="rectangular" height="48px" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return emptyState || <EmptyState />;
  }

  return (
    <div className={`w-full overflow-x-auto glass-panel rounded-xl border border-slate-800/80 ${className}`}>
      <table className="w-full text-left text-xs text-slate-300 border-collapse">
        <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
          <tr>
            {columns.map((col, idx) => (
              <th key={col.key || idx} className={`p-3.5 whitespace-nowrap ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {data.map((row, rowIdx) => (
            <tr
              key={row.id || rowIdx}
              onClick={() => onRowClick?.(row)}
              className={`transition-colors ${
                onRowClick ? 'cursor-pointer hover:bg-slate-800/50' : 'hover:bg-slate-900/30'
              }`}
            >
              {columns.map((col, colIdx) => (
                <td key={col.key || colIdx} className={`p-3.5 align-middle ${col.className || ''}`}>
                  {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
