import FarmRiskClient from './FarmRiskClient';

export function generateStaticParams() {
  return [{ farmId: '_' }];
}

export default function FarmRiskPage() {
  return <FarmRiskClient />;
}
