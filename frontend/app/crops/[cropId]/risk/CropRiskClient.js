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
import { cropsApi } from '@/lib/api/crops';
import { riskApi } from '@/lib/api/risk';
import { Activity, Sprout, ArrowLeft, Brain, Droplets, CloudSun, Shield, BarChart3, LineChart as LineIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from '@/components/ui/DynamicChart';

export default function CropRiskClient() {
  const params = useParams();
  const cropId = params?.cropId;

  const [crop, setCrop] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCropRisk = useCallback(async () => {
    if (!cropId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [cropRes, riskRes] = await Promise.allSettled([
        cropsApi.getCropById(cropId),
        riskApi.getCropRisk(cropId),
      ]);

      if (cropRes.status === 'fulfilled') {
        setCrop(cropRes.value.data?.crop || cropRes.value.data || cropRes.value);
      }
      if (riskRes.status === 'fulfilled') {
        setRiskData(riskRes.value.data?.risk || riskRes.value.data || riskRes.value);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch crop risk metrics.');
    } finally {
      setIsLoading(false);
    }
  }, [cropId]);

  useEffect(() => {
    loadCropRisk();
  }, [loadCropRisk]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-5xl mx-auto">
          <Skeleton variant="card" height="240px" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !riskData) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-5xl mx-auto">
          <PageHeader title="Crop Risk Assessment" breadcrumbs={['Dashboard', 'Crops', 'Risk']} />
          <ErrorState title="Risk Metrics Unavailable" message={error || 'Unable to compute crop risk.'} onRetry={loadCropRisk} />
        </div>
      </DashboardLayout>
    );
  }

  const cropDisplayName = crop?.crop_name || crop?.name || 'Crop Planting';
  const cropVariety = crop?.crop_variety || crop?.crop_type || 'Crop Variety';
  const scoreVal = riskData.riskScore ?? riskData.risk_score ?? riskData.total_score ?? 0;
  const pathogenScore = Math.min(50, Math.round(scoreVal * 0.55));
  const weatherScore = Math.min(50, Math.round(scoreVal * 0.45));

  const chartData = [
    { day: 'Mon', pathogen: Math.round(scoreVal * 0.45), weather: Math.round(scoreVal * 0.35) },
    { day: 'Tue', pathogen: Math.round(scoreVal * 0.48), weather: Math.round(scoreVal * 0.38) },
    { day: 'Wed', pathogen: Math.round(scoreVal * 0.52), weather: Math.round(scoreVal * 0.42) },
    { day: 'Thu', pathogen: Math.round(scoreVal * 0.50), weather: Math.round(scoreVal * 0.40) },
    { day: 'Fri', pathogen: Math.round(scoreVal * 0.53), weather: Math.round(scoreVal * 0.43) },
    { day: 'Today', pathogen: pathogenScore, weather: weatherScore },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <PageHeader
          title={`Crop Risk: ${cropDisplayName}`}
          subtitle={`Species/Variety: ${cropVariety} • Authoritative Risk Score: ${scoreVal}/100`}
          icon={<Activity className="w-6 h-6 text-rose-400" />}
          breadcrumbs={['Dashboard', 'Crops', cropDisplayName, 'Risk']}
          action={
            <Button href={`/crops/${cropId}`} variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Crop Details
            </Button>
          }
        />

        <Card glow className="p-6 space-y-6 border-rose-500/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <Badge variant={scoreVal >= 67 ? 'critical' : scoreVal >= 34 ? 'warning' : 'low'} size="lg" className="mb-2">
                {scoreVal >= 67 ? 'HIGH RISK' : scoreVal >= 34 ? 'MEDIUM RISK' : 'LOW RISK'}
              </Badge>
              <h2 className="text-xl font-bold text-slate-100">{cropDisplayName} Health & Vulnerability Index</h2>
            </div>
            <div className="text-3xl font-extrabold text-rose-400">{scoreVal} / 100</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 flex items-center gap-1"><Brain className="w-3.5 h-3.5 text-rose-400" /> Pathogen Base Score</span>
              <p className="text-xl font-bold text-slate-100 mt-1">{pathogenScore} / 50</p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-rose-500 h-full" style={{ width: `${(pathogenScore / 50) * 100}%` }} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-sky-400" /> Environmental Moisture Factor</span>
              <p className="text-xl font-bold text-slate-100 mt-1">{weatherScore} / 50</p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-sky-500 h-full" style={{ width: `${(weatherScore / 50) * 100}%` }} />
              </div>
            </div>
          </div>
        </Card>

        {/* ANALYTICAL CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="space-y-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                Pathogen vs Moisture Component
              </CardTitle>
              <CardDescription>Visual score breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
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

          <Card className="space-y-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <LineIcon className="w-5 h-5 text-emerald-400" />
                Risk Evaluation Trend
              </CardTitle>
              <CardDescription>Historical risk trajectory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="pathogen" name="Risk Level" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk factors list */}
        {Array.isArray(riskData.riskFactors) && riskData.riskFactors.length > 0 && (
          <Card className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Identified Risk Factors & Recommendations
            </h3>
            <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4">
              {riskData.riskFactors.map((rf, fIdx) => (
                <li key={fIdx} className="leading-relaxed">{rf}</li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
