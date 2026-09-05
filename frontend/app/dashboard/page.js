'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { farmsApi } from '@/lib/api/farms';
import { analysisApi } from '@/lib/api/analysis';
import { weatherApi } from '@/lib/api/weather';
import { riskApi } from '@/lib/api/risk';
import {
  Sprout,
  Tractor,
  Scan,
  Activity,
  ShieldAlert,
  CloudSun,
  Plus,
  ArrowRight,
  RefreshCw,
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  Calendar,
  FileText,
  ChevronRight,
  Eye,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  // State
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [crops, setCrops] = useState([]);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [weather, setWeather] = useState(null);
  const [riskData, setRiskData] = useState(null);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [isAddFarmOpen, setIsAddFarmOpen] = useState(false);
  const [isAddCropOpen, setIsAddCropOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Farm Form state
  const [farmForm, setFarmForm] = useState({
    name: '',
    location: '',
    size_hectares: '',
    soil_type: 'Loam',
    irrigation_type: 'Drip',
  });

  // New Crop Form state
  const [cropForm, setCropForm] = useState({
    name: '',
    crop_type: 'Tomato',
    variety: 'Roma',
    planting_date: new Date().toISOString().split('T')[0],
    acreage_hectares: '',
  });

  // Dynamic greeting based on current hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Fetch initial farms & dashboard data
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch user's farms
      const farmsRes = await farmsApi.getFarms();
      const farmsList = Array.isArray(farmsRes.data?.farms)
        ? farmsRes.data.farms
        : Array.isArray(farmsRes.data?.items)
        ? farmsRes.data.items
        : Array.isArray(farmsRes.farms)
        ? farmsRes.farms
        : Array.isArray(farmsRes.data)
        ? farmsRes.data
        : [];
      setFarms(farmsList);

      const activeFarm = farmsList.length > 0 ? farmsList[0] : null;
      setSelectedFarm(activeFarm);

      if (activeFarm) {
        // 2. Fetch farm crops, weather, risk, and analysis history concurrently
        const [cropsRes, historyRes, weatherRes, riskRes] = await Promise.allSettled([
          farmsApi.getCropsByFarm(activeFarm.id),
          analysisApi.getFarmAnalysisHistory(activeFarm.id, { limit: 5 }),
          weatherApi.getCurrentWeather(activeFarm.id),
          riskApi.getFarmRisk(activeFarm.id),
        ]);

        if (cropsRes.status === 'fulfilled') {
          const cList = Array.isArray(cropsRes.value.data?.crops)
            ? cropsRes.value.data.crops
            : Array.isArray(cropsRes.value.data?.items)
            ? cropsRes.value.data.items
            : Array.isArray(cropsRes.value.crops)
            ? cropsRes.value.crops
            : Array.isArray(cropsRes.value.data)
            ? cropsRes.value.data
            : [];
          setCrops(cList);
        } else {
          setCrops([]);
        }

        if (historyRes.status === 'fulfilled') {
          const aList = Array.isArray(historyRes.value.data?.items)
            ? historyRes.value.data.items
            : Array.isArray(historyRes.value.data?.history)
            ? historyRes.value.data.history
            : Array.isArray(historyRes.value.items)
            ? historyRes.value.items
            : Array.isArray(historyRes.value.data)
            ? historyRes.value.data
            : [];
          setRecentAnalyses(aList);
        } else {
          setRecentAnalyses([]);
        }

        if (weatherRes.status === 'fulfilled') {
          setWeather(weatherRes.value.data?.weather || weatherRes.value.data || weatherRes.value.weather || weatherRes.value || null);
        } else {
          setWeather(null);
        }

        if (riskRes.status === 'fulfilled') {
          setRiskData(riskRes.value.data?.risk || riskRes.value.data || riskRes.value.risk || riskRes.value || null);
        } else {
          setRiskData(null);
        }
      } else {
        setCrops([]);
        setRecentAnalyses([]);
        setWeather(null);
        setRiskData(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load farm dashboard information from backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle farm selection switch
  const handleFarmSwitch = async (farmId) => {
    const safeFarmsList = Array.isArray(farms) ? farms : [];
    const target = safeFarmsList.find((f) => String(f.id) === String(farmId));
    if (!target) return;
    setSelectedFarm(target);
    setIsLoading(true);

    try {
      const [cropsRes, historyRes, weatherRes, riskRes] = await Promise.allSettled([
        farmsApi.getCropsByFarm(target.id),
        analysisApi.getFarmAnalysisHistory(target.id, { limit: 5 }),
        weatherApi.getCurrentWeather(target.id),
        riskApi.getFarmRisk(target.id),
      ]);

      if (cropsRes.status === 'fulfilled') {
        const cList = Array.isArray(cropsRes.value.data?.crops)
          ? cropsRes.value.data.crops
          : Array.isArray(cropsRes.value.data?.items)
          ? cropsRes.value.data.items
          : Array.isArray(cropsRes.value.crops)
          ? cropsRes.value.crops
          : Array.isArray(cropsRes.value.data)
          ? cropsRes.value.data
          : [];
        setCrops(cList);
      } else {
        setCrops([]);
      }

      if (historyRes.status === 'fulfilled') {
        const aList = Array.isArray(historyRes.value.data?.items)
          ? historyRes.value.data.items
          : Array.isArray(historyRes.value.data?.history)
          ? historyRes.value.data.history
          : Array.isArray(historyRes.value.items)
          ? historyRes.value.items
          : Array.isArray(historyRes.value.data)
          ? historyRes.value.data
          : [];
        setRecentAnalyses(aList);
      } else {
        setRecentAnalyses([]);
      }

      if (weatherRes.status === 'fulfilled') {
        setWeather(weatherRes.value.data?.weather || weatherRes.value.data || weatherRes.value.weather || weatherRes.value || null);
      } else {
        setWeather(null);
      }

      if (riskRes.status === 'fulfilled') {
        setRiskData(riskRes.value.data?.risk || riskRes.value.data || riskRes.value.risk || riskRes.value || null);
      } else {
        setRiskData(null);
      }
    } catch (err) {
      showError(err.message || 'Failed to update farm metrics');
    } finally {
      setIsLoading(false);
    }
  };

  // Add Farm Submit
  const handleAddFarmSubmit = async (e) => {
    e.preventDefault();
    if (!farmForm.name.trim()) return;

    setIsSubmitting(true);
    try {
      await farmsApi.createFarm({
        farm_name: farmForm.name.trim(),
        location: farmForm.location.trim() || 'Default Region',
        area: parseFloat(farmForm.size_hectares) || 1.0,
        area_unit: 'hectares',
        soil_type: farmForm.soil_type || 'Loam',
      });

      showSuccess('Farm registered successfully!');
      setIsAddFarmOpen(false);
      setFarmForm({ name: '', location: '', size_hectares: '', soil_type: 'Loam', irrigation_type: 'Drip' });
      loadDashboardData();
    } catch (err) {
      showError(err.message || 'Failed to create farm');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Crop Submit
  const handleAddCropSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFarm || !cropForm.name.trim()) return;

    setIsSubmitting(true);
    try {
      await farmsApi.addCropToFarm(selectedFarm.id, {
        crop_name: cropForm.name.trim(),
        crop_variety: cropForm.variety.trim() || cropForm.crop_type || null,
        sowing_date: cropForm.planting_date ? new Date(cropForm.planting_date).toISOString() : null,
        status: 'active',
      });

      showSuccess('Crop registered under farm!');
      setIsAddCropOpen(false);
      setCropForm({ name: '', crop_type: 'Tomato', variety: 'Roma', planting_date: new Date().toISOString().split('T')[0], acreage_hectares: '' });
      // Refresh crops
      const cropsRes = await farmsApi.getCropsByFarm(selectedFarm.id);
      const cList = Array.isArray(cropsRes.data?.crops)
        ? cropsRes.data.crops
        : Array.isArray(cropsRes.data?.items)
        ? cropsRes.data.items
        : Array.isArray(cropsRes.crops)
        ? cropsRes.crops
        : Array.isArray(cropsRes.data)
        ? cropsRes.data
        : [];
      setCrops(cList);
    } catch (err) {
      showError(err.message || 'Failed to register crop');
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeFarms = Array.isArray(farms) ? farms : [];
  const safeCrops = Array.isArray(crops) ? crops : [];
  const safeAnalyses = Array.isArray(recentAnalyses) ? recentAnalyses : [];

  // Calculations for Stat Cards
  const highRiskCount = safeAnalyses.filter(
    (a) => a && (a.risk_level === 'high' || a.risk_level === 'critical' || a.severity === 'high' || a.risk === 'high' || a.risk === 'critical')
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Greeting & Farm Switcher Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="low" size="sm">
                Farmer Workspace
              </Badge>
              {selectedFarm && <span className="text-xs text-slate-400">Field: {selectedFarm.location}</span>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
              {getGreeting()}, <span className="text-emerald-400">{user?.first_name || 'Farmer'}</span> 👋
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Here is your real-time agricultural status overview.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {safeFarms.length > 0 && (
              <Select
                value={selectedFarm?.id || ''}
                onChange={(e) => handleFarmSwitch(e.target.value)}
                options={safeFarms.map((f) => ({ value: f.id, label: `🌾 ${f.farm_name || f.name} (${f.area || f.size_hectares || 1} ${f.area_unit || 'ha'})` }))}
                placeholder="Select Active Farm"
                className="w-48 text-xs py-2"
              />
            )}
            <Button size="sm" variant="outline" onClick={() => setIsAddFarmOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Add Farm
            </Button>
            <Button size="sm" variant="primary" onClick={() => router.push('/analysis')} leftIcon={<Scan className="w-4 h-4" />}>
              Analyze Crop
            </Button>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && <ErrorState title="Dashboard Synchronization Warning" message={error} onRetry={loadDashboardData} />}

        {/* 1. STAT CARDS GRID */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton variant="card" />
            <Skeleton variant="card" />
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Farms"
              value={safeFarms.length}
              subtitle={selectedFarm ? `Active: ${selectedFarm.farm_name || selectedFarm.name}` : 'No farms registered'}
              icon={<Tractor className="w-5 h-5 text-emerald-400" />}
            />
            <StatCard
              title="Registered Crops"
              value={safeCrops.length}
              subtitle={`${safeCrops.filter((c) => c && (c.status === 'active' || !c.status)).length} active plantings`}
              icon={<Sprout className="w-5 h-5 text-teal-400" />}
            />
            <StatCard
              title="AI Scans Executed"
              value={safeAnalyses.length}
              subtitle="Total leaf diagnoses"
              icon={<Scan className="w-5 h-5 text-sky-400" />}
            />
            <StatCard
              title="High Risk Alerts"
              value={highRiskCount}
              subtitle={highRiskCount > 0 ? 'Requires immediate action' : 'Optimal crop condition'}
              icon={<ShieldAlert className="w-5 h-5 text-rose-400" />}
              trend={highRiskCount > 0 ? 'ALERT' : 'NORMAL'}
              trendType={highRiskCount > 0 ? 'negative' : 'positive'}
            />
          </div>
        )}

        {/* 2. WEATHER & RISK DOUBLE PANEL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Current Weather Card */}
          <Card className="lg:col-span-6 space-y-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CloudSun className="w-5 h-5 text-sky-400" />
                  <CardTitle>Current Microclimate Weather</CardTitle>
                </div>
                <Badge variant="info">Live Weather Service</Badge>
              </div>
              <CardDescription>
                {selectedFarm ? `Location: ${selectedFarm.farm_name || selectedFarm.name} (${selectedFarm.location || 'Local'})` : 'Select a farm to view live weather'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {isLoading ? (
                <Skeleton variant="card" />
              ) : weather ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                      <Thermometer className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400">Temperature</span>
                      <p className="text-base sm:text-lg font-bold text-slate-100">
                        {weather.temperature !== undefined && weather.temperature !== null ? `${weather.temperature}°C` : weather.temperature_celsius ? `${weather.temperature_celsius}°C` : '--'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                      <Droplets className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400">Humidity</span>
                      <p className="text-base sm:text-lg font-bold text-sky-400">
                        {weather.humidity !== undefined && weather.humidity !== null ? `${weather.humidity}%` : weather.relative_humidity ? `${weather.relative_humidity}%` : '--'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                      <CloudRain className="w-4 h-4 text-teal-400 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400">Rainfall</span>
                      <p className="text-base sm:text-lg font-bold text-slate-100">
                        {weather.rainfall !== undefined && weather.rainfall !== null ? `${weather.rainfall} mm` : weather.rainfall_mm !== undefined ? `${weather.rainfall_mm} mm` : '0 mm'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between">
                    <span className="text-slate-400">Condition & Wind:</span>
                    <span className="font-semibold text-slate-200 capitalize">
                      {weather.weatherCondition || weather.weather_condition || 'Normal'} • {weather.windSpeed ?? weather.wind_speed_kmh ?? '--'} km/h
                    </span>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="No Weather Data"
                  description="Register a farm with coordinates to fetch real-time agricultural weather observations."
                  actionLabel="Add Farm"
                  onAction={() => setIsAddFarmOpen(true)}
                />
              )}
            </CardContent>
          </Card>

          {/* Farm Deterministic Risk Assessment */}
          <Card glow className="lg:col-span-6 space-y-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-rose-400" />
                  <CardTitle>Deterministic Risk Index</CardTitle>
                </div>
                <Badge variant={riskData?.overallRiskLevel || riskData?.riskLevel || riskData?.risk_level || 'low'}>
                  {(riskData?.overallRiskLevel || riskData?.riskLevel || riskData?.risk_level || 'Low Threat').toUpperCase()}
                </Badge>
              </div>
              <CardDescription>Pathogen base severity + Microclimate environmental vulnerability</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {isLoading ? (
                <Skeleton variant="card" />
              ) : riskData ? (
                <>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div>
                      <span className="text-xs text-slate-400">Computed Overall Risk Score</span>
                      <div className="text-3xl sm:text-4xl font-extrabold text-rose-400 tracking-tight mt-1">
                        {riskData.averageRiskScore ?? riskData.riskScore ?? riskData.risk_score ?? 0} / 100
                      </div>
                      <span className="text-[11px] text-slate-300 font-medium capitalize">
                        Level: {riskData.overallRiskLevel || riskData.riskLevel || riskData.risk_level || 'Low'} Threat
                      </span>
                    </div>
                    <div className="w-16 h-16 rounded-full border-4 border-rose-500/40 flex items-center justify-center bg-rose-950/30 text-rose-400 font-bold text-base shadow-lg shrink-0">
                      {riskData.averageRiskScore ?? riskData.riskScore ?? riskData.risk_score ?? 0}%
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Pathogen Component (Max 50 pts)</span>
                      <span className="font-semibold text-slate-200">
                        {riskData.cropRisks?.[0]?.riskFactors?.pathogen?.finalPathogenScore ?? riskData.pathogen_score ?? Math.min(25, Math.round((riskData.averageRiskScore ?? riskData.riskScore ?? 0) * 0.5))} pts
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full"
                        style={{
                          width: `${((riskData.cropRisks?.[0]?.riskFactors?.pathogen?.finalPathogenScore ?? riskData.pathogen_score ?? Math.min(25, Math.round((riskData.averageRiskScore ?? riskData.riskScore ?? 0) * 0.5))) / 50) * 100}%`
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-slate-400 pt-1">
                      <span>Weather Moisture Component (Max 50 pts)</span>
                      <span className="font-semibold text-slate-200">
                        {riskData.cropRisks?.[0]?.riskFactors?.weather?.finalWeatherScore ?? riskData.weather_score ?? Math.min(25, Math.round((riskData.averageRiskScore ?? riskData.riskScore ?? 0) * 0.5))} pts
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full"
                        style={{
                          width: `${((riskData.cropRisks?.[0]?.riskFactors?.weather?.finalWeatherScore ?? riskData.weather_score ?? Math.min(25, Math.round((riskData.averageRiskScore ?? riskData.riskScore ?? 0) * 0.5))) / 50) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState title="No Risk Metrics" description="Execute a crop scan to initialize deterministic risk engine metrics." />
              )}
            </CardContent>
          </Card>
        </div>

        {/* 3. QUICK ACTIONS BAR */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-200">Quick Actions:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="primary" onClick={() => router.push('/analysis')} leftIcon={<Scan className="w-3.5 h-3.5" />}>
              Analyze Crop
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setIsAddFarmOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Farm
            </Button>
            <Button
              size="sm"
              variant="secondary"
              isDisabled={!selectedFarm}
              onClick={() => setIsAddCropOpen(true)}
              leftIcon={<Sprout className="w-3.5 h-3.5" />}
            >
              Add Crop
            </Button>
            <Button size="sm" variant="outline" onClick={() => router.push('/analysis/history')} leftIcon={<Calendar className="w-3.5 h-3.5" />}>
              View History
            </Button>
            <Button size="sm" variant="outline" onClick={() => router.push('/reports')} leftIcon={<FileText className="w-3.5 h-3.5" />}>
              Generate Report
            </Button>
          </div>
        </div>

        {/* 4. RECENT ANALYSES FEED */}
        <Card className="space-y-4">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Disease Diagnoses</CardTitle>
              <CardDescription>Latest leaf scans executed across your registered crops</CardDescription>
            </div>
            <Link href="/analysis/history">
              <Button size="sm" variant="ghost" rightIcon={<ChevronRight className="w-4 h-4" />}>
                View All Scans
              </Button>
            </Link>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton variant="rectangular" height="48px" />
                <Skeleton variant="rectangular" height="48px" />
                <Skeleton variant="rectangular" height="48px" />
              </div>
            ) : safeAnalyses.length > 0 ? (
              <div className="divide-y divide-slate-800/80">
                {safeAnalyses.map((scan, idx) => (
                  <div key={scan.id || scan.analysisId || idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40 p-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 shrink-0">
                        <Scan className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                          {scan.disease || scan.diseaseName || scan.disease_name || scan.diagnosis || 'Healthy Crop'}
                          {(scan.confidence || scan.confidence_score) && (
                            <span className="text-[10px] font-normal text-emerald-400">({scan.confidence || scan.confidence_score}% conf.)</span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Crop: <strong className="text-slate-300">{scan.crop?.cropName || scan.cropName || scan.crop_name || 'Crop'}</strong> • Scanned on{' '}
                          {new Date(scan.date || scan.created_at || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={scan.severity === 'high' ? 'critical' : scan.severity === 'medium' ? 'warning' : 'success'}>
                        {(scan.severity || 'low').toUpperCase()}
                      </Badge>
                      <Link href={`/analysis/${scan.analysisId || scan.id || scan.analysis_id}`}>
                        <Button size="sm" variant="ghost" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                          Inspect
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No crop analyses yet."
                description="Upload a leaf photo to trigger your first AI plant disease analysis."
                actionLabel="Analyze Your First Crop"
                onAction={() => router.push('/analysis')}
              />
            )}
          </CardContent>
        </Card>

        {/* MODAL 1: ADD FARM */}
        <Modal
          isOpen={isAddFarmOpen}
          onClose={() => setIsAddFarmOpen(false)}
          title="Register New Farm Field"
          subtitle="Add operational farm parameters to track risk and weather microclimate."
        >
          <form onSubmit={handleAddFarmSubmit} className="space-y-4 py-2">
            <Input
              label="Farm Name"
              placeholder="e.g. Green Valley Sector 4"
              value={farmForm.name}
              onChange={(e) => setFarmForm({ ...farmForm, name: e.target.value })}
              required
            />
            <Input
              label="Location / Coordinates"
              placeholder="e.g. Central District, Region 2"
              value={farmForm.location}
              onChange={(e) => setFarmForm({ ...farmForm, location: e.target.value })}
            />
            <Input
              label="Size (Hectares)"
              type="number"
              step="0.1"
              placeholder="2.5"
              value={farmForm.size_hectares}
              onChange={(e) => setFarmForm({ ...farmForm, size_hectares: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Soil Type"
                value={farmForm.soil_type}
                onChange={(e) => setFarmForm({ ...farmForm, soil_type: e.target.value })}
                options={['Loam', 'Clay', 'Sandy', 'Silt', 'Peat', 'Chalky']}
              />
              <Select
                label="Irrigation System"
                value={farmForm.irrigation_type}
                onChange={(e) => setFarmForm({ ...farmForm, irrigation_type: e.target.value })}
                options={['Drip', 'Sprinkler', 'Flood', 'Rainfed', 'Sub-irrigation']}
              />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsAddFarmOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save Farm Field
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL 2: ADD CROP */}
        <Modal
          isOpen={isAddCropOpen}
          onClose={() => setIsAddCropOpen(false)}
          title={`Register Crop under ${selectedFarm?.farm_name || selectedFarm?.name || 'Farm'}`}
          subtitle="Add crop variety and planting date to monitor disease vulnerability."
        >
          <form onSubmit={handleAddCropSubmit} className="space-y-4 py-2">
            <Input
              label="Crop Identifier Name"
              placeholder="e.g. Field A Tomatoes"
              value={cropForm.name}
              onChange={(e) => setCropForm({ ...cropForm, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Crop Type"
                value={cropForm.crop_type}
                onChange={(e) => setCropForm({ ...cropForm, crop_type: e.target.value })}
                options={['Tomato', 'Maize', 'Apple', 'Wheat', 'Potato', 'Grape', 'Rice', 'Soybean', 'Cotton']}
              />
              <Input
                label="Variety / Hybrid"
                placeholder="e.g. Roma VF"
                value={cropForm.variety}
                onChange={(e) => setCropForm({ ...cropForm, variety: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Planting Date"
                type="date"
                value={cropForm.planting_date}
                onChange={(e) => setCropForm({ ...cropForm, planting_date: e.target.value })}
                required
              />
              <Input
                label="Acreage (Hectares)"
                type="number"
                step="0.1"
                placeholder="1.0"
                value={cropForm.acreage_hectares}
                onChange={(e) => setCropForm({ ...cropForm, acreage_hectares: e.target.value })}
              />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsAddCropOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Register Crop
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
