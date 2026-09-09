import CropRiskClient from './CropRiskClient';

export function generateStaticParams() {
  return [{ cropId: '_' }];
}

export default function CropRiskPage() {
  return <CropRiskClient />;
}
