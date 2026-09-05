'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setAuthToken } from '@/lib/api/client';
import { Spinner } from '@/components/ui/Spinner';
import { Sprout } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setAuthToken(token);
      window.location.href = '/dashboard';
    } else {
      router.push('/login');
    }
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 animate-pulse">
        <Sprout className="w-8 h-8" />
      </div>
      <Spinner size="md" className="text-emerald-400" />
      <p className="text-xs text-slate-400">Authenticating session... Redirecting to dashboard.</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-[#070a12] flex items-center justify-center">
      <Suspense fallback={<Spinner size="lg" className="text-emerald-400" />}>
        <AuthCallbackContent />
      </Suspense>
    </div>
  );
}
