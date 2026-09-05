import React, { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    className = '',
    id,
    type = 'text',
    required = false,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-slate-300 flex items-center gap-1">
          {label}
          {required && <span className="text-rose-400">*</span>}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`glass-input w-full min-h-[44px] rounded-lg text-sm px-3.5 py-2.5 placeholder-slate-500 text-slate-100 ${
            leftIcon ? 'pl-10' : ''
          } ${rightIcon ? 'pr-10' : ''} ${
            error ? '!border-rose-500 focus:!ring-rose-500/20' : ''
          } ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-slate-400 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-rose-400 mt-0.5">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-400 mt-0.5">{helperText}</p>}
    </div>
  );
});

