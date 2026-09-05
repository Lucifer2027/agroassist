import React from 'react';

export function Skeleton({ className = '', variant = 'text', width, height }) {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'h-32 rounded-xl',
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      style={style}
      className={`animate-pulse bg-slate-800/80 border border-slate-700/30 ${variants[variant] || variants.text} ${className}`}
    />
  );
}
