'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Sprout, Mail, Lock, Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showSuccess, showError } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState({});

  const rawRedirect = searchParams.get('redirect') || '/dashboard';
  // Sanitize to ensure internal relative path target only (prevents open redirect vulnerabilities)
  const redirectUrl = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/dashboard';

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [authLoading, isAuthenticated, router, redirectUrl]);

  const validate = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await login({ email, password });
      showSuccess('Signed in successfully! Redirecting...');
      router.push(redirectUrl);
    } catch (err) {
      const msg = err.message || 'Invalid credentials or login failed.';
      setErrorMessage(msg);
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = (role) => {
    if (role === 'farmer') {
      setEmail('farmer@agroassist.com');
      setPassword('FarmerSecret123!');
    } else if (role === 'admin') {
      setEmail('admin@agroassist.com');
      setPassword('AdminSecret123!');
    }
    setErrors({});
    setErrorMessage('');
  };

  return (
    <Card glow className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg">Sign In</CardTitle>
        <CardDescription>Enter your registered account credentials</CardDescription>
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
          error={errors.email}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <div className="space-y-1">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-200 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            required
          />
          <div className="flex justify-end pt-1">
            <Link href="/forgot-password" className="text-xs text-emerald-400 hover:underline">
              Forgot Password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-2.5 mt-2"
          isLoading={isSubmitting}
          leftIcon={<LogIn className="w-4 h-4" />}
        >
          Sign In to Dashboard
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Demo Accounts:</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="text-xs"
            onClick={() => fillDemoAccount('farmer')}
          >
            Farmer Account
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="text-xs"
            onClick={() => fillDemoAccount('admin')}
          >
            Admin Account
          </Button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-400">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-emerald-400 font-semibold hover:underline">
          Create Account
        </Link>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <PublicLayout>
      <div className="flex items-center justify-center min-h-[75vh] py-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 mb-1 shadow-lg">
              <Sprout className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Welcome Back</h1>
            <p className="text-xs text-slate-400">Access your AgroAssist Pro farm intelligence workspace</p>
          </div>

          <Suspense fallback={<div className="glass-panel p-8 text-center rounded-xl"><Spinner size="lg" className="text-emerald-400" /></div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </PublicLayout>
  );
}
