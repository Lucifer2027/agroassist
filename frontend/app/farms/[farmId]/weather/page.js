import FarmWeatherClient from './FarmWeatherClient';

export function generateStaticParams() {
  return [{ farmId: '_' }];
}

export default function FarmWeatherPage() {
  return <FarmWeatherClient />;
}
