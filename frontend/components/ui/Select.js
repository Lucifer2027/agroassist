import React, { forwardRef } from 'react';

export const Select = forwardRef(function Select(
  {
    label,
    options = [],
    error,
    helperText,
    className = '',
    id,
    required = false,
    placeholder = 'Select an option',
    ...props
  },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-slate-300 flex items-center gap-1">
          {label}
          {required && <span className="text-rose-400">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`glass-input w-full min-h-[44px] rounded-lg text-sm px-3.5 py-2.5 text-slate-100 bg-slate-900/90 appearance-none cursor-pointer ${
          error ? '!border-rose-500' : ''
        } ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled className="bg-slate-900 text-slate-400">
            {placeholder}
          </option>
        )}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val} className="bg-slate-900 text-slate-100">
              {lbl}
            </option>
          );
        })}
      </select>
      {error && <p className="text-xs text-rose-400 mt-0.5">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-400 mt-0.5">{helperText}</p>}
    </div>
  );
});

