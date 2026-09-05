'use client';

import React from 'react';
import Link from 'next/link';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import {
  Sprout,
  Scan,
  CloudSun,
  Activity,
  ShieldAlert,
  Tractor,
  BarChart3,
  FileText,
  Upload,
  Cloud,
  Brain,
  Zap,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  Droplets,
  Thermometer,
  Wind,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const mockTrendData = [
  { month: 'Jan', blight: 12, rust: 8, scab: 5 },
  { month: 'Feb', blight: 19, rust: 12, scab: 7 },
  { month: 'Mar', blight: 15, rust: 22, scab: 10 },
  { month: 'Apr', blight: 32, rust: 18, scab: 14 },
  { month: 'May', blight: 45, rust: 25, scab: 20 },
  { month: 'Jun', blight: 28, rust: 30, scab: 15 },
  { month: 'Jul', blight: 14, rust: 16, scab: 8 },
];

export default function LandingPage() {
  return (
    <PublicLayout>
      <div className="space-y-24 py-6">
        {/* 1. HERO SECTION */}
        <section className="relative pt-6 pb-12 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
            <Badge variant="low" size="lg" className="mx-auto animate-pulse-slow py-1.5 px-4 shadow-lg shadow-emerald-950/40">
              <Sprout className="w-4 h-4 text-emerald-400" />
              Next-Generation Agricultural AI
            </Badge>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-100 leading-tight">
              AI-Powered Crop Health & <br className="hidden sm:block" />
              <span className="gradient-text-emerald">Agricultural Intelligence</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Detect crop diseases instantly with Gemini vision AI, assess environmental microclimate risk in real-time, and protect smallholder harvests with expert recommendations.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link href="/analysis">
                <Button size="lg" variant="primary" rightIcon={<Scan className="w-5 h-5" />}>
                  Analyze Your Crop
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="secondary" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Quick trust badges */}
            <div className="pt-6 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 98% AI Vision Precision
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Deterministic Risk Matrix
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Snowflake Warehouse OLAP
              </span>
            </div>
          </div>
        </section>

        {/* 2. HOW IT WORKS (6-STEP PIPELINE) */}
        <section className="space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <Badge variant="info" size="md" className="mx-auto">
              Workflow Engine
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">How AgroAssist Pro Works</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              An end-to-end 6-stage agricultural intelligence pipeline from field scan to expert treatment action plan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {[
              { step: '01', title: 'Upload Image', desc: 'Capture leaf or plant photo on mobile or desktop.', icon: Upload, color: 'text-emerald-400' },
              { step: '02', title: 'Cloudinary Optimization', desc: 'Secure cloud image processing and metadata registration.', icon: Cloud, color: 'text-sky-400' },
              { step: '03', title: 'AI Disease Detection', desc: 'Gemini vision diagnoses pathogen & severity score.', icon: Brain, color: 'text-amber-400' },
              { step: '04', title: 'Weather Intelligence', desc: 'Live relative humidity, rain & temp observations.', icon: CloudSun, color: 'text-teal-400' },
              { step: '05', title: 'Risk Analysis', desc: '0–100 deterministic risk engine calculation.', icon: Activity, color: 'text-rose-400' },
              { step: '06', title: 'Action Plan', desc: 'Step-by-step biological & chemical treatments.', icon: ShieldAlert, color: 'text-emerald-400' },
            ].map((st, idx) => {
              const Icon = st.icon;
              return (
                <div key={idx} className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3 relative group hover:border-emerald-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider">STEP {st.step}</span>
                    <Icon className={`w-5 h-5 ${st.color}`} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-slate-200">{st.title}</h3>
                    <p className="text-[11px] text-slate-400 leading-normal">{st.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. CORE FEATURES (7 CARDS) */}
        <section className="space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <Badge variant="low" size="md" className="mx-auto">
              Platform Features
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">Comprehensive Agricultural Suite</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Built specifically to empower smallholder farmers with enterprise-grade agtech tooling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'AI Disease Detection',
                desc: 'Upload leaf lesions to detect fungal, bacterial, or viral pathogens with confidence scoring.',
                icon: Scan,
                color: 'text-emerald-400',
                border: 'hover:border-emerald-500/40',
              },
              {
                title: 'Weather Intelligence',
                desc: 'Real-time relative humidity, rainfall volume, and temperature extreme forecasting.',
                icon: CloudSun,
                color: 'text-sky-400',
                border: 'hover:border-sky-500/40',
              },
              {
                title: 'Crop Risk Engine',
                desc: 'Deterministic scoring matrix (0–100) factoring pathogen severity and microclimate moisture.',
                icon: Activity,
                color: 'text-amber-400',
                border: 'hover:border-amber-500/40',
              },
              {
                title: 'AI Recommendations',
                desc: 'Targeted biological treatments, organic solutions, and extension label fungicide dosage advice.',
                icon: ShieldAlert,
                color: 'text-rose-400',
                border: 'hover:border-rose-500/40',
              },
              {
                title: 'Farm Management',
                desc: 'Organize multiple fields, monitor acreage in hectares, soil types, and crop planting history.',
                icon: Tractor,
                color: 'text-teal-400',
                border: 'hover:border-teal-500/40',
              },
              {
                title: 'Analytics Warehouse',
                desc: 'Dual-database view combining operational MySQL data with historical Snowflake OLAP trends.',
                icon: BarChart3,
                color: 'text-indigo-400',
                border: 'hover:border-indigo-500/40',
              },
              {
                title: 'PDF Audit Reports',
                desc: 'Export downloadable agronomic audit reports formatted for insurance and agricultural extension officers.',
                icon: FileText,
                color: 'text-amber-300',
                border: 'hover:border-amber-400/40',
              },
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <Card key={idx} className={`space-y-3 transition-all duration-200 ${feat.border}`}>
                  <CardHeader className="border-b-0 pb-0">
                    <div className="p-3 w-fit rounded-xl bg-slate-900 border border-slate-800 mb-2">
                      <Icon className={`w-6 h-6 ${feat.color}`} />
                    </div>
                    <CardTitle className="text-base">{feat.title}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">{feat.desc}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        {/* 4. AI ANALYSIS PREVIEW */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <Badge variant="low" size="sm" className="mb-2">
                Live Interface Preview
              </Badge>
              <h2 className="text-2xl font-bold text-slate-100">AI Leaf Diagnostics UI</h2>
              <p className="text-xs text-slate-400 mt-1">Realistic diagnostic inspector preview output from Gemini AI vision</p>
            </div>
            <Link href="/analysis">
              <Button size="sm" variant="outline" rightIcon={<ChevronRight className="w-4 h-4" />}>
                Try Live Scanner
              </Button>
            </Link>
          </div>

          <Card glow className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Scan Image Mockup */}
              <div className="lg:col-span-5 relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[260px]">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
                <div className="text-center p-6 space-y-3 relative z-20">
                  <div className="p-4 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 inline-block">
                    <Scan className="w-10 h-10 animate-pulse-slow" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-200">Tomato Leaf Sample (Solanum lycopersicum)</span>
                    <p className="text-[11px] text-slate-400">Cloudinary Secured Asset ID: asset_9841</p>
                  </div>
                  <Badge variant="critical" size="sm">
                    Lesions Detected (88% coverage)
                  </Badge>
                </div>
              </div>

              {/* Diagnostic Results Breakdown */}
              <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-lg font-bold text-rose-400 flex items-center gap-2">
                        Late Blight <span className="text-xs font-mono text-slate-400">(Phytophthora infestans)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Diagnosed via Gemini AI Vision Engine</p>
                    </div>
                    <Badge variant="critical" size="lg">
                      High Severity
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400">Confidence Score</span>
                      <p className="text-base font-bold text-emerald-400">94.8%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400">Base Pathogen Severity</span>
                      <p className="text-base font-bold text-rose-400">35 / 50 pts</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400">Spread Vulnerability</span>
                      <p className="text-base font-bold text-amber-400">High Risk</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-300">Observed Symptoms:</span>
                    <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
                      <li>Large water-soaked dark brown spots on upper leaf surfaces.</li>
                      <li>White fungal growth visible on underside during humid conditions.</li>
                      <li>Rapid leaf wilt and necrotic tissue collapse.</li>
                    </ul>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-200">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    Recommended Action: Apply Copper Hydroxide fungicide within 24h.
                  </span>
                  <Link href="/analysis" className="text-emerald-400 font-semibold hover:underline shrink-0">
                    View Full Details
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* 5. WEATHER + RISK PREVIEW */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Weather Station Preview */}
          <Card className="lg:col-span-6 space-y-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CloudSun className="w-5 h-5 text-sky-400" />
                  <CardTitle>Farm Microclimate Weather</CardTitle>
                </div>
                <Badge variant="info">Live Weather API</Badge>
              </div>
              <CardDescription>Field Coordinates: Lat 36.77, Long -119.41</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <Thermometer className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400">Temperature</span>
                  <p className="text-lg font-bold text-slate-100">28.4°C</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <Droplets className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400">Humidity</span>
                  <p className="text-lg font-bold text-sky-400">88% (High)</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <Wind className="w-4 h-4 text-teal-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400">Rain Prob.</span>
                  <p className="text-lg font-bold text-slate-100">75%</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                  <ShieldAlert className="w-4 h-4" /> Spore Propagation Warning
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  Relative humidity $\ge 85\%$ combined with rainfall forecast creates optimal conditions for rapid fungal spore germination over the next 48 hours.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Risk Score Meter Preview */}
          <Card glow className="lg:col-span-6 space-y-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-rose-400" />
                  <CardTitle>Deterministic Crop Risk Index</CardTitle>
                </div>
                <Badge variant="high">High Threat</Badge>
              </div>
              <CardDescription>Mathematical risk score calculated from pathogen & microclimate parameters</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <div>
                  <span className="text-xs text-slate-400">Overall Crop Risk Score</span>
                  <div className="text-4xl font-extrabold text-rose-400 tracking-tight mt-1">78 / 100</div>
                  <span className="text-[11px] text-rose-300 font-medium">Categorization: HIGH RISK</span>
                </div>
                <div className="w-20 h-20 rounded-full border-4 border-rose-500/40 flex items-center justify-center bg-rose-950/30 text-rose-400 font-bold text-lg shadow-lg">
                  78%
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Disease Pathogen Component</span>
                  <span className="font-semibold text-slate-200">42 / 50 pts</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full w-[84%]" />
                </div>

                <div className="flex justify-between text-slate-400 pt-2">
                  <span>Weather Microclimate Component</span>
                  <span className="font-semibold text-slate-200">36 / 50 pts</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[72%]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 6. ANALYTICS PREVIEW */}
        <section className="space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <Badge variant="info" size="md" className="mx-auto">
              Analytical Data Warehouse
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">Historical Disease Outbreak Trends</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Aggregated Snowflake OLAP data analytics tracking seasonal disease vector frequency over time.
            </p>
          </div>

          <Card glow className="p-6">
            <div className="h-64 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="blightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="rustGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="blight" name="Late Blight Scans" stroke="#ef4444" fillOpacity={1} fill="url(#blightGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="rust" name="Common Rust Scans" stroke="#f59e0b" fillOpacity={1} fill="url(#rustGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap justify-center gap-6 pt-4 border-t border-slate-800 text-xs font-medium">
              <span className="flex items-center gap-2 text-rose-400">
                <span className="w-3 h-3 rounded-full bg-rose-500" /> Late Blight (Fungal)
              </span>
              <span className="flex items-center gap-2 text-amber-400">
                <span className="w-3 h-3 rounded-full bg-amber-500" /> Common Rust (Fungal)
              </span>
              <span className="flex items-center gap-2 text-slate-400">
                <span className="w-3 h-3 rounded-full bg-sky-500" /> Apple Scab
              </span>
            </div>
          </Card>
        </section>

        {/* 7. WHY AGROASSIST PRO */}
        <section className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">Why Smallholder Farmers Choose AgroAssist Pro</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Designed to bridge the gap between AI computer vision research and real-world farm decision making.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 text-center p-4">
              <div className="p-3 w-fit mx-auto rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                <TrendingDown className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-200">Reduce Crop Loss by 40%</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Early detection prevents localized fungal outbreaks from destroying entire farm acreage.
              </p>
            </div>

            <div className="space-y-2 text-center p-4">
              <div className="p-3 w-fit mx-auto rounded-2xl bg-sky-950/60 border border-sky-500/30 text-sky-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-200">Extension Authority Guided</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                All fungicide & chemical dosage guidance adheres strictly to official agricultural extension labels.
              </p>
            </div>

            <div className="space-y-2 text-center p-4">
              <div className="p-3 w-fit mx-auto rounded-2xl bg-amber-950/60 border border-amber-500/30 text-amber-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-200">Dual-Database Performance</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Immediate transactional MySQL responses coupled with asynchronous background Snowflake warehouse analytics.
              </p>
            </div>
          </div>
        </section>

        {/* 8. CTA SECTION */}
        <section className="relative rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-950 to-teal-950 border border-emerald-500/30 p-8 sm:p-12 text-center space-y-6 shadow-2xl overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100">Ready to Protect Your Harvest?</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Start scanning crop leaves, calculating microclimate risk, and exporting PDF agronomic reports today.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Create Free Account
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="secondary">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
