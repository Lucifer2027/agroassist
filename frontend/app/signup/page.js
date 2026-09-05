'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Sprout, User, Mail, Lock, Phone, MapPin, UserPlus, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { register, login } = useAuth();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    location: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-700' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'Strong', color: 'bg-sky-500' };
      case 4:
        return { score: 100, label: 'Excellent', color: 'bg-emerald-500' };
      default:
        return { score: 0, label: '', color: 'bg-slate-700' };
    }
  };

  const strength = getPasswordStrength(formData.password);

  const validate = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
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
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || null,
        location: formData.location || null,
      };

      await register(payload);
      showSuccess('Account created successfully!');
      
      // Auto sign-in after registration
      try {
        await login({ email: formData.email, password: formData.password });
        router.push('/dashboard');
      } catch {
        router.push('/login');
      }
    } catch (err) {
      const msg = err.message || 'Registration failed. Please check your information.';
      setErrorMessage(msg);
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="flex items-center justify-center py-8">
        <div className="w-full max-w-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 mb-1 shadow-lg">
              <Sprout className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Create Farmer Account</h1>
            <p className="text-xs text-slate-400">Join AgroAssist Pro to start AI crop diagnostics & risk scoring</p>
          </div>

          <Card glow className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg">Register Account</CardTitle>
              <CardDescription>Enter your farm and contact details</CardDescription>
            </CardHeader>

            {errorMessage && (
              <Alert type="error" className="mb-4" onClose={() => setErrorMessage('')}>
                {errorMessage}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="first_name"
                  placeholder="John"
                  value={formData.first_name}
                  onChange={handleChange}
                  error={errors.first_name}
                  leftIcon={<User className="w-4 h-4" />}
                  required
                />
                <Input
                  label="Last Name"
                  name="last_name"
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={handleChange}
                  error={errors.last_name}
                  leftIcon={<User className="w-4 h-4" />}
                  required
                />
              </div>

              <Input
                label="Email Address"
                name="email"
                type="email"
                placeholder="john.farmer@domain.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Input
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    leftIcon={<Lock className="w-4 h-4" />}
                    required
                  />
                  {formData.password && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${strength.color}`}
                          style={{ width: `${strength.score}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Strength: <strong className="text-slate-200">{strength.label}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <Input
                  label="Confirm Password"
                  name="confirm_password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  error={errors.confirm_password}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number (Optional)"
                  name="phone"
                  placeholder="+1 (555) 019-2834"
                  value={formData.phone}
                  onChange={handleChange}
                  leftIcon={<Phone className="w-4 h-4" />}
                />
                <Input
                  label="Farm Location / Region"
                  name="location"
                  placeholder="Central Valley, CA"
                  value={formData.location}
                  onChange={handleChange}
                  leftIcon={<MapPin className="w-4 h-4" />}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5 mt-2"
                isLoading={isSubmitting}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Create Farmer Account
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-400 font-semibold hover:underline">
                Sign In
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}
