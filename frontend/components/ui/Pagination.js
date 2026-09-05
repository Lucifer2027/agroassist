import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = '',
}) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between gap-3 pt-4 text-xs text-slate-400 ${className}`}>
      <span>
        Page <strong className="text-slate-200">{currentPage}</strong> of <strong className="text-slate-200">{totalPages}</strong>
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          isDisabled={currentPage <= 1}
          onClick={() => onPageChange?.(currentPage - 1)}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="secondary"
          isDisabled={currentPage >= totalPages}
          onClick={() => onPageChange?.(currentPage + 1)}
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
