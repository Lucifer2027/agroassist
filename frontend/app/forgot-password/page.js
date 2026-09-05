'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { authApi } from '@/lib/api/auth';
import { Sprout, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.forgotPassword({ email });
      setIsSubmitted(true);
    } catch (err) {
      // Show user-friendly response even if endpoint returns mock/error response
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="flex items-center justify-center min-h-[70vh] py-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 mb-1 shadow-lg">
              <Sprout className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Reset Password</h1>
            <p className="text-xs text-slate-400">Recover access to your AgroAssist Pro account</p>
          </div>

          <Card glow className="p-6">
            {!isSubmitted ? (
              <>
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-lg">Forgot Password?</CardTitle>
                  <CardDescription>Enter your account email to receive a password reset link.</CardDescription>
                </CardHeader>

                {errorMessage && (
                  <Alert type="error" className="mb-4" onClose={() => setErrorMessage('')}>
                    {errorMessage}
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="farmer@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftIcon={<Mail className="w-4 h-4" />}
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-2.5"
                    isLoading={isSubmitting}
                  >
                    Send Reset Password Instructions
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center space-y-4 py-4">
                <div className="p-3 w-fit mx-auto rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-100">Check Your Inbox</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If an account exists for <strong className="text-slate-200">{email}</strong>, we have sent instructions to reset your password.
                </p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}
