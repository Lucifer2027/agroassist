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
import { useAuth } from '@/context/AuthContext';
import { farmsApi } from '@/lib/api/farms';
import { analyticsApi } from '@/lib/api/analytics';
import {
  BarChart3,
  Database,
  TrendingUp,
  Activity,
  CloudSun,
  PieChart as PieIcon,
  Layers,
  MapPin,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from '@/components/ui/DynamicChart';

const COLORS = ['#ef4444', '#f59e0b', '#38bdf8', '#10b981', '#a855f7'];

export default function AnalyticsDashboardPage() {
  const { user } = useAuth();
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [timeWindow, setTimeWindow] = useState('30d');

  // Analytics data state
  const [farmMetrics, setFarmMetrics] = useState(null);
  const [diseaseTrends, setDiseaseTrends] = useState([]);
  const [riskEvolution, setRiskEvolution] = useState([]);
  const [weatherCorrelation, setWeatherCorrelation] = useState([]);
  const [adminSyncStatus, setAdminSyncStatus] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load farms list
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
        setError('Failed to load farms list.');
        setIsLoading(false);
      }
    }
    loadFarms();
  }, []);

  const loadAnalyticsData = useCallback(async () => {
    if (!selectedFarmId) return;
    setIsLoading(true);
    setError(null);

    const activeF = (Array.isArray(farms) ? farms : []).find((f) => String(f.id) === String(selectedFarmId));
    setSelectedFarm(activeF || null);

    try {
      const requests = [
        analyticsApi.getFarmAnalytics(selectedFarmId),
        analyticsApi.getDiseaseTrends(selectedFarmId),
        analyticsApi.getRiskAnalytics(selectedFarmId),
        analyticsApi.getWeatherCorrelation(selectedFarmId),
      ];

      if (user?.role === 'admin') {
        requests.push(analyticsApi.getAdminOverview());
      }

      const results = await Promise.allSettled(requests);
      const [farmRes, trendsRes, riskRes, corrRes, adminRes] = results;

      if (farmRes?.status === 'fulfilled') {
        setFarmMetrics(farmRes.value.data || farmRes.value);
      }
      if (trendsRes?.status === 'fulfilled') {
        const tr = trendsRes.value.data?.trends || trendsRes.value.trends || trendsRes.value.data?.items || trendsRes.value.data;
        setDiseaseTrends(Array.isArray(tr) ? tr : []);
      }
      if (riskRes?.status === 'fulfilled') {
        const rk = riskRes.value.data?.timeline || riskRes.value.timeline || riskRes.value.data?.items || riskRes.value.data;
        setRiskEvolution(Array.isArray(rk) ? rk : []);
      }
      if (corrRes?.status === 'fulfilled') {
        const cr = corrRes.value.data?.correlation || corrRes.value.correlation || corrRes.value.data?.items || corrRes.value.data;
        setWeatherCorrelation(Array.isArray(cr) ? cr : []);
      }
      if (adminRes?.status === 'fulfilled') {
        setAdminSyncStatus(adminRes.value.data || adminRes.value);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics warehouse data from backend server.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFarmId, farms, user]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const trendData = Array.isArray(diseaseTrends) ? diseaseTrends : [];
  const riskTimeline = Array.isArray(riskEvolution) ? riskEvolution : [];
  const diseaseDistribution = trendData.length > 0
    ? trendData.map((d) => ({
        name: d.disease_name || d.name || 'Disease',
        value: Number(d.total_occurrences || d.count || d.value || 1),
      }))
    : [];
  const correlationData = Array.isArray(weatherCorrelation) ? weatherCorrelation : [];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <PageHeader
          title="Dual-Database Analytics Data Warehouse Explorer"
          subtitle="Real-time MySQL operational metrics coupled with Snowflake OLAP analytical data warehouse insights."
          icon={<BarChart3 className="w-6 h-6 text-indigo-400" />}
          breadcrumbs={['Dashboard', 'Analytics Explorer']}
          action={
            Array.isArray(farms) && farms.length > 0 && (
              <div className="flex items-center gap-2">
                <Select
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  options={(Array.isArray(farms) ? farms : []).map((f) => ({ value: f.id, label: `🌾 ${f.farm_name || f.name} (${f.location || 'Central'})` }))}
                  className="w-48 text-xs py-2"
                />
                <Select
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(e.target.value)}
                  options={[
                    { value: '7d', label: '7 Days' },
                    { value: '30d', label: '30 Days' },
                    { value: '90d', label: '90 Days' },
                  ]}
                  className="w-32 text-xs py-2"
                />
              </div>
            )
          }
        />

        {/* Dual-Database Architecture Banner */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                Snowflake OLAP Analytical Warehouse Integration
                <Badge variant="low" size="sm">
                  Active Sync
                </Badge>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                MySQL operational transactions replicate asynchronously to Snowflake warehouse <code className="text-emerald-400">CORE</code> tables.
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-medium shrink-0">
            Warehouse Mode: <strong className="text-emerald-400">Snowflake CORE views</strong>
          </div>
        </div>

        {error && <ErrorState title="Failed to Load Analytics Warehouse" message={error} onRetry={loadAnalyticsData} />}

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton variant="card" height="300px" />
            <Skeleton variant="card" height="300px" />
          </div>
        ) : !selectedFarmId ? (
          <EmptyState
            title="No Farm Fields Registered"
            description="Register a farm field to populate Snowflake data warehouse analytics."
            actionLabel="Register Farm"
            onAction={() => (window.location.href = '/farms/new')}
          />
        ) : (
          <div className="space-y-6">
            {/* 1. DISEASE TRENDS & RISK EVOLUTION CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Disease Outbreak Trends Line/Area Chart */}
              <Card glow className="lg:col-span-7 space-y-4">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      Disease Outbreak Trends Over Time
                    </CardTitle>
                    <CardDescription>Snowflake OLAP aggregated vector count per period</CardDescription>
                  </div>
                  <Badge variant="low">Area Chart</Badge>
                </CardHeader>
                <CardContent>
                  {trendData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                      No disease outbreak trends recorded yet for this farm.
                    </div>
                  ) : (
                    <div className="h-64 sm:h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="blightGrad2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="rustGrad2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="period" stroke="#64748b" fontSize={12} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderColor: '#334155',
                              borderRadius: '12px',
                              color: '#f8fafc',
                              fontSize: '12px',
                            }}
                          />
                          <Area type="monotone" dataKey="blight" name="Late Blight" stroke="#ef4444" fillOpacity={1} fill="url(#blightGrad2)" strokeWidth={2} />
                          <Area type="monotone" dataKey="rust" name="Common Rust" stroke="#f59e0b" fillOpacity={1} fill="url(#rustGrad2)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Risk Evolution Line Chart */}
              <Card glow className="lg:col-span-5 space-y-4">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="w-5 h-5 text-rose-400" />
                      Risk Index Evolution
                    </CardTitle>
                    <CardDescription>0–100 deterministic risk trajectory</CardDescription>
                  </div>
                  <Badge variant="high">Risk Score</Badge>
                </CardHeader>
                <CardContent>
                  {riskTimeline.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                      No risk evolution history recorded yet for this farm.
                    </div>
                  ) : (
                    <div className="h-64 sm:h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={riskTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={12} tickLine={false} domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderColor: '#334155',
                              borderRadius: '12px',
                              color: '#f8fafc',
                              fontSize: '12px',
                            }}
                          />
                          <Line type="monotone" dataKey="total_risk" name="Risk Score" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 2. DISEASE DISTRIBUTION PIE & SEVERITY BAR CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Disease Distribution Pie Chart */}
              <Card className="lg:col-span-5 space-y-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieIcon className="w-5 h-5 text-sky-400" />
                    Pathogen Disease Share
                  </CardTitle>
                  <CardDescription>Percentage breakdown of diagnosed disease types</CardDescription>
                </CardHeader>
                <CardContent>
                  {diseaseDistribution.length === 0 ? (
                    <div className="h-60 flex items-center justify-center text-slate-400 text-xs">
                      No pathogen distribution data available.
                    </div>
                  ) : (
                    <>
                      <div className="h-60 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={diseaseDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                              {diseaseDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: '#334155',
                                borderRadius: '12px',
                                color: '#f8fafc',
                                fontSize: '12px',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-medium pt-2 border-t border-slate-800">
                        {diseaseDistribution.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span className="text-slate-300 truncate">
                              {item.name}: <strong className="text-slate-100">{item.value}%</strong>
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Weather vs Disease Correlation Bar Chart */}
              <Card className="lg:col-span-7 space-y-4">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CloudSun className="w-5 h-5 text-teal-400" />
                      Humidity vs Disease Correlation
                    </CardTitle>
                    <CardDescription>Scan volume correlation with field relative humidity ranges</CardDescription>
                  </div>
                  <Badge variant="info">Correlation Index</Badge>
                </CardHeader>
                <CardContent>
                  {correlationData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                      No weather-disease correlation data recorded yet for this farm.
                    </div>
                  ) : (
                    <div className="h-64 sm:h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={correlationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="humidity" stroke="#64748b" fontSize={12} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '12px',
                            color: '#f8fafc',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="scans" name="Positive Disease Scans" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
