'use client';

import React from 'react';
import Link from 'next/link';
import { Sprout, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#070a12] text-slate-100">
      {/* Public Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/30 group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-slate-100">AgroAssist <span className="text-emerald-400">Pro</span></span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">AI Agricultural Intelligence</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" leftIcon={<LogIn className="w-4 h-4" />}>
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="sm" leftIcon={<UserPlus className="w-4 h-4" />}>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Public Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-slate-400">AgroAssist Pro Platform</span>
          </div>
          <p>© {new Date().getFullYear()} AgroAssist Pro. AI Agricultural Diagnostics & Analytics.</p>
        </div>
      </footer>
    </div>
  );
}
