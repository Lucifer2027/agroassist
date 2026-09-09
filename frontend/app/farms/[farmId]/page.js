import FarmDetailClient from './FarmDetailClient';

export function generateStaticParams() {
  return [{ farmId: '_' }];
}

export default function FarmDetailPage() {
  return <FarmDetailClient />;
}
