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
import { useToast } from '@/context/ToastContext';
import { farmsApi } from '@/lib/api/farms';
import { recommendationsApi } from '@/lib/api/recommendations';
import { analysisApi } from '@/lib/api/analysis';
import { reportsApi } from '@/lib/api/reports';
import {
  ShieldAlert,
  Brain,
  Sparkles,
  Copy,
  Check,
  FileText,
  CloudSun,
  Globe,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi (हिंदी)' },
  { value: 'pa', label: 'Punjabi (ਪੰਜਾਬੀ)' },
  { value: 'ta', label: 'Tamil (தமிழ்)' },
  { value: 'te', label: 'Telugu (తెలుగు)' },
  { value: 'bn', label: 'Bengali (বাংলা)' },
];

export default function RecommendationsPage() {
  const { showSuccess, showError } = useToast();

  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [scans, setScans] = useState([]);
  const [selectedScanId, setSelectedScanId] = useState('');

  const [recommendation, setRecommendation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Load farms list on mount
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
        setError('Failed to load farms selection.');
        setIsLoading(false);
      }
    }
    loadFarms();
  }, []);

  // Fetch scans for selected farm
  useEffect(() => {
    if (!selectedFarmId) return;
    async function loadScans() {
      try {
        const res = await analysisApi.getFarmAnalysisHistory(selectedFarmId, { limit: 10 });
        const list = Array.isArray(res.data?.items)
          ? res.data.items
          : Array.isArray(res.items)
          ? res.items
          : Array.isArray(res.data?.history)
          ? res.data.history
          : Array.isArray(res.data)
          ? res.data
          : [];
        setScans(list);
        if (list.length > 0) {
          setSelectedScanId(list[0].id || list[0].analysis_id);
        } else {
          setSelectedScanId('');
          setRecommendation(null);
          setIsLoading(false);
        }
      } catch {
        setScans([]);
        setRecommendation(null);
        setIsLoading(false);
      }
    }
    loadScans();
  }, [selectedFarmId]);

  // Load or Generate Recommendations from Backend
  const loadRecommendation = useCallback(async () => {
    if (!selectedScanId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // If language is English, attempt to load stored record first
      if (selectedLanguage === 'en') {
        const res = await recommendationsApi.getRecommendationsByAnalysisId(selectedScanId);
        const recObj = res.data?.recommendations || res.data?.recommendation || res.recommendations || res.data || res;
        if (Array.isArray(recObj) && recObj.length > 0) {
          setRecommendation(recObj);
          setIsLoading(false);
          return;
        }
      }

      // Generate localized AI recommendation via backend for selected language
      const activeScan = (Array.isArray(scans) ? scans : []).find(
        (s) => String(s.id || s.analysis_id || s.analysisId) === String(selectedScanId)
      );
      const targetFarmId = activeScan?.farm_id || activeScan?.farmId || selectedFarmId;
      let targetCropId = activeScan?.crop_id || activeScan?.cropId || activeScan?.crop?.cropId;

      if (!targetCropId && selectedScanId) {
        try {
          const scanRes = await analysisApi.getAnalysisById(selectedScanId);
          const scanData = scanRes.data?.analysis || scanRes.data || scanRes;
          targetCropId = scanData?.crop_id || scanData?.cropId;
        } catch {
          // ignore
        }
      }

      if (targetCropId) {
        const genRes = await recommendationsApi.generateRecommendations({
          farmId: targetFarmId,
          cropId: targetCropId,
          diseaseAnalysisId: selectedScanId,
          language: selectedLanguage,
        });
        const gObj = genRes.data?.recommendations || genRes.data?.recommendation || genRes.data || genRes;
        setRecommendation(gObj);
      } else {
        setRecommendation(null);
      }
    } catch (genErr) {
      setError(genErr.response?.data?.message || genErr.message || 'Failed to load recommendations.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedScanId, selectedFarmId, selectedLanguage, scans]);

  useEffect(() => {
    loadRecommendation();
  }, [loadRecommendation]);

  // Generate for selected language
  const handleLanguageChange = async (newLang) => {
    setSelectedLanguage(newLang);
    if (!selectedScanId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const activeScan = (Array.isArray(scans) ? scans : []).find(
        (s) => String(s.id || s.analysis_id || s.analysisId) === String(selectedScanId)
      );
      const targetFarmId = activeScan?.farm_id || activeScan?.farmId || selectedFarmId;
      let targetCropId = activeScan?.crop_id || activeScan?.cropId || activeScan?.crop?.cropId;

      if (!targetCropId && selectedScanId) {
        try {
          const scanRes = await analysisApi.getAnalysisById(selectedScanId);
          const scanData = scanRes.data?.analysis || scanRes.data || scanRes;
          targetCropId = scanData?.crop_id || scanData?.cropId;
        } catch {
          // ignore
        }
      }

      if (!targetCropId) {
        showError('No crop record associated with selected scan.');
        return;
      }

      const genRes = await recommendationsApi.generateRecommendations({
        farmId: targetFarmId,
        cropId: targetCropId,
        diseaseAnalysisId: selectedScanId,
        language: newLang,
      });
      const gObj = genRes.data?.recommendations || genRes.data?.recommendation || genRes.data || genRes;
      setRecommendation(gObj);
      const langName = languageOptions.find((l) => l.value === newLang)?.label || newLang;
      showSuccess(`Action plan translated to ${langName}`);
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Failed to generate recommendations in selected language.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy recommendation to clipboard
  const handleCopyRecommendation = () => {
    if (!recommendation) return;
    const actions = Array.isArray(recommendation)
      ? recommendation.map((r) => r.recommendation_text || r.text || '')
      : (recommendation.recommendations || recommendation.immediate_actions || []);

    const textToCopy = `AgroAssist Pro AI Treatment Plan\n\nImmediate Actions:\n${actions.join('\n')}\n\nAdhere strictly to local agricultural extension product label instructions.`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    showSuccess('Action plan copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  // PDF Report Download
  const handleDownloadPdf = async () => {
    if (!selectedScanId) return;
    setIsDownloadingPdf(true);
    try {
      await reportsApi.downloadAnalysisPdfReport(selectedScanId);
      showSuccess('PDF Report downloaded!');
    } catch (err) {
      showError(err.message || 'Failed to download report.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <PageHeader
          title="AI Agricultural Treatment & Action Recommendations"
          subtitle="Gemini AI-backed step-by-step biological treatments, preventative agronomy, and fungicide advice."
          icon={<ShieldAlert className="w-6 h-6 text-rose-400" />}
          breadcrumbs={['Dashboard', 'Recommendations']}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyRecommendation}
                leftIcon={copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              >
                {copied ? 'Copied' : 'Copy Action Plan'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isDownloadingPdf}
                onClick={handleDownloadPdf}
                leftIcon={<FileText className="w-4 h-4" />}
              >
                Generate PDF Report
              </Button>
            </div>
          }
        />

        {/* 1. SELECTION & LANGUAGE TOOLBAR */}
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Select Farm Field"
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              options={(Array.isArray(farms) ? farms : []).map((f, idx) => ({ value: f.id || `farm-${idx}`, label: `🌾 ${f.farm_name || f.name || 'Unnamed Farm'}` }))}
              placeholder="Choose Farm"
            />

            <Select
              label="Select Disease Scan"
              value={selectedScanId}
              onChange={(e) => setSelectedScanId(e.target.value)}
              options={(Array.isArray(scans) ? scans : []).map((s, idx) => ({
                value: s.id || s.analysis_id || `scan-${idx}`,
                label: `🔬 ${s.disease_name || s.diagnosis || 'Scan'} (${new Date(s.created_at || Date.now()).toLocaleDateString()})`,
              }))}
              placeholder="Choose Scan Record"
            />

            <Select
              label="AI Recommendation Language"
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              options={languageOptions}
            />
          </div>
        </Card>

        {/* Safety Disclaimer Banner */}
        <Alert type="warning" title="Agricultural Extension Label Compliance Notice">
          All chemical, fungicide, and bio-pesticide suggestions are general product recommendations. Farmers must strictly adhere to local agricultural extension authority guidelines and official product label instructions. Do not exceed recommended label dosage measurements.
        </Alert>

        {error && <ErrorState title="Failed to Load Recommendations" message={error} onRetry={loadRecommendation} />}

        {isLoading || isGenerating ? (
          <div className="space-y-6">
            <Skeleton variant="card" height="180px" />
            <Skeleton variant="card" height="180px" />
            <Skeleton variant="card" height="180px" />
          </div>
        ) : !selectedScanId ? (
          <EmptyState
            title="No Disease Scans Found"
            description="Execute an AI leaf scan to generate custom treatment and preventative action plans."
            actionLabel="Start Crop Scan"
            onAction={() => window.location.href = '/analysis'}
          />
        ) : recommendation ? (
          (() => {
            const immediateActions = Array.isArray(recommendation)
              ? recommendation.filter((r) => r.recommendation_type === 'action' || !r.recommendation_type).map((r) => r.recommendation_text || r.text)
              : (recommendation?.recommendations || recommendation?.immediate_actions || []);

            const treatmentSuggestions = Array.isArray(recommendation)
              ? recommendation.filter((r) => r.recommendation_type === 'treatment').map((r) => r.recommendation_text || r.text)
              : (recommendation?.treatmentSuggestions || recommendation?.treatment_suggestions || []);

            const preventionSteps = Array.isArray(recommendation)
              ? recommendation.filter((r) => r.recommendation_type === 'prevention').map((r) => r.recommendation_text || r.text)
              : (recommendation?.preventionSteps || recommendation?.prevention_steps || []);

            const timingSuggestions = Array.isArray(recommendation)
              ? recommendation.filter((r) => r.recommendation_type === 'timing').map((r) => r.recommendation_text || r.text)
              : (recommendation?.timingSuggestions || recommendation?.timing_suggestions || recommendation?.weather_considerations || []);

            return (
              <div className="space-y-6">
                {/* 1. IMMEDIATE ACTIONS (HIGH PRIORITY) */}
                {immediateActions.length > 0 && (
                  <Card glow className="p-6 space-y-4 border-rose-500/40 bg-rose-950/10">
                    <CardHeader className="p-0 pb-2 border-b border-slate-800 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-400">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">Immediate Intervention Actions</CardTitle>
                          <CardDescription>High-priority steps required within 24–48 hours</CardDescription>
                        </div>
                      </div>
                      <Badge variant="critical">HIGH PRIORITY</Badge>
                    </CardHeader>

                    <CardContent className="p-0 pt-2 space-y-2 text-xs">
                      {immediateActions.map((act, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{act}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* 2. TREATMENT GUIDANCE */}
                {treatmentSuggestions.length > 0 && (
                  <Card className="p-6 space-y-4">
                    <CardHeader className="p-0 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">Treatment & Fungicide Guidance</CardTitle>
                          <CardDescription>Curative biological & chemical product suggestions</CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-0 pt-2 space-y-2 text-xs">
                      {treatmentSuggestions.map((trt, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 leading-relaxed">
                          {trt}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* 3. PREVENTATIVE AGRONOMY & TIMING PANEL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Prevention Steps */}
                  <Card className="space-y-3">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Preventative Agronomic Practices
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      {preventionSteps.length > 0 ? (
                        preventionSteps.map((prev, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{prev}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 text-xs">Practice annual crop rotation and sanitization of garden shears.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Timing Considerations */}
                  <Card className="space-y-3">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CloudSun className="w-4 h-4 text-sky-400" />
                        Timing & Weather Considerations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      {timingSuggestions.length > 0 ? (
                        timingSuggestions.map((wth, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-sky-950/30 border border-sky-500/30 text-sky-200 leading-relaxed">
                            {wth}
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 text-xs">Avoid chemical applications directly before expected heavy rainfall to prevent runoff.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })()
        ) : null}
      </div>
    </DashboardLayout>
  );
}
