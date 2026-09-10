'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { farmsApi } from '@/lib/api/farms';
import { cropsApi } from '@/lib/api/crops';
import { Sprout, Plus, Eye, Edit, Trash2, Calendar, Scan, Tractor } from 'lucide-react';

export default function AllCropsPage() {
  const { showSuccess, showError } = useToast();

  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('all');
  const [cropsWithFarm, setCropsWithFarm] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [cropToDelete, setCropToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const farmsRes = await farmsApi.getFarms();
      const farmList = Array.isArray(farmsRes.data?.farms)
        ? farmsRes.data.farms
        : Array.isArray(farmsRes.data?.items)
        ? farmsRes.data.items
        : Array.isArray(farmsRes.farms)
        ? farmsRes.farms
        : Array.isArray(farmsRes.data)
        ? farmsRes.data
        : [];
      setFarms(farmList);

      if (farmList.length === 0) {
        setCropsWithFarm([]);
        setIsLoading(false);
        return;
      }

      // Fetch crops for all farms in parallel
      const cropPromises = farmList.map(async (f) => {
        try {
          const res = await farmsApi.getCropsByFarm(f.id);
          const list = Array.isArray(res.data?.crops)
            ? res.data.crops
            : Array.isArray(res.data?.items)
            ? res.data.items
            : Array.isArray(res.crops)
            ? res.crops
            : Array.isArray(res.data)
            ? res.data
            : [];
          return list.map((c) => ({
            ...c,
            farmId: f.id,
            farmName: f.farm_name || f.name || 'Unnamed Farm',
            farmLocation: f.location || '',
          }));
        } catch {
          return [];
        }
      });

      const cropsNested = await Promise.all(cropPromises);
      setCropsWithFarm(cropsNested.flat());
    } catch (err) {
      setError(err.message || 'Failed to load crops data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteConfirm = async () => {
    if (!cropToDelete) return;
    setIsDeleting(true);
    try {
      await cropsApi.deleteCrop(cropToDelete.id);
      showSuccess(`Crop "${cropToDelete.crop_name || cropToDelete.name}" removed successfully.`);
      setCropToDelete(null);
      loadData();
    } catch (err) {
      showError(err.message || 'Failed to delete crop.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCrops = selectedFarmId === 'all'
    ? cropsWithFarm
    : cropsWithFarm.filter((c) => String(c.farmId) === String(selectedFarmId));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="All Crops & Plantings"
          subtitle="Comprehensive inventory of active crops across all your registered farm holdings."
          icon={<Sprout className="w-6 h-6 text-emerald-400" />}
          breadcrumbs={['Dashboard', 'Crops']}
          action={
            farms.length > 0 ? (
              <Button
                href={`/farms/crops/new?farmId=${selectedFarmId !== 'all' ? selectedFarmId : farms[0].id}`}
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add New Crop
              </Button>
            ) : null
          }
        />

        {/* Filter Bar */}
        {farms.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Filter by Farm:</span>
              <select
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
                className="w-full sm:w-64 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="all">All Farms ({Array.isArray(farms) ? farms.length : 0})</option>
                {(Array.isArray(farms) ? farms : []).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.farm_name || f.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-slate-400">
              Showing <strong className="text-emerald-400">{filteredCrops.length}</strong> registered crop{filteredCrops.length === 1 ? '' : 's'}
            </span>
          </div>
        )}

        {error && <ErrorState title="Failed to Load Crops" message={error} onRetry={loadData} />}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton variant="card" height="220px" />
            <Skeleton variant="card" height="220px" />
            <Skeleton variant="card" height="220px" />
          </div>
        ) : farms.length === 0 ? (
          <EmptyState
            title="No Farms Found"
            description="You need to register a farm before you can add crops to your inventory."
            actionLabel="Register Farm"
            onAction={() => (window.location.href = '/farms/new')}
          />
        ) : filteredCrops.length === 0 ? (
          <EmptyState
            title="No Crops Found"
            description={
              selectedFarmId === 'all'
                ? 'No crops have been registered yet. Add your first crop to begin disease tracking.'
                : 'No crops found for this selected farm. Register a crop planting to monitor health.'
            }
            actionLabel="Add Crop"
            onAction={() =>
              (window.location.href = `/farms/crops/new?farmId=${selectedFarmId !== 'all' ? selectedFarmId : farms[0].id}`)
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCrops.map((crop) => {
              const displayName = crop.crop_name || crop.name || 'Unnamed Crop';
              const displayVariety = crop.crop_variety || crop.variety;
              const displayDate = crop.sowing_date || crop.plantedDate;
              const status = crop.status || 'growing';

              return (
                <Card key={crop.id} glow hover className="flex flex-col justify-between p-5 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                          <Sprout className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-100 text-base leading-snug">{displayName}</h3>
                          {displayVariety && (
                            <p className="text-xs text-slate-400 font-medium">Variety: {displayVariety}</p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={
                          status === 'healthy' || status === 'active' || status === 'growing'
                            ? 'success'
                            : status === 'harvested'
                            ? 'info'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs space-y-1.5">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Tractor className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span className="truncate">
                          Farm: <strong className="text-slate-200">{crop.farmName}</strong>
                        </span>
                      </div>
                      {displayDate && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Sown: {new Date(displayDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {crop.notes && (
                        <p className="text-slate-400 italic line-clamp-1">"{crop.notes}"</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Button href={`/crops/${crop.id}`} variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                        Details
                      </Button>
                      <Button href={`/crops/${crop.id}/edit`} variant="ghost" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />}>
                        Edit
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button href={`/analysis?farmId=${crop.farmId}&cropId=${crop.id}`} variant="primary" size="sm" leftIcon={<Scan className="w-3.5 h-3.5" />}>
                        Scan
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setCropToDelete(crop)}
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        title="Delete Crop"
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!cropToDelete}
          title="Confirm Crop Deletion"
          message={`Are you sure you want to delete crop "${cropToDelete?.crop_name || cropToDelete?.name}"? All associated scan records will remain in historical audit logs.`}
          confirmLabel="Delete Crop"
          variant="danger"
          isLoading={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setCropToDelete(null)}
        />
      </div>
    </DashboardLayout>
  );
}
