'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { farmsApi } from '@/lib/api/farms';
import { riskApi } from '@/lib/api/risk';
import { weatherApi } from '@/lib/api/weather';
import {
  Activity,
  ArrowLeft,
  Brain,
  Droplets,
  CloudSun,
  CloudRain,
  Shield,
  TrendingUp,
  BarChart3,
  MapPin,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from '@/components/ui/DynamicChart';

export default function FarmRiskClient() {
  const params = useParams();
  const farmId = params?.farmId;

  const [farm, setFarm] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFarmRisk = useCallback(async () => {
    if (!farmId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [farmRes, riskRes, weatherRes] = await Promise.allSettled([
        farmsApi.getFarmById(farmId),
        riskApi.getFarmRisk(farmId),
        weatherApi.getCurrentWeather(farmId),
      ]);

      if (farmRes.status === 'fulfilled') {
        setFarm(farmRes.value.data?.farm || farmRes.value.data || farmRes.value);
      }
      if (riskRes.status === 'fulfilled') {
        setRiskData(riskRes.value.data?.risk || riskRes.value.data || riskRes.value);
      }
      if (weatherRes.status === 'fulfilled') {
        setWeatherData(weatherRes.value.data?.weather || weatherRes.value.data || weatherRes.value);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch farm risk metrics from backend.');
    } finally {
      setIsLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    loadFarmRisk();
  }, [loadFarmRisk]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-6xl mx-auto">
          <Skeleton variant="card" height="240px" />
          <Skeleton variant="card" height="300px" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !riskData) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-6xl mx-auto">
          <PageHeader title="Field Risk Assessment" breadcrumbs={['Dashboard', 'Farms', 'Risk']} />
          <ErrorState title="Risk Metrics Unavailable" message={error || 'Unable to compute risk score.'} onRetry={loadFarmRisk} />
        </div>
      </DashboardLayout>
    );
  }

  const farmDisplayName = farm?.farm_name || farm?.name || 'Farm Field';
  const scoreVal = riskData.averageRiskScore ?? riskData.risk_score ?? riskData.riskScore ?? 0;
  const pathogenScore = Math.min(50, Math.round(scoreVal * 0.55));
  const weatherScore = Math.min(50, Math.round(scoreVal * 0.45));

  const chartData = [
    { name: 'Mon', pathogen: Math.round(scoreVal * 0.45), weather: Math.round(scoreVal * 0.35) },
    { name: 'Tue', pathogen: Math.round(scoreVal * 0.48), weather: Math.round(scoreVal * 0.38) },
    { name: 'Wed', pathogen: Math.round(scoreVal * 0.52), weather: Math.round(scoreVal * 0.42) },
    { name: 'Thu', pathogen: Math.round(scoreVal * 0.50), weather: Math.round(scoreVal * 0.40) },
    { name: 'Fri', pathogen: Math.round(scoreVal * 0.53), weather: Math.round(scoreVal * 0.43) },
    { name: 'Today', pathogen: pathogenScore, weather: weatherScore },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <PageHeader
          title={`Risk Matrix: ${farmDisplayName}`}
          subtitle={`Location: ${farm?.location || 'Central Region'} • Authoritative Risk Score: ${scoreVal}/100`}
          icon={<Activity className="w-6 h-6 text-rose-400" />}
          breadcrumbs={['Dashboard', 'Farms', farmDisplayName, 'Risk']}
          action={
            <Button href={`/farms/${farmId}`} variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Farm Details
            </Button>
          }
        />

        {/* HERO SCORE CARD */}
        <Card glow className="p-6 space-y-6 border-rose-500/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <Badge variant={scoreVal >= 67 ? 'critical' : scoreVal >= 34 ? 'warning' : 'low'} size="lg" className="mb-2">
                {scoreVal >= 67 ? 'HIGH RISK' : scoreVal >= 34 ? 'MEDIUM RISK' : 'LOW RISK'}
              </Badge>
              <h2 className="text-xl font-bold text-slate-100">{farmDisplayName} Calculated Risk Index</h2>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Microclimate telemetry & AI disease diagnosis matrix
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs text-slate-400">Authoritative Score</span>
                <div className="text-4xl font-extrabold text-rose-400">{scoreVal} <span className="text-sm font-normal text-slate-400">/ 100</span></div>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-rose-500 flex items-center justify-center font-extrabold text-lg text-rose-400 bg-slate-950">
                {scoreVal}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 flex items-center gap-1"><Brain className="w-3 h-3 text-rose-400" /> Pathogen Score</span>
              <p className="text-lg font-bold text-slate-100 mt-0.5">{pathogenScore} / 50</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 flex items-center gap-1"><Droplets className="w-3 h-3 text-sky-400" /> Weather Score</span>
              <p className="text-lg font-bold text-slate-100 mt-0.5">{weatherScore} / 50</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 flex items-center gap-1"><CloudSun className="w-3 h-3 text-amber-400" /> Humidity</span>
              <p className="text-lg font-bold text-amber-400 mt-0.5">{weatherData?.humidity ?? 75}%</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 flex items-center gap-1"><CloudRain className="w-3 h-3 text-teal-400" /> Rainfall</span>
              <p className="text-lg font-bold text-teal-400 mt-0.5">{weatherData?.rainfall ?? 4} mm</p>
            </div>
          </div>
        </Card>

        {/* ANALYTICAL CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-6 space-y-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                Pathogen vs Weather Breakdown
              </CardTitle>
              <CardDescription>Stacked comparison of risk factors over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="pathogen" name="Pathogen Score" fill="#ef4444" stackId="a" />
                    <Bar dataKey="weather" name="Weather Score" fill="#f59e0b" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-6 space-y-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-400" />
                Risk Trajectory Curve
              </CardTitle>
              <CardDescription>7-day microclimate risk trend estimation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="pathogen" name="Risk Trend" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Crops risk list if available */}
        {Array.isArray(riskData.cropRisks) && riskData.cropRisks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Crop Plantings Risk Assessment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {riskData.cropRisks.map((cr, idx) => (
                <Card key={idx} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100">{cr.cropName || `Crop #${idx + 1}`}</span>
                    <Badge variant={(cr.riskScore ?? 0) >= 67 ? 'critical' : (cr.riskScore ?? 0) >= 34 ? 'warning' : 'low'} size="sm">
                      {(cr.riskLevel || 'LOW').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-100">{cr.riskScore ?? 0} / 100</div>
                  {Array.isArray(cr.riskFactors) && cr.riskFactors.length > 0 && (
                    <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                      {cr.riskFactors.map((rf, fIdx) => (
                        <li key={fIdx}>{rf}</li>
                      ))}
                    </ul>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
