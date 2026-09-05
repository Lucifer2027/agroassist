'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { farmsApi } from '@/lib/api/farms';
import { riskApi } from '@/lib/api/risk';
import { analyticsApi } from '@/lib/api/analytics';
import {
  Activity,
  ShieldAlert,
  Brain,
  CloudSun,
  MapPin,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Scan,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from '@/components/ui/DynamicChart';

export default function RiskDashboardPage() {
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedFarm, setSelectedFarm] = useState(null);

  const [riskData, setRiskData] = useState(null);
  const [riskHistory, setRiskHistory] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch farms list
  useEffect(() => {
    async function loadFarms() {
      try {
        const res = await farmsApi.getFarms();
        const fList = Array.isArray(res.data?.farms)
          ? res.data.farms
          : Array.isArray(res.data?.items)
          ? res.data.items
          : Array.isArray(res.farms)
          ? res.farms
          : Array.isArray(res.data)
          ? res.data
          : [];
        setFarms(fList);
        if (fList.length > 0) {
          setSelectedFarmId(fList[0].id);
          setSelectedFarm(fList[0]);
        } else {
          setIsLoading(false);
        }
      } catch {
        setError('Failed to fetch farms list.');
        setIsLoading(false);
      }
    }
    loadFarms();
  }, []);

  const loadRiskData = useCallback(async () => {
    if (!selectedFarmId) return;
    setIsLoading(true);
    setError(null);

    const activeF = (Array.isArray(farms) ? farms : []).find((f) => String(f.id) === String(selectedFarmId));
    setSelectedFarm(activeF || null);

    try {
      const [riskRes, historyRes] = await Promise.allSettled([
        riskApi.getFarmRisk(selectedFarmId),
        analyticsApi.getRiskAnalytics(selectedFarmId),
      ]);

      if (riskRes.status === 'fulfilled') {
        const rObj = riskRes.value.data?.risk || riskRes.value.data || riskRes.value;
        setRiskData(rObj);
      }

      if (historyRes.status === 'fulfilled') {
        const hList = historyRes.value.data?.timeline || historyRes.value.timeline || historyRes.value.data?.items || historyRes.value.data || [];
        setRiskHistory(Array.isArray(hList) ? hList : []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch deterministic risk metrics from backend service.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFarmId, farms]);

  useEffect(() => {
    loadRiskData();
  }, [loadRiskData]);

  // Risk Level Category Helper strictly obeying 0-33, 34-66, 67-100 bounds
  const getRiskCategory = (score = 0) => {
    const val = typeof score === 'number' ? score : parseFloat(score) || 0;
    if (val >= 67) return { label: 'HIGH RISK', variant: 'critical', color: 'text-rose-400', bg: 'border-rose-500/40 bg-rose-950/20' };
    if (val >= 34) return { label: 'MEDIUM RISK', variant: 'warning', color: 'text-amber-400', bg: 'border-amber-500/40 bg-amber-950/20' };
    return { label: 'LOW RISK', variant: 'low', color: 'text-emerald-400', bg: 'border-emerald-500/40 bg-emerald-950/20' };
  };

  const riskScoreVal = riskData?.averageRiskScore ?? riskData?.risk_score ?? riskData?.riskScore ?? 0;
  const category = getRiskCategory(riskScoreVal);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <PageHeader
          title="Deterministic Crop Risk Matrix Engine"
          subtitle="Authoritative 0–100 risk scoring combining Gemini AI disease diagnosis and microclimate humidity/rainfall telemetry."
          icon={<Activity className="w-6 h-6 text-rose-400" />}
          breadcrumbs={['Dashboard', 'Risk Engine']}
          action={
            Array.isArray(farms) && farms.length > 0 && (
              <Select
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
                options={(Array.isArray(farms) ? farms : []).map((f) => ({ value: f.id, label: `🌾 ${f.farm_name || f.name} (${f.location || 'Central'})` }))}
                className="w-56 text-xs py-2"
              />
            )
          }
        />

        {error && <ErrorState title="Failed to Load Risk Metrics" message={error} onRetry={loadRiskData} />}

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton variant="card" height="240px" />
            <Skeleton variant="card" height="300px" />
          </div>
        ) : !selectedFarmId ? (
          <EmptyState
            title="No Farm Fields Registered"
            description="Register a farm field to enable deterministic crop risk scoring calculations."
            actionLabel="Register Farm"
            onAction={() => window.location.href = '/farms/new'}
          />
        ) : riskData ? (
          <>
            {/* 1. MASTER RISK SCORE HERO PANEL */}
            <Card glow className={`p-6 space-y-6 ${category.bg}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <Badge variant={category.variant} size="lg" className="mb-2">
                    {category.label}
                  </Badge>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
                    {selectedFarm?.farm_name || selectedFarm?.name || 'Farm Field'} Overall Risk Assessment
                  </h2>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    {selectedFarm?.location} • Backend Authoritative Calculation Engine
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Authoritative Risk Score</span>
                    <div className={`text-4xl font-extrabold tracking-tight ${category.color}`}>
                      {riskScoreVal} <span className="text-lg text-slate-400 font-normal">/ 100</span>
                    </div>
                  </div>
                  <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center font-extrabold text-xl shadow-xl shrink-0 ${category.color} border-current bg-slate-950/80`}>
                    {riskScoreVal}%
                  </div>
                </div>
              </div>

              {/* Status Details */}
              <div className="text-xs text-slate-300">
                <p>
                  Evaluated risk across {riskData.cropsCount ?? riskData.cropRisks?.length ?? 0} active crop plantings using microclimate humidity telemetry and vision diagnostic models.
                </p>
              </div>
            </Card>

            {/* 2. CROP LEVEL RISK BREAKDOWN IF AVAILABLE */}
            {Array.isArray(riskData.cropRisks) && riskData.cropRisks.length > 0 && (
              <Card className="space-y-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="w-5 h-5 text-emerald-400" />
                    Individual Crop Plantings Risk
                  </CardTitle>
                  <CardDescription>Deterministic score and explanatory factors per crop planting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {riskData.cropRisks.map((cr, idx) => {
                      const cScore = cr.riskScore ?? 0;
                      const cCat = getRiskCategory(cScore);
                      return (
                        <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-100">{cr.cropName || `Crop #${idx + 1}`}</span>
                            <Badge variant={cCat.variant} size="sm">{cCat.label}</Badge>
                          </div>
                          <div className="text-2xl font-extrabold text-slate-100">
                            {cScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
                          </div>
                          {Array.isArray(cr.riskFactors) && cr.riskFactors.length > 0 && (
                            <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                              {cr.riskFactors.map((rf, fIdx) => (
                                <li key={fIdx}>{rf}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 3. RISK EVOLUTION CHART */}
            <Card className="space-y-4">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    Risk Score Evolution History
                  </CardTitle>
                  <CardDescription>Historical deterministic risk score breakdown over time</CardDescription>
                </div>
                <Badge variant="low">Analytics View</Badge>
              </CardHeader>

              <CardContent>
                {!Array.isArray(riskHistory) || riskHistory.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No historical risk records recorded yet for this farm field.
                  </div>
                ) : (
                  <div className="h-64 sm:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={riskHistory}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Bar dataKey="pathogen_component" name="Pathogen Score" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="weather_component" name="Weather Score" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
