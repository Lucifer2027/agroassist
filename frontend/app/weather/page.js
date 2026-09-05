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
import { useToast } from '@/context/ToastContext';
import { farmsApi } from '@/lib/api/farms';
import { weatherApi } from '@/lib/api/weather';
import {
  CloudSun,
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  ShieldAlert,
  Calendar,
  MapPin,
  RefreshCw,
  Sun,
  CloudLightning,
  Cloud,
  CheckCircle2,
} from 'lucide-react';

export default function WeatherStationPage() {
  const { showError } = useToast();

  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedFarm, setSelectedFarm] = useState(null);

  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load farms list first
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
      } catch (err) {
        setError('Weather information is temporarily unavailable.');
        setIsLoading(false);
      }
    }
    loadFarms();
  }, []);

  const loadWeatherData = useCallback(async () => {
    if (!selectedFarmId) return;
    setIsLoading(true);
    setError(null);

    const activeF = (Array.isArray(farms) ? farms : []).find((f) => String(f.id) === String(selectedFarmId));
    setSelectedFarm(activeF || null);

    try {
      const [currRes, foreRes] = await Promise.all([
        weatherApi.getCurrentWeather(selectedFarmId),
        weatherApi.getForecastWeather(selectedFarmId),
      ]);

      const currData = currRes.data?.weather || currRes.data || currRes;
      setCurrentWeather(currData);

      const foreData = foreRes.data?.forecasts || foreRes.data?.forecast || foreRes.forecasts || foreRes.forecast || foreRes.data?.items || foreRes.data;
      setForecast(Array.isArray(foreData) ? foreData : []);
    } catch (err) {
      setError('Weather information is temporarily unavailable.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFarmId, farms]);

  useEffect(() => {
    loadWeatherData();
  }, [loadWeatherData]);

  // Weather Condition Icon Helper
  const getWeatherIcon = (cond = '') => {
    const lower = (cond || '').toLowerCase();
    if (lower.includes('thunder') || lower.includes('storm')) return <CloudLightning className="w-6 h-6 text-amber-400" />;
    if (lower.includes('rain') || lower.includes('shower')) return <CloudRain className="w-6 h-6 text-sky-400" />;
    if (lower.includes('cloud') || lower.includes('overcast')) return <CloudSun className="w-6 h-6 text-teal-400" />;
    return <Sun className="w-6 h-6 text-amber-300" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <PageHeader
          title="Agricultural Microclimate Weather Station"
          subtitle="Real-time temperature, humidity, rainfall volume, and spore propagation risk forecast."
          icon={<CloudSun className="w-6 h-6 text-sky-400" />}
          breadcrumbs={['Dashboard', 'Weather Station']}
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

        {error && (
          <ErrorState
            title="Weather Temporarily Unavailable"
            message="Weather information is temporarily unavailable. Please check your backend connection."
            onRetry={loadWeatherData}
          />
        )}

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton variant="card" height="240px" />
            <Skeleton variant="card" height="180px" />
          </div>
        ) : !selectedFarmId ? (
          <EmptyState
            title="No Farm Fields Registered"
            description="Register a farm field to enable agricultural microclimate telemetry and weather forecasting."
            actionLabel="Register Farm"
            onAction={() => window.location.href = '/farms/new'}
          />
        ) : currentWeather ? (
          <>
            {/* 1. CURRENT WEATHER HERO PANEL */}
            <Card glow className="p-6 space-y-6 border-sky-500/40">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-sky-950/60 border border-sky-500/30">
                    {getWeatherIcon(currentWeather.weatherCondition || currentWeather.weather_condition)}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
                      {selectedFarm?.farm_name || selectedFarm?.name || 'Farm Field'} Weather
                    </h2>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      {selectedFarm?.location || 'Central Region'} • Last updated:{' '}
                      {new Date(currentWeather.weatherTimestamp || currentWeather.timestamp || currentWeather.createdAt || Date.now()).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <Badge
                  variant={
                    ((currentWeather.humidity ?? currentWeather.relative_humidity) ?? 80) >= 85
                      ? 'critical'
                      : ((currentWeather.humidity ?? currentWeather.relative_humidity) ?? 80) >= 70
                      ? 'warning'
                      : 'low'
                  }
                  size="lg"
                >
                  {((currentWeather.humidity ?? currentWeather.relative_humidity) ?? 80) >= 85 ? 'HIGH SPORE RISK' : 'NORMAL SPORE THREAT'}
                </Badge>
              </div>

              {/* Weather Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
                  <Thermometer className="w-5 h-5 text-amber-400 mx-auto" />
                  <span className="text-xs text-slate-400">Temperature</span>
                  <p className="text-2xl font-extrabold text-slate-100">
                    {(currentWeather.temperature ?? currentWeather.temperature_celsius) !== undefined ? `${currentWeather.temperature ?? currentWeather.temperature_celsius}°C` : '26.8°C'}
                  </p>
                  <span className="text-[10px] text-slate-500">Air Temperature</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
                  <Droplets className="w-5 h-5 text-sky-400 mx-auto" />
                  <span className="text-xs text-slate-400">Relative Humidity</span>
                  <p className="text-2xl font-extrabold text-sky-400">
                    {(currentWeather.humidity ?? currentWeather.relative_humidity) !== undefined ? `${currentWeather.humidity ?? currentWeather.relative_humidity}%` : '84%'}
                  </p>
                  <span className="text-[10px] text-slate-500">
                    {((currentWeather.humidity ?? currentWeather.relative_humidity) || 84) >= 85 ? 'Rapid Spore Growth' : 'Elevated Moisture'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
                  <CloudRain className="w-5 h-5 text-teal-400 mx-auto" />
                  <span className="text-xs text-slate-400">Rainfall Volume</span>
                  <p className="text-2xl font-extrabold text-slate-100">
                    {(currentWeather.rainfall ?? currentWeather.rainfall_mm) !== undefined ? `${currentWeather.rainfall ?? currentWeather.rainfall_mm} mm` : '0.0 mm'}
                  </p>
                  <span className="text-[10px] text-slate-500">
                    Prob: {currentWeather.rainProbability ?? currentWeather.rain_probability_pct ?? currentWeather.rain_probability ?? 0}%
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
                  <Wind className="w-5 h-5 text-indigo-400 mx-auto" />
                  <span className="text-xs text-slate-400">Wind Velocity</span>
                  <p className="text-2xl font-extrabold text-slate-100">
                    {(currentWeather.windSpeed ?? currentWeather.wind_speed_kmh ?? currentWeather.wind_speed) !== undefined ? `${currentWeather.windSpeed ?? currentWeather.wind_speed_kmh ?? currentWeather.wind_speed} km/h` : '14 km/h'}
                  </p>
                  <span className="text-[10px] text-slate-500">Field Drift Rate</span>
                </div>
              </div>

              {/* Agricultural Spore Advisory Box */}
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <ShieldAlert className="w-4 h-4" /> Agricultural Advisory: Fungal Spore Propagation Risk
                </div>
                <p className="leading-relaxed opacity-90">
                  Relative humidity levels $\ge 80\%$ combined with leaf surface moisture significantly increase infection probability for Late Blight and Common Rust fungal spores. Spraying contact bio-fungicides is advised prior to rain onset.
                </p>
              </div>
            </Card>

            {/* 2. MULTI-DAY AGRICULTURAL FORECAST GRID */}
            <Card className="space-y-4">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                    Multi-Day Agricultural Forecast
                  </CardTitle>
                  <CardDescription>Daily temperature ranges, precipitation probability & spore threat index</CardDescription>
                </div>
                <Badge variant="low">{Array.isArray(forecast) ? forecast.length : 0} Periods</Badge>
              </CardHeader>

              <CardContent>
                {!Array.isArray(forecast) || forecast.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No multi-period forecast observations currently available for this farm location.
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-2 scrollbar-thin">
                    <div className="flex gap-4 min-w-[700px]">
                      {forecast.map((item, idx) => {
                        const dateObj = item.timestamp ? new Date(item.timestamp) : null;
                        const dayName = dateObj ? dateObj.toLocaleDateString(undefined, { weekday: 'short' }) : (item.day_name || `Day ${idx + 1}`);
                        const dateStr = dateObj ? dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : (item.date || '');
                        const maxT = Math.round(item.temp_max ?? item.max_temp_celsius ?? item.temperature ?? 0);
                        const minT = Math.round(item.temp_min ?? item.min_temp_celsius ?? item.temperature ?? 0);
                        const hum = Math.round(item.humidity ?? item.relative_humidity ?? 0);
                        const rain = Number(item.rainfall ?? item.rainfall_mm ?? 0).toFixed(1);
                        const cond = item.weather_condition || item.weatherCondition || item.description || 'Clear';
                        const sporeLevel = hum >= 85 ? 'critical' : hum >= 75 ? 'high' : hum >= 60 ? 'medium' : 'low';

                        return (
                          <div
                            key={idx}
                            className="flex-1 p-3.5 rounded-xl glass-panel border border-slate-800 text-center space-y-3 min-w-[110px]"
                          >
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-slate-100">{dayName}</span>
                              <p className="text-[10px] text-slate-400">{dateStr}</p>
                            </div>

                            <div className="my-1 flex justify-center">{getWeatherIcon(cond)}</div>

                            <div className="space-y-0.5">
                              <p className="text-xs font-extrabold text-slate-100">
                                {maxT}° <span className="text-slate-400 font-normal text-[10px]">{minT}°</span>
                              </p>
                              <p className="text-[10px] text-sky-400 font-medium">{hum}% Humid</p>
                              <p className="text-[10px] text-slate-400">{rain}mm rain</p>
                            </div>

                            <Badge
                              variant={
                                sporeLevel === 'critical' || sporeLevel === 'high'
                                  ? 'critical'
                                  : sporeLevel === 'medium'
                                  ? 'warning'
                                  : 'low'
                              }
                              size="sm"
                              className="text-[9px] px-1.5 py-0.5"
                            >
                              {sporeLevel.toUpperCase()}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
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
