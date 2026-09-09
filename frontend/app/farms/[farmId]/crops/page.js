import FarmCropsListClient from './FarmCropsListClient';

export function generateStaticParams() {
  return [{ farmId: '_' }];
}

export default function FarmCropsListPage() {
  return <FarmCropsListClient />;
}
