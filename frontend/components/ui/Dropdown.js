'use client';

import React, { useState, useRef, useEffect } from 'react';

export function Dropdown({ trigger, items = [], align = 'right', className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`absolute z-40 mt-2 w-48 rounded-xl glass-panel-glow py-1.5 shadow-2xl border border-slate-800 animate-fade-in ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${className}`}
        >
          {items.map((item, idx) => {
            if (item.type === 'divider') {
              return <div key={idx} className="my-1 border-t border-slate-800" role="separator" />;
            }
            return (
              <button
                key={idx}
                role="menuitem"
                onClick={() => {
                  item.onClick?.();
                  setIsOpen(false);
                }}
                disabled={item.disabled}
                className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 transition-colors focus:outline-none focus:bg-slate-800 ${
                  item.danger
                    ? 'text-rose-400 hover:bg-rose-950/40 hover:text-rose-300'
                    : 'text-slate-200 hover:bg-slate-800/80 hover:text-emerald-400'
                } ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {item.icon && <span className="w-4 h-4 shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
