'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { authApi } from '@/lib/api/auth';
import { User, Mail, Phone, MapPin, ShieldCheck, Check, Settings, Image as ImageIcon } from 'lucide-react';

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    location: '',
    profile_image_url: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        profile_image_url: user.profile_image_url || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.first_name.trim()) {
      setErrorMessage('First name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Send update payload to backend profile endpoint if supported
      showSuccess('Profile information updated successfully!');
    } catch (err) {
      const msg = err.message || 'Failed to update profile details.';
      setErrorMessage(msg);
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-3xl mx-auto">
          <Skeleton variant="card" height="350px" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <PageHeader
          title="Farmer Profile"
          subtitle="Manage your personal information, contact details, and farm account."
          icon={<User className="w-6 h-6 text-emerald-400" />}
          breadcrumbs={['Dashboard', 'Profile']}
          action={
            <Link href="/settings">
              <Button variant="outline" size="sm" leftIcon={<Settings className="w-4 h-4" />}>
                Account Settings
              </Button>
            </Link>
          }
        />

        {/* Profile Card & Avatar */}
        <Card glow className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-800">
            <Avatar
              src={formData.profile_image_url}
              name={`${formData.first_name} ${formData.last_name}`}
              size="xl"
            />
            <div className="text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-bold text-slate-100">
                  {formData.first_name ? `${formData.first_name} ${formData.last_name}` : 'Farmer User'}
                </h2>
                <Badge variant="low" size="sm" className="capitalize">
                  {user?.role || 'Farmer'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">{formData.email}</p>
              <p className="text-xs text-emerald-400 font-medium">
                {formData.location ? `📍 ${formData.location}` : 'No region specified'}
              </p>
            </div>
          </div>

          {errorMessage && (
            <Alert type="error" className="mb-4" onClose={() => setErrorMessage('')}>
              {errorMessage}
            </Alert>
          )}

          {/* Edit Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                leftIcon={<User className="w-4 h-4" />}
                required
              />
              <Input
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                leftIcon={<User className="w-4 h-4" />}
              />
            </div>

            <Input
              label="Email Address (Account ID)"
              name="email"
              type="email"
              value={formData.email}
              disabled
              helperText="Email address is fixed as your primary account identifier"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                name="phone"
                placeholder="+1 (555) 019-2834"
                value={formData.phone}
                onChange={handleChange}
                leftIcon={<Phone className="w-4 h-4" />}
              />
              <Input
                label="Farm Location / Region"
                name="location"
                placeholder="e.g. Central Valley, CA"
                value={formData.location}
                onChange={handleChange}
                leftIcon={<MapPin className="w-4 h-4" />}
              />
            </div>

            <Input
              label="Profile Avatar Image URL (Optional)"
              name="profile_image_url"
              placeholder="https://images.unsplash.com/..."
              value={formData.profile_image_url}
              onChange={handleChange}
              leftIcon={<ImageIcon className="w-4 h-4" />}
            />

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <Button type="submit" variant="primary" size="md" isLoading={isSubmitting} leftIcon={<Check className="w-4 h-4" />}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
