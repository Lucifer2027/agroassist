import React, { forwardRef } from 'react';

export const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    helperText,
    rows = 4,
    className = '',
    id,
    required = false,
    ...props
  },
  ref
) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={textareaId} className="text-xs font-medium text-slate-300 flex items-center gap-1">
          {label}
          {required && <span className="text-rose-400">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`glass-input w-full rounded-lg text-sm p-3.5 placeholder-slate-500 text-slate-100 resize-y ${
          error ? '!border-rose-500' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-400 mt-0.5">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-400 mt-0.5">{helperText}</p>}
    </div>
  );
});
