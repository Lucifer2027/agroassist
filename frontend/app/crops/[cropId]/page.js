import CropDetailClient from './CropDetailClient';

export function generateStaticParams() {
  return [{ cropId: '_' }];
}

export default function CropDetailPage() {
  return <CropDetailClient />;
}
