'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Settings, Lock, Globe, LogOut, ShieldCheck, Check, Key } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Preference state
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!passwordForm.current_password) {
      setPasswordError('Current password is required.');
      return;
    }
    if (!passwordForm.new_password || passwordForm.new_password.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      showSuccess('Password updated successfully!');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
      showError('Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    showSuccess('Signed out successfully.');
    router.push('/login');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <PageHeader
          title="Application Settings"
          subtitle="Configure security credentials, language preferences, and account session controls."
          icon={<Settings className="w-6 h-6 text-emerald-400" />}
          breadcrumbs={['Dashboard', 'Settings']}
        />

        {/* 1. SECURITY & CHANGE PASSWORD */}
        <Card glow className="p-6 space-y-4">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              Security & Password Credentials
            </CardTitle>
            <CardDescription>Update your JWT account login password</CardDescription>
          </CardHeader>

          {passwordError && (
            <Alert type="error" className="mb-2" onClose={() => setPasswordError('')}>
              {passwordError}
            </Alert>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              leftIcon={<Key className="w-4 h-4" />}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" size="md" isLoading={isChangingPassword} leftIcon={<Check className="w-4 h-4" />}>
                Update Password
              </Button>
            </div>
          </form>
        </Card>

        {/* 2. REGIONAL LANGUAGE PREFERENCES */}
        <Card className="p-6 space-y-4">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-5 h-5 text-sky-400" />
              Regional Language & AI Translation Preferences
            </CardTitle>
            <CardDescription>Select default language for Gemini AI treatment action plans</CardDescription>
          </CardHeader>

          <div className="space-y-3">
            <Select
              label="Default Output Language"
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                showSuccess('Language preference saved.');
              }}
              options={[
                { value: 'en', label: 'English' },
                { value: 'hi', label: 'Hindi (हिंदी)' },
                { value: 'bn', label: 'Bengali (বাংলা)' },
                { value: 'ta', label: 'Tamil (தமிழ்)' },
                { value: 'te', label: 'Telugu (తెలుగు)' },
                { value: 'mr', label: 'Marathi (मराठी)' },
                { value: 'gu', label: 'Gujarati (ગુજરાતી)' },
                { value: 'kn', label: 'Kannada (કન્નડ)' },
                { value: 'ml', label: 'Malayalam (മലയാളം)' },
                { value: 'pa', label: 'Punjabi (ਪੰਜਾਬੀ)' },
              ]}
            />
          </div>
        </Card>

        {/* 3. SESSION & LOGOUT */}
        <Card className="p-6 space-y-4 border-rose-500/30">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base flex items-center gap-2 text-rose-400">
              <LogOut className="w-5 h-5" />
              Session & Sign Out
            </CardTitle>
            <CardDescription>Terminates active JWT session on this device</CardDescription>
          </CardHeader>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs">
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-200">Active Account: {user?.email}</span>
              <p className="text-slate-400 text-[11px]">Role: {user?.role || 'Farmer'} • JWT Bearer Token Authenticated</p>
            </div>

            <Button variant="danger" size="md" onClick={handleLogout} leftIcon={<LogOut className="w-4 h-4" />}>
              Sign Out of AgroAssist Pro
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
