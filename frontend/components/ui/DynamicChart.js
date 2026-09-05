'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from './Skeleton';

// Dynamically import Recharts components without SSR to optimize initial bundle size
export const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false, loading: () => <Skeleton variant="rectangular" height="100%" /> }
);

export const AreaChart = dynamic(
  () => import('recharts').then((mod) => mod.AreaChart),
  { ssr: false }
);

export const Area = dynamic(
  () => import('recharts').then((mod) => mod.Area),
  { ssr: false }
);

export const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  { ssr: false }
);

export const Line = dynamic(
  () => import('recharts').then((mod) => mod.Line),
  { ssr: false }
);

export const BarChart = dynamic(
  () => import('recharts').then((mod) => mod.BarChart),
  { ssr: false }
);

export const Bar = dynamic(
  () => import('recharts').then((mod) => mod.Bar),
  { ssr: false }
);

export const PieChart = dynamic(
  () => import('recharts').then((mod) => mod.PieChart),
  { ssr: false }
);

export const Pie = dynamic(
  () => import('recharts').then((mod) => mod.Pie),
  { ssr: false }
);

export const Cell = dynamic(
  () => import('recharts').then((mod) => mod.Cell),
  { ssr: false }
);

export const XAxis = dynamic(
  () => import('recharts').then((mod) => mod.XAxis),
  { ssr: false }
);

export const YAxis = dynamic(
  () => import('recharts').then((mod) => mod.YAxis),
  { ssr: false }
);

export const Tooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip),
  { ssr: false }
);

export const Legend = dynamic(
  () => import('recharts').then((mod) => mod.Legend),
  { ssr: false }
);
