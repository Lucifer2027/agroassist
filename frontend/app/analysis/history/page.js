'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
import { Pagination } from '@/components/ui/Pagination';
import { farmsApi } from '@/lib/api/farms';
import { analysisApi } from '@/lib/api/analysis';
import { Scan, Search, Eye, ArrowLeft, Calendar, Filter } from 'lucide-react';

export default function AnalysisHistoryPage() {
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
        if (fList.length > 0) setSelectedFarmId(fList[0].id);
      } catch {
        // Handled silently
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
      setError(err.response?.data?.message || err.message || 'Failed to load analysis scan history from backend.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFarmId, currentPage]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const safeHistory = Array.isArray(history) ? history : [];
  const filteredHistory = safeHistory.filter((item) => {
    const matchesSearch =
      (item.disease_name || item.diseaseName || item.diagnosis || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.crop_name || item.cropName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || item.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Disease Analysis Scan History"
          subtitle="Archive of all historical AI plant diagnostics and leaf lesion scans."
          icon={<Scan className="w-6 h-6 text-emerald-400" />}
          breadcrumbs={['Dashboard', 'AI Scanner', 'History']}
          action={
            <Link href="/analysis">
              <Button variant="primary" size="sm" leftIcon={<Scan className="w-4 h-4" />}>
                New Crop Scan
              </Button>
            </Link>
          }
        />

        {/* Filter Bar */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
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
          </div>

          <div className="w-full sm:w-72">
            <Input
              placeholder="Search by pathogen or crop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
        </div>

        {error && <ErrorState title="Failed to Load History" message={error} onRetry={loadHistory} />}

        {/* History Records List */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton variant="rectangular" height="60px" />
            <Skeleton variant="rectangular" height="60px" />
            <Skeleton variant="rectangular" height="60px" />
          </div>
        ) : filteredHistory.length > 0 ? (
          <Card className="p-4 space-y-3">
            <div className="divide-y divide-slate-800">
              {filteredHistory.map((scan, idx) => (
                <div key={scan.id || idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40 p-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 shrink-0">
                      <Scan className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        {scan.disease_name || scan.diagnosis || 'Healthy Crop'}
                        {scan.confidence_score && (
                          <span className="text-xs font-normal text-emerald-400">({scan.confidence_score}% conf.)</span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Crop: <strong className="text-slate-300">{scan.crop_name || 'Tomato'}</strong> • Date:{' '}
                        {new Date(scan.created_at || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={scan.severity === 'high' ? 'critical' : scan.severity === 'medium' ? 'warning' : 'success'}>
                      {(scan.severity || 'low').toUpperCase()}
                    </Badge>
                    <Link href={`/analysis/${scan.id || scan.analysis_id}`}>
                      <Button size="sm" variant="ghost" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                        Inspect
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setCurrentPage(p)} />
          </Card>
        ) : (
          <EmptyState
            title="No Disease Scans Found"
            description="No scan records match your selected farm or severity filter."
            actionLabel="Start New Scan"
            onAction={() => window.location.href = '/analysis'}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
