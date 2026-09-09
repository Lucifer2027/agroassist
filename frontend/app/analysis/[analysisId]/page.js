import AnalysisDetailClient from './AnalysisDetailClient';

export function generateStaticParams() {
  return [{ analysisId: '_' }];
}

export default function AnalysisDetailPage() {
  return <AnalysisDetailClient />;
}
