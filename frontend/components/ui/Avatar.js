import React from 'react';

export function Avatar({ src, name = '', size = 'md', className = '' }) {
  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return str.substring(0, 2).toUpperCase();
  };

  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-semibold shadow-md overflow-hidden border border-emerald-400/30 ${sizes[size] || sizes.md} ${className}`}
    >
      {src ? (
        <img src={src} alt={name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
