'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { farmsApi } from '@/lib/api/farms';
import { analysisApi } from '@/lib/api/analysis';
import { reportsApi } from '@/lib/api/reports';
import {
  FileText,
  Download,
  Scan,
  User,
  Tractor,
  Sprout,
  Brain,
  ShieldAlert,
  CloudSun,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Printer,
  ShieldCheck,
} from 'lucide-react';

export default function ReportsPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedFarm, setSelectedFarm] = useState(null);

  const [scans, setScans] = useState([]);
  const [selectedScanId, setSelectedScanId] = useState('');
  const [selectedScan, setSelectedScan] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // PDF Generation Progress Stage
  const [pdfStage, setPdfStage] = useState('idle'); // 'idle', 'preparing', 'generating', 'downloading', 'completed', 'error'
  const [pdfMessage, setPdfMessage] = useState('');

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

  // Fetch scans for selected farm
  useEffect(() => {
    if (!selectedFarmId) return;
    async function loadScans() {
      setIsLoading(true);
      setError(null);

      const activeF = (Array.isArray(farms) ? farms : []).find((f) => String(f.id) === String(selectedFarmId));
      setSelectedFarm(activeF || null);

      try {
        const res = await analysisApi.getFarmAnalysisHistory(selectedFarmId, { limit: 10 });
        const list = Array.isArray(res.data?.items)
          ? res.data.items
          : Array.isArray(res.items)
          ? res.items
          : Array.isArray(res.data?.history)
          ? res.data.history
          : Array.isArray(res.history)
          ? res.history
          : Array.isArray(res.data)
          ? res.data
          : [];
        setScans(list);
        if (list.length > 0) {
          const firstScan = list[0];
          setSelectedScanId(firstScan.id || firstScan.analysis_id);
          setSelectedScan(firstScan);
        } else {
          setSelectedScanId('');
          setSelectedScan(null);
        }
      } catch (err) {
        setError(err.message || 'Failed to load scan history for PDF report generation.');
      } finally {
        setIsLoading(false);
      }
    }
    loadScans();
  }, [selectedFarmId, farms]);

  // Update selected scan object when dropdown changes
  const handleScanChange = (scanId) => {
    setSelectedScanId(scanId);
    const target = (Array.isArray(scans) ? scans : []).find((s) => String(s.id || s.analysis_id) === String(scanId));
    setSelectedScan(target || null);
  };

  // PDF Download Action with Real Stages
  const handleGeneratePdf = async () => {
    if (!selectedScanId) {
      showError('Please select a disease scan to generate a PDF report.');
      return;
    }

    setError(null);
    setPdfStage('preparing');
    setPdfMessage('Preparing report parameters...');

    const timer1 = setTimeout(() => {
      setPdfStage('generating');
      setPdfMessage('Generating agronomic PDF document on backend server...');
    }, 400);

    const timer2 = setTimeout(() => {
      setPdfStage('downloading');
      setPdfMessage('Downloading PDF report file to your browser...');
    }, 1000);

    try {
      await reportsApi.downloadAnalysisPdfReport(selectedScanId);
      setPdfStage('completed');
      showSuccess('AgroAssist Pro PDF Report generated and downloaded!');
    } catch (err) {
      setPdfStage('error');
      const msg = err.message || 'Failed to generate PDF report from server.';
      setError(msg);
      showError(msg);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setTimeout(() => {
        setPdfStage('idle');
      }, 3000);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <PageHeader
          title="Agronomic PDF Report Generator & Export Manager"
          subtitle="Generate official, downloadable PDF reports formatted for agricultural extension officers and insurance audits."
          icon={<FileText className="w-6 h-6 text-emerald-400" />}
          breadcrumbs={['Dashboard', 'PDF Reports']}
          action={
            <Button
              variant="primary"
              size="sm"
              isLoading={pdfStage === 'preparing' || pdfStage === 'generating' || pdfStage === 'downloading'}
              onClick={handleGeneratePdf}
              isDisabled={!selectedScanId}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Generate & Download PDF Report
            </Button>
          }
        />

        {/* 1. SELECTION BAR */}
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Select Farm Field"
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              options={(Array.isArray(farms) ? farms : []).map((f) => ({ value: f.id, label: `🌾 ${f.farm_name || f.name} (${f.location || 'Location'})` }))}
              placeholder="Choose Farm"
            />

            <Select
              label="Select Disease Scan Record"
              value={selectedScanId}
              onChange={(e) => handleScanChange(e.target.value)}
              options={(Array.isArray(scans) ? scans : []).map((s) => ({
                value: s.id || s.analysis_id,
                label: `🔬 ${s.disease_name || s.diagnosis || 'Scan'} (${new Date(s.created_at || Date.now()).toLocaleDateString()})`,
              }))}
              placeholder="Choose Scan Record"
            />
          </div>
        </Card>

        {/* 2. PROGRESS FEEDBACK STATE */}
        {(pdfStage === 'preparing' || pdfStage === 'generating' || pdfStage === 'downloading') && (
          <Card glow className="p-6 text-center space-y-3">
            <Spinner size="lg" className="text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-100">{pdfMessage}</h3>
            <p className="text-xs text-slate-400">Communicating with backend endpoint GET /api/reports/analysis/:id/pdf</p>
          </Card>
        )}

        {error && <ErrorState title="Report Generation Error" message={error} onRetry={handleGeneratePdf} />}

        {/* 3. REPORT PREVIEW DOCUMENT */}
        {isLoading ? (
          <Skeleton variant="card" height="400px" />
        ) : !selectedScanId ? (
          <EmptyState
            title="No Scan Records Selected"
            description="Select a farm field with executed disease scans to generate a downloadable PDF report."
            actionLabel="Execute Crop Scan"
            onAction={() => (window.location.href = '/analysis')}
          />
        ) : selectedScan ? (
          <Card glow className="p-6 sm:p-8 space-y-6 border-emerald-500/40 bg-slate-950/90 shadow-2xl">
            {/* Header Document Branding */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg border border-emerald-400/30">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">AgroAssist Pro Agronomic Audit Report</h2>
                  <p className="text-xs text-slate-400">Official Document ID: REP-{selectedScan.id || selectedScanId}</p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <Badge variant={selectedScan.severity === 'high' ? 'critical' : 'warning'} size="lg">
                  {(selectedScan.severity || 'high').toUpperCase()} SEVERITY
                </Badge>
                <p className="text-[11px] text-slate-400 mt-1">Generated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Document Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3 text-emerald-400" /> Farmer Name
                </span>
                <p className="font-bold text-slate-100 mt-0.5">{user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Farmer User'}</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Tractor className="w-3 h-3 text-teal-400" /> Farm Field
                </span>
                <p className="font-bold text-slate-100 mt-0.5">{selectedFarm?.farm_name || selectedFarm?.name || 'Farm'}</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Sprout className="w-3 h-3 text-sky-400" /> Crop Species
                </span>
                <p className="font-bold text-slate-100 mt-0.5">{selectedScan.crop_name || 'Crop'}</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> Scan Date
                </span>
                <p className="font-bold text-slate-100 mt-0.5">{new Date(selectedScan.created_at || Date.now()).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Pathogen & Diagnostic Summary */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[200px]">
                {selectedScan.image_url ? (
                  <img src={selectedScan.image_url} alt={selectedScan.disease_name} className="w-full h-full object-cover max-h-56" />
                ) : (
                  <div className="text-center p-4">
                    <Scan className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                    <span className="text-xs text-slate-400">Scanned Leaf Image Asset</span>
                  </div>
                )}
              </div>

              <div className="md:col-span-7 space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{selectedScan.disease_name || selectedScan.diagnosis || 'Healthy / Unidentified'}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Pathogen: {selectedScan.pathogen_type || 'Biological Pathogen'}</p>

                  <div className="grid grid-cols-2 gap-3 my-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400">AI Confidence</span>
                      <p className="text-base font-bold text-emerald-400">{selectedScan.confidence_score || selectedScan.confidenceScore || 0}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400">Risk Score</span>
                      <p className="text-base font-bold text-rose-400">{selectedScan.risk_score || selectedScan.riskScore || 0}/100</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                  <strong className="text-slate-200">Symptoms:</strong> {selectedScan.symptoms || selectedScan.symptom_description || 'Refer to diagnostic analysis details.'}
                </div>
              </div>
            </div>

            {/* Treatment & Prevention Guidance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 space-y-2">
                <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Curative Treatment Guidance
                </h4>
                <p className="leading-relaxed">
                  {selectedScan.treatment_summary || selectedScan.treatment || 'Refer to agronomist recommendations.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 space-y-2">
                <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Preventative Agronomy
                </h4>
                <p className="leading-relaxed">
                  {selectedScan.prevention_summary || selectedScan.prevention || 'Implement standard preventive crop rotation and sanitation.'}
                </p>
              </div>
            </div>

            {/* Document Action Footer */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                AgroAssist Pro AI Platform • Document generated automatically
              </span>

              <Button
                variant="primary"
                size="md"
                isLoading={pdfStage === 'preparing' || pdfStage === 'generating' || pdfStage === 'downloading'}
                onClick={handleGeneratePdf}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Download Official PDF Document
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
