'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/context/ToastContext';
import { farmsApi } from '@/lib/api/farms';
import { Tractor, MapPin, Navigation, Layers, Droplets, ArrowLeft, Check } from 'lucide-react';

export default function CreateFarmPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    latitude: '',
    longitude: '',
    size_hectares: '',
    soil_type: 'Loam',
    irrigation_type: 'Drip',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Farm name is required';
    if (!formData.size_hectares || parseFloat(formData.size_hectares) <= 0) {
      newErrors.size_hectares = 'Area in hectares must be greater than 0';
    }
    if (formData.latitude && (parseFloat(formData.latitude) < -90 || parseFloat(formData.latitude) > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }
    if (formData.longitude && (parseFloat(formData.longitude) < -180 || parseFloat(formData.longitude) > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
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
        farm_name: formData.name.trim(),
        location: formData.location.trim() || 'Central Region',
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        area: parseFloat(formData.size_hectares) || 1.0,
        area_unit: 'hectares',
        soil_type: formData.soil_type || 'Loam',
      };

      await farmsApi.createFarm(payload);
      showSuccess(`Farm "${formData.name}" registered successfully!`);
      router.push('/farms');
    } catch (err) {
      const msg = err.message || 'Failed to create farm. Please verify backend fields.';
      setErrorMessage(msg);
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <PageHeader
          title="Register New Farm Field"
          subtitle="Add geographic coordinates, area in hectares, and soil parameters."
          icon={<Tractor className="w-6 h-6 text-emerald-400" />}
          breadcrumbs={['Dashboard', 'Farms', 'New Farm']}
          action={
            <Link href="/farms">
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Farms
              </Button>
            </Link>
          }
        />

        <Card glow className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Field Information</CardTitle>
            <CardDescription>Enter details matching your agricultural plot</CardDescription>
          </CardHeader>

          {errorMessage && (
            <Alert type="error" className="mb-4" onClose={() => setErrorMessage('')}>
              {errorMessage}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Farm Name"
              name="name"
              placeholder="e.g. Sunny Valley Plot 3"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              leftIcon={<Tractor className="w-4 h-4" />}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Location / District"
                name="location"
                placeholder="e.g. Northern Valley District"
                value={formData.location}
                onChange={handleChange}
                leftIcon={<MapPin className="w-4 h-4" />}
              />
              <Input
                label="Total Area (Hectares)"
                name="size_hectares"
                type="number"
                step="0.1"
                placeholder="e.g. 3.5"
                value={formData.size_hectares}
                onChange={handleChange}
                error={errors.size_hectares}
                leftIcon={<Layers className="w-4 h-4" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Latitude (Optional)"
                name="latitude"
                type="number"
                step="0.000001"
                placeholder="e.g. 36.778261"
                value={formData.latitude}
                onChange={handleChange}
                error={errors.latitude}
                leftIcon={<Navigation className="w-4 h-4" />}
              />
              <Input
                label="Longitude (Optional)"
                name="longitude"
                type="number"
                step="0.000001"
                placeholder="e.g. -119.417932"
                value={formData.longitude}
                onChange={handleChange}
                error={errors.longitude}
                leftIcon={<Navigation className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Soil Type"
                name="soil_type"
                value={formData.soil_type}
                onChange={handleChange}
                options={['Loam', 'Clay', 'Sandy', 'Silt', 'Peat', 'Chalky']}
              />
              <Select
                label="Irrigation System"
                name="irrigation_type"
                value={formData.irrigation_type}
                onChange={handleChange}
                options={['Drip', 'Sprinkler', 'Flood', 'Rainfed', 'Sub-irrigation']}
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <Link href="/farms">
                <Button variant="ghost" size="md">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" variant="primary" size="md" isLoading={isSubmitting} leftIcon={<Check className="w-4 h-4" />}>
                Save Farm Field
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
