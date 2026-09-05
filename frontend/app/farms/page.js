'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/context/ToastContext';
import { farmsApi } from '@/lib/api/farms';
import {
  Tractor,
  Plus,
  Search,
  MapPin,
  Layers,
  Sprout,
  Eye,
  Edit,
  Trash2,
  Activity,
  Droplets,
  ArrowRight,
} from 'lucide-react';

export default function FarmsListPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [farms, setFarms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Confirm delete dialog state
  const [farmToDelete, setFarmToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFarms = useCallback(async (page = 1, search = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await farmsApi.getFarms({ page, limit: 9, search });
      const farmList = Array.isArray(res.data?.farms)
        ? res.data.farms
        : Array.isArray(res.data?.items)
        ? res.data.items
        : Array.isArray(res.farms)
        ? res.farms
        : Array.isArray(res.data)
        ? res.data
        : [];
      const totalP = res.data?.pagination?.totalPages || res.data?.totalPages || res.totalPages || 1;
      setFarms(farmList);
      setTotalPages(totalP);
    } catch (err) {
      setError(err.message || 'Failed to load farms list from server.');
      setFarms([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFarms(currentPage, searchQuery);
  }, [currentPage, searchQuery, fetchFarms]);

  const handleDeleteConfirm = async () => {
    if (!farmToDelete) return;
    setIsDeleting(true);
    try {
      await farmsApi.deleteFarm(farmToDelete.id);
      showSuccess(`Farm "${farmToDelete.farm_name || farmToDelete.name}" deleted successfully.`);
      setFarmToDelete(null);
      fetchFarms(currentPage, searchQuery);
    } catch (err) {
      showError(err.message || 'Failed to delete farm.');
    } finally {
      setIsDeleting(false);
    }
  };

  const farmArray = Array.isArray(farms) ? farms : [];
  const filteredFarms = farmArray.filter(
    (f) =>
      (f.farm_name || f.name)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.soil_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Farm Management"
          subtitle="Manage your agricultural fields, crop inventory, and field microclimates."
          icon={<Tractor className="w-6 h-6 text-emerald-400" />}
          breadcrumbs={['Dashboard', 'Farms']}
          action={
            <Link href="/farms/new">
              <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                Register New Farm
              </Button>
            </Link>
          }
        />

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-xl border border-slate-800">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by farm name, location, soil..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Total Fields Registered: <strong className="text-slate-200">{farmArray.length}</strong>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && <ErrorState title="Failed to load farms" message={error} onRetry={() => fetchFarms(currentPage, searchQuery)} />}

        {/* Farm Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton variant="card" height="220px" />
            <Skeleton variant="card" height="220px" />
            <Skeleton variant="card" height="220px" />
          </div>
        ) : filteredFarms.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFarms.map((farm) => (
                <Card key={farm.id} glow className="flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                          {farm.farm_name || farm.name}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          {farm.location || 'Location Not Specified'}
                        </p>
                      </div>
                      <Badge variant="low">
                        {farm.area || farm.size_hectares || 1.0} {farm.area_unit || 'Ha'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-amber-400" /> Soil Type
                        </span>
                        <p className="font-semibold text-slate-200 mt-0.5">{farm.soil_type || 'Loam'}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-sky-400" /> Area Unit
                        </span>
                        <p className="font-semibold text-slate-200 mt-0.5 capitalize">{farm.area_unit || 'Hectares'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <Link href={`/farms/${farm.id}`}>
                      <Button size="sm" variant="outline" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                        View Field
                      </Button>
                    </Link>

                    <div className="flex items-center gap-1">
                      <Link href={`/farms/${farm.id}/edit`}>
                        <Button size="sm" variant="ghost" className="p-1.5 text-slate-400 hover:text-slate-200">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
                        onClick={() => setFarmToDelete(farm)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setCurrentPage(p)} />
          </>
        ) : (
          <EmptyState
            title="No farms registered yet."
            description="You have not registered any farm fields yet. Add a farm to start tracking crops, disease diagnosis, and weather risk."
            actionLabel="Register Your First Farm"
            onAction={() => router.push('/farms/new')}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!farmToDelete}
          onClose={() => setFarmToDelete(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Farm Field"
          message={`Are you sure you want to delete farm "${farmToDelete?.farm_name || farmToDelete?.name}"? All associated crop scan records and history will be permanently deleted.`}
          confirmText="Delete Farm"
          isDanger
          isLoading={isDeleting}
        />
      </div>
    </DashboardLayout>
  );
}
