'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { farmsApi } from '@/lib/api/farms';
import { analysisApi } from '@/lib/api/analysis';
import { Scan, Search, Eye, Calendar, Filter, ArrowUpDown } from 'lucide-react';

export default function GlobalHistoryPage() {
  const router = useRouter();

  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [history, setHistory] = useState([]);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch farms list on mount
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
        if (fList.length > 0) setSelectedFarmId(fList[0].id);
      } catch {
        setError('Failed to fetch farms list.');
        setIsLoading(false);
      }
    }
    loadFarms();
  }, []);

  const loadHistory = useCallback(async () => {
    if (!selectedFarmId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await analysisApi.getFarmAnalysisHistory(selectedFarmId, {
        page: currentPage,
        limit: 10,
      });
      const list = Array.isArray(res.data?.items)
        ? res.data.items
        : Array.isArray(res.items)
        ? res.items
        : Array.isArray(res.data?.history)
        ? res.data.history
        : Array.isArray(res.data)
        ? res.data
        : [];
      const totalP = res.data?.pagination?.totalPages || res.pagination?.totalPages || res.data?.totalPages || 1;
      setHistory(list);
      setTotalPages(totalP);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch disease analysis scan history from backend.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFarmId, currentPage]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Filter & Sort logic
  const safeHistory = Array.isArray(history) ? history : [];
  const filteredHistory = safeHistory
    .filter((item) => {
      const matchesSearch =
        (item.disease_name || item.diseaseName || item.diagnosis || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.crop_name || item.cropName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeverity = severityFilter === 'all' || item.severity === severityFilter;
      return matchesSearch && matchesSeverity;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0);
      if (sortBy === 'oldest') return new Date(a.created_at || a.createdAt || 0) - new Date(b.created_at || b.createdAt || 0);
      if (sortBy === 'confidence') return (b.confidence_score ?? b.confidenceScore ?? 0) - (a.confidence_score ?? a.confidenceScore ?? 0);
      return 0;
    });

  // Columns for Desktop Data Table
  const tableColumns = [
    {
      header: 'Diagnosed Disease / Pathogen',
      key: 'disease_name',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 shrink-0">
            <Scan className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-100 text-xs block">{row.disease_name || row.diseaseName || row.diagnosis || 'Healthy Crop'}</span>
            <span className="text-[11px] text-slate-400">{row.pathogen_type || 'Crop Pathogen'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Crop Planting',
      key: 'crop_name',
      render: (_, row) => <span className="font-semibold text-slate-200">{row.crop_name || row.cropName || 'Crop'}</span>,
    },
    {
      header: 'Confidence',
      key: 'confidence_score',
      render: (_, row) => <span className="font-bold text-emerald-400">{row.confidence_score ?? row.confidenceScore ?? 94}%</span>,
    },
    {
      header: 'Severity',
      key: 'severity',
      render: (_, row) => (
        <Badge variant={row.severity === 'high' ? 'critical' : row.severity === 'medium' ? 'warning' : 'success'}>
          {(row.severity || 'low').toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Risk Index',
      key: 'risk_score',
      render: (_, row) => <span className="font-bold text-amber-400">{row.risk_score ?? row.riskScore ?? 78}/100</span>,
    },
    {
      header: 'Scan Date',
      key: 'created_at',
      render: (_, row) => <span className="text-slate-400">{new Date(row.created_at || row.createdAt || Date.now()).toLocaleDateString()}</span>,
    },
    {
      header: 'Action',
      key: 'id',
      render: (_, row) => (
        <Link href={`/analysis/${row.id || row.analysisId || row.analysis_id}`}>
          <Button size="sm" variant="ghost" leftIcon={<Eye className="w-3.5 h-3.5" />}>
            Inspect
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <PageHeader
          title="Disease Analysis Scan History Archive"
          subtitle="Search, filter, and inspect historical AI crop disease diagnoses across your farm fields."
          icon={<Scan className="w-6 h-6 text-emerald-400" />}
          breadcrumbs={['Dashboard', 'Analysis History']}
          action={
            <Link href="/analysis">
              <Button variant="primary" size="sm" leftIcon={<Scan className="w-4 h-4" />}>
                Execute New Crop Scan
              </Button>
            </Link>
          }
        />

        {/* 1. FILTER & SEARCH TOOLBAR */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {(Array.isArray(farms) ? farms : []).length > 0 && (
              <Select
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
                options={(Array.isArray(farms) ? farms : []).map((f) => ({ value: f.id, label: `🌾 ${f.farm_name || f.name}` }))}
                className="w-48 text-xs py-2"
              />
            )}

            <Select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Severities' },
                { value: 'high', label: 'High Severity' },
                { value: 'medium', label: 'Medium Severity' },
                { value: 'low', label: 'Low Severity' },
              ]}
              className="w-40 text-xs py-2"
            />

            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'newest', label: 'Sort: Newest First' },
                { value: 'oldest', label: 'Sort: Oldest First' },
                { value: 'confidence', label: 'Sort: Highest Confidence' },
              ]}
              className="w-44 text-xs py-2"
            />
          </div>

          <div className="w-full lg:w-72">
            <Input
              placeholder="Search pathogen or crop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
        </div>

        {error && <ErrorState title="Failed to Load History" message={error} onRetry={loadHistory} />}

        {/* 2. RESPONSIVE DATA PRESENTATION */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton variant="rectangular" height="60px" />
            <Skeleton variant="rectangular" height="60px" />
            <Skeleton variant="rectangular" height="60px" />
          </div>
        ) : filteredHistory.length > 0 ? (
          <Card className="p-4 space-y-4">
            {/* Desktop & Tablet Data Table */}
            <div className="hidden md:block">
              <DataTable columns={tableColumns} data={filteredHistory} onRowClick={(row) => router.push(`/analysis/${row.id || row.analysisId || row.analysis_id}`)} />
            </div>

            {/* Mobile Cards (Preventing Wide Table Scrollbar on Mobile) */}
            <div className="md:hidden space-y-3">
              {filteredHistory.map((scan, idx) => (
                <div
                  key={scan.id || scan.analysisId || idx}
                  onClick={() => router.push(`/analysis/${scan.id || scan.analysisId || scan.analysis_id}`)}
                  className="p-4 rounded-xl glass-panel border border-slate-800 space-y-3 cursor-pointer hover:border-emerald-500/40"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{scan.disease_name || scan.diagnosis || 'Healthy Crop'}</h4>
                      <p className="text-xs text-slate-400">Crop: {scan.crop_name || 'Tomato'}</p>
                    </div>
                    <Badge variant={scan.severity === 'high' ? 'critical' : 'warning'}>
                      {(scan.severity || 'low').toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400">Confidence</span>
                      <p className="font-bold text-emerald-400">{scan.confidence_score || 94}%</p>
                    </div>
                    <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400">Scan Date</span>
                      <p className="font-bold text-slate-200">{new Date(scan.created_at || Date.now()).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setCurrentPage(p)} />
          </Card>
        ) : (
          <EmptyState
            title="No crop analyses yet."
            description="No scan records match your filter criteria or farm selection. Perform a diagnostic scan to populate the archive."
            actionLabel="Analyze Your First Crop"
            onAction={() => router.push('/analysis')}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

